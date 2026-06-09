import { StockItem } from '@/types';
import { supabase } from '@/lib/supabase';

export async function fetchStock(): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from('stock')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching stock:', error);
    return [];
  }
  return data || [];
}

export async function clearStock(): Promise<void> {
  const { error } = await supabase
    .from('stock')
    .delete()
    .neq('id', 'dummy'); // Delete all
    
  if (error) {
    console.error('Error clearing stock:', error);
    throw error;
  }
}

export async function addStockItem(item: Omit<StockItem, 'id'>): Promise<StockItem> {
  const newItem: StockItem = {
    ...item,
    id: `P-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };
  
  const { data, error } = await supabase
    .from('stock')
    .insert([newItem])
    .select()
    .single();
    
  if (error) {
    console.error('Error adding stock item:', error);
    throw error;
  }
  
  return data;
}

export async function subtractStockItem(id: string, quantity: number): Promise<StockItem | null> {
  // First, fetch current stock
  const { data: current, error: fetchError } = await supabase
    .from('stock')
    .select('stock')
    .eq('id', id)
    .single();
    
  if (fetchError || !current) return null;
  if (current.stock < quantity) return null;
  
  const newStock = current.stock - quantity;
  
  const { data, error } = await supabase
    .from('stock')
    .update({ stock: newStock })
    .eq('id', id)
    .select()
    .single();
    
  if (error) return null;
  return data;
}
