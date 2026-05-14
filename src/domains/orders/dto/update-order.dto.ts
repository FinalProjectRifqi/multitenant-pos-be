import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateOrderItemInputDto {
  @IsOptional()
  @IsUUID('4', { message: 'order_item_id harus berupa UUID yang valid' })
  order_item_id?: string;

  @IsUUID('4', { message: 'menu_item_id harus berupa UUID yang valid' })
  @IsNotEmpty({ message: 'menu_item_id tidak boleh kosong' })
  menu_item_id!: string;

  @Type(() => Number)
  @IsInt({ message: 'quantity harus berupa bilangan bulat' })
  @Min(1, { message: 'quantity minimal 1' })
  @Max(999, { message: 'quantity maksimal 999' })
  quantity!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'item_price harus berupa angka' })
  @Min(0, { message: 'item_price tidak boleh negatif' })
  item_price!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'notes maksimal 255 karakter' })
  notes?: string;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsUUID('4', { message: 'order_type_id harus berupa UUID yang valid' })
  order_type_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'order_status_id harus berupa UUID yang valid' })
  order_status_id?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama pelanggan tidak boleh kosong jika diisi' })
  @MaxLength(255, { message: 'Nama pelanggan maksimal 255 karakter' })
  customer_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Nomor meja maksimal 255 karakter' })
  table_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'notes maksimal 255 karakter' })
  notes?: string;

  @IsOptional()
  @IsArray({ message: 'items harus berupa array' })
  @ArrayMinSize(1, { message: 'Minimal satu item harus ada jika items diisi' })
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemInputDto)
  items?: UpdateOrderItemInputDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'subtotal harus berupa angka' })
  @Min(0, { message: 'subtotal tidak boleh negatif' })
  subtotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'tax_amount harus berupa angka' })
  @Min(0, { message: 'tax_amount tidak boleh negatif' })
  tax_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'total_amount harus berupa angka' })
  @Min(0, { message: 'total_amount tidak boleh negatif' })
  total_amount?: number;
}
