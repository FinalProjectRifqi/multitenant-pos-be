import type { Logger } from 'pino';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { authForbiddenError } from '../auth/errors/auth.errors';
import type { JwtTokenPayload } from '../auth/models/auth.model';
import { unitNotFoundError } from '../business-units/errors/business-unit.errors';
import type {
  AnalyticsCompareMetric,
  AnalyticsPeriod,
  CompareUnitsAnalyticsQueryDto,
  GroupSummaryAnalyticsQueryDto,
  MyUnitAnalyticsQueryDto,
} from './dto/analytics-query.dto';
import { ANALYTICS_COMPARE_METRICS } from './dto/analytics-query.dto';
import type {
  AnalyticsCriticalStockUnitRow,
  AnalyticsDailyUsageRow,
  AnalyticsInventoryPerformanceRow,
  AnalyticsInventoryRow,
  AnalyticsMenuRow,
  AnalyticsMetricSummary,
  AnalyticsPaymentHistoryRow,
  AnalyticsPaymentRow,
  AnalyticsReportResponse,
  AnalyticsScope,
  AnalyticsStatusRow,
  AnalyticsUnitRevenueRow,
  AnalyticsUnitRow,
} from './models/analytics.model';
import type { IAnalyticsRepository } from './repositories/analytics.repository';
import { assertValidDateRange, resolvePeriod } from './utils/analytics-period';

const GROUP_MANAGEMENT_ROLE = 'GROUP_MANAGEMENT';
const UNIT_MANAGER_ROLE = 'UNIT_MANAGER';

type UnitResponse = {
  unitId: string;
  unitName: string;
  location: string | null;
};

type MetricsResponse = {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  completedTransactions: number;
  cancelledTransactions: number;
};

type TransactionStatusResponse = {
  completed: number;
  cancelled: number;
  pending: number;
};

type UnitPerformanceResponse = MetricsResponse & {
  unitId: string;
  unitName: string;
  criticalStockItems: number;
};

type UnitReportData = MetricsResponse & {
  unit: UnitResponse | null;
  transactionStatus: TransactionStatusResponse;
  bestSellingMenus: AnalyticsMenuRow[];
  paymentReport: AnalyticsPaymentRow[];
  inventoryReport: {
    lowStockItems: AnalyticsInventoryRow[];
    outOfStockItems: AnalyticsInventoryRow[];
  };
  dailyInventoryUsage: AnalyticsDailyUsageRow[];
  menuRevenue?: AnalyticsMenuRow[];
  paymentHistory?: AnalyticsPaymentHistoryRow[];
  dailyWaste?: AnalyticsDailyUsageRow[];
  dailyVariance?: AnalyticsDailyUsageRow[];
};

type GroupSummaryData = MetricsResponse & {
  bestSellingMenus: AnalyticsMenuRow[];
  highestRevenueUnit: AnalyticsUnitRevenueRow | null;
  criticalStockUnits: AnalyticsCriticalStockUnitRow[];
  unitPerformanceComparison: UnitPerformanceResponse[];
};

type CompareUnitsData = {
  comparedUnits: Array<{ unitId: string; unitName: string }>;
  selectedMetrics: AnalyticsCompareMetric[];
  revenueComparison: AnalyticsUnitRevenueRow[];
  transactionComparison: AnalyticsUnitRevenueRow[];
  averageOrderComparison: AnalyticsUnitRevenueRow[];
  bestSellingMenuComparison: AnalyticsMenuRow[];
  inventoryComparison: AnalyticsInventoryPerformanceRow[];
  criticalStockComparison: AnalyticsCriticalStockUnitRow[];
};

export class AnalyticsService {
  constructor(
    private readonly repository: IAnalyticsRepository,
    private readonly logger: Logger,
  ) {}

  async getGroupSummary(
    user: JwtTokenPayload,
    query: GroupSummaryAnalyticsQueryDto,
  ): Promise<AnalyticsReportResponse<GroupSummaryData>> {
    return this.handleReport(
      'group summary',
      { userId: user.sub, query },
      async () => {
        this.assertRole(user, GROUP_MANAGEMENT_ROLE);
        const scope = this.buildScope(query, query.unitIds);
        const summary = await this.buildGroupSummary(scope);

        return {
          success: true,
          statusCode: 200,
          message: 'Analytics report retrieved successfully',
          data: summary,
        };
      },
    );
  }

  async getGroupUnitReport(
    user: JwtTokenPayload,
    unitId: string,
    query: GroupSummaryAnalyticsQueryDto,
  ): Promise<AnalyticsReportResponse<UnitReportData>> {
    return this.handleReport(
      'group unit report',
      { userId: user.sub, unitId, query },
      async () => {
        this.assertRole(user, GROUP_MANAGEMENT_ROLE);
        const unit = await this.getExistingUnit(unitId);
        const scope = this.buildScope(query, [unitId]);
        const report = await this.buildUnitReport(scope, unit);

        return {
          success: true,
          statusCode: 200,
          message: 'Analytics report retrieved successfully',
          data: report,
        };
      },
    );
  }

