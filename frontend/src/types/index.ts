export type Rol = 'admin' | 'usuario';
export type EventoLog = 'ingreso' | 'salida';
export type EstadoOrden = 'pendiente' | 'recibida' | 'cancelada';
export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';
export type EstadoMesa = 'libre' | 'ocupada' | 'reservada';
export type EstadoNota = 'abierta' | 'cerrada' | 'anulada';
export type OrigenProducto = 'interno' | 'proveedor';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
  deletedAt?: string;
}

export interface AccesoLog {
  id: string;
  usuarioId: string;
  nombreUsuario: string;
  ip: string;
  browser: string;
  evento: EventoLog;
  fechaHora: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  deletedAt?: string;
}

export interface Producto {
  id: string;
  categoriaId: string;
  categoriaNombre?: string;
  nombre: string;
  descripcion: string;
  fotoUrl?: string;
  origen: OrigenProducto;
  proveedorId?: string;
  productoProveedorId?: string;
  productoProveedorNombre?: string;
  precioUnitario: number;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  deletedAt?: string;
}

export interface Proveedor {
  id: string;
  razonSocial: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  productos?: {
    id: string;
    nombre: string;
  }[];
  activo: boolean;
  deletedAt?: string;
}

export interface DetalleCompra {
  id: string;
  ordenId: string;
  productoId: string;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface OrdenCompra {
  id: string;
  proveedorId: string;
  proveedorNombre?: string;
  usuarioId: string;
  estado: EstadoOrden;
  total: number;
  fecha: string;
  notas: string;
  detalle: DetalleCompra[];
  activo: boolean;
  deletedAt?: string;
}

export interface MovimientoInventario {
  id: string;
  productoId: string;
  productoNombre?: string;
  usuarioId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  referencia: string;
  fecha: string;
}

export interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
  activo: boolean;
  deletedAt?: string;
}

export interface DetalleVenta {
  id: string;
  notaId: string;
  productoId: string;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas: string;
}

export interface NotaVenta {
  id: string;
  usuarioId: string;
  mesaId: string;
  mesaNumero?: number;
  numeroNota: string;
  estado: EstadoNota;
  subtotal: number;
  descuento: number;
  total: number;
  fecha: string;
  detalle: DetalleVenta[];
  activo: boolean;
  deletedAt?: string;
}

export interface Gasto {
  id: string;
  usuarioId: string;
  descripcion: string;
  categoria: string;
  monto: number;
  fecha: string;
  activo: boolean;
  deletedAt?: string;
}

export interface AuthUser {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}