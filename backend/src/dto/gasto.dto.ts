import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateGastoDto {
  @IsString()
  descripcion!: string;

  @IsNumber()
  @Min(0)
  monto!: number;

  @IsOptional()
  fecha?: string;
}

export class UpdateGastoDto {
  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto?: number;

  @IsOptional()
  fecha?: string;
}
