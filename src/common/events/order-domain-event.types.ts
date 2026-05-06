/** Domain events emitted in-process after Kitchen Display mutations succeed */

export interface OrderDomainEventBase {
  occurredAt: string;
  correlationId?: string;
}

export type OrderStatusChangedPayload = {
  unitId: string;
  orderId: string;
  action: 'TRANSITION' | 'CANCEL';
  fromStatusId: string;
  fromStatusCode: string;
  toStatusId: string;
  toStatusCode: string;
  userId?: string;
};

export type OrderStatusChangedEvent = OrderDomainEventBase & {
  type: 'ORDER_STATUS_CHANGED';
  payload: OrderStatusChangedPayload;
};

export type OrderDomainEvent = OrderStatusChangedEvent;
