import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListOrdersQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'status_id harus berupa UUID yang valid' })
  status_id?: string;

  @IsOptional()
  @IsIn(['ordered_at', 'total_amount', 'customer_name'], {
    message: 'sortBy harus berupa ordered_at, total_amount, atau customer_name',
  })
  sortBy?: 'ordered_at' | 'total_amount' | 'customer_name';

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
