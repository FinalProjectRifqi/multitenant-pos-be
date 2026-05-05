import type { Request, Response } from 'express';
import type { LoginDto } from './dto/login.dto';
import type { JwtTokenPayload } from './models/auth.model';
import type { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    const dto = req.body as LoginDto;
    const result = await this.service.login(dto);
    res.status(200).json(result);
  }

  async me(req: Request, res: Response): Promise<void> {
    const jwtUser = (req as Request & { user?: JwtTokenPayload }).user!;
    const result = await this.service.getMe(jwtUser);
    res.status(200).json(result);
  }
}
