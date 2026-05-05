import type { Logger } from 'pino';

import { IOrderTypeRepository } from '../repositories/order-type.repository';
import { OrderType } from '../models/order-type.model';
import { OrderTypeService } from '../order-type.service';
import { ErrorCodes } from '../../../common/errors/error-codes';

const VALID_UUID = '';

const createMockRepository = (): jest.Mocked<IOrderTypeRepository> => ({
  findAll: jest.fn(),
});

const createMockLogger = (): jest.Mocked<Logger> =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as jest.Mocked<Logger>;

const createOrderType = (overrides?: Partial<OrderType>): OrderType => ({
  order_type_id: VALID_UUID,
  order_type_name: 'Dine In',
  order_type_code: 'DINE_IN',
  ...overrides,
});

describe('OrderTypeService', () => {
  let service: OrderTypeService;
  let mockRepository: jest.Mocked<IOrderTypeRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    service = new OrderTypeService(mockRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // listOrderTypes
  // ---------------------------------------------------------------------------

  describe('listOrderTypes', () => {
    it('returns paginated list with correct meta when data exists', async () => {
      const orderType = createOrderType();
      mockRepository.findAll.mockResolvedValueOnce({
        data: [orderType],
        total: 1,
      });

      const result = await service.listOrderTypes({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].order_type_id).toBe(VALID_UUID);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('uses defaults of page=1, limit=10 when not provided', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listOrderTypes({});

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('throws 500 when repository throws unexpected error', async () => {
      mockRepository.findAll.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await expect(service.listOrderTypes({})).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });
});
