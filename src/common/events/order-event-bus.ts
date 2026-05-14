import { EventEmitter } from 'events';
import type { Logger } from 'pino';
import type { OrderDomainEvent } from './order-domain-event.types';

const ORDER_EVENT_CHANNEL = 'order_domain_event';

export class OrderEventBus extends EventEmitter {
  publish(event: OrderDomainEvent): void {
    this.emit(ORDER_EVENT_CHANNEL, event);
  }

  subscribe(handler: (event: OrderDomainEvent) => void): void {
    this.on(ORDER_EVENT_CHANNEL, handler);
  }
}

export function createOrderEventBus(): OrderEventBus {
  return new OrderEventBus();
}

/** Default subscriber: structured log for future WS/audit wiring */
export function registerOrderEventLogging(
  logger: Logger,
  bus: OrderEventBus,
): void {
  bus.subscribe((event) => {
    logger.info(
      {
        eventType: event.type,
        correlationId: event.correlationId,
        payload: event.payload,
        occurredAt: event.occurredAt,
      },
      'order domain event',
    );
  });
}
