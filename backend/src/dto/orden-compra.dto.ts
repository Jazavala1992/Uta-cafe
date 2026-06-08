import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrdenCompraDto {
  @IsOptional()
  @IsString()
  proveedorId?: string;

  @IsOptional()
  @IsString()
  proveedorNombre?: string;  // ← agregar esto

  @IsNumber()
  total!: number;

  @IsOptional()
  detalle?: unknown;
}

export class UpdateOrdenCompraDto {
  @IsOptional()
  @IsString()
  proveedorId?: string;

  @IsOptional()
  @IsString()
  proveedorNombre?: string;  // ← agregar esto

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  detalle?: unknown;
}