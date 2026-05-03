export interface MenuRow {
  menu_id: string;
  menu_name: string;
  menu_category_id: string;
  menu_category_name: string | null;
  menu_price: string;
  blob_id: string | null;
  business_unit_id: string;
  business_unit_name: string | null;
  is_available: boolean;
}

export interface RawMenuStats {
  total_menu: string | number;
  menu_active: string | number;
  menu_inactive: string | number;
}

export interface MenuStats {
  total_menu: number;
  menu_active: number;
  menu_inactive: number;
}

export interface MenuResponse {
  menu_id: string;
  menu_name: string;
  menu_category_id: string;
  menu_category_name: string | null;
  menu_price: number;
  menu_image: string | null;
  business_unit_id: string;
  business_unit_name: string | null;
  is_available: boolean;
}

export interface MenuMutationResponse {
  menu_id: string;
  menu_name: string;
  menu_category_id: string;
  menu_category_name: string | null;
  menu_price: number;
  menu_image: string | null;
  is_available: boolean;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MenuListResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: MenuResponse[];
  meta: PaginationMeta;
}

export interface MenuStatsResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: MenuStats;
}

export interface MenuDetailResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: MenuResponse;
}

export interface MenuCreateResponse {
  success: true;
  statusCode: 201;
  message: string;
  data: MenuMutationResponse;
}

export interface MenuUpdateResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: MenuMutationResponse;
}

export interface MenuDeleteResponse {
  success: true;
  statusCode: 200;
  message: string;
}
