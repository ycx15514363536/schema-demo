import { Context } from 'koa';
import pool from '../config/db';
import { CreateSchemaDTO, UpdateSchemaDTO, PaginationQuery } from '../types/schema';

// ====================== 1. 创建 Schema ======================
export const createSchema = async (ctx: Context): Promise<void> => {
  // 1. 获取请求体并校验类型
  const body = ctx.request.body as unknown as CreateSchemaDTO;

  // 2. 参数校验（必填项）
  if (!body.name || body.name.length < 3 || body.name.length > 20) {
    return ctx.fail(400, 'Schema 名称长度必须在 3-20 个字符之间');
  }
  if (!body.context) {
    return ctx.fail(400, 'Schema 内容不能为空');
  }
  if (!body.type) {
    return ctx.fail(400, 'Schema 类型不能为空');
  }
  if (!body.create_user) {
    return ctx.fail(400, '创建人不能为空');
  }

  // 3. 验证 context 是否为有效的 JSON
  try {
    JSON.parse(body.context);
  } catch (err) {
    return ctx.fail(400, 'Schema 内容必须是有效的 JSON 格式');
  }

  try {
    // 4. 生成 UUID
    const id = require('crypto').randomUUID();
    
    // 5. 插入数据库
    await pool.query(
      'INSERT INTO schema_table (id, name, context, type, create_user) VALUES (?, ?, ?, ?, ?)',
      [id, body.name, body.context, body.type, body.create_user]
    );

    // 6. 返回成功响应
    ctx.success(
      {
        id,
        ...body,
      },
      'Schema 创建成功'
    );
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return ctx.fail(400, 'Schema 名称已存在');
    }
    ctx.fail(500, `创建失败：${err.message}`);
  }
};

// ====================== 2. 获取 Schema 列表（分页） ======================
export const getSchemaList = async (ctx: Context): Promise<void> => {
  // 1. 获取分页参数（URL 查询参数）
  const { page = 1, pageSize = 10 } = ctx.query as unknown as PaginationQuery;
  const pageNum = Number(page);
  const pageSizeNum = Number(pageSize);

  // 2. 参数校验
  if (pageNum < 1 || pageSizeNum < 1) {
    return ctx.fail(400, '页码和每页条数必须大于 0');
  }

  try {
    // 3. 计算分页偏移量
    const offset = (pageNum - 1) * pageSizeNum;

    // 4. 查询列表数据（只返回未删除的记录）
    const [listRows] = await pool.query(
      `SELECT id, name, context, type, create_user, created_at, updated_at FROM schema_table WHERE is_delete = 0 ORDER BY created_at DESC LIMIT ${pageSizeNum} OFFSET ${offset}`
    );

    // 5. 查询总条数
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM schema_table WHERE is_delete = 0');
    const total = (countRows as any[])[0].total;

    // 6. 格式化数据（JSON 字段反序列化）
    const list = (listRows as any[]).map((item) => ({
      ...item,
      context: typeof item.context === 'string' ? JSON.parse(item.context) : item.context,
    }));

    // 7. 返回分页响应
    ctx.success({
      items: list,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (err) {
    ctx.fail(500, `获取列表失败：${(err as Error).message}`);
  }
};

// ====================== 3. 获取 Schema 详情 ======================
export const getSchemaDetail = async (ctx: Context): Promise<void> => {
  // 1. 获取路径参数 ID
  const id = ctx.params.id;

  // 2. 参数校验
  if (!id) {
    return ctx.fail(400, 'Schema ID 不能为空');
  }

  try {
    // 3. 查询数据库（只查询未删除的记录）
    const [rows] = await pool.query('SELECT id, name, context, type, create_user, created_at, updated_at FROM schema_table WHERE id = ? AND is_delete = 0', [id]);
    const schema = (rows as any[])[0];

    // 4. 检查是否存在
    if (!schema) {
      return ctx.fail(404, 'Schema 不存在');
    }

    // 5. 格式化并返回
    ctx.success({
      ...schema,
      context: typeof schema.context === 'string' ? JSON.parse(schema.context) : schema.context,
    });
  } catch (err) {
    ctx.fail(500, `获取详情失败：${(err as Error).message}`);
  }
};

// ====================== 4. 更新 Schema ======================
export const updateSchema = async (ctx: Context): Promise<void> => {
  // 1. 获取路径参数和请求体
  const id = ctx.params.id;
  const body = ctx.request.body as unknown as UpdateSchemaDTO;

  // 2. 参数校验
  if (!id) {
    return ctx.fail(400, 'Schema ID 不能为空');
  }
  if (Object.keys(body).length === 0) {
    return ctx.fail(400, '请传入需要更新的字段');
  }

  // 3. 验证 name 长度（如果提供）
  if (body.name && (body.name.length < 3 || body.name.length > 20)) {
    return ctx.fail(400, 'Schema 名称长度必须在 3-20 个字符之间');
  }

  // 4. 验证 context 是否为有效的 JSON（如果提供）
  if (body.context) {
    try {
      JSON.parse(body.context);
    } catch (err) {
      return ctx.fail(400, 'Schema 内容必须是有效的 JSON 格式');
    }
  }

  try {
    // 5. 检查 Schema 是否存在且未删除
    const [existRows] = await pool.query('SELECT id FROM schema_table WHERE id = ? AND is_delete = 0', [id]);
    if ((existRows as any[]).length === 0) {
      return ctx.fail(404, 'Schema 不存在');
    }

    // 6. 构建动态更新语句
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    if (body.name) {
      updateFields.push('name = ?');
      updateValues.push(body.name);
    }
    if (body.context) {
      updateFields.push('context = ?');
      updateValues.push(body.context);
    }

    // 5. 执行更新
    updateValues.push(id);
    await pool.query(
      `UPDATE schema_table SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 7. 查询更新后的数据并返回
    const [updatedRows] = await pool.query('SELECT id, name, context, type, create_user, created_at, updated_at FROM schema_table WHERE id = ?', [id]);
    const updatedSchema = (updatedRows as any[])[0];

    ctx.success(
      {
        ...updatedSchema,
        context: typeof updatedSchema.context === 'string' ? JSON.parse(updatedSchema.context) : updatedSchema.context,
      },
      'Schema 更新成功'
    );
  } catch (err) {
    ctx.fail(500, `更新失败：${(err as Error).message}`);
  }
};

// ====================== 5. 删除 Schema ======================
export const deleteSchema = async (ctx: Context): Promise<void> => {
  // 1. 获取路径参数 ID
  const id = ctx.params.id;

  // 2. 参数校验
  if (!id) {
    return ctx.fail(400, 'Schema ID 不能为空');
  }

  try {
    // 3. 检查 Schema 是否存在且未删除
    const [existRows] = await pool.query('SELECT id FROM schema_table WHERE id = ? AND is_delete = 0', [id]);
    if ((existRows as any[]).length === 0) {
      return ctx.fail(404, 'Schema 不存在');
    }

    // 4. 执行软删除（更新 is_delete 字段）
    await pool.query('UPDATE schema_table SET is_delete = 1 WHERE id = ?', [id]);

    // 5. 返回成功
    ctx.success(null, 'Schema 删除成功');
  } catch (err) {
    ctx.fail(500, `删除失败：${(err as Error).message}`);
  }
};