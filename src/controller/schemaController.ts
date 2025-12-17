import { Context } from 'koa'
import pool from '../config/db'
import { CreateSchemaDTO, UpdateSchemaDTO, PaginationQuery } from '../types/schema'

// 创建 Schema
export const createSchema = async (ctx: Context): Promise<void> => {
  const body = ctx.request.body as unknown as CreateSchemaDTO

  if (!body.name || body.name.length < 3 || body.name.length > 20) {
    return ctx.fail(400, 'Schema 名称长度必须在 3-20 个字符之间')
  }
  if (!body.context) {
    return ctx.fail(400, 'Schema 内容不能为空')
  }
  if (!body.type) {
    return ctx.fail(400, 'Schema 类型不能为空')
  }
  if (!body.create_user) {
    return ctx.fail(400, '创建人不能为空')
  }

  // 验证 context 是否为有效的 JSON
  try {
    JSON.parse(body.context)
  } catch (err) {
    return ctx.fail(400, 'Schema 内容必须是有效的 JSON 格式')
  }

  try {
    const id = require('crypto').randomUUID()
    
    await pool.query(
      'INSERT INTO schema_table (id, name, context, type, create_user) VALUES (?, ?, ?, ?, ?)',
      [id, body.name, body.context, body.type, body.create_user]
    )

    ctx.success(
      {
        id,
        ...body,
      },
      'Schema 创建成功'
    )
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return ctx.fail(400, 'Schema 名称已存在')
    }
    ctx.fail(500, `创建失败：${err.message}`)
  }
}

// 获取 Schema 列表
export const getSchemaList = async (ctx: Context): Promise<void> => {
  const { page = 1, pageSize = 10 } = ctx.query as unknown as PaginationQuery
  const pageNum = Number(page)
  const pageSizeNum = Number(pageSize)

  if (pageNum < 1 || pageSizeNum < 1) {
    return ctx.fail(400, '页码和每页条数必须大于 0')
  }

  try {
    const offset = (pageNum - 1) * pageSizeNum

    const [listRows] = await pool.query(
      `SELECT id, name, context, type, create_user, created_at, updated_at FROM schema_table WHERE is_delete = 0 ORDER BY created_at DESC LIMIT ${pageSizeNum} OFFSET ${offset}`
    )

    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM schema_table WHERE is_delete = 0')
    const total = (countRows as any[])[0].total

    const list = (listRows as any[]).map((item) => ({
      ...item,
      context: typeof item.context === 'string' ? JSON.parse(item.context) : item.context,
    }))

    ctx.success({
      items: list,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    })
  } catch (err) {
    ctx.fail(500, `获取列表失败：${(err as Error).message}`)
  }
}

// 获取 Schema 详情
export const getSchemaDetail = async (ctx: Context): Promise<void> => {
  const id = ctx.params.id

  if (!id) {
    return ctx.fail(400, 'Schema ID 不能为空')
  }

  try {
    const [rows] = await pool.query('SELECT id, name, context, type, create_user, created_at, updated_at FROM schema_table WHERE id = ? AND is_delete = 0', [id])
    const schema = (rows as any[])[0]

    if (!schema) {
      return ctx.fail(404, 'Schema 不存在')
    }

    ctx.success({
      ...schema,
      context: typeof schema.context === 'string' ? JSON.parse(schema.context) : schema.context,
    })
  } catch (err) {
    ctx.fail(500, `获取详情失败：${(err as Error).message}`)
  }
}

// 更新 Schema
export const updateSchema = async (ctx: Context): Promise<void> => {
  const id = ctx.params.id
  const body = ctx.request.body as unknown as UpdateSchemaDTO

  if (!id) {
    return ctx.fail(400, 'Schema ID 不能为空')
  }
  if (Object.keys(body).length === 0) {
    return ctx.fail(400, '请传入需要更新的字段')
  }

  if (body.name && (body.name.length < 3 || body.name.length > 20)) {
    return ctx.fail(400, 'Schema 名称长度必须在 3-20 个字符之间')
  }

  if (body.context) {
    try {
      JSON.parse(body.context)
    } catch (err) {
      return ctx.fail(400, 'Schema 内容必须是有效的 JSON 格式')
    }
  }

  try {
    const [existRows] = await pool.query('SELECT id FROM schema_table WHERE id = ? AND is_delete = 0', [id])
    if ((existRows as any[]).length === 0) {
      return ctx.fail(404, 'Schema 不存在')
    }

    const updateFields: string[] = []
    const updateValues: any[] = []
    if (body.name) {
      updateFields.push('name = ?')
      updateValues.push(body.name)
    }
    if (body.context) {
      updateFields.push('context = ?')
      updateValues.push(body.context)
    }

    updateValues.push(id)
    await pool.query(
      `UPDATE schema_table SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    const [updatedRows] = await pool.query('SELECT id, name, context, type, create_user, created_at, updated_at FROM schema_table WHERE id = ?', [id])
    const updatedSchema = (updatedRows as any[])[0]

    ctx.success(
      {
        ...updatedSchema,
        context: typeof updatedSchema.context === 'string' ? JSON.parse(updatedSchema.context) : updatedSchema.context,
      },
      'Schema 更新成功'
    )
  } catch (err) {
    ctx.fail(500, `更新失败：${(err as Error).message}`)
  }
}

// 删除 Schema
export const deleteSchema = async (ctx: Context): Promise<void> => {
  const id = ctx.params.id

  if (!id) {
    return ctx.fail(400, 'Schema ID 不能为空')
  }

  try {
    const [existRows] = await pool.query('SELECT id FROM schema_table WHERE id = ? AND is_delete = 0', [id])
    if ((existRows as any[]).length === 0) {
      return ctx.fail(404, 'Schema 不存在')
    }

    await pool.query('UPDATE schema_table SET is_delete = 1 WHERE id = ?', [id])
    ctx.success(null, 'Schema 删除成功')
  } catch (err) {
    ctx.fail(500, `删除失败：${(err as Error).message}`)
  }
}