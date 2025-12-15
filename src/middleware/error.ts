import { Context, Next } from 'koa';

// 错误处理中间件（必须第一个注册）
export const errorMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  try {
    await next(); // 执行后续中间件
  } catch (err) {
    // 捕获异常并格式化响应
    const error = err as Error;
    console.error('服务器异常：', error.stack); // 开发时打印错误栈

    // 生产环境隐藏具体错误，避免泄露敏感信息
    ctx.fail(
      500,
      process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message,
      process.env.NODE_ENV === 'development' ? error.stack : undefined
    );
  }
};