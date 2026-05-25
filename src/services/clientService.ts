import { Client } from '@/types';

let clients: Client[] = [];

export async function fetchClients(): Promise<Client[]> {
  return [...clients];
}

export async function addClientEquipment(ci: string, name: string, equipment: { name: string; serial: string }, lastStatus?: string): Promise<Client> {
  let client = clients.find(c => c.ci === ci || c.name.toLowerCase() === name.toLowerCase());
  const status = lastStatus || 'recepcionado';
  if (client) {
    const existingIdx = client.equipment.findIndex(e => e.name.toLowerCase() === equipment.name.toLowerCase());
    let newEquipment;
    if (existingIdx >= 0) {
      const eq = client.equipment[existingIdx];
      newEquipment = client.equipment.map((e, i) =>
        i === existingIdx
          ? { ...e, serial: equipment.serial, lastOrder: equipment.serial, lastStatus: status, history: [...new Set([...e.history, equipment.serial])] }
          : e
      );
    } else {
      newEquipment = [...client.equipment, { ...equipment, lastOrder: equipment.serial, lastStatus: status, history: [equipment.serial] }];
    }
    client = { ...client, equipment: newEquipment };
    clients = clients.map(c => c.ci === client!.ci ? client! : c);
  } else {
    client = {
      name,
      ci: ci || "Sin RUT",
      numero_celular: "",
      orders: 1,
      equipment: [{ ...equipment, lastOrder: equipment.serial, lastStatus: status, history: [equipment.serial] }],
    };
    clients = [client, ...clients];
  }
  return client;
}

export async function registerClient(name: string, ci: string, numero_celular?: string): Promise<Client> {
  const existing = clients.find(c => c.ci === ci || c.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    if (numero_celular && existing.numero_celular !== numero_celular) {
      const updated = { ...existing, numero_celular };
      clients = clients.map(c => c.ci === existing.ci ? updated : c);
      return updated;
    }
    return existing;
  }
  const newClient: Client = {
    name,
    ci: ci || "Sin RUT",
    numero_celular: numero_celular || "",
    orders: 1,
    equipment: [],
  };
  clients = [newClient, ...clients];
  return newClient;
}

export async function updateClient(ci: string, fields: Partial<Client>): Promise<Client> {
  const existing = clients.find(c => c.ci === ci);
  if (!existing) throw new Error(`Client ${ci} not found`);
  const updated = { ...existing, ...fields };
  clients = clients.map(c => c.ci === ci ? updated : c);
  return updated;
}
