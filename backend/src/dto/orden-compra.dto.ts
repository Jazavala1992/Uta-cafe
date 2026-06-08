import { IsNumber, IsOptional, IsString, IsPositive } from 'class-validator';

export class CreateOrdenCompraDto {
  @IsOptional()
  @IsString()
  proveedorId?: string;

  @IsOptional()
  @IsString()
  proveedorNombre?: string;  // ← agregar esto

  @IsNumber()
  @IsPositive( { message: 'El total debe ser un número positivo' } )
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
  proveedorNombre?: string;  

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  detalle?: unknown;
}