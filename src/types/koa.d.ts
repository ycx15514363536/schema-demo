// 扩展 Koa Context 类型
declare module 'koa' {
  interface Context {
    success: <T>(data?: T, message?: string) => void
    fail: (code: number, message: string, data?: any) => void
  }
}
