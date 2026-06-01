import { Client } from '@/types';

let clients: Client[] = [];

export async function fetchClients(): Promise<Client[]> {
  return [...clients];
}

export async function addClientEquipment(ci: string, name: string, equipment: any, lastStatus?: string): Promise<Client> {
  // This function is kept for backward compatibility if needed temporarily,
  // but we'll redirect logic to registerClient.
  return registerClient(name, ci);
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
  
  // Si no tiene CI, le asignamos un prefijo CLI-
  const finalCi = ci || `CLI-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  
  const newClient: Client = {
    name,
    ci: finalCi,
    numero_celular: numero_celular || "",
    orders: 1,
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
