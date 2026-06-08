import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateGastoDto {
  @IsString( { message: 'La descripción debe ser texto' } )
  descripcion!: string;

  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0)
  monto!: number;

  @IsOptional()
  fecha?: string;
}

export class UpdateGastoDto {
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0)
  monto?: number;

  @IsOptional()
  fecha?: string;
}
