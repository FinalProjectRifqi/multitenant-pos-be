import { IsDateString, IsOptional } from 'class-validator';

export class AnalyticsDailyInventoryQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'date harus berformat ISO 8601 (YYYY-MM-DD)' })
  date?: string;
}
