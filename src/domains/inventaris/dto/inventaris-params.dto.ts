import { IsUUID } from 'class-validator';

export class InventarisBusinessIdParamsDto {
  @IsUUID('4', { message: 'businessId harus berupa UUID yang valid' })
  businessId!: string;
}

export class InventarisItemParamsDto {
  @IsUUID('4', { message: 'businessId harus berupa UUID yang valid' })
  businessId!: string;

  @IsUUID('4', { message: 'inventoryItemId harus berupa UUID yang valid' })
  inventoryItemId!: string;
}
