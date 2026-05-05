export interface OrderType {
  order_type_id: string;
  order_type_name: string;
  order_type_code: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface OrderTypeResponse {
  order_type_id: string;
  order_type_name: string;
  order_type_code: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderTypeListResponse {
  success: true;
  statusCode: number;
  message: string;
  data: OrderTypeResponse[];
  meta: PaginationMeta;
}

export interface OrderTypeDetailResponse {
  success: true;
  statusCode: number;
  message: string;
  data: OrderTypeResponse;
}
