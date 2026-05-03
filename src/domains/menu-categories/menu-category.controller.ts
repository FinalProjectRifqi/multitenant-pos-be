import type { Request, Response } from 'express';
import { MenuCategoryService } from './menu-category.service';
import { ListMenuCategoriesQueryDto } from './dto/list-menu-category-query.dto';

export class MenuCategoryController {
  constructor(private readonly service: MenuCategoryService) {}

  async listMenuCategories(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListMenuCategoriesQueryDto;
    const result = await this.service.listMenuCategories(query);
    res.status(200).json(result);
  }
}
