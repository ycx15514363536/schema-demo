const Router = require('koa-router') as any
import {
  createSchema,
  getSchemaList,
  getSchemaDetail,
  updateSchema,
  deleteSchema,
} from '../controller/schemaController'

const router = new Router({ prefix: '/api/v1' })

router.post('/schema', createSchema as any)
router.get('/schema', getSchemaList as any)
router.get('/schema/:id', getSchemaDetail as any)
router.put('/schema/:id', updateSchema as any)
router.delete('/schema/:id', deleteSchema as any)

export default router