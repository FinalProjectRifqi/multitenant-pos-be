import type { Request, Response } from 'express';
import type { CreateMenuDto } from './dto/create-menu.dto';
import type { ListMenusQueryDto } from './dto/list-menus-query.dto';
import type { MenuBusinessIdParamsDto, MenuItemParamsDto } from './dto/menu-params.dto';
import type { UpdateMenuDto } from './dto/update-menu.dto';
import type { MenuService } from './menus.service';

export class MenuController {
  constructor(private readonly service: MenuService) {}

  async listMenus(req: Request, res: Response): Promise<void> {
    const { businessId } = req.params as unknown as MenuBusinessIdParamsDto;
    const result = await this.service.listMenus(
      businessId,
      req.query as unknown as ListMenusQueryDto,
    );
    res.status(200).json(result);
  }

  async getMenuStats(req: Request, res: Response): Promise<void> {
    const { businessId } = req.params as unknown as MenuBusinessIdParamsDto;
    const result = await this.service.getMenuStats(businessId);
    res.status(200).json(result);
  }

  async createMenu(req: Request, res: Response): Promise<void> {
    const { businessId } = req.params as unknown as MenuBusinessIdParamsDto;
    const result = await this.service.createMenu(
      businessId,
      req.body as CreateMenuDto,
      req.file,
    );
    res.status(201).json(result);
  }

  async getMenuById(req: Request, res: Response): Promise<void> {
    const { businessId, menuId } = req.params as unknown as MenuItemParamsDto;
    const result = await this.service.getMenuById(businessId, menuId);
    res.status(200).json(result);
  }

  async updateMenu(req: Request, res: Response): Promise<void> {
    const { businessId, menuId } = req.params as unknown as MenuItemParamsDto;
    const result = await this.service.updateMenu(
      businessId,
      menuId,
      req.body as UpdateMenuDto,
      req.file,
    );
    res.status(200).json(result);
  }

  async deleteMenu(req: Request, res: Response): Promise<void> {
    const { businessId, menuId } = req.params as unknown as MenuItemParamsDto;
    const result = await this.service.deleteMenu(businessId, menuId);
    res.status(200).json(result);
  }
}
