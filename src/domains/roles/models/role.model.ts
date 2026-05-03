export interface Role {
  role_id: string;
  role_name: string;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface RoleResponse {
  role_id: string;
  role_name: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RoleListResponse {
  success: true;
  statusCode: number;
  message: string;
  data: RoleResponse[];
  meta: PaginationMeta;
}

export interface RoleDetailResponse {
  success: true;
  statusCode: number;
  message: string;
  data: RoleResponse;
}

export interface RoleDeleteResponse {
  success: true;
  statusCode: number;
  message: string;
}
