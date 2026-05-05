export interface UserRow {
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  is_active: boolean;
  last_login_at: Date;
  role_id: string | null;
  role_name: string | null;
  role_code: string | null;
}

export interface RawUserStats {
  total_users: string;
  users_active: string;
  users_inactive: string;
}

export interface BusinessUnitRef {
  business_unit_id: string;
  business_unit_name: string;
}

export interface UserWithDetails extends UserRow {
  business_units: BusinessUnitRef[];
}

export interface UserStats {
  total_users: number;
  users_active: number;
  users_inactive: number;
}

export interface UserResponse {
  user_id: string;
  full_name: string;
  user_name: string;
  email: string;
  role_id: string | null;
  role_name: string | null;
  role_code: string | null;
  status: 'active' | 'inactive';
  last_login: Date;
  business_units: BusinessUnitRef[];
}

export interface CreatedUserResponse {
  user_id: string;
  user_name: string;
  password: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: UserResponse[];
  meta: PaginationMeta;
}

export interface UserStatsResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: UserStats;
}

export interface UserDetailResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: UserResponse;
}

export interface UserCreateResponse {
  success: true;
  statusCode: 201;
  message: string;
  data: CreatedUserResponse;
}

export interface UserDeleteResponse {
  success: true;
  statusCode: 200;
  message: string;
}
