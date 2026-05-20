// ===========================
// KPI Summary
// ===========================

export interface AnalyticsKpiData {
  total_omzet: number;
  total_transaksi: number;
  rata_rata_order: number;
  selesai: number;
  dibatalkan: number;
  stok_kritis: number;
  omzet_growth_pct: number | null;
  transaksi_growth_pct: number | null;
  avg_growth_pct: number | null;
}

export interface AnalyticsKpiResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: AnalyticsKpiData;
}

// ===========================
// Sales Trend
// ===========================

export interface SalesTrendPoint {
  label: string; // display label e.g. "Sen", "01/05", "Mei"
  date: string; // ISO date for the bucket
  omzet: number;
  transaksi: number;
}

export interface AnalyticsSalesTrendResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: SalesTrendPoint[];
}

// ===========================
// Top Menus
// ===========================

export interface TopMenuRow {
  menu_item_id: string;
  menu_item_name: string;
  category_name: string;
  qty_terjual: number;
  pendapatan: number;
}

export interface AnalyticsTopMenusResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: TopMenuRow[];
}

// ===========================
// Payment History
// ===========================

export type PaymentHistoryStatus =
  | 'paid'
  | 'pending'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'refunded';

export interface PaymentHistoryRow {
  payment_id: string;
  reference_number: string;
  order_number: string;
  amount: number;
  payment_method: string; // derived: 'QRIS' | 'Tunai'
  payment_status: PaymentHistoryStatus;
  created_at: string;
}

export interface AnalyticsPaymentsResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: PaymentHistoryRow[];
}

// ===========================
// Inventory Status
// ===========================

export type StockStatus = 'LOW' | 'CRITICAL' | 'OUT';

export interface InventoryStatusRow {
  inventory_item_id: string;
  inventory_item_name: string;
  current_stock: number;
  min_threshold: number;
  unit_of_measure: string;
  status: 'LOW' | 'CRITICAL' | 'OUT';
}

export interface AnalyticsInventoryStatusResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: {
    low_or_critical: InventoryStatusRow[];
    out_of_stock: InventoryStatusRow[];
  };
}

// ===========================
// Daily Inventory
// ===========================

export interface DailyInventoryRow {
  inventory_item_name: string;
  unit: string;
  planned_usage_qty: number;
  actual_usage_qty: number;
  waste_qty: number | null;
  variance_qty: number;
}

export interface AnalyticsDailyInventoryResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: DailyInventoryRow[];
}

// ===========================
// Group Analytics — Summary
// ===========================

export interface GroupKpiData {
  total_omzet: number;
  total_transaksi: number;
  rata_rata_order: number;
  selesai: number;
  dibatalkan: number;
  stok_kritis: number;
}

export interface UnitPerformanceRow {
  unit_id: string;
  unit_name: string;
  omzet: number;
  transaksi: number;
  rata_rata_order: number;
  selesai: number;
  dibatalkan: number;
  stok_kritis: number;
}

export interface AnalyticsGroupSummaryData {
  kpi: GroupKpiData;
  sales_trend: SalesTrendPoint[];
  top_menus: TopMenuRow[];
  unit_performance: UnitPerformanceRow[];
}

export interface AnalyticsGroupSummaryResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: AnalyticsGroupSummaryData;
}

// ===========================
// Group Analytics — Compare
// ===========================

export interface UnitCompareRow {
  unit_id: string;
  unit_name: string;
  omzet: number;
  transaksi: number;
  rata_rata_order: number;
  selesai: number;
  dibatalkan: number;
  stok_kritis: number;
}

export interface AnalyticsGroupCompareResponse {
  success: true;
  statusCode: 200;
  message: string;
  data: UnitCompareRow[];
}
