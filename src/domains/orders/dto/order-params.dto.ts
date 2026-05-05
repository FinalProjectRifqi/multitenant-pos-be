import { IsUUID } from 'class-validator';

export class OrderUnitParamsDto {
  @IsUUID('4', { message: 'unitId harus berupa UUID yang valid' })
  unitId!: string;
}

export class OrderItemParamsDto {
  @IsUUID('4', { message: 'unitId harus berupa UUID yang valid' })
  unitId!: string;

  @IsUUID('4', { message: 'orderId harus berupa UUID yang valid' })
  orderId!: string;
}
