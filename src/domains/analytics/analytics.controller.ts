import type { Request, Response } from 'express';
import { authTokenInvalidError } from '../auth/errors/auth.errors';
import type { AnalyticsService } from './analytics.service';
import type {
  AnalyticsDateRangeQueryDto,
  CompareUnitsAnalyticsQueryDto,
  GroupSummaryAnalyticsQueryDto,
  MyUnitAnalyticsQueryDto,
} from './dto/analytics-query.dto';

export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  async getGroupSummary(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw authTokenInvalidError();
    }

    const result = await this.service.getGroupSummary(
      req.user,
      req.query as unknown as GroupSummaryAnalyticsQueryDto,
    );
    res.status(result.statusCode).json(result);
  }

  async getGroupUnitReport(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw authTokenInvalidError();
    }

    const result = await this.service.getGroupUnitReport(
      req.user,
      req.params.unitId,
      req.query as unknown as AnalyticsDateRangeQueryDto,
    );
    res.status(result.statusCode).json(result);
  }

  async compareGroupUnits(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw authTokenInvalidError();
    }

    const result = await this.service.compareGroupUnits(
      req.user,
      req.query as unknown as CompareUnitsAnalyticsQueryDto,
    );
    res.status(result.statusCode).json(result);
  }

  async getUnitManagerReport(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw authTokenInvalidError();
    }

    const result = await this.service.getUnitManagerReport(
      req.user,
      req.query as unknown as MyUnitAnalyticsQueryDto,
    );
    res.status(result.statusCode).json(result);
  }
}
