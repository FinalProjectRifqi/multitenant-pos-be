export interface AnalyticsScope {
  unitIds?: string[];
  startDate: string;
  endDate: string;
  period?: 'daily' | 'weekly' | 'monthly';
}

export interface AnalyticsUnitRow {
  unit_id: string;
  unit_name: string;
  unit_address: string | null;
}

export interface AnalyticsMetricSummary {
  total_revenue: number;
  total_transactions: number;
  average_order_value: number;
  completed_transactions: number;
  cancelled_transactions: number;
}

export interface AnalyticsStatusRow {
  status_code: 'COMPLETED' | 'CANCELLED' | 'PENDING';
  status_name: string;
  total_transactions: number;
}

export interface AnalyticsMenuRow {
  menu_item_id: string;
  menu_item_name: string;
  unit_id?: string;
  unit_name?: string;
  quantity_sold: number;
  gross_revenue: number;
}

export interface AnalyticsUnitRevenueRow {
  unit_id: string;
  unit_name: string;
  total_revenue: number;
  total_transactions: number;
  average_order_value: number;
  completed_transactions: number;
  cancelled_transactions: number;
}

export interface AnalyticsCriticalStockUnitRow {
  unit_id: string;
  unit_name: string;
  low_stock_items: number;
  out_of_stock_items: number;
}

export interface AnalyticsPaymentRow {
  payment_status: string;
  total_payments: number;
  total_amount: number;
}

export interface AnalyticsPaymentHistoryRow {
  payment_id: string;
  order_id: string;
  order_number: string;
  unit_id: string;
  unit_name: string;
  reference_number: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  paid_at: Date | null;
  created_at: Date;
}

export interface AnalyticsInventoryRow {
  inventory_item_id: string;
  inventory_item_name: string;
  unit_id: string;
  unit_name: string;
  current_stock: number;
  min_threshold: number;
  unit_of_measure: string;
  stock_status: 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface AnalyticsDailyUsageRow {
  date: string;
  unit_id: string;
  unit_name: string;
  inventory_item_id: string;
  inventory_item_name: string;
  planned_usage_qty: number;
  actual_usage_qty: number;
  waste_qty: number;
  variance_qty: number;
  usage_unit: string;
}

export interface AnalyticsInventoryPerformanceRow {
  unit_id: string;
  unit_name: string;
  actual_usage_qty: number;
  waste_qty: number;
  variance_qty: number;
}

export interface AnalyticsSummaryData {
  metrics: AnalyticsMetricSummary;
  status_transactions: AnalyticsStatusRow[];
  top_menus: AnalyticsMenuRow[];
  revenue_by_menu: AnalyticsMenuRow[];
  revenue_by_unit: AnalyticsUnitRevenueRow[];
  unit_comparison: AnalyticsUnitRevenueRow[];
  critical_stock_units: AnalyticsCriticalStockUnitRow[];
  payment_summary: AnalyticsPaymentRow[];
  payment_history: AnalyticsPaymentHistoryRow[];
  low_stock_items: AnalyticsInventoryRow[];
  daily_inventory_usage: AnalyticsDailyUsageRow[];
  waste_and_variance: AnalyticsDailyUsageRow[];
}

export interface AnalyticsReportResponse<TData> {
  success: true;
  statusCode: 200;
  message: string;
  data: TData;
}
