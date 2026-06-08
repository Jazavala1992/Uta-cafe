import { IsOptional, IsString } from 'class-validator';

export class CreateProveedorDto {
  @IsString({ message: 'La razón social debe ser texto' })
  razonSocial!: string;

  @IsOptional()
  @IsString({ message: 'El contacto debe ser texto' })
  contacto?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  telefono?: string;

  @IsOptional()
  @IsString({ message: 'El email debe ser texto' })
  email?: string;

  @IsOptional()
  productos?: unknown;
}

export class UpdateProveedorDto {
  @IsOptional()
  @IsString({ message: 'La razón social debe ser texto' })
  razonSocial?: string;

  @IsOptional()
  @IsString({ message: 'El contacto debe ser texto' })
  contacto?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  telefono?: string;

  @IsOptional()
  @IsString({ message: 'El email debe ser texto' })
  email?: string;

  @IsOptional()
  productos?: unknown;
}
