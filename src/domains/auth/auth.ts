export { AuthController } from './auth.controller';
export { AuthService } from './auth.service';
export { buildAuthRouter } from './auth.routes';
export { AuthRepository } from './repositories/auth.repository';
export type { IAuthRepository } from './repositories/auth.repository';
export { LoginDto } from './dto/login.dto';
export type {
  UserWithRole,
  UserForMe,
  JwtTokenPayload,
  LoginResponse,
  MeResponse,
} from './models/auth.model';
export {
  authInvalidCredentialsError,
  authInactiveAccountError,
  authInvalidRoleError,
} from './errors/auth.errors';
