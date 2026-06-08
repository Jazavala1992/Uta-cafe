import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoriaDto {
  @IsString( { message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  nombre!: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;
}

export class UpdateCategoriaDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @IsOptional()
  activo?: boolean;

  @IsOptional()
  deletedAt?: string | null;
}
