import { Assembly } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchAssemblies(): Promise<Assembly[]> {
  const { data, error } = await supabase
    .from('assemblies')
    .select('*')
    .order('date', { ascending: false });
    
  if (error) {
    console.error('Error fetching assemblies:', error);
    return [];
  }
  return data || [];
}

export async function createAssembly(data: Omit<Assembly, 'id'>): Promise<Assembly> {
  const newAssembly: Assembly = {
    ...data,
    id: "ENS-" + Math.floor(1000 + Math.random() * 9000),
  };
  
  const { data: insertedData, error } = await supabase
    .from('assemblies')
    .insert([newAssembly])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating assembly:', error);
    throw error;
  }
  
  return insertedData;
}

export async function updateAssembly(id: string, fields: Partial<Assembly>): Promise<Assembly> {
  const { data, error } = await supabase
    .from('assemblies')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating assembly:', error);
    throw error;
  }
  
  return data;
}
