import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @IsOptional()
  @IsUUID('4', { message: 'business_unit_id harus berupa UUID v4' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  business_unit_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'role_id harus berupa UUID v4' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  role_id?: string;

  @IsOptional()
  @IsIn(
    [
      'full_name',
      'username',
      'business_unit_name',
      'role_name',
      'status',
      'last_login',
    ],
    {
      message:
        'sortBy harus salah satu dari: full_name, username, business_unit_name, role_name, status, last_login',
    },
  )
  sortBy?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'], { message: 'sortType harus ASC atau DESC' })
  sortType?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
