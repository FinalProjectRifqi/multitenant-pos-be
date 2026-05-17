import type { Request, Response } from 'express';
import { authTokenInvalidError } from '../auth/errors/auth.errors';
import type { AnalyticsService } from './analytics.service';
import type {
  AnalyticsDateRangeQueryDto,
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
      req.query as unknown as AnalyticsDateRangeQueryDto,
    );
    res.status(result.statusCode).json(result);
  }

  async getUnitSummary(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw authTokenInvalidError();
    }

    const result = await this.service.getUnitSummary(
      req.user,
      req.params.unitId,
      req.query as unknown as AnalyticsDateRangeQueryDto,
    );
    res.status(result.statusCode).json(result);
  }

  async getMyUnitSummary(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw authTokenInvalidError();
    }

    const result = await this.service.getMyUnitSummary(
      req.user,
      req.query as unknown as MyUnitAnalyticsQueryDto,
    );
    res.status(result.statusCode).json(result);
  }
}
