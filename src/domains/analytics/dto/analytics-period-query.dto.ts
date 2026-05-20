import { IsIn, IsOptional, IsString } from 'class-validator';

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'month' | 'quarter';

export class AnalyticsPeriodQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['today', '7d', '30d', 'month', 'quarter'], {
    message: 'period harus salah satu dari: today, 7d, 30d, month, quarter',
  })
  period?: AnalyticsPeriod;
}
