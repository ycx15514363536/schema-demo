import { Context, Next } from 'koa'

export const errorMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  try {
    await next()
  } catch (err) {
    const error = err as Error
    console.error('服务器异常：', error.stack)

    ctx.fail(
      500,
      process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message,
      process.env.NODE_ENV === 'development' ? error.stack : undefined
    )
  }
}