import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
 @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña no puede estar vacía' })
  password!: string;
}
