import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong' })
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  full_name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  user_name!: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsUUID('4', { message: 'role_id harus berupa UUID yang valid' })
  @IsNotEmpty({ message: 'Role tidak boleh kosong' })
  role_id!: string;

  @ValidateIf((_object, value) => value !== null)
  @IsUUID('4', { message: 'business_unit_id harus berupa UUID yang valid' })
  @IsNotEmpty({ message: 'Unit usaha tidak boleh kosong' })
  business_unit_id!: string | null;

  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(255)
  password!: string;
}
