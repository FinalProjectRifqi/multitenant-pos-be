export interface InventoryItem {
  inventory_item_id: string;
  inventory_item_name: string;
  description: string;
  unit_of_measure: string;
  current_stock: number;
  min_threshold: number;
  max_threshold: number;
  last_restocked_at: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface InventoryItemWithUnit extends InventoryItem {
  unit_id: string;
}

export interface InventoryStats {
  total_inventory_item: number;
  inventory_item_low_stock: number;
  inventory_item_normal_stock: number;
  inventory_item_out_of_stock: number;
}

export interface InventoryTransaction {
  inventory_transaction_id: string;
  user_id: string;
  inventory_item_id: string;
  inventory_item_name: string;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity_changed: number;
  quantity_before: number;
  quantity_after: number;
  notes: string | null;
  transacted_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InventoryItemListResponse {
  success: true;
  statusCode: number;
  message: string;
  data: InventoryItemWithUnit[];
  meta: PaginationMeta;
}

export interface InventoryItemDetailResponse {
  success: true;
  statusCode: number;
  message: string;
  data: InventoryItemWithUnit;
}

export interface InventoryItemStatsResponse {
  success: true;
  statusCode: number;
  message: string;
  data: InventoryStats;
}

export interface InventoryItemDeleteResponse {
  success: true;
  statusCode: number;
  message: string;
}

export interface InventoryTransactionListResponse {
  success: true;
  statusCode: number;
  message: string;
  data: InventoryTransaction[];
  meta: PaginationMeta;
}

export interface InventoryTransactionCreateResponse {
  success: true;
  statusCode: number;
  message: string;
  data: InventoryTransaction;
}
