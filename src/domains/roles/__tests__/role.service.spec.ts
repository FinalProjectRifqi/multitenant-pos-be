import type { Logger } from 'pino';
import { ErrorCodes } from '../../../common/errors/error-codes';
import type { Role } from '../models/role.model';
import type { IRoleRepository } from '../repositories/role.repository';
import { RoleService } from '../role.service';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const createMockRepository = (): jest.Mocked<IRoleRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
});

const createMockLogger = (): jest.Mocked<Logger> =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as jest.Mocked<Logger>;

const createRole = (overrides?: Partial<Role>): Role => ({
  role_id: VALID_UUID,
  role_name: 'Director',
  description: 'Director of the company',
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides,
});

describe('RoleService', () => {
  let service: RoleService;
  let mockRepository: jest.Mocked<IRoleRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    service = new RoleService(mockRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // listRoles
  // ---------------------------------------------------------------------------

  describe('listRoles', () => {
    it('returns paginated list with correct meta when data exists', async () => {
      const role = createRole();
      mockRepository.findAll.mockResolvedValueOnce({ data: [role], total: 1 });

      const result = await service.listRoles({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].role_id).toBe(VALID_UUID);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('uses defaults of page=1, limit=10 when not provided', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listRoles({});

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('trims empty search string to undefined', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listRoles({ search: '' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: undefined }),
      );
    });

    it('throws 500 when repository throws unexpected error', async () => {
      mockRepository.findAll.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await expect(service.listRoles({})).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });
});
