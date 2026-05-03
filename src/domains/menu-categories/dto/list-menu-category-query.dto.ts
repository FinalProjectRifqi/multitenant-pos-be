import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListMenuCategoriesQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'business_unit_id harus berupa UUID v4' })
  business_unit_id?: string;

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
