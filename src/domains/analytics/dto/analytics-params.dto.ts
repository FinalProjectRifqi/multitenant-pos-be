import { IsUUID } from 'class-validator';

export class AnalyticsUnitParamsDto {
  @IsUUID('4', { message: 'unitId harus berupa UUID yang valid' })
  unitId!: string;
}
