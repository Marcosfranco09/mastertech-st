import { useState, useEffect, Component } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppProvider, useAppContext } from "@/store/AppContext";
import { AppLayout } from "@/app/Layout";
import { ToastContainer } from "@/app/Toast";
import { Dashboard } from "@/views/Dashboard";
import { OrdenesPage, OrderDetailPage } from "@/views/OrdenesPage";
import { Equipment } from "@/views/Equipment";
import { Stock } from "@/views/Stock";
import { Assemblies } from "@/views/Assemblies";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/components/ui/alert-dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { toast } from "@/app/Toast";

class AppErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean; error: string}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: String(error?.message ?? error) };
  }
  componentDidCatch(error: any, info: any) {
    console.error("App error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"var(--background)", color:"var(--foreground)", gap:12, fontFamily:"Inter,sans-serif" }}>
          <div style={{ fontSize:16, fontWeight:600 }}>Se produjo un error inesperado</div>
          <div style={{ fontSize:12, color:"var(--muted-foreground)", maxWidth:400, textAlign:"center" }}>{this.state.error}</div>
          <button onClick={() => this.setState({ hasError: false, error: "" })} style={{ marginTop:8, padding:"8px 20px", fontSize:12, background:"var(--primary)", color:"white", border:"none", cursor:"pointer" }}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuxModals() {
  const { actions } = useAppContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRegisterEqOpen, setIsRegisterEqOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [newStockForm, setNewStockForm] = useState({ name: "", category: "", stock: "", price: "" });
  const [newEqForm, setNewEqForm] = useState({ client: "", ci: "", equipment: "", serial: "" });

  useEffect(() => {
    const h = (e: Event, setter: (v: boolean) => void) => setter(true);
    const handlers: [string, EventListener][] = [
      ["open-settings",           (e) => h(e, setIsSettingsOpen)],
      ["open-notifications",      (e) => h(e, setIsNotificationsOpen)],
      ["open-register-equipment", (e) => h(e, setIsRegisterEqOpen)],
      ["open-add-stock",          (e) => h(e, setIsAddStockOpen)],
    ];
    handlers.forEach(([ev, fn]) => window.addEventListener(ev, fn));
    return () => handlers.forEach(([ev, fn]) => window.removeEventListener(ev, fn));
  }, []);

  return (
    <>
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader><DialogTitle>Configuración del Sistema</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: "Nombre del taller", placeholder: "MasterTech Gamer Store" },
              { label: "Dirección", placeholder: "Av. Providencia 1234" },
              { label: "Teléfono de contacto", placeholder: "+595 981 234 567" },
            ].map(({ label, placeholder }) => (
              <div key={label} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input placeholder={placeholder} className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)} style={{ borderColor: "var(--border)" }}>Cancelar</Button>
            <Button onClick={() => { toast.success("Configuración guardada"); setIsSettingsOpen(false); }} style={{ background: "var(--primary)", color: "white" }}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader><DialogTitle>Notificaciones</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            {[
              { msg: "OT-2838 marcada como URGENTE", time: "Hace 5 min", color: "#DC2626" },
              { msg: "Pieza BAT-MBP14-22 con stock bajo", time: "Hace 1 hora", color: "#D97706" },
              { msg: "OT-2844 finalizada por Oscar Gomez", time: "Hace 2 horas", color: "#059669" },
            ].map((n, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border-l-2" style={{ background: "var(--muted)", borderLeftColor: n.color }}>
                <div className="flex-1">
                  <div className="text-xs" style={{ color: "var(--foreground)" }}>{n.msg}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRegisterEqOpen} onOpenChange={setIsRegisterEqOpen}>
        <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader><DialogTitle>Registrar Equipo</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente</Label>
                <Input placeholder="Nombre del cliente" value={newEqForm.client} onChange={e => setNewEqForm({...newEqForm, client: e.target.value})} className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">CI / RUC</Label>
                <Input placeholder="Ej. 1234567-8" value={newEqForm.ci} onChange={e => setNewEqForm({...newEqForm, ci: e.target.value})} className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Equipo</Label>
              <Input placeholder="Ej. MacBook Pro 14" value={newEqForm.equipment} onChange={e => setNewEqForm({...newEqForm, equipment: e.target.value})} className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Número de serie</Label>
              <Input placeholder="Serial del equipo" value={newEqForm.serial} onChange={e => setNewEqForm({...newEqForm, serial: e.target.value})} className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegisterEqOpen(false)} style={{ borderColor: "var(--border)" }}>Cancelar</Button>
            <Button onClick={() => { toast.success("Equipo registrado correctamente"); setIsRegisterEqOpen(false); setNewEqForm({ client:"", ci:"", equipment:"", serial:"" }); }} style={{ background: "var(--primary)", color: "white" }}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader><DialogTitle>Agregar Pieza al Inventario</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre de la pieza</Label>
              <Input placeholder="Ej. Batería MacBook Pro 14" value={newStockForm.name} onChange={e => setNewStockForm({...newStockForm, name: e.target.value})} className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría</Label>
              <Input placeholder="Baterías" value={newStockForm.category} onChange={e => setNewStockForm({...newStockForm, category: e.target.value})} className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Stock inicial</Label>
                <Input type="number" placeholder="0" value={newStockForm.stock} onChange={e => setNewStockForm({...newStockForm, stock: e.target.value})} className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Precio (₲)</Label>
                <Input type="number" placeholder="Ej. 150000" value={newStockForm.price} onChange={e => setNewStockForm({...newStockForm, price: e.target.value})} className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStockOpen(false)} style={{ borderColor: "var(--border)" }}>Cancelar</Button>
            <Button onClick={async () => {
              if (!newStockForm.name.trim() || !newStockForm.stock || !newStockForm.price) { toast.info("Completa todos los campos"); return; }
              await actions.addStockItem({
                name: newStockForm.name.trim(),
                category: newStockForm.category.trim() || "General",
                stock: Number(newStockForm.stock),
                price: Number(newStockForm.price),
                sku: "",
                min: 1,
                recent: true,
              });
              toast.success("Pieza agregada al inventario");
              setIsAddStockOpen(false);
              setNewStockForm({ name:"", category:"", stock:"", price:"" });
            }} style={{ background: "var(--primary)", color: "white" }}>Agregar pieza</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AppShell() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ordenes" element={<OrdenesPage />} />
          <Route path="/ordenes/:id" element={<OrderDetailPage />} />
          <Route path="/equipos" element={<Equipment />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/ensambles" element={<Assemblies />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <AuxModals />
        <AppShell />
        <ToastContainer />
      </AppProvider>
    </AppErrorBoundary>
  );
}