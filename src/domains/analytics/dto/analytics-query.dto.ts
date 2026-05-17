import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AnalyticsDateRangeQueryDto {
  @IsOptional()
  @IsDateString(
    {},
    { message: 'startDate harus menggunakan format YYYY-MM-DD' },
  )
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate harus menggunakan format YYYY-MM-DD' })
  endDate?: string;
}

export class MyUnitAnalyticsQueryDto extends AnalyticsDateRangeQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'unitId harus berupa UUID yang valid' })
  unitId?: string;
}

export class AnalyticsUnitParamsDto {
  @IsUUID('4', { message: 'unitId harus berupa UUID yang valid' })
  unitId!: string;
}
