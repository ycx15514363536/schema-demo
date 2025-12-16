import { Context, Next } from 'koa';
import { BaseResponse } from '../types/schema';

// 扩展 Koa Context 类型，添加自定义响应方法
declare module 'koa' {
  interface Context {
    success: <T>(data?: T, message?: string) => void;
    fail: (code: number, message: string, data?: any) => void;
  }
}

// 统一响应中间件
export const responseMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  // 成功响应：默认 code=200，message=操作成功
  ctx.success = <T>(data?: T, message = '操作成功'): void => {
    const response: BaseResponse<T> = {
      code: 200,
      message,
      data,
    };
    ctx.body = response;
    ctx.status = 200;
    ctx.set('Content-Type', 'application/json; charset=utf-8');
  };

  // 失败响应：自定义 code 和 message
  ctx.fail = (code: number, message: string, data?: any): void => {
    const response: BaseResponse = {
      code,
      message,
      data,
    };
    ctx.body = response;
    ctx.status = code; // HTTP 状态码与业务码一致
    ctx.set('Content-Type', 'application/json; charset=utf-8');
  };

  // 执行后续中间件（路由/控制器）
  await next();
};