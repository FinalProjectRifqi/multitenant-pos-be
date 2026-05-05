import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import type { Logger } from 'pino';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import type { AppConfig } from '../../config';
import type { LoginDto } from './dto/login.dto';
import type {
  JwtTokenPayload,
  LoginResponse,
  UserWithRole,
} from './models/auth.model';
import type { IAuthRepository } from './repositories/auth.repository';
import {
  authInactiveAccountError,
  authInvalidCredentialsError,
  authInvalidRoleError,
} from './errors/auth.errors';

export class AuthService {
  constructor(
    private readonly repository: IAuthRepository,
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    try {
      this.logger.info({ username: dto.username }, 'Login attempt');

      const user = await this.repository.findUserByUsername(dto.username);

      if (!user) {
        this.logger.warn(
          { username: dto.username },
          'Login failed - invalid credentials',
        );
        throw authInvalidCredentialsError();
      }

      if (!user.is_active) {
        this.logger.warn(
          { username: dto.username },
          'Login failed - inactive account',
        );
        throw authInactiveAccountError();
      }

      if (!user.role_code) {
        this.logger.warn(
          { username: dto.username },
          'Login failed - invalid role',
        );
        throw authInvalidRoleError();
      }

      const isPasswordMatch = await bcrypt.compare(dto.password, user.password);

      if (!isPasswordMatch) {
        this.logger.warn(
          { username: dto.username },
          'Login failed - invalid credentials',
        );
        throw authInvalidCredentialsError();
      }

      const [permissions, units] = await Promise.all([
        this.repository.getUserPermissions(user.role_id),
        this.repository.getUserUnits(user.user_id),
      ]);

      const payload = this.buildJwtPayload(user, permissions, units);
      const accessToken = await this.signJwt(payload);

      await this.repository.updateLastLogin(user.user_id);

      this.logger.info({ userId: user.user_id }, 'Login successful');

      return {
        success: true,
        statusCode: 200,
        message: 'Login berhasil!',
        accessToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error, username: dto.username },
        'Unexpected error during login',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  private buildJwtPayload(
    user: UserWithRole,
    permissions: string[],
    units: string[],
  ): JwtTokenPayload {
    return {
      sub: user.user_id,
      typ: 'Bearer',
      roles: user.role_code as string,
      permission: permissions,
      full_name: user.full_name,
      email: user.email,
      units,
      must_change_password: user.must_change_password,
    };
  }

  private async signJwt(payload: JwtTokenPayload): Promise<string> {
    const secretKey = new TextEncoder().encode(this.config.jwt.secret);

    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(this.config.jwt.expiresIn)
      .sign(secretKey);
  }

  async getMe(jwtPayload: JwtTokenPayload): Promise<MeResponse> {
    try {
      const user = await this.repository.findUserById(jwtPayload.sub);

      if (!user) {
        throw authTokenInvalidError();
      }

      if (!user.is_active) {
        throw authInactiveAccountError();
      }

      this.logger.debug({ userId: user.user_id }, 'getMe successful');

      return {
        success: true,
        statusCode: 200,
        message: 'Data pengguna berhasil diambil',
        data: {
          user_id: user.user_id,
          full_name: user.full_name,
          user_name: user.username,
          email: user.email,
          role_id: user.role_id,
          role_name: user.role_name,
          role_code: jwtPayload.roles,
          status: user.is_active ? 'active' : 'inactive',
          last_login: user.last_login_at,
          business_units: user.business_units,
          permissions: jwtPayload.permission,
          must_change_password: jwtPayload.must_change_password,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error, userId: jwtPayload.sub },
        'Unexpected error in getMe',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }
}
