import { IsUUID } from 'class-validator';

export class BusinessUnitParamsDto {
  @IsUUID('4', { message: 'ID unit usaha harus berupa UUID yang valid' })
  id!: string;
}
