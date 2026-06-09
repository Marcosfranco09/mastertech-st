import { Client } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('fecha_registro', { ascending: false });
  
  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
  return data || [];
}

export async function addClientEquipment(ci: string, name: string, equipment: any, lastStatus?: string): Promise<Client> {
  return registerClient(name, ci);
}

export async function registerClient(name: string, ci: string, numero_celular?: string): Promise<Client> {
  // Check if client exists
  const { data: existingClients } = await supabase
    .from('clients')
    .select('*')
    .or(`ci.eq.${ci},name.ilike.${name}`);

  const existing = existingClients?.[0];

  if (existing) {
    if (numero_celular && existing.numero_celular !== numero_celular) {
      return updateClient(existing.ci, { numero_celular });
    }
    return existing;
  }
  
  const finalCi = ci || `CLI-${(Math.random().toString(36).substring(2, 8)).toUpperCase()}`;
  
  const newClient: Client = {
    name,
    ci: finalCi,
    numero_celular: numero_celular || "",
    orders: 1,
    fecha_registro: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('clients')
    .insert([newClient])
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }

  return data;
}

export async function updateClient(ci: string, fields: Partial<Client>): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(fields)
    .eq('ci', ci)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }

  return data;
}
