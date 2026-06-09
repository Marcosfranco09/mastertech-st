import { Equipo, ClienteEquipo } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchEquipos(): Promise<Equipo[]> {
  const { data, error } = await supabase
    .from('equipos')
    .select('*');
    
  if (error) {
    console.error('Error fetching equipos:', error);
    return [];
  }
  return data || [];
}

export async function fetchClienteEquipos(): Promise<ClienteEquipo[]> {
  const { data, error } = await supabase
    .from('cliente_equipos')
    .select('*');
    
  if (error) {
    console.error('Error fetching cliente_equipos:', error);
    return [];
  }
  return data || [];
}

export async function getEquipoById(id: string): Promise<Equipo | undefined> {
  const { data, error } = await supabase
    .from('equipos')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    return undefined;
  }
  return data;
}

export async function addEquipo(equipo: Equipo): Promise<Equipo> {
  const { data, error } = await supabase
    .from('equipos')
    .insert([equipo])
    .select()
    .single();
    
  if (error) {
    console.error('Error adding equipo:', error);
    throw error;
  }
  return data;
}

export async function updateEquipo(id: string, fields: Partial<Equipo>): Promise<Equipo> {
  const { data, error } = await supabase
    .from('equipos')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating equipo:', error);
    throw error;
  }
  return data;
}

export async function addClienteEquipo(cliente_ci: string, equipo_id: string, es_propietario: boolean = true): Promise<ClienteEquipo> {
  const { data: existingData } = await supabase
    .from('cliente_equipos')
    .select('*')
    .eq('cliente_ci', cliente_ci)
    .eq('equipo_id', equipo_id);
    
  const existing = existingData?.[0];
  if (existing) {
    return existing;
  }
  
  const nuevo = {
    cliente_ci,
    equipo_id,
    fecha_registro: new Date().toISOString(),
    es_propietario
  };
  
  const { data, error } = await supabase
    .from('cliente_equipos')
    .insert([nuevo])
    .select()
    .single();
    
  if (error) {
    console.error('Error adding cliente_equipo:', error);
    throw error;
  }
  return data;
}
