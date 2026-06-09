import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested, ArrayMinSize } from 'class-validator';

class DetalleVentaDto {
  @IsString()
  productoId: string;

  @IsOptional()
  @IsString()
  productoNombre?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precioUnitario: number;

  @Type(() => Number)
  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class CreateVentaDto {
  @IsString()
  usuarioId: string;

  @IsString()
  mesaId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mesaNumero?: number;

  @IsString()
  numeroNota: string;

  @IsEnum(['abierta', 'cerrada', 'anulada'], {
    message: 'Estado debe ser abierta, cerrada o anulada',
  })
  estado: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  descuento?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total: number;

  @IsDateString({}, { message: 'Fecha inválida' })
  fecha: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe agregar al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => DetalleVentaDto)
  detalle: DetalleVentaDto[];

  @IsOptional()
  activo?: boolean;
}

export class UpdateVentaDto {
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @IsString()
  mesaId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mesaNumero?: number;

  @IsOptional()
  @IsEnum(['abierta', 'cerrada', 'anulada'])
  estado?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  descuento?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total?: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleVentaDto)
  detalle?: DetalleVentaDto[];
}