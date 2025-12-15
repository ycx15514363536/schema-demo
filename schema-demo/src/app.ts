import Koa from 'koa';
import koaBody from 'koa-body';
import { errorMiddleware } from './middleware/error';
import { responseMiddleware } from './middleware/response';
import schemaRouter from './routes/schemaRoutes';

// 创建 Koa 应用实例
const app = new Koa();

// 1. 错误处理中间件（第一个注册）
app.use(errorMiddleware);

// 2. 解析请求体中间件（解析 JSON/表单）
app.use(
  koaBody({
    json: true,
    urlencoded: true,
    text: true,
  })
);

// 3. 统一响应封装中间件
app.use(responseMiddleware);

// 4. 注册路由
app.use(schemaRouter.routes()).use(schemaRouter.allowedMethods());
// allowedMethods：处理 405（方法不允许）/501（未实现）错误

export default app;