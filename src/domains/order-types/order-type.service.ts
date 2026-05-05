import { Logger } from 'pino';

import { ListOrderTypesQueryDto } from './dto/list-order-type-query.dto';
import {
  OrderTypeListResponse,
  OrderTypeResponse,
  OrderType,
} from './models/order-type.model';
import { IOrderTypeRepository } from './repositories/order-type.repository';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';

export class OrderTypeService {
  constructor(
    private readonly repository: IOrderTypeRepository,
    private readonly logger: Logger,
  ) {}

  async listOrderTypes(
    query: ListOrderTypesQueryDto,
  ): Promise<OrderTypeListResponse> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;

      this.logger.info({ page, limit }, 'Fetching order type list');

      const { data, total } = await this.repository.findAll({
        page,
        limit,
      });

      const totalPages = Math.ceil(total / limit);

      this.logger.info(
        { total, page, limit },
        'Order types list fetched successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Data tipe pesanan berhasil diambil',
        data: data.map((orderType) => this.mapToResponse(orderType)),
        meta: { page, limit, total, totalPages },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error },
        'Unexpected error while fetching order type list',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  private mapToResponse(orderType: OrderType): OrderTypeResponse {
    return {
      order_type_id: orderType.order_type_id,
      order_type_name: orderType.order_type_name,
      order_type_code: orderType.order_type_code,
    };
  }
}
