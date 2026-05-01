import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsIndonesianPhone } from '../../../utils/validators/indonesian-phone.validator';

export class UpdateBusinessUnitDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama unit usaha tidak boleh kosong' })
  @MaxLength(255, { message: 'Nama unit usaha maksimal 255 karakter' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  business_unit_name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Alamat unit usaha tidak boleh kosong' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  business_unit_address?: string;

  @IsOptional()
  @IsString()
  @IsIndonesianPhone()
  business_unit_phone?: string;

  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa boolean' })
  is_active?: boolean;
}
