import type { Request, Response } from 'express';
import type { InventarisService } from './inventaris.service';
import type { ListInventarisQueryDto } from './dto/list-inventaris-query.dto';
import type { CreateInventarisItemDto } from './dto/create-inventaris-item.dto';
import type { UpdateInventarisItemDto } from './dto/update-inventaris-item.dto';
import type { ListInventoryTransactionsQueryDto } from './dto/list-inventory-transactions-query.dto';
import type { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';

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
    const result = await this.service.updateItem(
      req.params.businessId,
      req.params.inventoryItemId,
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
    const result = await this.service.createTransaction(
      req.params.businessId,
      req.user?.sub ?? '',
      req.body as CreateInventoryTransactionDto,
    );
    res.status(result.statusCode).json(result);
  }
}
