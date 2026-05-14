// ===========================
// DB Row Types
// ===========================

export interface OrderRow {
  order_id: string;
  unit_id: string;
  user_id: string;
  order_number: string;
  table_number: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  ordered_at: Date;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  customer_name: string;
  order_type_id: string;
  order_type_name: string;
  order_status_id: string;
  order_status_name: string;
  order_status_code: string;
}

export interface OrderItemRow {
  order_item_id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  item_price: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItemLookupRow {
  menu_item_id: string;
  menu_item_name: string;
  item_price: number;
  is_available: boolean;
}

// ===========================
// Response Shapes
// ===========================

export interface OrderItemResponse {
  order_item_id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  item_price: number;
  subtotal: number;
  notes: string | null;
}

export interface OrderListItemResponse {
  order_id: string;
  order_number: string;
  customer_name: string;
  table_number: string | null;
  order_type_id: string;
  order_type_name: string;
  total_amount: number;
  order_status_id: string;
  order_status_name: string;
  ordered_at: Date;
}

export interface OrderDetailResponse {
  order_id: string;
  unit_id: string;
  user_id: string;
  order_number: string;
  customer_name: string;
  table_number: string | null;
  notes: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  ordered_at: Date;
  completed_at: Date | null;
  order_type_id: string;
  order_type_name: string;
  order_status_id: string;
  order_status_name: string;
  items: OrderItemResponse[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ===========================
// API Response Envelopes
// ===========================

export interface OrderListApiResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: OrderListItemResponse[];
  meta: PaginationMeta;
}

export interface OrderDetailApiResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: OrderDetailResponse;
}

export interface OrderCreateApiResponse {
  success: true;
  statusCode: 201;
  message: string;
  data: OrderDetailResponse;
}

export interface OrderUpdateApiResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: OrderDetailResponse;
}

export interface OrderCancelApiResponse {
  success: true;
  statusCode: 200;
  message: string;
}
