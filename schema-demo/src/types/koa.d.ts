import { Context as KoaContext } from 'koa';
import { ParameterizedContext } from 'koa';

// 扩展 Koa Context 类型
declare module 'koa' {
  interface Context extends ParameterizedContext {}
}
