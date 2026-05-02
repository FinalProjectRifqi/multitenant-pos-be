import { ListRoleQueryDto } from './dto/list-role-query.dto';
import type { Request, Response } from 'express';
import { RoleService } from './role.service';

export class RoleController {
  constructor(private service: RoleService) {}

  async listRoles(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListRoleQueryDto;
    const result = await this.service.listRoles(query);
    res.status(200).json(result);
  }
}
