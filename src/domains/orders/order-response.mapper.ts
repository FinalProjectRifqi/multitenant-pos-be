import type {
  OrderDetailResponse,
  OrderItemResponse,
  OrderItemRow,
  OrderRow,
} from './models/order.model';

export function mapOrderItemResponse(row: OrderItemRow): OrderItemResponse {
  return {
    order_item_id: row.order_item_id,
    menu_item_id: row.menu_item_id,
    menu_item_name: row.menu_item_name,
    quantity: Number(row.quantity),
    item_price: Number(row.item_price),
    subtotal: Number(row.item_price) * Number(row.quantity),
    notes: row.notes,
  };
}

export function mapOrderDetailResponse(
  order: OrderRow,
  items: OrderItemRow[],
): OrderDetailResponse {
  return {
    order_id: order.order_id,
    unit_id: order.unit_id,
    user_id: order.user_id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    table_number: order.table_number,
    notes: order.notes,
    subtotal: Number(order.subtotal),
    tax_amount: Number(order.tax_amount),
    total_amount: Number(order.total_amount),
    ordered_at: order.ordered_at,
    completed_at: order.completed_at,
    order_type_id: order.order_type_id,
    order_type_name: order.order_type_name,
    order_status_id: order.order_status_id,
    order_status_name: order.order_status_name,
    items: items.map((item) => mapOrderItemResponse(item)),
  };
}
