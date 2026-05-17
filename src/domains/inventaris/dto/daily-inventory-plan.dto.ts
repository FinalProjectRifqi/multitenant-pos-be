import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
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
  @Min(0, { message: 'planned_usage_qty tidak boleh negatif' })
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
  @Min(0, { message: 'planned_usage_qty tidak boleh negatif' })
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
}
