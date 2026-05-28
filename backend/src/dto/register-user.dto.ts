import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  nombre!: string;

  @IsString()
  apellido!: string;

  @IsEmail()
  email!: string;

  @IsString()
  rol!: 'admin' | 'usuario';

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  activo?: boolean;
}
