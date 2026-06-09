import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { OrdenTrabajo, Order, Client, StockItem, Assembly, Equipo, ClienteEquipo, GalleryPhoto } from '@/types';
import * as orderService from '@/services/orderService';
import * as stockService from '@/services/stockService';
import * as clientService from '@/services/clientService';
import * as assemblyService from '@/services/assemblyService';
import * as equipmentService from '@/services/equipmentService';
import * as galleryService from '@/services/galleryService';

interface AppState {
  orders: OrdenTrabajo[];
  equiposFinalizados: OrdenTrabajo[];
  clients: Client[];
  equipos: Equipo[];
  clienteEquipos: ClienteEquipo[];
  stock: StockItem[];
  assemblies: Assembly[];
  galleryPhotos: GalleryPhoto[];
  loading: boolean;
  globalMonthFilter: string;
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
  | { type: 'SET_EQUIPOS'; payload: Equipo[] }
  | { type: 'ADD_EQUIPO'; payload: Equipo }
  | { type: 'UPDATE_EQUIPO'; payload: { id: string; fields: Partial<Equipo> } }
  | { type: 'SET_CLIENTE_EQUIPOS'; payload: ClienteEquipo[] }
  | { type: 'ADD_CLIENTE_EQUIPO'; payload: ClienteEquipo }
  | { type: 'SET_STOCK'; payload: StockItem[] }
  | { type: 'ADD_STOCK'; payload: StockItem }
  | { type: 'SUBTRACT_STOCK'; payload: { id: string; fields: Partial<StockItem> } }
  | { type: 'SET_ASSEMBLIES'; payload: Assembly[] }
  | { type: 'ADD_ASSEMBLY'; payload: Assembly }
  | { type: 'UPDATE_ASSEMBLY'; payload: { id: string; fields: Partial<Assembly> } }
  | { type: 'SET_GALLERY_PHOTOS'; payload: GalleryPhoto[] }
  | { type: 'ADD_GALLERY_PHOTO'; payload: GalleryPhoto }
  | { type: 'REMOVE_GALLERY_PHOTO'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MONTH_FILTER'; payload: string };

const initialState: AppState = {
  orders: [],
  equiposFinalizados: [],
  clients: [],
  equipos: [],
  clienteEquipos: [],
  stock: [],
  assemblies: [],
  galleryPhotos: [],
  loading: true,
  globalMonthFilter: new Date().toISOString().slice(0, 7), // YYYY-MM
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ORDERS': return { ...state, orders: action.payload };
    case 'ADD_ORDER': return { ...state, orders: [action.payload, ...state.orders] };
    case 'UPDATE_ORDER': return {
      ...state, orders: state.orders.map(o => o.id === action.payload.id ? { ...o, ...action.payload.fields } : o),
    };
    case 'REMOVE_ORDER': return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };
    case 'ADD_EQUIPO_FINALIZADO': return { ...state, equiposFinalizados: [action.payload, ...state.equiposFinalizados] };
    
    case 'SET_CLIENTS': return { ...state, clients: action.payload };
    case 'UPSERT_CLIENT':
      return {
        ...state,
        clients: state.clients.some(c => c.ci === action.payload.ci)
          ? state.clients.map(c => c.ci === action.payload.ci ? action.payload : c)
          : [action.payload, ...state.clients],
      };
    case 'ADD_CLIENT': return { ...state, clients: [action.payload, ...state.clients] };
    case 'UPDATE_CLIENT': return {
      ...state, clients: state.clients.map(c => c.ci === action.payload.ci ? { ...c, ...action.payload.fields } : c),
    };

    case 'SET_EQUIPOS': return { ...state, equipos: action.payload };
    case 'ADD_EQUIPO': return { ...state, equipos: [action.payload, ...state.equipos] };
    case 'UPDATE_EQUIPO': return {
      ...state, equipos: state.equipos.map(e => e.id === action.payload.id ? { ...e, ...action.payload.fields } : e),
    };
    
    case 'SET_CLIENTE_EQUIPOS': return { ...state, clienteEquipos: action.payload };
    case 'ADD_CLIENTE_EQUIPO': return {
      ...state,
      clienteEquipos: state.clienteEquipos.some(ce => ce.cliente_ci === action.payload.cliente_ci && ce.equipo_id === action.payload.equipo_id)
        ? state.clienteEquipos
        : [action.payload, ...state.clienteEquipos]
    };

    case 'SET_STOCK': return { ...state, stock: action.payload };
    case 'ADD_STOCK': return { ...state, stock: [...state.stock, action.payload] };
    case 'SUBTRACT_STOCK': return {
      ...state, stock: state.stock.map(s => s.id === action.payload.id ? { ...s, ...action.payload.fields } : s),
    };
    
    case 'SET_ASSEMBLIES': return { ...state, assemblies: action.payload };
    case 'ADD_ASSEMBLY': return { ...state, assemblies: [action.payload, ...state.assemblies] };
    case 'UPDATE_ASSEMBLY': return {
      ...state, assemblies: state.assemblies.map(a => a.id === action.payload.id ? { ...a, ...action.payload.fields } : a),
    };
    
    case 'SET_GALLERY_PHOTOS': return { ...state, galleryPhotos: action.payload };
    case 'ADD_GALLERY_PHOTO': return { ...state, galleryPhotos: [action.payload, ...state.galleryPhotos] };
    case 'REMOVE_GALLERY_PHOTO': return { ...state, galleryPhotos: state.galleryPhotos.filter(p => p.id !== action.payload) };

    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_MONTH_FILTER': return { ...state, globalMonthFilter: action.payload };
    default: return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  actions: {
    loadInitialData: () => Promise<void>;
    createOrden: (data: Omit<OrdenTrabajo, 'id' | 'equipo_id'>, equipoId?: string, nuevoEquipoData?: Omit<Equipo, 'id'>) => Promise<OrdenTrabajo>;
    updateOrden: (id: string, fields: Partial<OrdenTrabajo>) => Promise<void>;
    deleteOrden: (id: string) => Promise<void>;
    finalizarOrden: (id: string, piezas: OrdenTrabajo['piezas_utilizadas']) => Promise<void>;
    addStockItem: (item: Omit<StockItem, 'id'>) => Promise<StockItem>;
    clearStock: () => Promise<void>;
    createAssembly: (data: Omit<Assembly, 'id'>) => Promise<Assembly>;
    updateAssembly: (id: string, fields: Partial<Assembly>) => Promise<void>;
    updateClient: (ci: string, fields: Partial<Client>) => Promise<void>;
    addGalleryPhoto: (dataUrl: string) => Promise<void>;
    removeGalleryPhoto: (id: string) => Promise<void>;
    setGlobalMonthFilter: (month: string) => void;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadInitialData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const [ordenes, clients, stock, assemblies, equipos, clienteEquipos, galleryPhotos] = await Promise.all([
      orderService.fetchOrdenes(),
      clientService.fetchClients(),
      stockService.fetchStock(),
      assemblyService.fetchAssemblies(),
      equipmentService.fetchEquipos(),
      equipmentService.fetchClienteEquipos(),
      galleryService.fetchGalleryPhotos(),
    ]);
    dispatch({ type: 'SET_ORDERS', payload: ordenes });
    dispatch({ type: 'SET_CLIENTS', payload: clients });
    dispatch({ type: 'SET_STOCK', payload: stock });
    dispatch({ type: 'SET_ASSEMBLIES', payload: assemblies });
    dispatch({ type: 'SET_EQUIPOS', payload: equipos });
    dispatch({ type: 'SET_CLIENTE_EQUIPOS', payload: clienteEquipos });
    dispatch({ type: 'SET_GALLERY_PHOTOS', payload: galleryPhotos });
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(async () => {
      const photos = await galleryService.fetchGalleryPhotos();
      dispatch({ type: 'SET_GALLERY_PHOTOS', payload: photos });
    }, 3000);
    return () => clearInterval(interval);
  }, [loadInitialData]);

