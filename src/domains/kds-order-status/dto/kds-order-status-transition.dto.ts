import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class KdsOrderStatusTransitionDto {
  @IsOptional()
  @IsUUID('4', {
    message: 'order_status_id harus berupa UUID yang valid jika dikirim',
  })
  order_status_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'order_status_code maksimal 255 karakter jika dikirim',
  })
  order_status_code?: string;
}
