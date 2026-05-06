import type { Request, Response } from 'express';
import type { JwtTokenPayload } from '../auth/models/auth.model';
import type { KdsOrderStatusService } from './kds-order-status.service';
import type { KdsOrderStatusTransitionDto } from './dto/kds-order-status-transition.dto';
import type { OrderItemParamsDto } from '../orders/dto/order-params.dto';

export class KdsOrderStatusController {
  constructor(private readonly service: KdsOrderStatusService) {}

  async transition(req: Request, res: Response): Promise<void> {
    const { unitId, orderId } = req.params as unknown as OrderItemParamsDto;
    const jwtUser = (req as Request & { user?: JwtTokenPayload }).user;
    const result = await this.service.transitionOrderStatus(
      unitId,
      orderId,
      req.body as KdsOrderStatusTransitionDto,
      {
        userId: jwtUser?.sub,
        correlationId:
          typeof req.id === 'string' && req.id.length > 0 ? req.id : undefined,
      },
    );
    res.status(200).json(result);
  }

  async cancel(req: Request, res: Response): Promise<void> {
    const { unitId, orderId } = req.params as unknown as OrderItemParamsDto;
    const jwtUser = (req as Request & { user?: JwtTokenPayload }).user;
    const result = await this.service.cancelOrderFromKds(unitId, orderId, {
      userId: jwtUser?.sub,
      correlationId:
        typeof req.id === 'string' && req.id.length > 0 ? req.id : undefined,
    });
    res.status(200).json(result);
  }
}
