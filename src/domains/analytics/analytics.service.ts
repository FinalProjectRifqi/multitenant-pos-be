import type { Logger } from 'pino';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { authForbiddenError } from '../auth/errors/auth.errors';
import type { JwtTokenPayload } from '../auth/models/auth.model';
import { unitNotFoundError } from '../business-units/errors/business-unit.errors';
import type {
  AnalyticsScope,
  AnalyticsSummaryData,
  AnalyticsSummaryResponse,
} from './models/analytics.model';
import type { IAnalyticsRepository } from './repositories/analytics.repository';

export class AnalyticsService {
  constructor(
    private readonly repository: IAnalyticsRepository,
    private readonly logger: Logger,
  ) {}

  async getGroupSummary(
    user: JwtTokenPayload,
    query: { startDate?: string; endDate?: string },
  ): Promise<AnalyticsSummaryResponse> {
    try {
      this.assertValidDateRange(query.startDate, query.endDate);
      this.assertGroupRole(user);

      const data = await this.buildSummary({
        startDate: query.startDate,
        endDate: query.endDate,
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Laporan analytics grup berhasil dimuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, userId: user.sub, query },
        'Unexpected error while getting group analytics summary',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getUnitSummary(
    user: JwtTokenPayload,
    unitId: string,
    query: { startDate?: string; endDate?: string },
  ): Promise<AnalyticsSummaryResponse> {
    try {
      this.assertValidDateRange(query.startDate, query.endDate);
      await this.assertUnitExists(unitId);
      this.assertCanAccessUnit(user, unitId);

      const data = await this.buildSummary({
        unitIds: [unitId],
        startDate: query.startDate,
        endDate: query.endDate,
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Laporan analytics unit berhasil dimuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, userId: user.sub, unitId, query },
        'Unexpected error while getting unit analytics summary',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getMyUnitSummary(
    user: JwtTokenPayload,
    query: { unitId?: string; startDate?: string; endDate?: string },
  ): Promise<AnalyticsSummaryResponse> {
    try {
      this.assertValidDateRange(query.startDate, query.endDate);

      if (user.units.length === 0) {
        throw authForbiddenError();
      }

      const unitIds = query.unitId ? [query.unitId] : user.units;
      for (const unitId of unitIds) {
        await this.assertUnitExists(unitId);
        this.assertCanAccessUnit(user, unitId);
      }

      const data = await this.buildSummary({
        unitIds,
        startDate: query.startDate,
        endDate: query.endDate,
      });

      return {
        success: true,
        statusCode: 200,
        message: 'Laporan analytics unit saya berhasil dimuat',
        data,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, userId: user.sub, query },
        'Unexpected error while getting my unit analytics summary',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  private async buildSummary(
    scope: AnalyticsScope,
  ): Promise<AnalyticsSummaryData> {
    const [
      metrics,
      statusTransactions,
      topMenus,
      revenueByMenu,
      revenueByUnit,
      criticalStockUnits,
      paymentSummary,
      paymentHistory,
      lowStockItems,
      dailyInventoryUsage,
    ] = await Promise.all([
      this.repository.getMetrics(scope),
      this.repository.getStatusTransactions(scope),
      this.repository.getTopMenus(scope),
      this.repository.getRevenueByMenu(scope),
      this.repository.getRevenueByUnit(scope),
      this.repository.getCriticalStockUnits(scope),
      this.repository.getPaymentSummary(scope),
      this.repository.getPaymentHistory(scope),
      this.repository.getLowStockItems(scope),
      this.repository.getDailyInventoryUsage(scope),
    ]);

    return {
      metrics,
      status_transactions: statusTransactions,
      top_menus: topMenus,
      revenue_by_menu: revenueByMenu,
      revenue_by_unit: revenueByUnit,
      unit_comparison: revenueByUnit,
      critical_stock_units: criticalStockUnits,
      payment_summary: paymentSummary,
      payment_history: paymentHistory,
      low_stock_items: lowStockItems,
      daily_inventory_usage: dailyInventoryUsage,
      waste_and_variance: dailyInventoryUsage.filter(
        (row) => row.waste_qty > 0 || row.variance_qty !== 0,
      ),
    };
  }

  private async assertUnitExists(unitId: string): Promise<void> {
    const unit = await this.repository.findUnitById(unitId);
    if (!unit) {
      throw unitNotFoundError({ unitId });
    }
  }

  private assertCanAccessUnit(user: JwtTokenPayload, unitId: string): void {
    if (this.isGroupRole(user.roles)) return;
    if (user.units.includes(unitId)) return;
    throw authForbiddenError();
  }

  private assertGroupRole(user: JwtTokenPayload): void {
    if (!this.isGroupRole(user.roles)) {
      throw authForbiddenError();
    }
  }

  private isGroupRole(roleCode: string): boolean {
    return ['SUPER_ADMIN', 'GROUP_ADMIN', 'GROUP_MANAGER', 'OWNER'].includes(
      roleCode.toUpperCase(),
    );
  }

  private assertValidDateRange(startDate?: string, endDate?: string): void {
    if (startDate && endDate && startDate > endDate) {
      throw new AppError({
        code: ErrorCodes.ValidationFailed,
        message: 'startDate tidak boleh lebih besar dari endDate',
        status: 400,
      });
    }
  }
}
