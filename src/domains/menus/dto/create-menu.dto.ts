import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama menu tidak boleh kosong' })
  @MaxLength(255, { message: 'Nama menu maksimal 255 karakter' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  menu_name!: string;

  @IsUUID('4', { message: 'menu_category_id harus berupa UUID yang valid' })
  @IsNotEmpty({ message: 'ID kategori menu tidak boleh kosong' })
  menu_category_id!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Harga menu harus berupa angka' })
  @Min(0, { message: 'Harga menu tidak boleh negatif' })
  item_price!: number;

  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'is_available harus berupa boolean (true/false)' })
  is_available!: boolean;
}
