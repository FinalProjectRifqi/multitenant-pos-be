import { Type, Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListRoleQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

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
