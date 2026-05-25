import { StockItem } from '@/types';

const INITIAL_STOCK: StockItem[] = [];

let stock = [...INITIAL_STOCK];

export async function fetchStock(): Promise<StockItem[]> {
  return [...stock];
}

export async function clearStock(): Promise<void> {
  stock = [];
}

export async function addStockItem(item: Omit<StockItem, 'id'>): Promise<StockItem> {
  const newItem: StockItem = {
    ...item,
    id: `P-${String(stock.length + 1).padStart(3, '0')}`,
  };
  stock = [...stock, newItem];
  return newItem;
}

export async function subtractStockItem(id: string, quantity: number): Promise<StockItem | null> {
  const idx = stock.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const item = stock[idx];
  if (item.stock < quantity) return null;
  const updated = { ...item, stock: item.stock - quantity };
  stock = [...stock.slice(0, idx), updated, ...stock.slice(idx + 1)];
  return updated;
}
