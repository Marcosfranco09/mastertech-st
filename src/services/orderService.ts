import { OrdenTrabajo } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchOrdenes(): Promise<OrdenTrabajo[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('fecha_recepcion', { ascending: false });
    
  if (error) {
    console.error('Error fetching ordenes:', error);
    return [];
  }
  return data || [];
}

export async function createOrden(data: Omit<OrdenTrabajo, 'id'>): Promise<OrdenTrabajo> {
  const nueva: OrdenTrabajo = {
    ...data,
    id: "ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
  };
  
  const { data: insertedData, error } = await supabase
    .from('orders')
    .insert([nueva])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating orden:', error);
    throw error;
  }
  
  return insertedData;
}

export async function updateOrden(id: string, fields: Partial<OrdenTrabajo>): Promise<OrdenTrabajo> {
  const { data, error } = await supabase
    .from('orders')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating orden:', error);
    throw error;
  }
  
  return data;
}

export async function finalizarOrden(id: string, piezas: OrdenTrabajo['piezas_utilizadas']): Promise<OrdenTrabajo> {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      estado: 'finalizado', 
      piezas_utilizadas: piezas 
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error finalizando orden:', error);
    throw error;
  }
  
  return data;
}

export async function deleteOrden(id: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error eliminando orden:', error);
    throw error;
  }
}