  async compareGroupUnits(
    user: JwtTokenPayload,
    query: CompareUnitsAnalyticsQueryDto,
  ): Promise<AnalyticsReportResponse<CompareUnitsData>> {
    return this.handleReport(
      'compare units',
      { userId: user.sub, query },
      async () => {
        this.assertRole(user, GROUP_MANAGEMENT_ROLE);
        const scope = this.buildScope(query, query.unitIds);
        const [unitMetrics, bestSellingMenus, inventory, criticalStock] =
          await Promise.all([
            this.repository.getRevenueByUnit(scope),
            this.repository.getTopMenusByUnit(scope),
            this.repository.getInventoryPerformanceByUnit(scope),
            this.repository.getCriticalStockUnits(scope),
          ]);

        return {
          success: true,
          statusCode: 200,
          message: 'Analytics report retrieved successfully',
          data: {
            comparedUnits: unitMetrics.map((unit) => ({
              unitId: unit.unit_id,
              unitName: unit.unit_name,
            })),
            selectedMetrics:
              query.metrics && query.metrics.length > 0
                ? query.metrics
                : [...ANALYTICS_COMPARE_METRICS],
            revenueComparison: unitMetrics,
            transactionComparison: unitMetrics,
            averageOrderComparison: unitMetrics,
            bestSellingMenuComparison: bestSellingMenus,
            inventoryComparison: inventory,
            criticalStockComparison: criticalStock,
          },
        };
      },
    );
  }

