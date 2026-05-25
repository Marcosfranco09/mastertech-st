import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { OrdenTrabajo, Order, Client, StockItem, Assembly } from '@/types';
import * as orderService from '@/services/orderService';
import * as stockService from '@/services/stockService';
import * as clientService from '@/services/clientService';
import * as assemblyService from '@/services/assemblyService';

interface AppState {
  orders: OrdenTrabajo[];
  equiposFinalizados: OrdenTrabajo[];
  clients: Client[];
  stock: StockItem[];
  assemblies: Assembly[];
  loading: boolean;
}

type Action =
  | { type: 'SET_ORDERS'; payload: OrdenTrabajo[] }
  | { type: 'ADD_ORDER'; payload: OrdenTrabajo }
  | { type: 'UPDATE_ORDER'; payload: { id: string; fields: Partial<OrdenTrabajo> } }
  | { type: 'REMOVE_ORDER'; payload: string }
  | { type: 'ADD_EQUIPO_FINALIZADO'; payload: OrdenTrabajo }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'UPSERT_CLIENT'; payload: Client }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: { ci: string; fields: Partial<Client> } }
  | { type: 'SET_STOCK'; payload: StockItem[] }
  | { type: 'ADD_STOCK'; payload: StockItem }
  | { type: 'SUBTRACT_STOCK'; payload: { id: string; fields: Partial<StockItem> } }
  | { type: 'SET_ASSEMBLIES'; payload: Assembly[] }
  | { type: 'ADD_ASSEMBLY'; payload: Assembly }
  | { type: 'UPDATE_ASSEMBLY'; payload: { id: string; fields: Partial<Assembly> } }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  orders: [],
  equiposFinalizados: [],
  clients: [],
  stock: [],
  assemblies: [],
  loading: true,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.payload.id ? { ...o, ...action.payload.fields } : o
        ),
      };
    case 'REMOVE_ORDER':
      return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };
    case 'ADD_EQUIPO_FINALIZADO':
      return { ...state, equiposFinalizados: [action.payload, ...state.equiposFinalizados] };
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };
    case 'UPSERT_CLIENT':
      return {
        ...state,
        clients: state.clients.some(c => c.ci === action.payload.ci || c.name === action.payload.name)
          ? state.clients.map(c => (c.ci === action.payload.ci || c.name === action.payload.name) ? action.payload : c)
          : [action.payload, ...state.clients],
      };
    case 'ADD_CLIENT':
      return { ...state, clients: [action.payload, ...state.clients] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(c =>
          c.ci === action.payload.ci ? { ...c, ...action.payload.fields } : c
        ),
      };
    case 'SET_STOCK':
      return { ...state, stock: action.payload };
    case 'ADD_STOCK':
      return { ...state, stock: [...state.stock, action.payload] };
    case 'SUBTRACT_STOCK':
      return {
        ...state,
        stock: state.stock.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.fields } : s
        ),
      };
    case 'SET_ASSEMBLIES':
      return { ...state, assemblies: action.payload };
    case 'ADD_ASSEMBLY':
      return { ...state, assemblies: [action.payload, ...state.assemblies] };
    case 'UPDATE_ASSEMBLY':
      return {
        ...state,
        assemblies: state.assemblies.map(a =>
          a.id === action.payload.id ? { ...a, ...action.payload.fields } : a
        ),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  actions: {
    loadInitialData: () => Promise<void>;
    createOrden: (data: Omit<OrdenTrabajo, 'id'>) => Promise<OrdenTrabajo>;
    updateOrden: (id: string, fields: Partial<OrdenTrabajo>) => Promise<void>;
    finalizarOrden: (id: string, piezas: OrdenTrabajo['piezas_utilizadas']) => Promise<void>;
    addStockItem: (item: Omit<StockItem, 'id'>) => Promise<StockItem>;
    clearStock: () => Promise<void>;
    createAssembly: (data: Omit<Assembly, 'id'>) => Promise<Assembly>;
    updateAssembly: (id: string, fields: Partial<Assembly>) => Promise<void>;
    updateClient: (ci: string, fields: Partial<Client>) => Promise<void>;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadInitialData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const [ordenes, clients, stock, assemblies] = await Promise.all([
      orderService.fetchOrdenes(),
      clientService.fetchClients(),
      stockService.fetchStock(),
      assemblyService.fetchAssemblies(),
    ]);
    dispatch({ type: 'SET_ORDERS', payload: ordenes });
    dispatch({ type: 'SET_CLIENTS', payload: clients });
    dispatch({ type: 'SET_STOCK', payload: stock });
    dispatch({ type: 'SET_ASSEMBLIES', payload: assemblies });
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const createOrden = useCallback(async (data: Omit<OrdenTrabajo, 'id'>) => {
    const orden = await orderService.createOrden(data);
    dispatch({ type: 'ADD_ORDER', payload: orden });
    const equipmentName = [data.marca, data.modelo].filter(Boolean).join(" ");
    let client = await clientService.addClientEquipment(
      data.ci || "Sin RUT", data.nombre_cliente,
      { name: equipmentName || "Equipo sin especificar", serial: orden.id },
      data.estado
    );
    if (data.numero_celular) {
      client = await clientService.registerClient(data.nombre_cliente, data.ci || "Sin RUT", data.numero_celular);
    }
    dispatch({ type: 'UPSERT_CLIENT', payload: client });
    return orden;
  }, []);

  const updateOrden = useCallback(async (id: string, fields: Partial<OrdenTrabajo>) => {
    await orderService.updateOrden(id, fields);
    dispatch({ type: 'UPDATE_ORDER', payload: { id, fields } });
  }, []);

  const finalizarOrden = useCallback(async (id: string, piezas: OrdenTrabajo['piezas_utilizadas']) => {
    for (const p of piezas) {
      const updated = await stockService.subtractStockItem(p.stockItemId, p.quantity);
      if (updated) {
        dispatch({ type: 'SUBTRACT_STOCK', payload: { id: p.stockItemId, fields: { stock: updated.stock } } });
      }
    }
    const orden = await orderService.finalizarOrden(id, piezas);
    dispatch({ type: 'UPDATE_ORDER', payload: { id, fields: { estado: 'finalizado', piezas_utilizadas: piezas } } });
    dispatch({ type: 'ADD_EQUIPO_FINALIZADO', payload: orden });
  }, []);

  const addStockItem = useCallback(async (data: Omit<StockItem, 'id'>) => {
    const item = await stockService.addStockItem(data);
    dispatch({ type: 'ADD_STOCK', payload: item });
    return item;
  }, []);

  const clearStock = useCallback(async () => {
    await stockService.clearStock();
    dispatch({ type: 'SET_STOCK', payload: [] });
  }, []);

  const createAssembly = useCallback(async (data: Omit<Assembly, 'id'>) => {
    const assembly = await assemblyService.createAssembly(data);
    dispatch({ type: 'ADD_ASSEMBLY', payload: assembly });
    const client = await clientService.addClientEquipment(
      data.ci, data.client,
      { name: data.equipment, serial: assembly.id },
      'completed'
    );
    dispatch({ type: 'UPSERT_CLIENT', payload: client });
    return assembly;
  }, []);

  const updateAssembly = useCallback(async (id: string, fields: Partial<Assembly>) => {
    await assemblyService.updateAssembly(id, fields);
    dispatch({ type: 'UPDATE_ASSEMBLY', payload: { id, fields } });
  }, []);

  const updateClient = useCallback(async (ci: string, fields: Partial<Client>) => {
    await clientService.updateClient(ci, fields);
    dispatch({ type: 'UPDATE_CLIENT', payload: { ci, fields } });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, actions: { loadInitialData, createOrden, updateOrden, finalizarOrden, addStockItem, clearStock, createAssembly, updateAssembly, updateClient } }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}