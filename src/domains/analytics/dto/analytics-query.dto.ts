import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export const ANALYTICS_PERIODS = ['daily', 'weekly', 'monthly'] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const ANALYTICS_COMPARE_METRICS = [
  'revenue',
  'transactions',
  'averageOrderValue',
  'completedTransactions',
  'cancelledTransactions',
  'bestSellingMenus',
  'inventoryPerformance',
  'criticalStock',
] as const;
export type AnalyticsCompareMetric = (typeof ANALYTICS_COMPARE_METRICS)[number];

const transformQueryArray = ({ value }: TransformFnParams): unknown => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export class AnalyticsDateRangeQueryDto {
  @IsNotEmpty({ message: 'startDate wajib diisi' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate harus menggunakan format YYYY-MM-DD',
  })
  startDate!: string;

  @IsNotEmpty({ message: 'endDate wajib diisi' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate harus menggunakan format YYYY-MM-DD',
  })
  endDate!: string;

  @IsOptional()
  @IsIn(ANALYTICS_PERIODS, {
    message: 'period harus salah satu dari: daily, weekly, monthly',
  })
  period?: AnalyticsPeriod;
}

export class GroupSummaryAnalyticsQueryDto extends AnalyticsDateRangeQueryDto {
  @IsOptional()
  @Transform(transformQueryArray)
  @IsArray({ message: 'unitIds harus berupa array UUID' })
  @IsUUID('4', { each: true, message: 'unitIds harus berisi UUID yang valid' })
  unitIds?: string[];
}

export class CompareUnitsAnalyticsQueryDto extends AnalyticsDateRangeQueryDto {
  @Transform(transformQueryArray)
  @IsArray({ message: 'unitIds harus berupa array UUID' })
  @ArrayNotEmpty({ message: 'unitIds wajib berisi minimal satu unit' })
  @IsUUID('4', { each: true, message: 'unitIds harus berisi UUID yang valid' })
  unitIds!: string[];

  @IsOptional()
  @Transform(transformQueryArray)
  @IsArray({ message: 'metrics harus berupa array' })
  @IsIn(ANALYTICS_COMPARE_METRICS, {
    each: true,
    message:
      'metrics hanya boleh berisi: revenue, transactions, averageOrderValue, completedTransactions, cancelledTransactions, bestSellingMenus, inventoryPerformance, criticalStock',
  })
  metrics?: AnalyticsCompareMetric[];
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
