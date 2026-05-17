import type { Logger } from 'pino';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import type { CreateInventarisItemDto } from './dto/create-inventaris-item.dto';
import type { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import type {
  CreateDailyInventoryPlanDto,
  ListDailyInventoryPlanQueryDto,
  UpdateDailyInventoryPlanDto,
} from './dto/daily-inventory-plan.dto';
import type {
  CreateDailyInventoryRealizationDto,
  ListDailyInventoryRealizationQueryDto,
} from './dto/daily-inventory-realization.dto';
import type { ListInventarisQueryDto } from './dto/list-inventaris-query.dto';
import type { ListInventoryTransactionsQueryDto } from './dto/list-inventory-transactions-query.dto';
import type { UpdateInventarisItemDto } from './dto/update-inventaris-item.dto';
import {
  dailyInventoryPlanAlreadyRealizedError,
  dailyInventoryPlanConflictError,
  dailyInventoryPlanNotFoundError,
  dailyInventoryRealizationNotFoundError,
  inventoryItemConflictError,
  inventoryItemNotFoundError,
  inventoryUnitMismatchError,
  inventoryUnitNotFoundError,
} from './errors/inventaris.errors';
import type {
  DailyInventoryPlanDeleteResponse,
  DailyInventoryPlanDetailResponse,
  DailyInventoryPlanListResponse,
  DailyInventoryRealizationDetailResponse,
  DailyInventoryRealizationListResponse,
  DailyUsageReportResponse,
  InventoryItemDeleteResponse,
  InventoryItemDetailResponse,
  InventoryItemListResponse,
  InventoryItemStatsResponse,
  InventoryTransactionCreateResponse,
  InventoryTransactionListResponse,
  InventoryVarianceReportResponse,
} from './models/inventaris.model';
import type {
  IInventarisRepository,
  InventorySortByColumn,
} from './repositories/inventaris.repository';

export class InventarisService {
  constructor(
    private readonly repository: IInventarisRepository,
    private readonly logger: Logger,
  ) {}

  async listItems(
    businessId: string,
    query: ListInventarisQueryDto,
  ): Promise<InventoryItemListResponse> {
    try {
      await this.assertUnitExists(businessId);

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const sortBy =
        (query.sortBy as InventorySortByColumn | undefined) ?? 'updated_at';
      const sortType = query.sortType ?? 'DESC';
      const search =
        query.search && query.search.trim().length > 0
          ? query.search.trim()
          : undefined;

      const { data, total } = await this.repository.findAll({
        businessId,
        page,
        limit,
        search,
        sortBy,
        sortType,
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Daftar inventaris berhasil dimuat',
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, query },
        'Unexpected error while listing inventory items',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Gagal memuat daftar inventaris',
        status: 500,
      });
    }
  }

  async getItemById(
    businessId: string,
    inventoryItemId: string,
  ): Promise<InventoryItemDetailResponse> {
    try {
      await this.assertUnitExists(businessId);

      const item = await this.repository.findById(businessId, inventoryItemId);
      if (!item) {
        throw inventoryItemNotFoundError({ businessId, inventoryItemId });
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Detail inventaris berhasil dimuat',
        data: item,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, inventoryItemId },
        'Unexpected error while getting inventory item detail',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async createItem(
    businessId: string,
    dto: CreateInventarisItemDto,
  ): Promise<InventoryItemDetailResponse> {
    try {
      await this.assertUnitExists(businessId);
      this.assertThreshold(dto.min_threshold, dto.max_threshold);

      const existing = await this.repository.findByName(
        businessId,
        dto.inventory_item_name,
      );
      if (existing) {
        throw inventoryItemConflictError({
          businessId,
          inventory_item_name: dto.inventory_item_name,
        });
      }

      const data = await this.repository.create({
        businessId,
        inventory_item_name: dto.inventory_item_name,
        description: dto.description,
        unit_of_measure: dto.unit_of_measure,
        current_stock: dto.current_stock,
        min_threshold: dto.min_threshold,
        max_threshold: dto.max_threshold,
      });

      return {
        success: true,
        statusCode: 201,
        message: 'Item inventaris berhasil dibuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, dto },
        'Unexpected error while creating inventory item',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async updateItem(
    businessId: string,
    inventoryItemId: string,
    userId: string,
    dto: UpdateInventarisItemDto,
  ): Promise<InventoryItemDetailResponse> {
    try {
      await this.assertUnitExists(businessId);
      this.assertUpdatePayload(dto);

      const currentItem = await this.repository.findById(
        businessId,
        inventoryItemId,
      );
      if (!currentItem) {
        throw inventoryItemNotFoundError({ businessId, inventoryItemId });
      }

      const nextMin = dto.min_threshold ?? currentItem.min_threshold;
      const nextMax = dto.max_threshold ?? currentItem.max_threshold;
      this.assertThreshold(nextMin, nextMax);

      if (dto.inventory_item_name) {
        const existing = await this.repository.findByName(
          businessId,
          dto.inventory_item_name,
          inventoryItemId,
        );
        if (existing) {
          throw inventoryItemConflictError({
            businessId,
            inventory_item_name: dto.inventory_item_name,
          });
        }
      }

      const data = await this.repository.update(businessId, inventoryItemId, {
        inventory_item_name: dto.inventory_item_name,
        description: dto.description,
        unit_of_measure: dto.unit_of_measure,
        current_stock: dto.current_stock,
        min_threshold: dto.min_threshold,
        max_threshold: dto.max_threshold,
        updated_by_user_id: userId,
      });
      if (!data) {
        throw inventoryItemNotFoundError({ businessId, inventoryItemId });
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Item inventaris berhasil diperbarui',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, inventoryItemId, userId, dto },
        'Unexpected error while updating inventory item',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async deleteItem(
    businessId: string,
    inventoryItemId: string,
  ): Promise<InventoryItemDeleteResponse> {
    try {
      await this.assertUnitExists(businessId);
      const deleted = await this.repository.softDelete(
        businessId,
        inventoryItemId,
      );

      if (!deleted) {
        throw inventoryItemNotFoundError({ businessId, inventoryItemId });
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Item inventaris berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, inventoryItemId },
        'Unexpected error while deleting inventory item',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getStats(businessId: string): Promise<InventoryItemStatsResponse> {
    try {
      await this.assertUnitExists(businessId);
      const data = await this.repository.getStats(businessId);

      return {
        success: true,
        statusCode: 200,
        message: 'Statistik inventaris berhasil dimuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId },
        'Unexpected error while getting inventory stats',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async listTransactions(
    businessId: string,
    query: ListInventoryTransactionsQueryDto,
  ): Promise<InventoryTransactionListResponse> {
    try {
      await this.assertUnitExists(businessId);

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const { data, total } = await this.repository.listTransactions({
        businessId,
        page,
        limit,
        inventory_item_id: query.inventory_item_id,
        transaction_type: query.transaction_type,
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Riwayat transaksi inventaris berhasil dimuat',
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, query },
        'Unexpected error while listing inventory transactions',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async createTransaction(
    businessId: string,
    userId: string,
    dto: CreateInventoryTransactionDto,
  ): Promise<InventoryTransactionCreateResponse> {
    try {
      await this.assertUnitExists(businessId);

      const data = await this.repository.createTransaction({
        businessId,
        user_id: userId,
        ...dto,
      });

      if (!data) {
        throw inventoryItemNotFoundError({
          businessId,
          inventoryItemId: dto.inventory_item_id,
        });
      }

      return {
        success: true,
        statusCode: 201,
        message: 'Transaksi inventaris berhasil dibuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, userId, dto },
        'Unexpected error while creating inventory transaction',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async createDailyPlan(
    businessId: string,
    userId: string,
    dto: CreateDailyInventoryPlanDto,
  ): Promise<DailyInventoryPlanDetailResponse> {
    try {
      await this.assertUnitExists(businessId);
      await this.assertInventoryItemAndUnit(
        businessId,
        dto.inventory_item_id,
        dto.unit,
      );

      const existing = await this.repository.findDailyPlanByDateAndItem(
        businessId,
        dto.date,
        dto.inventory_item_id,
      );
      if (existing) {
        throw dailyInventoryPlanConflictError({
          businessId,
          date: dto.date,
          inventory_item_id: dto.inventory_item_id,
        });
      }

      const data = await this.repository.createDailyPlan({
        businessId,
        date: dto.date,
        inventory_item_id: dto.inventory_item_id,
        planned_usage_qty: dto.planned_usage_qty,
        unit: dto.unit,
        notes: dto.notes,
        created_by: userId,
      });

      if (!data) {
        throw inventoryItemNotFoundError({
          businessId,
          inventoryItemId: dto.inventory_item_id,
        });
      }

      return {
        success: true,
        statusCode: 201,
        message: 'Rencana inventaris harian berhasil dibuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, userId, dto },
        'Unexpected error while creating daily inventory plan',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async listDailyPlans(
    businessId: string,
    query: ListDailyInventoryPlanQueryDto,
  ): Promise<DailyInventoryPlanListResponse> {
    try {
      await this.assertUnitExists(businessId);
      const data = await this.repository.findDailyPlans(businessId, query.date);

      return {
        success: true,
        statusCode: 200,
        message: 'Daftar rencana inventaris harian berhasil dimuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, query },
        'Unexpected error while listing daily inventory plans',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async updateDailyPlan(
    businessId: string,
    dailyPlanId: string,
    dto: UpdateDailyInventoryPlanDto,
  ): Promise<DailyInventoryPlanDetailResponse> {
    try {
      await this.assertUnitExists(businessId);
      this.assertUpdatePayload(dto);

      const current = await this.repository.findDailyPlanById(
        businessId,
        dailyPlanId,
      );
      if (!current) {
        throw dailyInventoryPlanNotFoundError({ businessId, dailyPlanId });
      }

      const realization = await this.repository.findRealizationByPlanId(
        businessId,
        dailyPlanId,
      );
      if (realization) {
        throw dailyInventoryPlanAlreadyRealizedError({
          businessId,
          dailyPlanId,
        });
      }

      if (dto.unit !== undefined) {
        await this.assertInventoryItemAndUnit(
          businessId,
          current.inventory_item_id,
          dto.unit,
        );
      }

      const data = await this.repository.updateDailyPlan(
        businessId,
        dailyPlanId,
        dto,
      );
      if (!data) {
        throw dailyInventoryPlanNotFoundError({ businessId, dailyPlanId });
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Rencana inventaris harian berhasil diperbarui',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, dailyPlanId, dto },
        'Unexpected error while updating daily inventory plan',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async deleteDailyPlan(
    businessId: string,
    dailyPlanId: string,
  ): Promise<DailyInventoryPlanDeleteResponse> {
    try {
      await this.assertUnitExists(businessId);
      const deleted = await this.repository.deleteDailyPlan(
        businessId,
        dailyPlanId,
      );

      if (!deleted) {
        throw dailyInventoryPlanNotFoundError({ businessId, dailyPlanId });
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Rencana inventaris harian berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, dailyPlanId },
        'Unexpected error while deleting daily inventory plan',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async submitDailyRealization(
    businessId: string,
    userId: string,
    dto: CreateDailyInventoryRealizationDto,
  ): Promise<DailyInventoryRealizationDetailResponse> {
    try {
      await this.assertUnitExists(businessId);

      const plan = await this.repository.findDailyPlanByDateAndItem(
        businessId,
        dto.date,
        dto.inventory_item_id,
      );
      if (!plan) {
        throw dailyInventoryPlanNotFoundError({
          businessId,
          date: dto.date,
          inventory_item_id: dto.inventory_item_id,
        });
      }

      const data = await this.repository.createDailyRealization({
        businessId,
        date: dto.date,
        inventory_item_id: dto.inventory_item_id,
        actual_usage_qty: dto.actual_usage_qty,
        waste_qty: dto.waste_qty ?? 0,
        remaining_qty: dto.remaining_qty,
        notes: dto.notes,
        submitted_by: userId,
      });

      if (!data) {
        throw dailyInventoryPlanNotFoundError({
          businessId,
          date: dto.date,
          inventory_item_id: dto.inventory_item_id,
        });
      }

      return {
        success: true,
        statusCode: 201,
        message: 'Realisasi inventaris harian berhasil disubmit',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, userId, dto },
        'Unexpected error while submitting daily inventory realization',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async listDailyRealizations(
    businessId: string,
    query: ListDailyInventoryRealizationQueryDto,
  ): Promise<DailyInventoryRealizationListResponse> {
    try {
      await this.assertUnitExists(businessId);
      const data = await this.repository.findDailyRealizations(
        businessId,
        query.date,
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Daftar realisasi inventaris harian berhasil dimuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, query },
        'Unexpected error while listing daily inventory realizations',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getDailyRealizationById(
    businessId: string,
    dailyRealizationId: string,
  ): Promise<DailyInventoryRealizationDetailResponse> {
    try {
      await this.assertUnitExists(businessId);
      const data = await this.repository.findDailyRealizationById(
        businessId,
        dailyRealizationId,
      );
      if (!data) {
        throw dailyInventoryRealizationNotFoundError({
          businessId,
          dailyRealizationId,
        });
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Detail realisasi inventaris harian berhasil dimuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, dailyRealizationId },
        'Unexpected error while getting daily inventory realization',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getDailyUsageReport(
    businessId: string,
    date: string,
  ): Promise<DailyUsageReportResponse> {
    try {
      await this.assertUnitExists(businessId);
      const data = await this.repository.getDailyUsageReport(businessId, date);

      return {
        success: true,
        statusCode: 200,
        message: 'Laporan planned vs actual usage berhasil dimuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, date },
        'Unexpected error while getting daily usage report',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getVarianceReport(
    businessId: string,
    startDate: string,
    endDate: string,
  ): Promise<InventoryVarianceReportResponse> {
    try {
      await this.assertUnitExists(businessId);
      if (startDate > endDate) {
        throw new AppError({
          code: ErrorCodes.ValidationFailed,
          message: 'startDate tidak boleh lebih besar dari endDate',
          status: 400,
        });
      }

      const data = await this.repository.getVarianceReport(
        businessId,
        startDate,
        endDate,
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Laporan variance penggunaan inventaris berhasil dimuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, startDate, endDate },
        'Unexpected error while getting inventory variance report',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  private async assertUnitExists(businessId: string): Promise<void> {
    const unit = await this.repository.findUnitById(businessId);
    if (!unit) {
      throw inventoryUnitNotFoundError({ businessId });
    }
  }

  private async assertInventoryItemAndUnit(
    businessId: string,
    inventoryItemId: string,
    unit: string,
  ): Promise<void> {
    const item = await this.repository.findById(businessId, inventoryItemId);
    if (!item) {
      throw inventoryItemNotFoundError({ businessId, inventoryItemId });
    }

    if (item.unit_of_measure !== unit) {
      throw inventoryUnitMismatchError({
        inventory_item_id: inventoryItemId,
        expected_unit: item.unit_of_measure,
        received_unit: unit,
      });
    }
  }

  private assertThreshold(minThreshold: number, maxThreshold: number): void {
    if (minThreshold > maxThreshold) {
      throw new AppError({
        code: ErrorCodes.ValidationFailed,
        message:
          'Batas minimum stok tidak boleh lebih besar dari batas maksimum',
        status: 400,
      });
    }
  }

  private assertUpdatePayload(dto: object): void {
    if (Object.keys(dto).length === 0) {
      throw new AppError({
        code: ErrorCodes.ValidationFailed,
        message: 'Tidak ada data yang dikirim untuk diperbarui',
        status: 400,
      });
    }
  }
}
