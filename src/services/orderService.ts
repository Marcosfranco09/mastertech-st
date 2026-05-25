import { OrdenTrabajo } from '@/types';

let ordenes: OrdenTrabajo[] = [];

export async function fetchOrdenes(): Promise<OrdenTrabajo[]> {
  return [...ordenes];
}

export async function createOrden(data: Omit<OrdenTrabajo, 'id'>): Promise<OrdenTrabajo> {
  const nueva: OrdenTrabajo = {
    ...data,
    id: crypto.randomUUID(),
  };
  ordenes = [nueva, ...ordenes];
  return nueva;
}

export async function updateOrden(id: string, fields: Partial<OrdenTrabajo>): Promise<OrdenTrabajo> {
  const idx = ordenes.findIndex(o => o.id === id);
  if (idx === -1) throw new Error(`Orden ${id} no encontrada`);
  ordenes[idx] = { ...ordenes[idx], ...fields };
  return ordenes[idx];
}

export async function finalizarOrden(id: string, piezas: OrdenTrabajo['piezas_utilizadas']): Promise<OrdenTrabajo> {
  const idx = ordenes.findIndex(o => o.id === id);
  if (idx === -1) throw new Error(`Orden ${id} no encontrada`);
  ordenes[idx] = {
    ...ordenes[idx],
    estado: 'finalizado',
    piezas_utilizadas: piezas,
  };
  return ordenes[idx];
}
