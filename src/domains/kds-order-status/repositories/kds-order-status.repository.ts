import type { IOrderRepository } from '../../orders/repositories/order.repository';
import { OrderRepository } from '../../orders/repositories/order.repository';

export type IKdsOrderStatusRepository = IOrderRepository;

export class KdsOrderStatusRepository extends OrderRepository {}
