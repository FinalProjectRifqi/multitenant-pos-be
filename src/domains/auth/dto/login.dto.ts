import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  username!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  password!: string;
}
