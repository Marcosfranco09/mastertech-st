import { Equipo, ClienteEquipo } from '@/types';

let equipos: Equipo[] = [];
let clienteEquipos: ClienteEquipo[] = [];

export async function fetchEquipos(): Promise<Equipo[]> {
  return [...equipos];
}

export async function fetchClienteEquipos(): Promise<ClienteEquipo[]> {
  return [...clienteEquipos];
}

export async function getEquipoById(id: string): Promise<Equipo | undefined> {
  return equipos.find(e => e.id === id);
}

export async function addEquipo(equipo: Equipo): Promise<Equipo> {
  equipos = [equipo, ...equipos];
  return equipo;
}

export async function updateEquipo(id: string, fields: Partial<Equipo>): Promise<Equipo> {
  const idx = equipos.findIndex(e => e.id === id);
  if (idx === -1) throw new Error(`Equipo ${id} no encontrado`);
  equipos[idx] = { ...equipos[idx], ...fields };
  return equipos[idx];
}

export async function addClienteEquipo(cliente_ci: string, equipo_id: string, es_propietario: boolean = true): Promise<ClienteEquipo> {
  const existing = clienteEquipos.find(ce => ce.cliente_ci === cliente_ci && ce.equipo_id === equipo_id);
  if (existing) {
    return existing;
  }
  const nuevo: ClienteEquipo = {
    cliente_ci,
    equipo_id,
    fecha_registro: new Date().toISOString(),
    es_propietario
  };
  clienteEquipos = [nuevo, ...clienteEquipos];
  return nuevo;
}
