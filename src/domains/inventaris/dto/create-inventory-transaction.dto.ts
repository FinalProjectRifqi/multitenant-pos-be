import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateInventoryTransactionDto {
  @IsUUID('4', { message: 'inventory_item_id harus berupa UUID yang valid' })
  inventory_item_id!: string;

  @IsString()
  @IsIn(['in', 'out', 'adjustment'])
  transaction_type!: 'in' | 'out' | 'adjustment';

  @Type(() => Number)
  @IsInt({ message: 'quantity_changed harus berupa bilangan bulat' })
  @Min(1, { message: 'quantity_changed minimal 1' })
  quantity_changed!: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Catatan transaksi tidak boleh kosong' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;
}
