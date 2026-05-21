import type { Request, Response } from 'express';
import type { InventarisService } from './inventaris.service';
import type { ListInventarisQueryDto } from './dto/list-inventaris-query.dto';
import type { CreateInventarisItemDto } from './dto/create-inventaris-item.dto';
import type { UpdateInventarisItemDto } from './dto/update-inventaris-item.dto';
import type { ListInventoryTransactionsQueryDto } from './dto/list-inventory-transactions-query.dto';
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
import { authTokenInvalidError } from '../auth/errors/auth.errors';

export class InventarisController {
  constructor(private readonly service: InventarisService) {}

  async listItems(req: Request, res: Response): Promise<void> {
    const result = await this.service.listItems(
      req.params.businessId,
      req.query as unknown as ListInventarisQueryDto,
    );
    res.status(result.statusCode).json(result);
  }

  async getItemById(req: Request, res: Response): Promise<void> {
    const result = await this.service.getItemById(
      req.params.businessId,
      req.params.inventoryItemId,
    );
    res.status(result.statusCode).json(result);
  }

  async createItem(req: Request, res: Response): Promise<void> {
    const result = await this.service.createItem(
      req.params.businessId,
      req.body as CreateInventarisItemDto,
    );
    res.status(result.statusCode).json(result);
  }

  async updateItem(req: Request, res: Response): Promise<void> {
    const userId = req.user?.sub;
    if (!userId) {
      throw authTokenInvalidError();
    }

    const result = await this.service.updateItem(
      req.params.businessId,
      req.params.inventoryItemId,
      userId,
      req.body as UpdateInventarisItemDto,
    );
    res.status(result.statusCode).json(result);
  }

  async deleteItem(req: Request, res: Response): Promise<void> {
    const result = await this.service.deleteItem(
      req.params.businessId,
      req.params.inventoryItemId,
    );
    res.status(result.statusCode).json(result);
  }

  async getStats(req: Request, res: Response): Promise<void> {
    const result = await this.service.getStats(req.params.businessId);
    res.status(result.statusCode).json(result);
  }

  async listTransactions(req: Request, res: Response): Promise<void> {
    const result = await this.service.listTransactions(
      req.params.businessId,
      req.query as unknown as ListInventoryTransactionsQueryDto,
    );
    res.status(result.statusCode).json(result);
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    const userId = req.user?.sub;
    if (!userId) {
      throw authTokenInvalidError();
    }

    const result = await this.service.createTransaction(
      req.params.businessId,
      userId,
      req.body as CreateInventoryTransactionDto,
    );
    res.status(result.statusCode).json(result);
  }

  async createDailyPlan(req: Request, res: Response): Promise<void> {
    const userId = req.user?.sub;
    if (!userId) {
      throw authTokenInvalidError();
    }

    const result = await this.service.createDailyPlan(
      req.params.businessId,
      userId,
      req.body as CreateDailyInventoryPlanDto,
    );
    res.status(result.statusCode).json(result);
  }

  async listDailyPlans(req: Request, res: Response): Promise<void> {
    const result = await this.service.listDailyPlans(
      req.params.businessId,
      req.query as unknown as ListDailyInventoryPlanQueryDto,
    );
    res.status(result.statusCode).json(result);
  }

  async updateDailyPlan(req: Request, res: Response): Promise<void> {
    const userId = req.user?.sub;
    if (!userId) {
      throw authTokenInvalidError();
    }

    const result = await this.service.updateDailyPlan(
      req.params.businessId,
      req.params.dailyPlanId,
      userId,
      req.body as UpdateDailyInventoryPlanDto,
    );
    res.status(result.statusCode).json(result);
  }

  async getDailyPlanById(req: Request, res: Response): Promise<void> {
    const result = await this.service.getDailyPlanById(
      req.params.businessId,
      req.params.dailyPlanId,
    );
    res.status(result.statusCode).json(result);
  }

  async deleteDailyPlan(req: Request, res: Response): Promise<void> {
    const result = await this.service.deleteDailyPlan(
      req.params.businessId,
      req.params.dailyPlanId,
    );
    res.status(result.statusCode).json(result);
  }

  async submitDailyRealization(req: Request, res: Response): Promise<void> {
    const userId = req.user?.sub;
    if (!userId) {
      throw authTokenInvalidError();
    }

    const result = await this.service.submitDailyRealization(
      req.params.businessId,
      userId,
      req.body as CreateDailyInventoryRealizationDto,
    );
    res.status(result.statusCode).json(result);
  }

  async listDailyRealizations(req: Request, res: Response): Promise<void> {
    const result = await this.service.listDailyRealizations(
      req.params.businessId,
      req.query as unknown as ListDailyInventoryRealizationQueryDto,
    );
    res.status(result.statusCode).json(result);
  }

  async getDailyRealizationById(req: Request, res: Response): Promise<void> {
    const result = await this.service.getDailyRealizationById(
      req.params.businessId,
      req.params.dailyRealizationId,
    );
    res.status(result.statusCode).json(result);
  }

  async getDailyUsageReport(req: Request, res: Response): Promise<void> {
    const result = await this.service.getDailyUsageReport(
      req.params.businessId,
      String(req.query.date),
    );
    res.status(result.statusCode).json(result);
  }

  async getVarianceReport(req: Request, res: Response): Promise<void> {
    const result = await this.service.getVarianceReport(
      req.params.businessId,
      String(req.query.startDate),
      String(req.query.endDate),
    );
    res.status(result.statusCode).json(result);
  }
}
