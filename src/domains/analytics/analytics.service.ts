import type { Logger } from 'pino';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import type {
  AnalyticsDailyInventoryResponse,
  AnalyticsInventoryStatusResponse,
  AnalyticsKpiResponse,
  AnalyticsPaymentsResponse,
  AnalyticsSalesTrendResponse,
  AnalyticsTopMenusResponse,
} from './models/analytics.model';
import {
  type IAnalyticsRepository,
  resolveDateRange,
  resolvePreviousDateRange,
} from './repositories/analytics.repository';

export class AnalyticsService {
  constructor(
    private readonly repository: IAnalyticsRepository,
    private readonly logger: Logger,
  ) {}

  // ===========================
  // Guard
  // ===========================

  private async assertUnitExists(unitId: string): Promise<void> {
    const unit = await this.repository.findUnitById(unitId);
    if (!unit) {
      throw new AppError({
        code: ErrorCodes.NotFound,
        message: 'Unit tidak ditemukan',
        status: 404,
      });
    }
  }

  // ===========================
  // KPI
  // ===========================

  async getKpi(unitId: string, period: string): Promise<AnalyticsKpiResponse> {
    this.logger.info({ unitId, period }, 'Fetching analytics KPI');
    await this.assertUnitExists(unitId);

    const { startDate, endDate } = resolveDateRange(period);
    const { startDate: prevStart, endDate: prevEnd } =
      resolvePreviousDateRange(period);

    const [kpiRaw, prevKpiRaw, stokKritis] = await Promise.all([
      this.repository.getKpiRaw(unitId, startDate, endDate),
      this.repository.getKpiRaw(unitId, prevStart, prevEnd),
      this.repository.getStokKritis(unitId),
    ]);

    const totalTransaksi = Number(kpiRaw.total_transaksi);
    const totalOmzet = Number(kpiRaw.total_omzet);
    const rataRataOrder =
      totalTransaksi > 0 ? Math.round(totalOmzet / totalTransaksi) : 0;

    const prevTransaksi = Number(prevKpiRaw.total_transaksi);
    const prevOmzet = Number(prevKpiRaw.total_omzet);
    const prevAvg =
      prevTransaksi > 0 ? Math.round(prevOmzet / prevTransaksi) : 0;

    const calcGrowth = (current: number, previous: number): number | null => {
      if (previous <= 0) return null;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      success: true,
      statusCode: 200,
      message: 'Berhasil mengambil data KPI analytics',
      data: {
        total_omzet: totalOmzet,
        total_transaksi: totalTransaksi,
        rata_rata_order: rataRataOrder,
        selesai: Number(kpiRaw.selesai),
        dibatalkan: Number(kpiRaw.dibatalkan),
        stok_kritis: stokKritis,
        omzet_growth_pct: calcGrowth(totalOmzet, prevOmzet),
        transaksi_growth_pct: calcGrowth(totalTransaksi, prevTransaksi),
        avg_growth_pct: calcGrowth(rataRataOrder, prevAvg),
      },
    };
  }

  // ===========================
  // Sales Trend
  // ===========================

  async getSalesTrend(
    unitId: string,
    period: string,
  ): Promise<AnalyticsSalesTrendResponse> {
    this.logger.info({ unitId, period }, 'Fetching analytics sales trend');
    await this.assertUnitExists(unitId);

    const { startDate, endDate } = resolveDateRange(period);
    const data = await this.repository.getSalesTrend(
      unitId,
      startDate,
      endDate,
      period,
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Berhasil mengambil data tren penjualan',
      data,
    };
  }

  // ===========================
  // Top Menus
  // ===========================

  async getTopMenus(
    unitId: string,
    period: string,
    limit = 5,
  ): Promise<AnalyticsTopMenusResponse> {
    this.logger.info({ unitId, period, limit }, 'Fetching top menus');
    await this.assertUnitExists(unitId);

    const { startDate, endDate } = resolveDateRange(period);
    const data = await this.repository.getTopMenus(
      unitId,
      startDate,
      endDate,
      limit,
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Berhasil mengambil data menu terlaris',
      data,
    };
  }

  // ===========================
  // Recent Payments
  // ===========================

  async getRecentPayments(
    unitId: string,
    limit = 10,
  ): Promise<AnalyticsPaymentsResponse> {
    this.logger.info(
      { unitId, limit },
      'Fetching recent payments for analytics',
    );
    await this.assertUnitExists(unitId);

    const data = await this.repository.getRecentPayments(unitId, limit);

    return {
      success: true,
      statusCode: 200,
      message: 'Berhasil mengambil riwayat pembayaran',
      data,
    };
  }

  // ===========================
  // Inventory Status
  // ===========================

  async getInventoryStatus(
    unitId: string,
  ): Promise<AnalyticsInventoryStatusResponse> {
    this.logger.info({ unitId }, 'Fetching inventory status for analytics');
    await this.assertUnitExists(unitId);

    const { lowOrCritical, outOfStock } =
      await this.repository.getInventoryStatus(unitId);

    return {
      success: true,
      statusCode: 200,
      message: 'Berhasil mengambil status inventaris',
      data: {
        low_or_critical: lowOrCritical,
        out_of_stock: outOfStock,
      },
    };
  }

  // ===========================
  // Daily Inventory
  // ===========================

  async getDailyInventory(
    unitId: string,
    date?: string,
  ): Promise<AnalyticsDailyInventoryResponse> {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    this.logger.info(
      { unitId, date: targetDate },
      'Fetching daily inventory for analytics',
    );
    await this.assertUnitExists(unitId);

    const data = await this.repository.getDailyInventory(unitId, targetDate);

    return {
      success: true,
      statusCode: 200,
      message: 'Berhasil mengambil penggunaan inventaris harian',
      data,
    };
  }
}
