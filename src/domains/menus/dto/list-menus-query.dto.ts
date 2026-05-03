import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListMenusQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @IsOptional()
  @IsIn(['menu_name', 'menu_category', 'menu_price'], {
    message: 'sortBy harus berupa menu_name, menu_category, atau menu_price',
  })
  sortBy?: 'menu_name' | 'menu_category' | 'menu_price';

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