  const createOrden = useCallback(async (data: Omit<OrdenTrabajo, 'id' | 'equipo_id'>, equipoId?: string, nuevoEquipoData?: Omit<Equipo, 'id'>) => {
    // 1. Manejar Cliente
    let client = await clientService.registerClient(data.nombre_cliente, data.ci, data.numero_celular);
    dispatch({ type: 'UPSERT_CLIENT', payload: client });

    // 2. Manejar Equipo
    let targetEquipoId = equipoId;
    if (!targetEquipoId && nuevoEquipoData) {
      const nuevoEquipo: Equipo = {
        ...nuevoEquipoData,
        id: `MT-${(Math.random().toString(36).substring(2, 8)).toUpperCase()}`
      };
      await equipmentService.addEquipo(nuevoEquipo);
      dispatch({ type: 'ADD_EQUIPO', payload: nuevoEquipo });
      targetEquipoId = nuevoEquipo.id;
    }

    if (!targetEquipoId) {
      throw new Error("Se requiere un equipo existente o datos para un equipo nuevo");
    }

    // 3. Vincular Cliente y Equipo
    const relacion = await equipmentService.addClienteEquipo(client.ci, targetEquipoId);
    dispatch({ type: 'ADD_CLIENTE_EQUIPO', payload: relacion });

    // 4. Crear Orden
    const ordenData: Omit<OrdenTrabajo, 'id'> = {
      ...data,
      equipo_id: targetEquipoId,
      ci: client.ci, // Actualizar en la orden con el finalCi generado si corresponde
    };
    const orden = await orderService.createOrden(ordenData);
    dispatch({ type: 'ADD_ORDER', payload: orden });

    return orden;
  }, []);

