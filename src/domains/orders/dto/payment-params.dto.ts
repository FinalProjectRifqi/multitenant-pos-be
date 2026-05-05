import { IsUUID } from 'class-validator';

export class PaymentOrderParamsDto {
  @IsUUID('4', { message: 'unitId harus berupa UUID yang valid' })
  unitId!: string;

  @IsUUID('4', { message: 'orderId harus berupa UUID yang valid' })
  orderId!: string;
}

export class PaymentItemParamsDto {
  @IsUUID('4', { message: 'unitId harus berupa UUID yang valid' })
  unitId!: string;

  @IsUUID('4', { message: 'orderId harus berupa UUID yang valid' })
  orderId!: string;

  @IsUUID('4', { message: 'paymentId harus berupa UUID yang valid' })
  paymentId!: string;
}
