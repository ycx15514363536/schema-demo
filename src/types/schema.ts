export enum SchemaType {
  PAGE = 'Page',
  FLOW = 'Flow',
}

export interface Schema {
  id?: string // 主键 (UUID)
  name: string // schema 名，唯一，长度 3-20
  context: string // Schema 内容，内容必须为 JSON
  type: SchemaType // 类型：Page (页面), Flow (流程)
  create_user: string // 创建人
  created_at?: Date // 创建时间
  updated_at?: Date // 更新时间
  is_delete: number // 0 未删除，1 已经删除
}

// 创建 Schema 的请求体
export interface CreateSchemaDTO {
  name: string
  context: string
  type: SchemaType
  create_user: string
}

// 更新 Schema 的请求体
export interface UpdateSchemaDTO {
  name?: string
  context?: string
}

// 分页查询参数
export interface PaginationQuery {
  page?: number // 页码，默认 1
  pageSize?: number // 每页条数，默认 10
}

// 基础响应接口
export interface BaseResponse<T = any> {
  code: number // 业务状态码（200 成功，400 参数错，500 服务器错）
  message: string // 提示信息
  data?: T // 响应数据（可选）
}

// 分页响应接口
export interface PaginationResponse<T = any> extends BaseResponse {
  data: {
      items: T[]
      total: number
      page: number
      pageSize: number
      totalPages: number
  }
}