  const updateOrden = useCallback(async (id: string, fields: Partial<OrdenTrabajo>) => {
    let finalFields = { ...fields };
    if (fields.estado === 'entregado' && !finalFields.fecha_entrega) {
      finalFields.fecha_entrega = new Date().toISOString();
    }
    await orderService.updateOrden(id, finalFields);
    dispatch({ type: 'UPDATE_ORDER', payload: { id, fields: finalFields } });

    if (fields.diagnostico) {
      const orden = state.orders.find(o => o.id === id);
      if (orden && orden.equipo_id) {
        const d = fields.diagnostico;
        const especificaciones = {
          procesador: d.procesador,
          memoria_ram: d.memoria_ram,
          grafica: d.grafica,
          almacenamientos: d.almacenamientos.map(a => ({ nombre: a.nombre, capacidad: a.capacidad, letra: a.letra, estado: a.estado })),
          bateria: d.estado_bateria || d.bateria,
          medicion_pila: d.medicion_pila,
          fuente_potencia: d.fuente_potencia,
          fuente_marca: d.fuente_marca,
        };
        await equipmentService.updateEquipo(orden.equipo_id, { especificaciones });
        dispatch({ type: 'UPDATE_EQUIPO', payload: { id: orden.equipo_id, fields: { especificaciones } } });
      }
    }
  }, [state.orders]);

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

    if (piezas && piezas.length > 0 && orden.equipo_id) {
      const equipo = state.equipos.find(e => e.id === orden.equipo_id);
      if (equipo && equipo.especificaciones) {
        let nuevasSpecs = { ...equipo.especificaciones };
        let updatedSpecs = false;

        piezas.forEach(p => {
          if (p.reemplazaA) {
            const stockItem = state.stock.find(s => s.id === p.stockItemId);
            const itemName = stockItem?.name || p.stockItemId;
            
            if (p.reemplazaA.startsWith("CPU:")) nuevasSpecs.procesador = itemName;
            else if (p.reemplazaA.startsWith("RAM:")) nuevasSpecs.memoria_ram = itemName;
            else if (p.reemplazaA.startsWith("GPU:")) nuevasSpecs.grafica = itemName;
            else if (p.reemplazaA.startsWith("Batería")) nuevasSpecs.bateria = itemName;
            else if (p.reemplazaA.startsWith("Pila")) nuevasSpecs.medicion_pila = itemName;
            else if (p.reemplazaA.startsWith("Fuente")) {
              nuevasSpecs.fuente_marca = itemName;
              nuevasSpecs.fuente_potencia = "";
            }
            else if (p.reemplazaA.startsWith("Almacenamiento:")) {
              const prevNombre = p.reemplazaA.replace("Almacenamiento: ", "");
              if (nuevasSpecs.almacenamientos) {
                const idx = nuevasSpecs.almacenamientos.findIndex(a => a.nombre === prevNombre);
                if (idx !== -1) {
                  nuevasSpecs.almacenamientos[idx] = { ...nuevasSpecs.almacenamientos[idx], nombre: itemName };
                }
              }
            }
            updatedSpecs = true;
          }
        });

        if (updatedSpecs) {
          await equipmentService.updateEquipo(orden.equipo_id, { especificaciones: nuevasSpecs });
          dispatch({ type: 'UPDATE_EQUIPO', payload: { id: orden.equipo_id, fields: { especificaciones: nuevasSpecs } } });
        }
      }
    }
  }, [state.stock, state.equipos]);

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

  const setGlobalMonthFilter = useCallback((month: string) => {
    dispatch({ type: 'SET_MONTH_FILTER', payload: month });
  }, []);

  const addGalleryPhoto = useCallback(async (dataUrl: string) => {
    const photo = await galleryService.addGalleryPhoto(dataUrl);
    dispatch({ type: 'ADD_GALLERY_PHOTO', payload: photo });
  }, []);

  const removeGalleryPhoto = useCallback(async (id: string) => {
    await galleryService.removeGalleryPhoto(id);
    dispatch({ type: 'REMOVE_GALLERY_PHOTO', payload: id });
  }, []);

  const markGalleryPhotoUsed = useCallback(async (id: string) => {
    const newUrl = await galleryService.markGalleryPhotoUsed(id);
    dispatch({ type: 'REMOVE_GALLERY_PHOTO', payload: id });
    return newUrl;
  }, []);

  const deleteOrden = useCallback(async (id: string) => {
    await orderService.deleteOrden(id);
    dispatch({ type: 'REMOVE_ORDER', payload: id });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, actions: { loadInitialData, createOrden, updateOrden, deleteOrden, finalizarOrden, addStockItem, clearStock, createAssembly, updateAssembly, updateClient, addGalleryPhoto, removeGalleryPhoto, markGalleryPhotoUsed, setGlobalMonthFilter } }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}