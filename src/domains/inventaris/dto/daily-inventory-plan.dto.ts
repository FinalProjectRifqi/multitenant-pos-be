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

export class CreateDailyInventoryPlanDto {
  @IsDateString({}, { message: 'date harus menggunakan format YYYY-MM-DD' })
  date!: string;

  @IsUUID('4', { message: 'inventory_item_id harus berupa UUID yang valid' })
  inventory_item_id!: string;

  @Type(() => Number)
  @IsInt({ message: 'planned_usage_qty harus berupa bilangan bulat' })
  @Min(1, { message: 'planned_usage_qty minimal bernilai 1' })
  planned_usage_qty!: number;

  @IsString()
  @IsNotEmpty({ message: 'unit tidak boleh kosong' })
  @MaxLength(50, { message: 'unit maksimal 50 karakter' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  unit!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'notes tidak boleh kosong' })
  @MaxLength(1000, { message: 'notes maksimal 1000 karakter' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;
}

export class UpdateDailyInventoryPlanDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'planned_usage_qty harus berupa bilangan bulat' })
  @Min(1, { message: 'planned_usage_qty minimal bernilai 1' })
  planned_usage_qty?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'unit tidak boleh kosong' })
  @MaxLength(50, { message: 'unit maksimal 50 karakter' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  unit?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'notes tidak boleh kosong' })
  @MaxLength(1000, { message: 'notes maksimal 1000 karakter' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;
}

export class ListDailyInventoryPlanQueryDto {
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
