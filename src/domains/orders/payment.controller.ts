import type { Request, Response } from 'express';
import type { CreateCashlessPaymentDto } from './dto/create-cashless-payment.dto';
import type { CreateCashPaymentDto } from './dto/create-cash-payment.dto';
import type {
  PaymentItemParamsDto,
  PaymentOrderParamsDto,
} from './dto/payment-params.dto';
import type { PaymentService } from './payment.service';

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  async createCashlessPayment(req: Request, res: Response): Promise<void> {
    const { unitId, orderId } = req.params as unknown as PaymentOrderParamsDto;
    const userId = req.user!.sub;
    const result = await this.service.createCashlessPayment(
      unitId,
      orderId,
      userId,
      req.body as CreateCashlessPaymentDto,
    );
    res.status(201).json(result);
  }

  async createCashPayment(req: Request, res: Response): Promise<void> {
    const { unitId, orderId } = req.params as unknown as PaymentOrderParamsDto;
    const userId = req.user!.sub;
    const result = await this.service.createCashPayment(
      unitId,
      orderId,
      userId,
      req.body as CreateCashPaymentDto,
    );
    res.status(201).json(result);
  }

  async listPayments(req: Request, res: Response): Promise<void> {
    const { unitId, orderId } = req.params as unknown as PaymentOrderParamsDto;
    const result = await this.service.listPayments(unitId, orderId);
    res.status(200).json(result);
  }

  async getPaymentById(req: Request, res: Response): Promise<void> {
    const { unitId, orderId, paymentId } =
      req.params as unknown as PaymentItemParamsDto;
    const result = await this.service.getPaymentById(
      unitId,
      orderId,
      paymentId,
    );
    res.status(200).json(result);
  }

  async handleMidtransWebhook(req: Request, res: Response): Promise<void> {
    const result = await this.service.handleMidtransWebhook(req.body);
    res.status(200).json(result);
  }
}
