import type { Request, Response } from 'express';
import { ListOrderTypesQueryDto } from './dto/list-order-type-query.dto';
import { OrderTypeService } from './order-type.service';

export class OrderTypeController {
  constructor(private readonly service: OrderTypeService) {}

  async listOrderTypes(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOrderTypesQueryDto;
    const result = await this.service.listOrderTypes(query);
    res.status(200).json(result);
  }
}
