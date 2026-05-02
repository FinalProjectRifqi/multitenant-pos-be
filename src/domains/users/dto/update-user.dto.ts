import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  user_name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @IsOptional()
  @IsUUID('4', { message: 'role_id harus berupa UUID yang valid' })
  role_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'business_unit_id harus berupa UUID yang valid' })
  business_unit_id?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'status harus berupa active atau inactive',
  })
  status?: 'active' | 'inactive';
}