  async getUnitManagerReport(
    user: JwtTokenPayload,
    query: MyUnitAnalyticsQueryDto,
  ): Promise<AnalyticsReportResponse<UnitReportData>> {
    return this.handleReport(
      'unit manager report',
      { userId: user.sub, query },
      async () => {
        this.assertRole(user, UNIT_MANAGER_ROLE);

        if (user.units.length === 0) {
          throw authForbiddenError({
            details: 'User tidak memiliki assignment unit',
          });
        }

        const unitIds = query.unitId ? [query.unitId] : user.units;
        for (const unitId of unitIds) {
          this.assertCanAccessAssignedUnit(user, unitId);
        }

        // Only fetch unit details if we have exactly one unit and it's a valid UUID
        let unit: AnalyticsUnitRow | null = null;
        if (unitIds.length === 1) {
          try {
            // Validate UUID format before querying
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(unitIds[0])) {
              unit = await this.getExistingUnit(unitIds[0]);
            }
          } catch (error) {
            // If unit fetch fails, continue without unit details
            this.logger.warn(
              { unitId: unitIds[0], error },
              'Failed to fetch unit details, continuing without unit info',
            );
          }
        }

        const scope = this.buildScope(query, unitIds);
        const report = await this.buildUnitReport(scope, unit, true);

        return {
          success: true,
          statusCode: 200,
          message: 'Analytics report retrieved successfully',
          data: report,
        };
      },
    );
  }

  private async buildGroupSummary(
    scope: AnalyticsScope,
  ): Promise<GroupSummaryData> {
    const [metrics, bestSellingMenus, revenueByUnit, criticalStockUnits] =
      await Promise.all([
        this.repository.getMetrics(scope),
        this.repository.getTopMenus(scope),
        this.repository.getRevenueByUnit(scope),
        this.repository.getCriticalStockUnits(scope),
      ]);

    return {
      ...this.mapMetrics(metrics),
      bestSellingMenus,
      highestRevenueUnit: revenueByUnit[0] ?? null,
      criticalStockUnits,
      unitPerformanceComparison: this.buildUnitPerformance(
        revenueByUnit,
        criticalStockUnits,
      ),
    };
  }

  private async buildUnitReport(
    scope: AnalyticsScope,
    unit: AnalyticsUnitRow | null,
    includeManagerOnlyFields = false,
  ): Promise<UnitReportData> {
    const [
      metrics,
      transactionStatus,
      bestSellingMenus,
      menuRevenue,
      paymentReport,
      paymentHistory,
      inventoryItems,
      dailyInventoryUsage,
    ] = await Promise.all([
      this.repository.getMetrics(scope),
      this.repository.getStatusTransactions(scope),
      this.repository.getTopMenus(scope),
      this.repository.getRevenueByMenu(scope),
      this.repository.getPaymentSummary(scope),
      this.repository.getPaymentHistory(scope),
      this.repository.getLowStockItems(scope),
      this.repository.getDailyInventoryUsage(scope),
    ]);

    const report: UnitReportData = {
      unit: unit ? this.mapUnit(unit) : null,
      ...this.mapMetrics(metrics),
      transactionStatus: this.mapTransactionStatus(transactionStatus),
      bestSellingMenus,
      paymentReport,
      inventoryReport: {
        lowStockItems: inventoryItems.filter(
          (item) => item.stock_status === 'LOW_STOCK',
        ),
        outOfStockItems: inventoryItems.filter(
          (item) => item.stock_status === 'OUT_OF_STOCK',
        ),
      },
      dailyInventoryUsage,
    };

    if (includeManagerOnlyFields) {
      report.menuRevenue = menuRevenue;
      report.paymentHistory = paymentHistory;
      report.dailyWaste = dailyInventoryUsage.filter(
        (row) => row.waste_qty > 0,
      );
      report.dailyVariance = dailyInventoryUsage.filter(
        (row) => row.variance_qty !== 0,
      );
    }

    return report;
  }

  private buildScope(
    query: {
      startDate: string;
      endDate: string;
      period?: AnalyticsPeriod;
    },
    unitIds?: string[],
  ): AnalyticsScope {
    try {
      assertValidDateRange(query.startDate, query.endDate);
    } catch {
      throw new AppError({
        code: ErrorCodes.ValidationFailed,
        message: 'startDate tidak boleh lebih besar dari endDate',
        status: 400,
      });
    }

    return {
      startDate: query.startDate,
      endDate: query.endDate,
      period: resolvePeriod(query.period),
      unitIds,
    };
  }

  private async getExistingUnit(unitId: string): Promise<AnalyticsUnitRow> {
    const unit = await this.repository.findUnitById(unitId);
    if (!unit) {
      throw unitNotFoundError({ unitId });
    }
    return unit;
  }

  private assertRole(user: JwtTokenPayload, expectedRole: string): void {
    if (user.roles.trim().toUpperCase() !== expectedRole) {
      throw authForbiddenError({
        allowedRoles: [expectedRole],
        currentRole: user.roles,
      });
    }
  }

  private assertCanAccessAssignedUnit(
    user: JwtTokenPayload,
    unitId: string,
  ): void {
    if (user.units.includes(unitId)) return;
    throw authForbiddenError({
      details: 'You are not allowed to access this unit report',
      unitId,
    });
  }

  private mapMetrics(metrics: AnalyticsMetricSummary): MetricsResponse {
    return {
      totalRevenue: metrics.total_revenue,
      totalTransactions: metrics.total_transactions,
      averageOrderValue: metrics.average_order_value,
      completedTransactions: metrics.completed_transactions,
      cancelledTransactions: metrics.cancelled_transactions,
    };
  }

  private mapTransactionStatus(
    rows: AnalyticsStatusRow[],
  ): TransactionStatusResponse {
    const totals: TransactionStatusResponse = {
      completed: 0,
      cancelled: 0,
      pending: 0,
    };

    for (const row of rows) {
      if (row.status_code === 'COMPLETED') {
        totals.completed += row.total_transactions;
      } else if (row.status_code === 'CANCELLED') {
        totals.cancelled += row.total_transactions;
      } else {
        totals.pending += row.total_transactions;
      }
    }

    return totals;
  }

  private mapUnit(unit: AnalyticsUnitRow): UnitResponse {
    return {
      unitId: unit.unit_id,
      unitName: unit.unit_name,
      location: unit.unit_address,
    };
  }

  private buildUnitPerformance(
    unitMetrics: AnalyticsUnitRevenueRow[],
    criticalStockUnits: AnalyticsCriticalStockUnitRow[],
  ): UnitPerformanceResponse[] {
    const criticalByUnit = new Map(
      criticalStockUnits.map((unit) => [
        unit.unit_id,
        unit.low_stock_items + unit.out_of_stock_items,
      ]),
    );

    return unitMetrics.map((unit) => ({
      unitId: unit.unit_id,
      unitName: unit.unit_name,
      totalRevenue: unit.total_revenue,
      totalTransactions: unit.total_transactions,
      averageOrderValue: unit.average_order_value,
      completedTransactions: unit.completed_transactions,
      cancelledTransactions: unit.cancelled_transactions,
      criticalStockItems: criticalByUnit.get(unit.unit_id) ?? 0,
    }));
  }

  private async handleReport<T>(
    reportName: string,
    logContext: Record<string, unknown>,
    operation: () => Promise<AnalyticsReportResponse<T>>,
  ): Promise<AnalyticsReportResponse<T>> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AppError) throw error;

      this.logger.error(
        { err: error, ...logContext },
        `Unexpected error while building analytics ${reportName}`,
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }
}
