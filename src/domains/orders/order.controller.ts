import type { Request, Response } from 'express';
import type { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import type { ListTransactionHistoryQueryDto } from './dto/list-transaction-history-query.dto';
import type {
  OrderItemParamsDto,
  OrderUnitParamsDto,
} from './dto/order-params.dto';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { UpdateOrderDto } from './dto/update-order.dto';
import type { OrderService } from './order.service';

export class OrderController {
  constructor(private readonly service: OrderService) {}

  async listOrders(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params as unknown as OrderUnitParamsDto;
    const result = await this.service.listOrders(
      unitId,
      req.query as unknown as ListOrdersQueryDto,
    );
    res.status(200).json(result);
  }

  async listTransactionHistory(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params as unknown as OrderUnitParamsDto;
    const result = await this.service.listTransactionHistory(
      unitId,
      req.query as unknown as ListTransactionHistoryQueryDto,
      req.user!,
    );
    res.status(200).json(result);
  }

  async getOrderById(req: Request, res: Response): Promise<void> {
    const { unitId, orderId } = req.params as unknown as OrderItemParamsDto;
    const result = await this.service.getOrderById(unitId, orderId);
    res.status(200).json(result);
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params as unknown as OrderUnitParamsDto;
    const userId = req.user!.sub;
    const result = await this.service.createOrder(
      unitId,
      userId,
      req.body as CreateOrderDto,
    );
    res.status(201).json(result);
  }

  async updateOrder(req: Request, res: Response): Promise<void> {
    const { unitId, orderId } = req.params as unknown as OrderItemParamsDto;
    const result = await this.service.updateOrder(
      unitId,
      orderId,
      req.body as UpdateOrderDto,
    );
    res.status(200).json(result);
  }

  async cancelOrder(req: Request, res: Response): Promise<void> {
    const { unitId, orderId } = req.params as unknown as OrderItemParamsDto;
    const result = await this.service.cancelOrder(unitId, orderId);
    res.status(200).json(result);
  }
}
