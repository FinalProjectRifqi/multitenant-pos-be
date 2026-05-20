import type { Request, Response } from 'express';
import type { AnalyticsService } from './analytics.service';
import type { AnalyticsUnitParamsDto } from './dto/analytics-params.dto';
import type { AnalyticsPeriodQueryDto } from './dto/analytics-period-query.dto';
import type { AnalyticsDailyInventoryQueryDto } from './dto/analytics-daily-inventory-query.dto';
import type { AnalyticsGroupCompareQueryDto } from './dto/analytics-group-compare-query.dto';

export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  async getKpi(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params as unknown as AnalyticsUnitParamsDto;
    const { period = '7d' } = req.query as unknown as AnalyticsPeriodQueryDto;
    const result = await this.service.getKpi(unitId, period);
    res.status(200).json(result);
  }

  async getSalesTrend(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params as unknown as AnalyticsUnitParamsDto;
    const { period = '7d' } = req.query as unknown as AnalyticsPeriodQueryDto;
    const result = await this.service.getSalesTrend(unitId, period);
    res.status(200).json(result);
  }

  async getTopMenus(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params as unknown as AnalyticsUnitParamsDto;
    const { period = '7d' } = req.query as unknown as AnalyticsPeriodQueryDto;
    const result = await this.service.getTopMenus(unitId, period, 5);
    res.status(200).json(result);
  }

  async getRecentPayments(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params as unknown as AnalyticsUnitParamsDto;
    const result = await this.service.getRecentPayments(unitId, 10);
    res.status(200).json(result);
  }

  async getInventoryStatus(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params as unknown as AnalyticsUnitParamsDto;
    const result = await this.service.getInventoryStatus(unitId);
    res.status(200).json(result);
  }

  async getDailyInventory(req: Request, res: Response): Promise<void> {
    const { unitId } = req.params as unknown as AnalyticsUnitParamsDto;
    const { date } = req.query as unknown as AnalyticsDailyInventoryQueryDto;
    const result = await this.service.getDailyInventory(unitId, date);
    res.status(200).json(result);
  }

  // ─── Group Analytics ────────────────────────────

  async getGroupSummary(req: Request, res: Response): Promise<void> {
    const { period = '7d' } = req.query as unknown as AnalyticsPeriodQueryDto;
    const result = await this.service.getGroupSummary(period);
    res.status(200).json(result);
  }

  async getGroupCompare(req: Request, res: Response): Promise<void> {
    const { unitIds, period = '7d' } =
      req.query as unknown as AnalyticsGroupCompareQueryDto;
    const ids = unitIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    const result = await this.service.getGroupCompare(ids, period);
    res.status(200).json(result);
  }
}
