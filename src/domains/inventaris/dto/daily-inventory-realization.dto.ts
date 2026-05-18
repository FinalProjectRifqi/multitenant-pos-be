import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDailyInventoryRealizationDto {
  @IsDateString({}, { message: 'date harus menggunakan format YYYY-MM-DD' })
  date!: string;

  @IsUUID('4', { message: 'inventory_item_id harus berupa UUID yang valid' })
  inventory_item_id!: string;

  @Type(() => Number)
  @IsInt({ message: 'actual_usage_qty harus berupa bilangan bulat' })
  @Min(1, { message: 'actual_usage_qty minimal bernilai 1' })
  actual_usage_qty!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'waste_qty harus berupa bilangan bulat' })
  @Min(0, { message: 'waste_qty tidak boleh negatif' })
  waste_qty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'remaining_qty harus berupa bilangan bulat' })
  @Min(0, { message: 'remaining_qty tidak boleh negatif' })
  remaining_qty?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'notes tidak boleh kosong' })
  @MaxLength(1000, { message: 'notes maksimal 1000 karakter' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;
}

export class ListDailyInventoryRealizationQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'date harus menggunakan format YYYY-MM-DD' })
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page harus berupa bilangan bulat' })
  @Min(1, { message: 'page minimal bernilai 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit harus berupa bilangan bulat' })
  @Min(1, { message: 'limit minimal bernilai 1' })
  @Max(100, { message: 'limit maksimal bernilai 100' })
  limit?: number;
}
