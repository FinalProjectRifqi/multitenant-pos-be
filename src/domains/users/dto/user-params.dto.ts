import { IsNotEmpty, IsUUID } from 'class-validator';

export class UserParamsDto {
  @IsUUID('4', { message: 'id harus berupa UUID yang valid' })
  @IsNotEmpty({ message: 'id tidak boleh kosong' })
  id!: string;
}
