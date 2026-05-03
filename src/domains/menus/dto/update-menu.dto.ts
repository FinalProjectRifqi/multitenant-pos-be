import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  emptyToUndefined,
  emptyToUndefinedThenBoolean,
  emptyToUndefinedThenNumber,
} from './transforms';

export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama menu tidak boleh kosong' })
  @MaxLength(255, { message: 'Nama menu maksimal 255 karakter' })
  @Transform(emptyToUndefined)
  menu_name?: string;

  @IsOptional()
  @IsUUID('4', { message: 'menu_category_id harus berupa UUID yang valid' })
  @Transform(emptyToUndefined)
  menu_category_id?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Harga menu harus berupa angka' })
  @Min(0, { message: 'Harga menu tidak boleh negatif' })
  @Transform(emptyToUndefinedThenNumber)
  item_price?: number;

  @IsOptional()
  @IsBoolean({ message: 'is_available harus berupa boolean (true/false)' })
  @Transform(emptyToUndefinedThenBoolean)
  is_available?: boolean;

  /** Whitelist field multipart saat file kosong; file nyata tetap di req.file */
  @IsOptional()
  @Transform(emptyToUndefined)
  menu_image?: unknown;
}
