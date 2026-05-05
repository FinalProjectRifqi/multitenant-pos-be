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

export interface UserForMe {
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  is_active: boolean;
  last_login_at: Date | null;
  role_id: string | null;
  role_name: string | null;
  role_code: string | null;
  business_units: Array<{
    business_unit_id: string;
    business_unit_name: string;
  }>;
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

export interface MeResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: {
    user_id: string;
    full_name: string;
    user_name: string;
    email: string;
    role_id: string | null;
    role_name: string | null;
    role_code: string;
    status: 'active' | 'inactive';
    last_login: Date | null;
    business_units: Array<{
      business_unit_id: string;
      business_unit_name: string;
    }>;
    permissions: string[];
    must_change_password: boolean;
  };
}
