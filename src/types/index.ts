export type UserRole = 'ADMIN' | 'CAJERO';

export type OrderStatus = 'RECIBIDO' | 'EN_PROCESO' | 'COMPLETADO' | 'ENTREGADO' | 'CANCELADO';

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  sucursal_id?: string;
  activo: boolean;
  created_at: string;
}

export interface Sucursal {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  activa: boolean;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre_completo: string;
  telefono: string;
  correo?: string;
  direccion?: string;
  notas?: string;
  sucursal_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PrendaTipo {
  id: string;
  nombre: string;
  icono?: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  prenda_tipo_id?: string;
  activo: boolean;
  created_at: string;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  sucursal_id?: string;
  usuario_id: string;
  numero_pedido: string;
  fecha_recepcion: string;
  fecha_entrega_estimada: string;
  fecha_entrega_real?: string;
  estado: OrderStatus;
  total: number;
  observaciones?: string;
  notificacion_enviada: boolean;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
  detalles?: PedidoDetalle[];
}

export interface PedidoDetalle {
  id: string;
  pedido_id: string;
  prenda_tipo_id: string;
  servicio_id?: string;
  servicio_personalizado?: string;
  precio: number;
  foto_url?: string;
  observaciones?: string;
  created_at: string;
  prenda_tipo?: PrendaTipo;
  servicio?: Servicio;
}

export interface Notificacion {
  id: string;
  pedido_id: string;
  tipo: string;
  enviada: boolean;
  fecha_envio?: string;
  mensaje?: string;
  created_at: string;
}

export interface DashboardStats {
  totalClientes: number;
  totalPedidos: number;
  pedidosPendientes: number;
  pedidosHoy: number;
  pedidosManana: number;
  gananciasMes: number;
}
