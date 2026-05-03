import { IsUUID } from 'class-validator';

export class MenuBusinessIdParamsDto {
  @IsUUID('4', { message: 'businessId harus berupa UUID yang valid' })
  businessId!: string;
}

export class MenuItemParamsDto {
  @IsUUID('4', { message: 'businessId harus berupa UUID yang valid' })
  businessId!: string;

  @IsUUID('4', { message: 'menuId harus berupa UUID yang valid' })
  menuId!: string;
}
