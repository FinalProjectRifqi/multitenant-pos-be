import type { AnalyticsPeriod } from '../dto/analytics-query.dto';

export interface DateRangeBounds {
  startDate: string;
  endDate: string;
}

export const assertValidDateRange = (
  startDate: string,
  endDate: string,
): DateRangeBounds => {
  if (startDate > endDate) {
    throw new Error('INVALID_DATE_RANGE');
  }

  return { startDate, endDate };
};

export const resolvePeriod = (
  period: AnalyticsPeriod | undefined,
): AnalyticsPeriod => period ?? 'daily';

export const getPeriodTrunc = (period: AnalyticsPeriod): string => {
  if (period === 'weekly') return 'week';
  if (period === 'monthly') return 'month';
  return 'day';
};
