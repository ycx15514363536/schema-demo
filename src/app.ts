import bodyParser from 'koa-bodyparser'
import { errorMiddleware } from './middleware/error'
import { responseMiddleware } from './middleware/response'
import schemaRouter from './routes/schemaRoutes'

const Koa = require('koa') as any
const app = new Koa()

app.use(errorMiddleware)
app.use(bodyParser())
app.use(responseMiddleware)

app.use(schemaRouter.routes()).use(schemaRouter.allowedMethods())

export default app