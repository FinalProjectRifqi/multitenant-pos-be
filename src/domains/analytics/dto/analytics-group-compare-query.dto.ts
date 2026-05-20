import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AnalyticsGroupCompareQueryDto {
  @IsNotEmpty({ message: 'unitIds wajib diisi' })
  @IsString({ message: 'unitIds harus berupa string' })
  unitIds!: string;

  @IsOptional()
  @IsString()
  @IsIn(['today', '7d', '30d', 'month', 'quarter'], {
    message: 'period harus salah satu dari: today, 7d, 30d, month, quarter',
  })
  period?: string;
}
