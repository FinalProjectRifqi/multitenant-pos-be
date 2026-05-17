import { IsDateString } from 'class-validator';

export class DailyUsageReportQueryDto {
  @IsDateString({}, { message: 'date harus menggunakan format YYYY-MM-DD' })
  date!: string;
}

export class VarianceReportQueryDto {
  @IsDateString(
    {},
    { message: 'startDate harus menggunakan format YYYY-MM-DD' },
  )
  startDate!: string;

  @IsDateString({}, { message: 'endDate harus menggunakan format YYYY-MM-DD' })
  endDate!: string;
}
