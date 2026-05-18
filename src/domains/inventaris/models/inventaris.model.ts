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
  transaction_type:
    | 'in'
    | 'out'
    | 'adjustment'
    | 'RESTOCK'
    | 'DAILY_USAGE'
    | 'WASTE'
    | 'MANUAL_ADJUSTMENT';
  quantity_changed: number;
  quantity_before: number;
  quantity_after: number;
  notes: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  transacted_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DailyInventoryPlan {
  daily_inventory_plan_id: string;
  unit_id: string;
  date: string;
  inventory_item_id: string;
  inventory_item_name: string;
  planned_usage_qty: number;
  unit: string;
  notes: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface DailyInventoryRealization {
  daily_inventory_realization_id: string;
  unit_id: string;
  date: string;
  inventory_item_id: string;
  inventory_item_name: string;
  daily_inventory_plan_id: string;
  planned_usage_qty: number;
  actual_usage_qty: number;
  waste_qty: number;
  remaining_qty: number | null;
  variance_qty: number;
  notes: string | null;
  status: 'SUBMITTED' | 'DRAFT';
  submitted_by: string;
  submitted_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DailyUsageReportRow {
  date: string;
  inventory_item_id: string;
  inventory_item_name: string;
  unit: string;
  planned_usage_qty: number;
  actual_usage_qty: number | null;
  waste_qty: number | null;
  variance_qty: number | null;
  status: string | null;
}

export interface InventoryVarianceReportRow {
  inventory_item_id: string;
  inventory_item_name: string;
  unit: string;
  planned_usage_qty: number;
  actual_usage_qty: number;
  waste_qty: number;
  variance_qty: number;
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

export interface DailyInventoryPlanListResponse {
  success: true;
  statusCode: number;
  message: string;
  data: DailyInventoryPlan[];
  meta: PaginationMeta;
}

export interface DailyInventoryPlanDetailResponse {
  success: true;
  statusCode: number;
  message: string;
  data: DailyInventoryPlan;
}

export interface DailyInventoryPlanDeleteResponse {
  success: true;
  statusCode: number;
  message: string;
}

export interface DailyInventoryRealizationListResponse {
  success: true;
  statusCode: number;
  message: string;
  data: DailyInventoryRealization[];
  meta: PaginationMeta;
}

export interface DailyInventoryRealizationDetailResponse {
  success: true;
  statusCode: number;
  message: string;
  data: DailyInventoryRealization;
}

export interface DailyUsageReportResponse {
  success: true;
  statusCode: number;
  message: string;
  data: DailyUsageReportRow[];
}

export interface InventoryVarianceReportResponse {
  success: true;
  statusCode: number;
  message: string;
  data: InventoryVarianceReportRow[];
}
