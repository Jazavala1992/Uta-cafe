import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMovimientoDto {
  @IsString()
  productoId!: string;

  @IsNumber()
  cantidad!: number;

  @IsOptional()
  @IsString()
  nota?: string;
}
