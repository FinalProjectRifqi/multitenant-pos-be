import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListInventoryTransactionsQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'inventory_item_id harus berupa UUID yang valid' })
  inventory_item_id?: string;

  @IsOptional()
  @IsIn([
    'in',
    'out',
    'adjustment',
    'RESTOCK',
    'DAILY_USAGE',
    'WASTE',
    'MANUAL_ADJUSTMENT',
  ])
  transaction_type?:
    | 'in'
    | 'out'
    | 'adjustment'
    | 'RESTOCK'
    | 'DAILY_USAGE'
    | 'WASTE'
    | 'MANUAL_ADJUSTMENT';

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
