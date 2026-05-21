import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListTransactionHistoryQueryDto {
  @IsOptional()
  @IsString({ message: 'search harus berupa string' })
  @MaxLength(255, { message: 'search maksimal 255 karakter' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @IsOptional()
  @IsUUID('4', { message: 'status_id harus berupa UUID yang valid' })
  status_id?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'date_from harus berupa tanggal ISO 8601 yang valid' },
  )
  date_from?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'date_to harus berupa tanggal ISO 8601 yang valid' },
  )
  date_to?: string;

  @IsOptional()
  @IsIn(['cash', 'cashless'], {
    message: 'payment_method harus berupa cash atau cashless',
  })
  payment_method?: 'cash' | 'cashless';

  @IsOptional()
  @IsIn(
    [
      'ordered_at',
      'completed_at',
      'total_amount',
      'customer_name',
      'payment_status',
    ],
    {
      message:
        'sortBy harus berupa ordered_at, completed_at, total_amount, customer_name, atau payment_status',
    },
  )
  sortBy?:
    | 'ordered_at'
    | 'completed_at'
    | 'total_amount'
    | 'customer_name'
    | 'payment_status';

  @IsOptional()
  @IsIn(['ASC', 'DESC'], { message: 'sortType harus berupa ASC atau DESC' })
  sortType?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page harus berupa bilangan bulat' })
  @Min(1, { message: 'page minimal 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit harus berupa bilangan bulat' })
  @Min(1, { message: 'limit minimal 1' })
  @Max(100, { message: 'limit maksimal 100' })
  limit?: number;
}
