import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMovimientoDto {
  @IsString( { message: 'El tipo debe ser texto' } )
  productoId!: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  cantidad!: number;

  @IsOptional()
  @IsString({ message: 'La nota debe ser texto' })
  nota?: string;
}
