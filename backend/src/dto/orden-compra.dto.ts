import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrdenCompraDto {
  @IsOptional()
  proveedorId?: string;

  @IsNumber()
  total!: number;

  @IsOptional()
  detalle?: unknown;
}

export class UpdateOrdenCompraDto {
  @IsOptional()
  proveedorId?: string;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  detalle?: unknown;
}
