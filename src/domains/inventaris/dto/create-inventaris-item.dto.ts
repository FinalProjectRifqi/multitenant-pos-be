import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInventarisItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama item inventaris tidak boleh kosong' })
  @MaxLength(255, {
    message: 'Nama item inventaris maksimal 255 karakter',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  inventory_item_name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, {
    message: 'Deskripsi maksimal 1000 karakter',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  description!: string;

  @IsString()
  @IsNotEmpty({ message: 'Satuan tidak boleh kosong' })
  @MaxLength(50, { message: 'Satuan maksimal 50 karakter' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  unit_of_measure!: string;

  @Type(() => Number)
  @IsInt({ message: 'Stok saat ini harus berupa bilangan bulat' })
  @Min(0, { message: 'Stok saat ini tidak boleh negatif' })
  current_stock!: number;

  @Type(() => Number)
  @IsInt({ message: 'Batas minimum harus berupa bilangan bulat' })
  @Min(0, { message: 'Batas minimum tidak boleh negatif' })
  min_threshold!: number;

  @Type(() => Number)
  @IsInt({ message: 'Batas maksimum harus berupa bilangan bulat' })
  @Min(1, { message: 'Batas maksimum minimal 1' })
  max_threshold!: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  last_restocked_at?: string;
}
