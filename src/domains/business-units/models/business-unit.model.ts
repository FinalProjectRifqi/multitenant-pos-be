export interface BusinessUnit {
  unit_id: string;
  unit_name: string;
  unit_address: string;
  phone_number: string | null;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface BusinessUnitResponse {
  business_unit_id: string;
  business_unit_name: string;
  business_unit_address: string;
  business_unit_phone: string | null;
  business_unit_status: string;
}

export interface BusinessUnitStats {
  total_business_unit: number;
  business_unit_active: number;
  business_unit_inactive: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BusinessUnitListResponse {
  success: true;
  statusCode: number;
  message: string;
  data: BusinessUnitResponse[];
  meta: PaginationMeta;
}

export interface BusinessUnitDetailResponse {
  success: true;
  statusCode: number;
  message: string;
  data: BusinessUnitResponse;
}

export interface BusinessUnitStatsResponse {
  success: true;
  statusCode: number;
  message: string;
  data: BusinessUnitStats;
}

export interface BusinessUnitDeleteResponse {
  success: true;
  statusCode: number;
  message: string;
}
