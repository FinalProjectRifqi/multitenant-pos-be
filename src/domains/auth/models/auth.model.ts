export interface UserWithRole {
  user_id: string;
  role_id: string;
  full_name: string;
  username: string;
  email: string;
  password: string;
  is_active: boolean;
  must_change_password: boolean;
  role_code: string | null;
}

export interface JwtTokenPayload {
  sub: string;
  typ: 'Bearer';
  roles: string;
  permission: string[];
  full_name: string;
  email: string;
  units: string[];
  must_change_password: boolean;
}

export interface LoginResponse {
  success: true;
  statusCode: number;
  message: string;
  accessToken: string;
}
