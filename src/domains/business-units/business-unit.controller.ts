import type { Request, Response } from 'express';
import type { CreateBusinessUnitDto } from './dto/create-business-unit.dto';
import type { ListBusinessUnitsQueryDto } from './dto/list-business-units-query.dto';
import type { UpdateBusinessUnitDto } from './dto/update-business-unit.dto';
import type { BusinessUnitService } from './business-unit.service';

export class BusinessUnitController {
  constructor(private readonly service: BusinessUnitService) {}

  async listBusinessUnits(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListBusinessUnitsQueryDto;
    const result = await this.service.listBusinessUnits(query);
    res.status(200).json(result);
  }

  async getBusinessUnitStats(_req: Request, res: Response): Promise<void> {
    const result = await this.service.getBusinessUnitStats();
    res.status(200).json(result);
  }

  async createBusinessUnit(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateBusinessUnitDto;
    const result = await this.service.createBusinessUnit(dto);
    res.status(201).json(result);
  }

  async getBusinessUnitById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await this.service.getBusinessUnitById(id);
    res.status(200).json(result);
  }

  async updateBusinessUnit(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const dto = req.body as UpdateBusinessUnitDto;
    const result = await this.service.updateBusinessUnit(id, dto);
    res.status(200).json(result);
  }

  async deleteBusinessUnit(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const result = await this.service.deleteBusinessUnit(id);
    res.status(200).json(result);
  }
}
