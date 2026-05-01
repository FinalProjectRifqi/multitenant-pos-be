import type { Logger } from 'pino';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import type { CreateBusinessUnitDto } from './dto/create-business-unit.dto';
import type { ListBusinessUnitsQueryDto } from './dto/list-business-units-query.dto';
import type { UpdateBusinessUnitDto } from './dto/update-business-unit.dto';
import { unitNotFoundError } from './errors/business-unit.errors';
import type {
  BusinessUnit,
  BusinessUnitDeleteResponse,
  BusinessUnitDetailResponse,
  BusinessUnitListResponse,
  BusinessUnitResponse,
  BusinessUnitStatsResponse,
} from './models/business-unit.model';
import type { IBusinessUnitRepository } from './repositories/business-unit.repository';

export class BusinessUnitService {
  constructor(
    private readonly repository: IBusinessUnitRepository,
    private readonly logger: Logger,
  ) {}

  async listBusinessUnits(
    query: ListBusinessUnitsQueryDto,
  ): Promise<BusinessUnitListResponse> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const search =
        query.search && query.search.length > 0 ? query.search : undefined;
      const showInactive = query.show_inactive === 'true';

      this.logger.info(
        { page, limit, search, showInactive },
        'Fetching business units list',
      );

      const { data, total } = await this.repository.findAll({
        page,
        limit,
        search,
        showInactive,
      });

      const totalPages = Math.ceil(total / limit);

      this.logger.info(
        { total, page, limit },
        'Business units list fetched successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Data unit usaha berhasil diambil',
        data: data.map((unit) => this.mapToResponse(unit)),
        meta: { page, limit, total, totalPages },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error },
        'Unexpected error while fetching business units list',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getBusinessUnitStats(): Promise<BusinessUnitStatsResponse> {
    try {
      this.logger.info('Fetching business unit stats');

      const stats = await this.repository.getStats();

      this.logger.info({ stats }, 'Business unit stats fetched successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Statistik unit usaha berhasil diambil',
        data: stats,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error },
        'Unexpected error while fetching business unit stats',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async createBusinessUnit(
    dto: CreateBusinessUnitDto,
  ): Promise<BusinessUnitDetailResponse> {
    try {
      this.logger.info(
        { name: dto.business_unit_name },
        'Creating business unit',
      );

      const status = dto.is_active === false ? 'inactive' : 'active';

      const unit = await this.repository.create({
        unit_name: dto.business_unit_name,
        unit_address: dto.business_unit_address,
        phone_number: dto.business_unit_phone ?? null,
        status,
      });

      this.logger.info(
        { unitId: unit.unit_id },
        'Business unit created successfully',
      );

      return {
        success: true,
        statusCode: 201,
        message: 'Unit usaha berhasil dibuat',
        data: this.mapToResponse(unit),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error, name: dto.business_unit_name },
        'Unexpected error while creating business unit',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getBusinessUnitById(id: string): Promise<BusinessUnitDetailResponse> {
    try {
      this.logger.info({ unitId: id }, 'Fetching business unit by ID');

      const unit = await this.repository.findById(id);

      if (!unit) {
        this.logger.warn({ unitId: id }, 'Business unit not found');
        throw unitNotFoundError();
      }

      this.logger.info({ unitId: id }, 'Business unit fetched successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Detail unit usaha berhasil diambil',
        data: this.mapToResponse(unit),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error, unitId: id },
        'Unexpected error while fetching business unit',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async updateBusinessUnit(
    id: string,
    dto: UpdateBusinessUnitDto,
  ): Promise<BusinessUnitDetailResponse> {
    try {
      this.logger.info({ unitId: id }, 'Updating business unit');

      const hasAnyField =
        dto.business_unit_name !== undefined ||
        dto.business_unit_address !== undefined ||
        dto.business_unit_phone !== undefined ||
        dto.is_active !== undefined;

      if (!hasAnyField) {
        throw new AppError({
          code: ErrorCodes.ValidationFailed,
          message: 'Minimal satu field harus diisi untuk melakukan pembaruan',
          status: 400,
        });
      }

      const existing = await this.repository.findById(id);

      if (!existing) {
        this.logger.warn({ unitId: id }, 'Business unit not found for update');
        throw unitNotFoundError();
      }

      const updateData: {
        unit_name?: string;
        unit_address?: string;
        phone_number?: string | null;
        status?: 'active' | 'inactive';
      } = {};

      if (dto.business_unit_name !== undefined)
        updateData.unit_name = dto.business_unit_name;
      if (dto.business_unit_address !== undefined)
        updateData.unit_address = dto.business_unit_address;
      if (dto.business_unit_phone !== undefined)
        updateData.phone_number = dto.business_unit_phone;
      if (dto.is_active !== undefined)
        updateData.status = dto.is_active ? 'active' : 'inactive';

      const updated = await this.repository.update(id, updateData);

      this.logger.info({ unitId: id }, 'Business unit updated successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Unit usaha berhasil diperbarui',
        data: this.mapToResponse(updated),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error, unitId: id },
        'Unexpected error while updating business unit',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async deleteBusinessUnit(id: string): Promise<BusinessUnitDeleteResponse> {
    try {
      this.logger.info({ unitId: id }, 'Deleting business unit');

      const existing = await this.repository.findById(id);

      if (!existing) {
        this.logger.warn(
          { unitId: id },
          'Business unit not found for deletion',
        );
        throw unitNotFoundError();
      }

      await this.repository.softDelete(id);

      this.logger.info({ unitId: id }, 'Business unit deleted successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Unit usaha berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error, unitId: id },
        'Unexpected error while deleting business unit',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  private mapToResponse(unit: BusinessUnit): BusinessUnitResponse {
    return {
      business_unit_id: unit.unit_id,
      business_unit_name: unit.unit_name,
      business_unit_address: unit.unit_address,
      business_unit_phone: unit.phone_number,
      business_unit_status: unit.status,
    };
  }
}
