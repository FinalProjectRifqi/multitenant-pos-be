export interface MenuCategory {
  menu_category_id: string;
  business_unit_id: string;
  category_name: string;
  description: string | null;
  business_unit_name: string; // This would require a join to get the business unit name
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface MenuCategoryResponse {
  menu_category_id: string;
  menu_category_name: string;
  description: string | null;
  business_unit_id: string;
  business_unit_name: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MenuCategoryListResponse {
  success: true;
  statusCode: number;
  message: string;
  data: MenuCategoryResponse[];
  meta: PaginationMeta;
}

export interface MenuCategoryDetailResponse {
  success: true;
  statusCode: number;
  message: string;
  data: MenuCategoryResponse;
}
