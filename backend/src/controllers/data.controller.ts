import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { DataService } from '@src/data/data.service';
import { CreateProductoDto, UpdateProductoDto } from '@src/dto/producto.dto';
import { CreateCategoriaDto, UpdateCategoriaDto } from '@src/dto/categoria.dto';
import { CreateProveedorDto, UpdateProveedorDto } from '@src/dto/proveedor.dto';
import { CreateOrdenCompraDto, UpdateOrdenCompraDto } from '@src/dto/orden-compra.dto';
import { CreateVentaDto, UpdateVentaDto } from '@src/dto/venta.dto';
import { CreateGastoDto, UpdateGastoDto } from '@src/dto/gasto.dto';
import { CreateMovimientoDto } from '@src/dto/movimiento.dto';

@Controller('api')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('productos') listProductos(@Query('incluirEliminados') ie?: string) { return this.dataService.list('productos', ie === 'true'); }
  @Get('productos/:id') getProducto(@Param('id') id: string) { return this.dataService.getById('productos', id); }
  @Post('productos') createProducto(@Body() body: CreateProductoDto) { return this.dataService.create('productos', body as unknown as Record<string, unknown>); }
  @Put('productos/:id') updateProducto(@Param('id') id: string, @Body() body: UpdateProductoDto) { return this.dataService.update('productos', id, body as unknown as Record<string, unknown>); }
  @Delete('productos/:id') delProducto(@Param('id') id: string) { return this.dataService.softDelete('productos', id); }
  @Put('productos/:id/restaurar') restProducto(@Param('id') id: string) { return this.dataService.restore('productos', id); }

  @Get('categorias') listCategorias(@Query('incluirEliminados') ie?: string) { return this.dataService.list('categorias', ie === 'true'); }
  @Get('categorias/:id') getCategoria(@Param('id') id: string) { return this.dataService.getById('categorias', id); }
  @Post('categorias') createCategoria(@Body() body: CreateCategoriaDto) { return this.dataService.create('categorias', body as unknown as Record<string, unknown>); }
  @Put('categorias/:id') updateCategoria(@Param('id') id: string, @Body() body: UpdateCategoriaDto) { return this.dataService.update('categorias', id, body as unknown as Record<string, unknown>); }
  @Delete('categorias/:id') delCategoria(@Param('id') id: string) { return this.dataService.softDelete('categorias', id); }
  @Put('categorias/:id/restaurar') restCategoria(@Param('id') id: string) { return this.dataService.restore('categorias', id); }

  @Get('proveedores') listProveedores(@Query('incluirEliminados') ie?: string) { return this.dataService.list('proveedores', ie === 'true'); }
  @Get('proveedores/:id') getProveedor(@Param('id') id: string) { return this.dataService.getById('proveedores', id); }
  @Post('proveedores') createProveedor(@Body() body: CreateProveedorDto) { return this.dataService.create('proveedores', body as unknown as Record<string, unknown>); }
  @Put('proveedores/:id') updateProveedor(@Param('id') id: string, @Body() body: UpdateProveedorDto) { return this.dataService.update('proveedores', id, body as unknown as Record<string, unknown>); }
  @Delete('proveedores/:id') delProveedor(@Param('id') id: string) { return this.dataService.softDelete('proveedores', id); }
  @Put('proveedores/:id/restaurar') restProveedor(@Param('id') id: string) { return this.dataService.restore('proveedores', id); }

  @Get('ordenes-compra') listCompras(@Query('incluirEliminados') ie?: string) { return this.dataService.list('ordenesCompra', ie === 'true'); }
  @Get('ordenes-compra/:id') getCompra(@Param('id') id: string) { return this.dataService.getById('ordenesCompra', id); }
  @Post('ordenes-compra') createCompra(@Body() body: CreateOrdenCompraDto) { return this.dataService.create('ordenesCompra', body as unknown as Record<string, unknown>); }
  @Put('ordenes-compra/:id') updateCompra(@Param('id') id: string, @Body() body: UpdateOrdenCompraDto) { return this.dataService.update('ordenesCompra', id, body as unknown as Record<string, unknown>); }
  @Put('ordenes-compra/:id/finalizar') finalizarCompra(@Param('id') id: string, @Body() body?: { usuarioId?: string }) {
    return this.dataService.finalizarOrdenCompra(id, body?.usuarioId);
  }
  @Delete('ordenes-compra/:id') delCompra(@Param('id') id: string) { return this.dataService.softDelete('ordenesCompra', id); }
  @Put('ordenes-compra/:id/restaurar') restCompra(@Param('id') id: string) { return this.dataService.restore('ordenesCompra', id); }

  @Get('ventas') listVentas(@Query('incluirEliminados') ie?: string) { return this.dataService.list('ventas', ie === 'true'); }
  @Get('ventas/:id') getVenta(@Param('id') id: string) { return this.dataService.getById('ventas', id); }
  @Post('ventas') createVenta(@Body() body: CreateVentaDto) { return this.dataService.create('ventas', body as unknown as Record<string, unknown>); }
  @Put('ventas/:id') updateVenta(@Param('id') id: string, @Body() body: UpdateVentaDto) { return this.dataService.update('ventas', id, body as unknown as Record<string, unknown>); }
  @Delete('ventas/:id') delVenta(@Param('id') id: string) { return this.dataService.softDelete('ventas', id); }
  @Put('ventas/:id/restaurar') restVenta(@Param('id') id: string) { return this.dataService.restore('ventas', id); }

  @Get('gastos') listGastos(@Query('incluirEliminados') ie?: string) { return this.dataService.list('gastos', ie === 'true'); }
  @Get('gastos/:id') getGasto(@Param('id') id: string) { return this.dataService.getById('gastos', id); }
  @Post('gastos') createGasto(@Body() body: CreateGastoDto) { return this.dataService.create('gastos', body as unknown as Record<string, unknown>); }
  @Put('gastos/:id') updateGasto(@Param('id') id: string, @Body() body: UpdateGastoDto) { return this.dataService.update('gastos', id, body as unknown as Record<string, unknown>); }
  @Delete('gastos/:id') delGasto(@Param('id') id: string) { return this.dataService.softDelete('gastos', id); }
  @Put('gastos/:id/restaurar') restGasto(@Param('id') id: string) { return this.dataService.restore('gastos', id); }

  @Get('inventario/movimientos') listMovimientos() { return this.dataService.list('movimientos'); }
  @Post('inventario/movimientos') createMovimiento(@Body() body: CreateMovimientoDto) { return this.dataService.create('movimientos', body as unknown as Record<string, unknown>); }

  @Get('reportes/ingresos-egresos') reporteIE() { return this.dataService.resumenIngresosEgresos(); }
}
