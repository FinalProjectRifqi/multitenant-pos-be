import type { Logger } from 'pino';
import { AppError } from '../../../common/errors/app-error';
import { ErrorCodes } from '../../../common/errors/error-codes';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import { BusinessUnitService } from '../business-unit.service';
import type {
  BusinessUnit,
  BusinessUnitStats,
} from '../models/business-unit.model';
import type { IBusinessUnitRepository } from '../repositories/business-unit.repository';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const createMockRepository = (): jest.Mocked<IBusinessUnitRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  getStats: jest.fn(),
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

const createBusinessUnit = (
  overrides?: Partial<BusinessUnit>,
): BusinessUnit => ({
  unit_id: VALID_UUID,
  unit_name: 'Toko Maju Jaya',
  unit_address: 'Jl. Sudirman No. 10, Jakarta',
  phone_number: '081234567890',
  status: 'active',
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides,
});

describe('BusinessUnitService', () => {
  let service: BusinessUnitService;
  let mockRepository: jest.Mocked<IBusinessUnitRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    service = new BusinessUnitService(mockRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // listBusinessUnits
  // ---------------------------------------------------------------------------

  describe('listBusinessUnits', () => {
    it('returns paginated list with correct meta when data exists', async () => {
      const unit = createBusinessUnit();
      mockRepository.findAll.mockResolvedValueOnce({ data: [unit], total: 1 });

      const result = await service.listBusinessUnits({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].business_unit_id).toBe(VALID_UUID);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('uses defaults of page=1, limit=10 when not provided', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listBusinessUnits({});

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('passes showInactive=true when show_inactive is "true"', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listBusinessUnits({ show_inactive: 'true' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ showInactive: true }),
      );
    });

    it('passes showInactive=false when show_inactive is absent', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listBusinessUnits({});

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ showInactive: false }),
      );
    });

    it('trims empty search string to undefined', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listBusinessUnits({ search: '' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: undefined }),
      );
    });

    it('throws 500 when repository throws unexpected error', async () => {
      mockRepository.findAll.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await expect(service.listBusinessUnits({})).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getBusinessUnitStats
  // ---------------------------------------------------------------------------

  describe('getBusinessUnitStats', () => {
    it('returns stats object with correct counts', async () => {
      const stats: BusinessUnitStats = {
        total_business_unit: 10,
        business_unit_active: 7,
        business_unit_inactive: 3,
      };
      mockRepository.getStats.mockResolvedValueOnce(stats);

      const result = await service.getBusinessUnitStats();

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(stats);
    });

    it('throws 500 when repository throws unexpected error', async () => {
      mockRepository.getStats.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.getBusinessUnitStats()).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createBusinessUnit
  // ---------------------------------------------------------------------------

  describe('createBusinessUnit', () => {
    it('returns 201 with mapped response on success', async () => {
      const unit = createBusinessUnit();
      mockRepository.create.mockResolvedValueOnce(unit);

      const result = await service.createBusinessUnit({
        business_unit_name: 'Toko Maju Jaya',
        business_unit_address: 'Jl. Sudirman No. 10, Jakarta',
      });

      expect(result.statusCode).toBe(201);
      expect(result.data.business_unit_id).toBe(VALID_UUID);
      expect(result.data.business_unit_name).toBe('Toko Maju Jaya');
    });

    it('maps is_active=false to status "inactive"', async () => {
      const unit = createBusinessUnit({ status: 'inactive' });
      mockRepository.create.mockResolvedValueOnce(unit);

      await service.createBusinessUnit({
        business_unit_name: 'Toko Tutup',
        business_unit_address: 'Jl. Gatot Subroto',
        is_active: false,
      });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'inactive' }),
      );
    });

    it('maps is_active=true (or omitted) to status "active"', async () => {
      const unit = createBusinessUnit();
      mockRepository.create.mockResolvedValueOnce(unit);

      await service.createBusinessUnit({
        business_unit_name: 'Toko Aktif',
        business_unit_address: 'Jl. Thamrin',
      });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
      );
    });

    it('throws 409 UNIT_CONFLICT when unit name already exists', async () => {
      mockRepository.findByName.mockResolvedValueOnce(createBusinessUnit());

      await expect(
        service.createBusinessUnit({
          business_unit_name: 'Toko Maju Jaya',
          business_unit_address: 'Jl. Sudirman No. 10, Jakarta',
        }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UnitConflict,
        status: 409,
        details: [
          expect.objectContaining({
            property: 'business_unit_name',
            constraints: expect.objectContaining({
              unique: 'Nama unit usaha sudah digunakan',
            }),
          }),
        ],
      });

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('throws 500 on unexpected repository error', async () => {
      mockRepository.create.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.createBusinessUnit({
          business_unit_name: 'Gagal',
          business_unit_address: 'Jl. Error',
        }),
      ).rejects.toMatchObject({ code: ErrorCodes.Internal, status: 500 });
    });
  });

  // ---------------------------------------------------------------------------
  // getBusinessUnitById
  // ---------------------------------------------------------------------------

  describe('getBusinessUnitById', () => {
    it('returns 200 with unit data when found', async () => {
      const unit = createBusinessUnit();
      mockRepository.findById.mockResolvedValueOnce(unit);

      const result = await service.getBusinessUnitById(VALID_UUID);

      expect(result.statusCode).toBe(200);
      expect(result.data.business_unit_id).toBe(VALID_UUID);
    });

    it('throws 404 UNIT_NOT_FOUND when unit does not exist', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.getBusinessUnitById(VALID_UUID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UnitNotFound,
        status: 404,
      });
    });

    it('throws 500 on unexpected repository error', async () => {
      mockRepository.findById.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.getBusinessUnitById(VALID_UUID),
      ).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateBusinessUnit
  // ---------------------------------------------------------------------------

  describe('updateBusinessUnit', () => {
    it('returns 200 with updated data on success', async () => {
      const existing = createBusinessUnit();
      const updated = createBusinessUnit({ unit_name: 'Nama Baru' });
      mockRepository.findById.mockResolvedValueOnce(existing);
      mockRepository.update.mockResolvedValueOnce(updated);

      const result = await service.updateBusinessUnit(VALID_UUID, {
        business_unit_name: 'Nama Baru',
      });

      expect(result.statusCode).toBe(200);
      expect(result.data.business_unit_name).toBe('Nama Baru');
    });

    it('throws 400 VALIDATION_FAILED when body is empty', async () => {
      await expect(
        service.updateBusinessUnit(VALID_UUID, {}),
      ).rejects.toMatchObject({
        code: ErrorCodes.ValidationFailed,
        status: 400,
      });

      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('throws 404 UNIT_NOT_FOUND when unit does not exist', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.updateBusinessUnit(VALID_UUID, {
          business_unit_name: 'Nama Baru',
        }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UnitNotFound,
        status: 404,
      });
    });

    it('only passes defined fields to repository update', async () => {
      const existing = createBusinessUnit();
      const updated = createBusinessUnit();
      mockRepository.findById.mockResolvedValueOnce(existing);
      mockRepository.update.mockResolvedValueOnce(updated);

      await service.updateBusinessUnit(VALID_UUID, {
        business_unit_name: 'Baru',
      });

      expect(mockRepository.update).toHaveBeenCalledWith(
        VALID_UUID,
        expect.not.objectContaining({ unit_address: expect.anything() }),
      );
    });

    it('maps is_active to correct status value', async () => {
      const existing = createBusinessUnit();
      const updated = createBusinessUnit({ status: 'inactive' });
      mockRepository.findById.mockResolvedValueOnce(existing);
      mockRepository.update.mockResolvedValueOnce(updated);

      await service.updateBusinessUnit(VALID_UUID, { is_active: false });

      expect(mockRepository.update).toHaveBeenCalledWith(
        VALID_UUID,
        expect.objectContaining({ status: 'inactive' }),
      );
    });

    it('throws 409 UNIT_CONFLICT when new name already exists on another unit', async () => {
      const existing = createBusinessUnit();
      mockRepository.findById.mockResolvedValueOnce(existing);
      mockRepository.findByName.mockResolvedValueOnce(
        createBusinessUnit({ unit_id: '660e8400-e29b-41d4-a716-446655440001' }),
      );

      await expect(
        service.updateBusinessUnit(VALID_UUID, {
          business_unit_name: 'Toko Maju Jaya',
        }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UnitConflict,
        status: 409,
      });

      expect(mockRepository.findByName).toHaveBeenCalledWith(
        'Toko Maju Jaya',
        VALID_UUID,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('excludes current unit when checking name conflicts on update', async () => {
      const existing = createBusinessUnit();
      const updated = createBusinessUnit({ unit_name: 'Nama Baru' });
      mockRepository.findById.mockResolvedValueOnce(existing);
      mockRepository.findByName.mockResolvedValueOnce(null);
      mockRepository.update.mockResolvedValueOnce(updated);

      await service.updateBusinessUnit(VALID_UUID, {
        business_unit_name: 'Nama Baru',
      });

      expect(mockRepository.findByName).toHaveBeenCalledWith(
        'Nama Baru',
        VALID_UUID,
      );
    });

    it('re-throws AppError from repository without wrapping', async () => {
      const existing = createBusinessUnit();
      mockRepository.findById.mockResolvedValueOnce(existing);
      const appError = new AppError({
        code: ErrorCodes.Internal,
        message: 'DB fail',
        status: 500,
      });
      mockRepository.update.mockRejectedValueOnce(appError);

      await expect(
        service.updateBusinessUnit(VALID_UUID, { business_unit_name: 'X' }),
      ).rejects.toBe(appError);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteBusinessUnit
  // ---------------------------------------------------------------------------

  describe('deleteBusinessUnit', () => {
    it('returns 200 with success message when unit deleted', async () => {
      const existing = createBusinessUnit();
      mockRepository.findById.mockResolvedValueOnce(existing);
      mockRepository.softDelete.mockResolvedValueOnce();

      const result = await service.deleteBusinessUnit(VALID_UUID);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(VALID_UUID);
    });

    it('throws 404 UNIT_NOT_FOUND when unit does not exist', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.deleteBusinessUnit(VALID_UUID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UnitNotFound,
        status: 404,
      });

      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it('throws 500 on unexpected repository error', async () => {
      mockRepository.findById.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.deleteBusinessUnit(VALID_UUID),
      ).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });
});
