import Router from 'koa-router';
import {
  createSchema,
  getSchemaList,
  getSchemaDetail,
  updateSchema,
  deleteSchema,
} from '../controller/schemaController';

// 创建路由实例，前缀为 /api/schemas（所有接口统一前缀）
const router = new Router({ prefix: '/api/v1' });

// 1. POST /api/schemas - 创建 Schema
router.post('/schema', createSchema as any);

// 2. GET /api/schemas - 获取 Schema 列表（分页）
router.get('/schema', getSchemaList as any);

// 3. GET /api/schemas/:id - 获取 Schema 详情
router.get('/schema/:id', getSchemaDetail as any);

// 4. PUT /api/schemas/:id - 更新 Schema
router.put('/schema/:id', updateSchema as any);

// 5. DELETE /api/schemas/:id - 删除 Schema
router.delete('/schema/:id', deleteSchema as any);

export default router;