import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Search, Plus, X, Camera, Trash2, ArrowLeft } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { EstadoBadge, capitalizeWords } from "@/app/helpers";
import { toast } from "@/app/Toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import type { OrdenTrabajo, Diagnostico, PiezaUtilizada } from "@/types";

const TECNICOS = ["Oscar Gomez", "Orlando Moreno", "Marcos Franco"];

const FILTROS = [
  { value: "todas", label: "Todas" },
  { value: "recepcionado", label: "Recepcionado" },
  { value: "diagnosticado", label: "Diagnosticado" },
  { value: "en_espera", label: "En espera" },
  { value: "en_proceso", label: "En proceso" },
  { value: "finalizado", label: "Finalizado" },
  { value: "rechazado", label: "Rechazados" },
];

export function ReceptionModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state, actions } = useAppContext();
  const [form, setForm] = useState({
    recepcionado_por: "",
    nombre_cliente: "",
    ci: "",
    numero_celular: "",
    categoria: "",
    marca: "",
    modelo: "",
    falla_segun_cliente: "",
    contrasena_equipo: "",
    accesorios: "",
    solicitud_adicional: "",
  });
  const [fotos, setFotos] = useState<string[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [ciFilledBySuggestion, setCiFilledBySuggestion] = useState(false);
  const [clientLocked, setClientLocked] = useState(false);
  const [equipmentLocked, setEquipmentLocked] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [garantia, setGarantia] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredClients = state.clients.filter(c =>
    c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    c.ci.toLowerCase().includes(clientSearchQuery.toLowerCase())
  );

  const existingClientForCi = form.ci
    ? state.clients.find(c => c.ci.toLowerCase() === form.ci.toLowerCase())
    : null;
  const lockedClient = clientLocked && form.ci
    ? state.clients.find(c => c.ci.toLowerCase() === form.ci.toLowerCase())
    : null;

  useEffect(() => {
    if (!form.ci || ciFilledBySuggestion) return;
    const match = state.clients.find(c => c.ci.toLowerCase() === form.ci.toLowerCase());
    if (match) {
      setForm(prev => ({ ...prev, nombre_cliente: capitalizeWords(match.name), numero_celular: match.numero_celular }));
      setClientLocked(true);
    }
  }, [form.ci]);

  useEffect(() => {
    if (open) {
      setForm({
        recepcionado_por: "",
        nombre_cliente: "",
        ci: "",
        numero_celular: "",
        categoria: "",
        marca: "",
        modelo: "",
        falla_segun_cliente: "",
        contrasena_equipo: "",
        accesorios: "",
        solicitud_adicional: "",
      });
      setFotos([]);
      setClientSearchQuery("");
      setCiFilledBySuggestion(false);
      setClientLocked(false);
      setEquipmentLocked(false);
      setSelectedEquipment("");
      setGarantia(false);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map(f => URL.createObjectURL(f));
    setFotos(prev => [...prev, ...urls]);
  };

  const removeFoto = (idx: number) => {
    URL.revokeObjectURL(fotos[idx]);
    setFotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.recepcionado_por || !form.nombre_cliente || !form.modelo) {
      toast.info("Completa los campos obligatorios (técnico, cliente, modelo)");
      return;
    }
    await actions.createOrden({
      ...form,
      fotos,
      estado: "recepcionado",
      garantia,
      fecha_recepcion: new Date().toISOString(),
    });
    toast.success("Recepción registrada correctamente");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Recepción de equipo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Recepcionado por *</Label>
            <Select value={form.recepcionado_por} onValueChange={v => setForm({ ...form, recepcionado_por: v })}>
              <SelectTrigger className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }}>
                <SelectValue placeholder="Seleccionar técnico" />
              </SelectTrigger>
              <SelectContent style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                {TECNICOS.map(t => (
                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

           <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
             <div className="text-xs font-semibold mb-3" style={{ color: "var(--foreground)" }}>Datos del cliente</div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 relative">
                  <Label className="text-xs">Nombre del cliente *</Label>
                  <Input placeholder="Nombre y apellido" value={form.nombre_cliente}
                    disabled={clientLocked}
                    onChange={e => { setForm({ ...form, nombre_cliente: e.target.value }); setClientSearchQuery(e.target.value); setClientLocked(false); }}
                    onFocus={() => setClientSearchQuery(form.nombre_cliente)}
                    onBlur={e => { setForm({ ...form, nombre_cliente: capitalizeWords(e.target.value) }); setTimeout(() => setClientSearchQuery(""), 200); }}
                    className="text-xs"
                    style={{ background: clientLocked ? "var(--muted)" : "var(--input)", borderColor: "var(--border)" }} />
                 {clientSearchQuery && filteredClients.length > 0 && (
                   <div className="absolute z-10 w-full border rounded p-1 max-h-32 overflow-y-auto space-y-1" style={{ borderColor: "var(--border)", background: "var(--card)", top: "100%", marginTop: 2 }}>
                     {filteredClients.map(c => (
                       <div key={c.ci} className="flex flex-col p-1.5 hover:bg-muted/50 rounded cursor-pointer"
                   onMouseDown={() => { setForm({ ...form, nombre_cliente: capitalizeWords(c.name), ci: c.ci, numero_celular: c.numero_celular }); setClientSearchQuery(""); setCiFilledBySuggestion(true); setClientLocked(true); }}> 
                         <div className="text-[11px] font-medium" style={{ color: "var(--foreground)" }}>{c.name}</div>
                         <div className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>CI: {c.ci}</div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CI / RUC</Label>
                  <Input placeholder="Ej. 1234567-8" value={form.ci}
                    disabled={clientLocked}
                    onChange={e => { setForm({ ...form, ci: e.target.value.replace(/[^\d-]/g, "") }); setCiFilledBySuggestion(false); setClientLocked(false); }}
                    className="text-xs" style={{ background: clientLocked ? "var(--muted)" : "var(--input)", borderColor: "var(--border)" }} />
                  {existingClientForCi && !ciFilledBySuggestion && (
                    <div className="text-[11px] flex items-center gap-1 mt-1" style={{ color: "#D97706" }}>
                      <span>Ya existe un cliente con este CI: <strong>{existingClientForCi.name}</strong></span>
                    </div>
                  )}
                </div>
             </div>
              <div className="mt-3 space-y-1.5">
                <Label className="text-xs">Número de celular</Label>
                <Input placeholder="+595 9XX XXX XXX" value={form.numero_celular}
                  disabled={clientLocked}
                  onChange={e => setForm({ ...form, numero_celular: e.target.value.replace(/\D/g, "") })} className="text-xs"
                 style={{ background: "var(--input)", borderColor: "var(--border)" }} />
             </div>
           </div>

           <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <div className="text-xs font-semibold mb-3" style={{ color: "var(--foreground)" }}>Datos del equipo</div>

             {lockedClient && lockedClient.equipment.length > 0 && (
              <div className="mb-3 space-y-1.5">
                <Label className="text-xs">Equipo registrado</Label>
                <Select value={selectedEquipment} onValueChange={serial => {
                  setSelectedEquipment(serial);
                  setEquipmentLocked(true);
                  const eq = lockedClient.equipment.find(e => e.serial === serial);
                  const name = eq?.name ?? "";
                  const spaceIdx = name.indexOf(" ");
                  if (spaceIdx > 0) {
                    setForm(prev => ({ ...prev, marca: capitalizeWords(name.slice(0, spaceIdx)), modelo: capitalizeWords(name.slice(spaceIdx + 1)) }));
                  } else {
                    setForm(prev => ({ ...prev, modelo: capitalizeWords(name) }));
                  }
                  const order = state.orders.find(o => o.id === serial);
                  if (order?.categoria) {
                    setForm(prev => ({ ...prev, categoria: capitalizeWords(order.categoria) }));
                  }
                }}>
                  <SelectTrigger className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }}>
                    <SelectValue placeholder="Seleccionar equipo existente..." />
                  </SelectTrigger>
                  <SelectContent style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    {lockedClient.equipment.map(eq => (
                      <SelectItem key={eq.serial} value={eq.serial} className="text-xs">{eq.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedEquipment && (
              <div className="mb-3 flex items-center gap-2">
                <input type="checkbox" id="garantia" checked={garantia}
                  onChange={e => setGarantia(e.target.checked)}
                  className="size-4 accent-[var(--primary)]" />
                <Label htmlFor="garantia" className="text-xs cursor-pointer">Garantía</Label>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoría</Label>
                <Input placeholder="Ej. Notebook" value={form.categoria}
                  disabled={equipmentLocked}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                  onBlur={e => setForm({ ...form, categoria: capitalizeWords(e.target.value) })}
                  className="text-xs" style={{ background: equipmentLocked ? "var(--muted)" : "var(--input)", borderColor: "var(--border)" }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Marca</Label>
                <Input placeholder="Ej. HP" value={form.marca}
                  disabled={equipmentLocked}
                  onChange={e => setForm({ ...form, marca: e.target.value })}
                  onBlur={e => setForm({ ...form, marca: capitalizeWords(e.target.value) })}
                  className="text-xs" style={{ background: equipmentLocked ? "var(--muted)" : "var(--input)", borderColor: "var(--border)" }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Modelo *</Label>
                <Input placeholder="Ej. Pavilion 15" value={form.modelo}
                  disabled={equipmentLocked}
                  onChange={e => setForm({ ...form, modelo: e.target.value })}
                  onBlur={e => setForm({ ...form, modelo: capitalizeWords(e.target.value) })}
                  className="text-xs" style={{ background: equipmentLocked ? "var(--muted)" : "var(--input)", borderColor: "var(--border)" }} />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs">Falla según cliente</Label>
              <Textarea placeholder="Describe el problema reportado..." value={form.falla_segun_cliente}
                onChange={e => setForm({ ...form, falla_segun_cliente: e.target.value })}
                onBlur={e => setForm({ ...form, falla_segun_cliente: capitalizeWords(e.target.value) })}
                className="text-xs h-20 resize-none"
                style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Contraseña del equipo</Label>
                <Input placeholder="Si aplica" value={form.contrasena_equipo}
                  onChange={e => setForm({ ...form, contrasena_equipo: e.target.value })} className="text-xs"
                  style={{ background: "var(--input)", borderColor: "var(--border)" }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Accesorios</Label>
                <Input placeholder="Cargador, mouse, etc." value={form.accesorios}
                  onChange={e => setForm({ ...form, accesorios: e.target.value })}
                  onBlur={e => setForm({ ...form, accesorios: capitalizeWords(e.target.value) })}
                  className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs">Solicitud adicional del cliente</Label>
              <Textarea placeholder="Notas adicionales..." value={form.solicitud_adicional}
                onChange={e => setForm({ ...form, solicitud_adicional: e.target.value })}
                onBlur={e => setForm({ ...form, solicitud_adicional: capitalizeWords(e.target.value) })}
                className="text-xs h-16 resize-none"
                style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
            <div className="mt-3 space-y-2">
              <Label className="text-xs">Fotos del equipo</Label>
              <div className="flex flex-wrap gap-2">
                {fotos.map((url, i) => (
                  <div key={i} className="relative size-16 border rounded overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <img src={url} alt="" className="size-full object-cover" />
                    <button onClick={() => removeFoto(i)}
                      className="absolute top-0.5 right-0.5 size-4 flex items-center justify-center rounded-full"
                      style={{ background: "rgba(0,0,0,0.6)", color: "white" }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <button onClick={() => fileRef.current?.click()}
                  className="size-16 border rounded flex items-center justify-center hover:bg-muted/40 transition-colors"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                  <Camera size={18} />
                </button>
              </div>
              <input ref={fileRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="text-xs" style={{ background: "var(--primary)", color: "white" }}>
            Guardar recepción
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiagnosticoModal({ open, onOpenChange, onSave, esNotebook, garantia }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (d: Diagnostico) => void;
  esNotebook: boolean;
  garantia?: boolean;
}) {
  const [form, setForm] = useState<Diagnostico>({
    procesador: "", memoria_ram: "", grafica: "", almacenamientos: [{ nombre: "", estado: "" }],
    usuario_nombre: "", usuario_informacion: "", pico_estres_cpu: "", pico_estres_gpu: "",
    bateria: "", solucion_propuesta: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        procesador: "", memoria_ram: "", grafica: "", almacenamientos: [{ nombre: "", estado: "" }],
        usuario_nombre: "", usuario_informacion: "", pico_estres_cpu: "", pico_estres_gpu: "",
        bateria: "", solucion_propuesta: "",
      });
    }
  }, [open]);

  const addAlmacenamiento = () => setForm({ ...form, almacenamientos: [...form.almacenamientos, { nombre: "", estado: "" }] });
  const removeAlmacenamiento = (i: number) => setForm({ ...form, almacenamientos: form.almacenamientos.filter((_, idx) => idx !== i) });
  const setAlmacenamiento = (i: number, field: 'nombre' | 'estado', value: string) => {
    const updated = form.almacenamientos.map((a, idx) => idx === i ? { ...a, [field]: value } : a);
    setForm({ ...form, almacenamientos: updated });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{garantia ? "Diagnóstico (Garantía)" : "Diagnóstico técnico"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!garantia && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Procesador</Label>
                  <Input placeholder="Ej. Intel i5-1240P"
                    value={form.procesador} onChange={e => setForm({ ...form, procesador: e.target.value })}
                    className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Memoria RAM</Label>
                  <Input placeholder="Ej. 16GB DDR5"
                    value={form.memoria_ram} onChange={e => setForm({ ...form, memoria_ram: e.target.value })}
                    className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Gráfica</Label>
                  <Input placeholder="Ej. RTX 3060"
                    value={form.grafica} onChange={e => setForm({ ...form, grafica: e.target.value })}
                    className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Almacenamiento/s</Label>
                  <button onClick={addAlmacenamiento} className="text-xs text-primary hover:underline">+ Agregar</button>
                </div>
                {form.almacenamientos.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input placeholder="Nombre (ej. SSD NVMe 512GB)"
                      value={a.nombre} onChange={e => setAlmacenamiento(i, 'nombre', e.target.value)}
                      className="text-xs flex-1" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                    <Input placeholder="Estado"
                      value={a.estado} onChange={e => setAlmacenamiento(i, 'estado', e.target.value)}
                      className="text-xs w-28" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                    {form.almacenamientos.length > 1 && (
                      <button onClick={() => removeAlmacenamiento(i)} style={{ color: "#DC2626" }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Usuario</Label>
                  <Input placeholder="Nombre"
                    value={form.usuario_nombre} onChange={e => setForm({ ...form, usuario_nombre: e.target.value })}
                    className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Información almacenada</Label>
                  <Input placeholder="Cantidad aprox."
                    value={form.usuario_informacion} onChange={e => setForm({ ...form, usuario_informacion: e.target.value })}
                    className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Pico de estrés CPU</Label>
                  <Input placeholder="Ej. 85°C"
                    value={form.pico_estres_cpu} onChange={e => setForm({ ...form, pico_estres_cpu: e.target.value })}
                    className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Pico de estrés GPU</Label>
                  <Input placeholder="Ej. 78°C"
                    value={form.pico_estres_gpu} onChange={e => setForm({ ...form, pico_estres_gpu: e.target.value })}
                    className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
              </div>

              {esNotebook && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Batería</Label>
                  <Input placeholder="Estado de la batería (opcional)"
                    value={form.bateria} onChange={e => setForm({ ...form, bateria: e.target.value })}
                    className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">{garantia ? "Descripción del problema y solución aplicada" : "Solución propuesta"}</Label>
            <Textarea placeholder="Describe la solución recomendada..."
              value={form.solucion_propuesta} onChange={e => setForm({ ...form, solucion_propuesta: e.target.value })}
              className="text-xs h-20 resize-none" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            Cancelar
          </Button>
          <Button onClick={() => { onSave(form); onOpenChange(false); }} className="text-xs" style={{ background: "var(--primary)", color: "white" }}>
            Guardar diagnóstico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useAppContext();
  const ordenActual = state.orders.find(o => o.id === id);
  const [step, setStep] = useState(0);
  const [showDiagnostico, setShowDiagnostico] = useState(false);
  const [showPresupuesto, setShowPresupuesto] = useState(false);
  const [showFinalizacion, setShowFinalizacion] = useState(false);
  const [presupuestoMonto, setPresupuestoMonto] = useState("");
  const [presupuestoDesc, setPresupuestoDesc] = useState("");
  const [conVariaciones, setConVariaciones] = useState(false);
  const [variacionMonto, setVariacionMonto] = useState("");
  const [variacionDesc, setVariacionDesc] = useState("");
  const [piezas, setPiezas] = useState<PiezaUtilizada[]>([{ stockItemId: "", quantity: 1 }]);
  const [searchQueries, setSearchQueries] = useState<string[]>([""]);

  useEffect(() => {
    if (ordenActual) {
      setShowDiagnostico(false);
      setShowPresupuesto(false);
      setShowFinalizacion(false);
      setPresupuestoMonto("");
      setPresupuestoDesc("");
      setConVariaciones(false);
      setVariacionMonto("");
      setVariacionDesc("");
      setPiezas([{ stockItemId: "", quantity: 1 }]);
      setSearchQueries([""]);
    }
  }, [ordenActual?.id]);

  const setSearchQuery = (i: number, val: string) => {
    setSearchQueries(qs => qs.map((q, idx) => idx === i ? val : q));
  };

  if (!ordenActual) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Orden no encontrada</div>
      </div>
    );
  }

  const esNotebook = ordenActual.categoria?.toLowerCase().includes("notebook") ||
    ordenActual.categoria?.toLowerCase().includes("laptop") ||
    ordenActual.categoria?.toLowerCase().includes("macbook");

  const steps = [
    { key: "recepcion", label: "Recepción" },
    { key: "diagnostico", label: "Diagnóstico" },
    ...(!ordenActual.garantia ? [{ key: "presupuesto", label: "Presupuesto" }] : []),
    ...(!ordenActual.garantia ? [{ key: "finalizacion", label: "Finalización" }] : []),
  ];

  const handleDiagnosticoSave = async (diag: Diagnostico) => {
    await actions.updateOrden(ordenActual.id, {
      diagnostico: diag,
      estado: ordenActual.garantia ? "en_proceso" : "diagnosticado",
    });
    toast.success(ordenActual.garantia ? "Diagnóstico guardado" : "Diagnóstico guardado, estado actualizado a diagnosticado");
  };

  const handlePresupuestoSave = async () => {
    const monto = Number(presupuestoMonto);
    if (!monto) { toast.info("Ingresa un monto de presupuesto"); return; }
    await actions.updateOrden(ordenActual.id, {
      presupuesto: { monto, descripcion: presupuestoDesc },
      estado: "en_espera",
    });
    toast.success("Presupuesto enviado");
  };

  const handleRechazar = async () => {
    await actions.updateOrden(ordenActual.id, {
      respuesta_cliente: "rechazado",
      estado: "rechazado",
    });
    toast.success("Orden rechazada por el cliente");
  };

  const handleAceptar = async () => {
    const presupuestoOriginal = ordenActual.presupuesto;
    if (!presupuestoOriginal) return;
    const aceptado = conVariaciones
      ? { monto: Number(variacionMonto), descripcion: variacionDesc }
      : { monto: presupuestoOriginal.monto, descripcion: presupuestoOriginal.descripcion };
    if (conVariaciones && !Number(variacionMonto)) { toast.info("Ingresa el nuevo monto acordado"); return; }
    await actions.updateOrden(ordenActual.id, {
      respuesta_cliente: "aceptado",
      presupuesto_aceptado: aceptado,
      estado: "en_proceso",
    });
    toast.success("Presupuesto aceptado, orden en proceso");
  };

  const addPieza = () => setPiezas([...piezas, { stockItemId: "", quantity: 1 }]);
  const removePieza = (i: number) => setPiezas(piezas.filter((_, idx) => idx !== i));
  const setPieza = (i: number, field: 'stockItemId' | 'quantity', value: string | number) => {
    setPiezas(piezas.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const handleFinalizar = async () => {
    await actions.finalizarOrden(ordenActual.id, piezas.filter(p => p.stockItemId));
    toast.success("Orden finalizada correctamente");
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
          <div><span className="text-muted-foreground">ID:</span> <span className="font-mono font-semibold" style={{ color: "var(--primary)" }}>{ordenActual.id.slice(0, 8)}</span></div>
          <div><span className="text-muted-foreground">Fecha recepción:</span> {new Date(ordenActual.fecha_recepcion).toLocaleDateString("es-ES")}</div>
          <div><span className="text-muted-foreground">Recepcionado por:</span> {capitalizeWords(ordenActual.recepcionado_por)}</div>
          <div><span className="text-muted-foreground">Cliente:</span> {capitalizeWords(ordenActual.nombre_cliente)}</div>
          <div><span className="text-muted-foreground">Celular:</span> {ordenActual.numero_celular || "—"}</div>
          <div><span className="text-muted-foreground">CI / RUC:</span> {ordenActual.ci || "—"}</div>
          <div><span className="text-muted-foreground">Categoría:</span> {capitalizeWords(ordenActual.categoria || "—")}</div>
          <div><span className="text-muted-foreground">Marca:</span> {capitalizeWords(ordenActual.marca || "—")}</div>
          <div><span className="text-muted-foreground">Modelo:</span> {capitalizeWords(ordenActual.modelo)}</div>
          <div className="col-span-2"><span className="text-muted-foreground">Contraseña:</span> {ordenActual.contrasena_equipo || "—"}</div>
          <div className="col-span-2"><span className="text-muted-foreground">Accesorios:</span> {capitalizeWords(ordenActual.accesorios || "—")}</div>
          {ordenActual.falla_segun_cliente && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Falla según cliente:</span>
              <p className="mt-1 leading-relaxed" style={{ color: "var(--foreground)" }}>{capitalizeWords(ordenActual.falla_segun_cliente)}</p>
            </div>
          )}
          {ordenActual.solicitud_adicional && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Solicitud adicional:</span>
              <p className="mt-1 leading-relaxed" style={{ color: "var(--foreground)" }}>{capitalizeWords(ordenActual.solicitud_adicional)}</p>
            </div>
          )}
          {ordenActual.fotos.length > 0 && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Fotos:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {ordenActual.fotos.map((url, i) => (
                  <img key={i} src={url} alt="" className="size-20 object-cover border rounded" style={{ borderColor: "var(--border)" }} />
                ))}
              </div>
            </div>
          )}
        </div>
      );
      case 1: {
        if (!ordenActual.diagnostico) {
          return (
            <div>
              <Button onClick={() => setShowDiagnostico(true)} className="text-xs"
                style={{ background: "#2563EB", color: "white" }}>
                {ordenActual.garantia ? "Realizar diagnóstico (Garantía)" : "Realizar diagnóstico"}
              </Button>
            </div>
          );
        }
        return (
          <div className="text-xs space-y-3">
            {!ordenActual.garantia && (
              <>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div><span className="text-muted-foreground">CPU:</span> <span className="font-medium ml-1">{capitalizeWords(ordenActual.diagnostico.procesador)}</span></div>
                  <div><span className="text-muted-foreground">RAM:</span> <span className="font-medium ml-1">{capitalizeWords(ordenActual.diagnostico.memoria_ram)}</span></div>
                  <div><span className="text-muted-foreground">GPU:</span> <span className="font-medium ml-1">{capitalizeWords(ordenActual.diagnostico.grafica)}</span></div>
                  <div><span className="text-muted-foreground">Batería:</span> <span className="font-medium ml-1">{capitalizeWords(ordenActual.diagnostico.bateria || "—")}</span></div>
                </div>
                {ordenActual.diagnostico.almacenamientos.length > 0 && (
                  <div className="border-t pt-2" style={{ borderColor: "var(--border)" }}>
                    <span className="text-muted-foreground">Almacenamiento:</span>
                    <div className="mt-1 space-y-1">
                      {ordenActual.diagnostico.almacenamientos.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 ml-2">
                          <span className="font-medium">{a.nombre}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: a.estado.toLowerCase() === "bien" ? "rgba(5,150,105,0.1)" : "rgba(217,119,6,0.1)", color: a.estado.toLowerCase() === "bien" ? "#059669" : "#D97706" }}>{a.estado}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-t pt-2" style={{ borderColor: "var(--border)" }}>
                  <div><span className="text-muted-foreground">Usuario:</span> <span className="font-medium ml-1">{ordenActual.diagnostico.usuario_nombre}</span></div>
                  <div><span className="text-muted-foreground">Información:</span> <span className="font-medium ml-1">{ordenActual.diagnostico.usuario_informacion}</span></div>
                  <div><span className="text-muted-foreground">Pico estrés CPU:</span> <span className="font-medium ml-1">{ordenActual.diagnostico.pico_estres_cpu}</span></div>
                  <div><span className="text-muted-foreground">Pico estrés GPU:</span> <span className="font-medium ml-1">{ordenActual.diagnostico.pico_estres_gpu}</span></div>
                </div>
              </>
            )}
            <div className={`${ordenActual.garantia ? "" : "border-t pt-2"} p-3 rounded`} style={Object.assign({ background: "rgba(0,71,171,0.04)" }, ordenActual.garantia ? {} : { borderColor: "var(--border)" })}>
              <span className="font-semibold" style={{ color: "var(--primary)" }}>{ordenActual.garantia ? "Descripción y solución aplicada" : "Solución propuesta"}</span>
              <p className="mt-1.5 leading-relaxed" style={{ color: "var(--foreground)" }}>{capitalizeWords(ordenActual.diagnostico.solucion_propuesta)}</p>
            </div>
            {ordenActual.garantia && ordenActual.estado === "en_proceso" && (
              <Button onClick={() => { actions.finalizarOrden(ordenActual.id, []); }} className="text-xs w-full"
                style={{ background: "#059669", color: "white" }}>Finalizado</Button>
            )}
            {ordenActual.garantia && ordenActual.estado === "finalizado" && (
              <div className="flex items-center justify-center gap-2 p-4 rounded border" style={{ background: "rgba(5,150,105,0.06)", borderColor: "rgba(5,150,105,0.25)" }}>
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: "#059669" }}>Equipo finalizado</span>
              </div>
            )}
          </div>
        );
      }
      case 2: {
        if (ordenActual.presupuesto || ordenActual.estado === "en_espera" || ordenActual.estado === "finalizado" || ordenActual.estado === "rechazado") {
          return (
            <div className="text-xs space-y-2">
              {ordenActual.presupuesto && (
                <div className="p-2 rounded" style={{ background: "var(--muted)" }}>
                  Presupuesto enviado: <strong>{ordenActual.presupuesto.monto.toLocaleString("es-PY")}₲</strong>
                  {ordenActual.presupuesto.descripcion && <> — {capitalizeWords(ordenActual.presupuesto.descripcion)}</>}
                </div>
              )}
              {ordenActual.respuesta_cliente && (
                <div className="flex items-center gap-1.5 py-1 px-2">
                  <span className="text-muted-foreground">Respuesta cliente:</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide" style={{ background: ordenActual.respuesta_cliente === "aceptado" ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)", color: ordenActual.respuesta_cliente === "aceptado" ? "#059669" : "#DC2626" }}>
                    {ordenActual.respuesta_cliente === "aceptado" ? "ACEPTADO" : "RECHAZADO"}
                  </span>
                </div>
              )}
              {ordenActual.presupuesto_aceptado && (
                <div className="p-2 rounded" style={{ background: "var(--muted)" }}>
                  Presupuesto aceptado: <strong>{ordenActual.presupuesto_aceptado.monto.toLocaleString("es-PY")}₲</strong>
                  {ordenActual.presupuesto_aceptado.descripcion && <> — {capitalizeWords(ordenActual.presupuesto_aceptado.descripcion)}</>}
                </div>
              )}
              {ordenActual.estado === "en_espera" && (
                <Button onClick={() => setShowPresupuesto(true)} className="text-xs" style={{ background: "#7C3AED", color: "white" }}>
                  Responder presupuesto
                </Button>
              )}
            </div>
          );
        }
        return (
          <div>
            <Button onClick={() => setShowPresupuesto(true)} className="text-xs" style={{ background: "#7C3AED", color: "white" }}>
              Registrar presupuesto
            </Button>
          </div>
        );
      }
      case 3: {
        if (ordenActual.estado === "finalizado" || ordenActual.estado === "rechazado") {
          return (
            <div className="text-xs space-y-2">
              {ordenActual.respuesta_cliente && (
                <div className="flex items-center gap-1.5 py-1 px-2">
                  <span className="text-muted-foreground">Respuesta cliente:</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide" style={{ background: ordenActual.respuesta_cliente === "aceptado" ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)", color: ordenActual.respuesta_cliente === "aceptado" ? "#059669" : "#DC2626" }}>
                    {ordenActual.respuesta_cliente === "aceptado" ? "ACEPTADO" : "RECHAZADO"}
                  </span>
                </div>
              )}
              {ordenActual.presupuesto_aceptado && (
                <div className="p-2 rounded mt-2" style={{ background: "var(--muted)" }}>
                  Presupuesto aceptado: <strong>{ordenActual.presupuesto_aceptado.monto.toLocaleString("es-PY")}₲</strong>
                  {ordenActual.presupuesto_aceptado.descripcion && <> — {capitalizeWords(ordenActual.presupuesto_aceptado.descripcion)}</>}
                </div>
              )}
              {ordenActual.piezas_utilizadas && ordenActual.piezas_utilizadas.length > 0 && (
                <div><span className="text-muted-foreground">Piezas utilizadas:</span>
                  {ordenActual.piezas_utilizadas.map((p, i) => {
                    const stockItem = state.stock.find(s => s.id === p.stockItemId);
                    return (
                      <div key={i} className="ml-2">{capitalizeWords(stockItem?.name ?? p.stockItemId)}: {p.quantity} ud{p.quantity > 1 ? "s" : ""}</div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        return (
          <div>
            <Button onClick={() => setShowFinalizacion(true)} className="text-xs" style={{ background: "#059669", color: "white" }}>
              Agregar piezas y finalizar
            </Button>
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ background: "var(--background)" }}>
      <button onClick={() => navigate("/ordenes")}
        className="flex items-center gap-1 text-xs mb-4 transition-colors hover:text-primary"
        style={{ color: "var(--muted-foreground)" }}>
        <ArrowLeft size={14} /> Volver a órdenes
      </button>

      <div className="border rounded p-4 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{ordenActual.nombre_cliente}</span>
              <span className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>#{ordenActual.id.slice(0, 8)}</span>
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              {ordenActual.marca} {ordenActual.modelo}{ordenActual.falla_segun_cliente ? ` · "${ordenActual.falla_segun_cliente}"` : ""}
            </div>
          </div>
          <EstadoBadge estado={ordenActual.estado} />
        </div>
      </div>

      <div className="flex items-center gap-0 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
        {steps.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStep(i)}
            className={`px-4 py-2 text-xs font-medium transition-colors relative ${i === step ? "" : "hover:bg-muted/40"}`}
            style={{
              color: i === step ? "var(--primary)" : "var(--foreground)",
              cursor: "pointer",
              borderBottom: i === step ? "2px solid var(--primary)" : "2px solid transparent",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="border rounded p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        {renderStep()}
      </div>

      <DiagnosticoModal
        open={showDiagnostico}
        onOpenChange={setShowDiagnostico}
        onSave={handleDiagnosticoSave}
        esNotebook={esNotebook}
        garantia={ordenActual.garantia}
      />

      <Dialog open={showPresupuesto} onOpenChange={setShowPresupuesto}>
        <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", maxWidth: 450 }}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {ordenActual.estado === "en_espera" ? "Responder presupuesto" : "Registrar presupuesto"}
            </DialogTitle>
          </DialogHeader>
          {ordenActual.estado === "en_espera" ? (
            <div className="space-y-3 py-2">
              {ordenActual.presupuesto && (
                <div className="text-xs p-2 rounded" style={{ background: "var(--muted)" }}>
                  Presupuesto enviado: <strong>{ordenActual.presupuesto.monto.toLocaleString("es-PY")}₲</strong>
                  {ordenActual.presupuesto.descripcion && <> — {capitalizeWords(ordenActual.presupuesto.descripcion)}</>}
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" checked={conVariaciones} onChange={e => setConVariaciones(e.target.checked)}
                    className="rounded" style={{ accentColor: "var(--primary)" }} />
                  Aceptado con variaciones
                </label>
              </div>
              {conVariaciones && (
                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <Input placeholder="Ej. 200000" inputMode="numeric" value={variacionMonto}
                      onChange={e => setVariacionMonto(e.target.value.replace(/\D/g, ""))}
                      className="text-xs pr-8" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                    <span className="absolute right-3 text-xs font-semibold pointer-events-none" style={{ color: "var(--muted-foreground)" }}>₲</span>
                  </div>
                  <Textarea placeholder="Descripción de las variaciones" value={variacionDesc}
                    onChange={e => setVariacionDesc(e.target.value)}
                    className="text-xs h-16 resize-none" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button onClick={() => { handleRechazar(); setShowPresupuesto(false); }} className="text-xs flex-1"
                  style={{ background: "#DC2626", color: "white" }}>Rechazado</Button>
                <Button onClick={() => { handleAceptar(); setShowPresupuesto(false); }} className="text-xs flex-1"
                  style={{ background: "#059669", color: "white" }}>Aceptado</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="relative flex items-center">
                <Input placeholder="Ej. 200000" inputMode="numeric" value={presupuestoMonto}
                  onChange={e => setPresupuestoMonto(e.target.value.replace(/\D/g, ""))}
                  className="text-xs pr-8" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                <span className="absolute right-3 text-xs font-semibold pointer-events-none" style={{ color: "var(--muted-foreground)" }}>₲</span>
              </div>
              <Textarea placeholder="Descripción opcional" value={presupuestoDesc}
                onChange={e => setPresupuestoDesc(e.target.value)}
                className="text-xs h-16 resize-none" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
              <Button onClick={() => { handlePresupuestoSave(); setShowPresupuesto(false); }} className="text-xs w-full"
                style={{ background: "#7C3AED", color: "white" }}>Registrar presupuesto</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showFinalizacion} onOpenChange={setShowFinalizacion}>
        <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", maxWidth: 450 }}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Finalizar orden</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {piezas.map((p, i) => {
              const selected = state.stock.find(s => s.id === p.stockItemId);
              const sq = searchQueries[i] ?? "";
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Buscar producto en stock..."
                      value={sq}
                      onChange={e => setSearchQuery(i, e.target.value)}
                      className="w-full pl-2 pr-2 py-1.5 text-xs border outline-none"
                      style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                    {sq && (
                      <div className="absolute top-full left-0 right-0 z-10 max-h-32 overflow-y-auto border"
                        style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                        {state.stock.filter(s => s.name.toLowerCase().includes(sq.toLowerCase())).map(s => (
                          <button
                            key={s.id}
                            onClick={() => { setPieza(i, 'stockItemId', s.id); setSearchQuery(i, ""); }}
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                            style={{ color: "var(--foreground)" }}
                          >{s.name} <span className="text-muted-foreground">({s.stock} uds)</span></button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selected && (
                    <span className="text-[10px] shrink-0" style={{ color: "var(--muted-foreground)" }}>{selected.stock} disp.</span>
                  )}
                  <input
                    type="number"
                    min={1}
                    max={selected?.stock || 1}
                    value={p.quantity}
                    onChange={e => setPieza(i, 'quantity', Math.max(1, Math.min(selected?.stock || 99, Number(e.target.value))))}
                    className="w-14 text-xs py-1.5 text-center border"
                    style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                  {piezas.length > 1 && (
                    <button onClick={() => removePieza(i)} style={{ color: "#DC2626" }}><Trash2 size={14} /></button>
                  )}
                </div>
              );
            })}
            <button onClick={addPieza} className="text-xs text-primary hover:underline">+ Agregar pieza</button>
            <Button onClick={() => { handleFinalizar(); setShowFinalizacion(false); }} className="text-xs w-full"
              style={{ background: "#059669", color: "white" }}>Finalizar orden</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function OrdenesPage() {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [showReception, setShowReception] = useState(false);
  const [filter, setFilter] = useState("todas");
  const [q, setQ] = useState("");

  const filtered = state.orders.filter(o => {
    const matchEstado = filter === "todas" || o.estado === filter;
    const matchQ = !q
      || o.nombre_cliente.toLowerCase().includes(q.toLowerCase())
      || o.modelo.toLowerCase().includes(q.toLowerCase())
      || o.marca?.toLowerCase().includes(q.toLowerCase())
      || o.recepcionado_por.toLowerCase().includes(q.toLowerCase())
      || o.id.toLowerCase().includes(q.toLowerCase());
    return matchEstado && matchQ;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Órdenes de trabajo</h1>
        <button
          onClick={() => setShowReception(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all hover:opacity-90"
          style={{ background: "var(--primary)", color: "white" }}
        >
          <Plus size={14} /> Nueva recepción
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="px-3 py-1.5 text-xs font-medium transition-all border"
              style={{
                background: filter === f.value ? "var(--primary)" : "var(--card)",
                color: filter === f.value ? "white" : "var(--muted-foreground)",
                borderColor: filter === f.value ? "var(--primary)" : "var(--border)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              placeholder="Buscar..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs border outline-none focus:border-primary/60"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                width: 200,
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="border overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
              {["ID", "Cliente", "Equipo", "Estado", "Técnico", "Fecha"].map(h => (
                <th key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => (
              <tr
                key={o.id}
                onClick={() => navigate(`/ordenes/${o.id}`)}
                className="cursor-pointer transition-colors hover:bg-muted/40"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>
                    {o.id.slice(0, 8)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{capitalizeWords(o.nombre_cliente)}</div>
                  {o.numero_celular && (
                    <div className="text-[11px] font-mono mt-0.5" style={{ color: "var(--muted-foreground)" }}>{o.numero_celular}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs" style={{ color: "var(--foreground)" }}>{capitalizeWords(o.marca ?? "")} {capitalizeWords(o.modelo)}</div>
                  {o.categoria && <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{capitalizeWords(o.categoria)}</div>}
                </td>
                <td className="px-4 py-3"><EstadoBadge estado={o.estado} /></td>
                <td className="px-4 py-3">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{o.recepcionado_por}</span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {new Date(o.fecha_recepcion).toLocaleDateString("es-ES")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
            No se encontraron órdenes.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Mostrando {filtered.length} de {state.orders.length} órdenes
        </span>
      </div>

      <ReceptionModal open={showReception} onOpenChange={setShowReception} />
    </div>
  );
}
