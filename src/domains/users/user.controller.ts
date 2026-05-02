import type { Request, Response } from 'express';
import type { CreateUserDto } from './dto/create-user.dto';
import type { ListUsersQueryDto } from './dto/list-users-query.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UserParamsDto } from './dto/user-params.dto';
import type { UserService } from './user.service';

export class UserController {
  constructor(private readonly service: UserService) {}

  async listUsers(req: Request, res: Response): Promise<void> {
    const result = await this.service.listUsers(
      req.query as unknown as ListUsersQueryDto,
    );
    res.status(200).json(result);
  }

  async getUserStats(_req: Request, res: Response): Promise<void> {
    const result = await this.service.getUserStats();
    res.status(200).json(result);
  }

  async createUser(req: Request, res: Response): Promise<void> {
    const result = await this.service.createUser(req.body as CreateUserDto);
    res.status(201).json(result);
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as unknown as UserParamsDto;
    const result = await this.service.getUserById(id);
    res.status(200).json(result);
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params as unknown as UserParamsDto;
    const requestUserId = req.user!.sub;
    const result = await this.service.updateUser(
      id,
      req.body as UpdateUserDto,
      requestUserId,
    );
    res.status(200).json(result);
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params as unknown as UserParamsDto;
    const requestUserId = req.user!.sub;
    const result = await this.service.deleteUser(id, requestUserId);
    res.status(200).json(result);
  }
}
