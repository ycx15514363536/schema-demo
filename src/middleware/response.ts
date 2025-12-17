import { Context, Next } from 'koa'
import { BaseResponse } from '../types/schema'

declare module 'koa' {
  interface Context {
    success: <T>(data?: T, message?: string) => void
    fail: (code: number, message: string, data?: any) => void
  }
}

export const responseMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  ctx.success = <T>(data?: T, message = '操作成功'): void => {
    const response: BaseResponse<T> = {
      code: 200,
      message,
      data,
    }
    ctx.body = response
    ctx.status = 200
    ctx.set('Content-Type', 'application/json charset=utf-8')
  }

  ctx.fail = (code: number, message: string, data?: any): void => {
    const response: BaseResponse = {
      code,
      message,
      data,
    }
    ctx.body = response
    ctx.status = code
    ctx.set('Content-Type', 'application/json charset=utf-8')
  }

  await next()
}