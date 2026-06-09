import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min, MinLength, MaxLength, IsUrl, IsEnum } from 'class-validator';

export class CreateProductoDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El ID de categoría debe ser texto' })
  categoriaId?: string;

  @IsOptional()
  @IsString({ message: 'El nombre de categoría debe ser texto' })
  categoriaNombre?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, { message: 'La descripción no puede superar 500 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @IsOptional()
  @IsEnum(['interno', 'proveedor'], {
    message: 'El origen debe ser interno o proveedor',
  })
  origen?: 'interno' | 'proveedor';

  @IsOptional()
  @IsString({ message: 'El ID de proveedor debe ser texto' })
  proveedorId?: string;

  @IsOptional()
  @IsString({ message: 'El ID de producto proveedor debe ser texto' })
  productoProveedorId?: string;

  @IsOptional()
  @IsString({ message: 'El nombre de producto proveedor debe ser texto' })
  productoProveedorNombre?: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio unitario debe ser un número' }
  )
  @Min(0, { message: 'El precio no puede ser negativo' })
  precioUnitario: number;

  @IsOptional()
  @IsString({ message: 'La unidad de medida debe ser texto' })
  unidadMedida?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El stock actual debe ser un número' })
  @Min(0, { message: 'El stock actual no puede ser negativo' })
  stockActual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El stock mínimo debe ser un número' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  stockMinimo?: number;

  @IsOptional()
  @IsBoolean({ message: 'usaStock debe ser verdadero o falso' })
  usaStock?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'disponible debe ser verdadero o falso' })
  disponible?: boolean;
}

export class UpdateProductoDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El ID de categoría debe ser texto' })
  categoriaId?: string;
  
  @IsOptional()
  @IsString({ message: 'El nombre de categoría debe ser texto' })
  categoriaNombre?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, { message: 'La descripción no puede superar 500 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsString({ message: 'La URL de la foto no es válida' })
  fotoUrl?: string;

  @IsOptional()
  @IsEnum(['interno', 'proveedor'], {
    message: 'El origen debe ser interno o proveedor',
  })
  origen?: 'interno' | 'proveedor';

  @IsOptional()
  @IsString({ message: 'El ID de proveedor debe ser texto' })
  proveedorId?: string;

  @IsOptional()
  @IsString({ message: 'El ID de producto proveedor debe ser texto' })
  productoProveedorId?: string;

  @IsOptional()
  @IsString({ message: 'El nombre de producto proveedor debe ser texto' })
  productoProveedorNombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio unitario debe ser un número' })
  @Min(0)
  precioUnitario?: number;

  @IsOptional()
  @IsString({ message: 'La unidad de medida debe ser texto' })
  unidadMedida?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El stock actual debe ser un número' })
  @Min(0)
  stockActual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El stock mínimo debe ser un número' })
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsBoolean({ message: 'usaStock debe ser verdadero o falso' })
  usaStock?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'disponible debe ser verdadero o falso' })
  disponible?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'activo debe ser verdadero o falso' })
  activo?: boolean;

  @IsOptional()
  @IsString({ message: 'La fecha de eliminación debe ser texto' })
  deletedAt?: string | null;
}
