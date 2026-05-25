export type EstadoOrden = 'recepcionado' | 'diagnosticado' | 'en_espera' | 'en_proceso' | 'finalizado' | 'rechazado';

export interface Diagnostico {
  procesador: string;
  memoria_ram: string;
  grafica: string;
  almacenamientos: { nombre: string; estado: string }[];
  usuario_nombre: string;
  usuario_informacion: string;
  pico_estres_cpu: string;
  pico_estres_gpu: string;
  bateria?: string;
  solucion_propuesta: string;
}

export interface Presupuesto {
  monto: number;
  descripcion: string;
}

export interface PiezaUtilizada {
  stockItemId: string;
  quantity: number;
}

export interface OrdenTrabajo {
  id: string;
  recepcionado_por: string;
  nombre_cliente: string;
  ci: string;
  numero_celular: string;
  fecha_recepcion: string;
  categoria: string;
  marca: string;
  modelo: string;
  falla_segun_cliente: string;
  contrasena_equipo: string;
  accesorios: string;
  solicitud_adicional: string;
  fotos: string[];
  estado: EstadoOrden;
  garantia: boolean;
  diagnostico?: Diagnostico;
  presupuesto?: Presupuesto;
  respuesta_cliente?: 'aceptado' | 'rechazado';
  presupuesto_aceptado?: Presupuesto;
  piezas_utilizadas?: PiezaUtilizada[];
}

export type OrderStatus = 'diagnosis' | 'in_progress' | 'waiting_parts' | 'completed' | 'urgent';
export type Priority = 'urgent' | 'high' | 'normal' | 'low';

export interface Order {
  id: string;
  client: string;
  ci: string;
  equipment: string;
  model: string;
  serial: string;
  status: OrderStatus;
  priority: Priority;
  tech: string;
  date: string;
  issue: string;
}

export interface ClientEquipment {
  name: string;
  serial: string;
  lastOrder: string;
  lastStatus: string;
  history: string[];
}

export interface Client {
  name: string;
  ci: string;
  numero_celular: string;
  orders: number;
  equipment: ClientEquipment[];
  notes?: string;
}

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  min: number;
  price: number;
  category: string;
  recent: boolean;
}

export interface Component {
  name: string;
  sku: string;
}

export interface Assembly {
  id: string;
  client: string;
  ci: string;
  date: string;
  equipment: string;
  components: Component[];
  warranty: boolean;
  warrantyReason?: string;
  warrantySolution?: string;
  tech?: string;
}

export interface TimelineEvent {
  time: string;
  date: string;
  action: string;
  user: string;
  type: string;
  detail: string;
}
