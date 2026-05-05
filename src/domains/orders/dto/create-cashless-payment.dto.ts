import { Type } from 'class-transformer';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateCashlessPaymentDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'amount harus berupa angka' })
  @IsNotEmpty({ message: 'amount tidak boleh kosong' })
  @Min(1, { message: 'amount minimal 1' })
  amount!: number;
}
