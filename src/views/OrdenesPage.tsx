import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Search, Plus, X, Camera, Trash2, ArrowLeft, Calendar, Image as ImageIcon, Check } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { EstadoBadge, capitalizeWords, isOrdenEnTaller } from "@/app/helpers";
import { toast } from "@/app/Toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import type { OrdenTrabajo, Diagnostico, PiezaUtilizada } from "@/types";
import { ShutterPanel, DialogShutterBody, DialogScrollBody } from "@/app/components/ShutterPanel";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const TECNICOS = ["Oscar Gomez", "Orlando Moreno", "Marcos Franco"];

const FILTROS = [
  { value: "activas", label: "Activas" },
  { value: "todas", label: "Todas" },
  { value: "recepcionado", label: "Recepcionado" },
  { value: "diagnosticado", label: "Diagnosticado" },
  { value: "en_espera", label: "En espera" },
  { value: "en_proceso", label: "En proceso" },
  { value: "finalizado", label: "Finalizado" },
  { value: "entregado", label: "Entregado" },
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
  const [showEquipmentSearch, setShowEquipmentSearch] = useState(false);
  const [equipmentSearchId, setEquipmentSearchId] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<Set<string>>(new Set());

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

  const clientEquipments = lockedClient
    ? state.clienteEquipos
        .filter(ce => ce.cliente_ci === lockedClient.ci)
        .map(ce => state.equipos.find(e => e.id === ce.equipo_id))
        .filter(e => e !== undefined)
    : [];

  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setShowEquipmentSearch(false);
      setEquipmentSearchId("");
      setIsGalleryOpen(false);
      setSelectedGalleryIds(new Set());
      setIsSubmitting(false);
    }
  }, [open]);

  const receptionShutterKey = `${showEquipmentSearch}-${clientLocked}-${selectedEquipment}-${garantia}-${lockedClient?.ci ?? ""}-${clientEquipments.length}`;

  const removeFoto = (idx: number) => {
    // Note: Don't revoke URLs that come from dataUrls (gallery), only those from createObjectURL
    // In a full implementation we'd track the source, but for this demo we'll let GC handle it or just do it safely.
    setFotos(prev => prev.filter((_, i) => i !== idx));
  };

  const [isGalleryAdding, setIsGalleryAdding] = useState(false);

  const handleGallerySelection = async () => {
    setIsGalleryAdding(true);
    try {
      const selectedPhotos = state.galleryPhotos.filter(p => selectedGalleryIds.has(p.id));
      const newPhotosUrls = [];
      
      for (const p of selectedPhotos) {
        // Move file to 'used/' folder in Supabase so it hides from gallery, but keeps it in DB.
        const newUrl = await actions.markGalleryPhotoUsed(p.id);
        newPhotosUrls.push(newUrl);
      }
      
      setFotos(prev => [...prev, ...newPhotosUrls]);
      setIsGalleryOpen(false);
      setSelectedGalleryIds(new Set());
    } catch (e: any) {
      toast.error("Error al procesar las fotos: " + e.message);
    } finally {
      setIsGalleryAdding(false);
    }
  };

  const handleSave = async () => {
    if (!form.recepcionado_por || !form.nombre_cliente || !form.modelo) {
      toast.info("Completa los campos obligatorios (técnico, cliente, modelo)");
      return;
    }
    
    const isNew = selectedEquipment === "nuevo" || selectedEquipment === "";
    const equipoId = isNew ? undefined : selectedEquipment;
    const nuevoEquipoData = isNew ? {
      marca: form.marca,
      modelo: form.modelo,
      tipo: (form.categoria.toLowerCase() === "notebook" || form.categoria.toLowerCase() === "pc") ? form.categoria.toLowerCase() as any : "otro",
      notas: ""
    } : undefined;

    setIsSubmitting(true);
    try {
      await actions.createOrden({
        ...form,
        fotos,
        estado: "recepcionado",
        garantia,
        fecha_recepcion: new Date().toISOString(),
      }, equipoId, nuevoEquipoData);
      
      toast.success("Recepción registrada correctamente");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al registrar:", error);
      toast.error(`Error al registrar: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col gap-4" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-semibold">Recepción de equipo</DialogTitle>
        </DialogHeader>
        <DialogScrollBody>
        <div className="grid gap-4 py-1">
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
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="text-xs font-semibold mb-3 flex items-center justify-between" style={{ color: "var(--foreground)" }}>
              <span>Datos del equipo</span>
              <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted" onClick={() => setShowEquipmentSearch(!showEquipmentSearch)}>
                <Plus className={`h-4 w-4 transition-transform ${showEquipmentSearch ? 'rotate-45' : ''}`} />
              </Button>
            </div>

            {showEquipmentSearch && (
              <div className="mb-4 space-y-2 bg-muted/30 p-3 rounded-md border" style={{ borderColor: "var(--border)" }}>
                <Label className="text-xs">Buscar equipo por ID</Label>
                <div className="flex relative">
                  <Input 
                    placeholder="Escriba el ID completo (ej. MT-A1B2C3)..." 
                    className="text-xs uppercase" 
                    value={equipmentSearchId}
                    onChange={e => setEquipmentSearchId(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                    style={{ background: "var(--input)", borderColor: "var(--border)" }}
                  />
                </div>
                {equipmentSearchId.length > 0 && (() => {
                  const searchStr = equipmentSearchId;
                  const matchingEqs = state.equipos.filter(e => e.id.toUpperCase().includes(searchStr));
                  if (matchingEqs.length > 0) {
                    return (
                      <div className="mt-2 flex flex-col max-h-48 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
                        {matchingEqs.map(foundEq => (
                          <div
                            key={foundEq.id}
                            className="py-1.5 px-1 cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-2 uppercase"
                            onClick={() => {
                              setSelectedEquipment(foundEq.id);
                              setEquipmentLocked(true);
                              setForm(prev => ({ ...prev, marca: foundEq.marca, modelo: foundEq.modelo, categoria: foundEq.tipo === "otro" ? "" : (foundEq.tipo === "pc" ? "PC" : capitalizeWords(foundEq.tipo)) }));
                              setShowEquipmentSearch(false);
                              setEquipmentSearchId("");
                              toast.success("Equipo seleccionado");
                            }}
                          >
                            <span className="text-xs font-mono font-semibold text-primary shrink-0">{foundEq.id}</span>
                            <span className="text-xs text-foreground">{foundEq.marca} {foundEq.modelo}</span>
                            <span className="text-xs text-muted-foreground ml-auto shrink-0">{foundEq.tipo}</span>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    return (
                      <div className="mt-2 text-xs text-muted-foreground">
                        No se encontró ningún equipo que contenga "{equipmentSearchId}"
                      </div>
                    );
                  }
                })()}
              </div>
            )}

              {lockedClient && clientEquipments.length > 0 && (
                <div className="mb-3 flex items-end gap-4">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Equipo registrado</Label>
                    <Select value={selectedEquipment} onValueChange={id => {
                      setSelectedEquipment(id);
                      if (id === "nuevo") {
                        setEquipmentLocked(false);
                        setForm(prev => ({ ...prev, marca: "", modelo: "", categoria: "" }));
                      } else {
                        setEquipmentLocked(true);
                        const eq = state.equipos.find(e => e.id === id);
                        if (eq) {
                          setForm(prev => ({
                            ...prev,
                            marca: eq.marca,
                            modelo: eq.modelo,
                            categoria: eq.tipo === "otro" ? "" : (eq.tipo === "pc" ? "PC" : capitalizeWords(eq.tipo))
                          }));
                        }
                      }
                    }}>
                      <SelectTrigger className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }}>
                        <SelectValue placeholder="Seleccionar equipo existente o crear nuevo..." />
                      </SelectTrigger>
                      <SelectContent style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                        <SelectItem value="nuevo" className="text-xs font-semibold" style={{ color: "var(--primary)" }}>+ Registrar equipo nuevo</SelectItem>
                        {clientEquipments.map(eq => eq ? (
                          <SelectItem key={eq.id} value={eq.id} className="text-xs">
                            {eq.marca} {eq.modelo} <span className="text-[10px] text-muted-foreground ml-2">({eq.id})</span>
                          </SelectItem>
                        ) : null)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={`flex items-center gap-2 h-9 pb-1 shrink-0 ${selectedEquipment && selectedEquipment !== "nuevo" ? "" : "hidden"}`}>
                    <input type="checkbox" id="garantia" checked={garantia}
                      onChange={e => setGarantia(e.target.checked)}
                      className="size-4 accent-[var(--primary)] cursor-pointer" />
                    <Label htmlFor="garantia" className="text-xs cursor-pointer">Garantía</Label>
                  </div>
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
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <button onClick={() => setIsGalleryOpen(true)}
                  className="size-16 border rounded flex items-center justify-center hover:bg-muted/40 transition-colors"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                  <Camera size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
        </DialogScrollBody>
        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} style={{ borderColor: "var(--border)" }}>Cancelar</Button>
          <Button onClick={handleSave} style={{ background: "var(--primary)", color: "var(--primary-foreground)" }} isLoading={isSubmitting}>
            Guardar recepción
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="sm:max-w-[500px] flex flex-col gap-4" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Seleccionar fotos de la galería</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {state.galleryPhotos.map(photo => {
              const isSelected = selectedGalleryIds.has(photo.id);
              return (
                <div 
                  key={photo.id} 
                  className={`relative aspect-square rounded border cursor-pointer overflow-hidden ${isSelected ? "ring-2 ring-primary border-primary" : "border-border"}`}
                  onClick={() => {
                    const newSet = new Set(selectedGalleryIds);
                    if (isSelected) newSet.delete(photo.id);
                    else newSet.add(photo.id);
                    setSelectedGalleryIds(newSet);
                  }}
                >
                  <img src={photo.dataUrl} className="w-full h-full object-cover" alt="" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-white rounded-full p-1">
                        <Check size={16} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGalleryOpen(false)} className="text-xs">Cancelar</Button>
            <Button onClick={handleGallerySelection} disabled={selectedGalleryIds.size === 0} className="text-xs" isLoading={isGalleryAdding}>
              Añadir {selectedGalleryIds.size > 0 ? `(${selectedGalleryIds.size})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function DiagnosticoModal({ open, onOpenChange, onSave, esNotebook, garantia, isLoading }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (d: Diagnostico) => void;
  esNotebook: boolean;
  garantia?: boolean;
  isLoading?: boolean;
}) {
  const [form, setForm] = useState<Diagnostico>({
    procesador: "", memoria_ram: "", grafica: "", almacenamientos: [{ nombre: "", capacidad: "", letra: "", estado: "" }],
    usuario_nombre: "", usuario_informacion: "", pico_estres_cpu: "", pico_estres_gpu: "",
    bateria: "", medicion_pila: "", estado_bateria: "", fuente_potencia: "", fuente_marca: "", observaciones: "", solucion_propuesta: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        procesador: "", memoria_ram: "", grafica: "", almacenamientos: [{ nombre: "", capacidad: "", letra: "", estado: "" }],
        usuario_nombre: "", usuario_informacion: "", pico_estres_cpu: "", pico_estres_gpu: "",
        bateria: "", medicion_pila: "", estado_bateria: "", fuente_potencia: "", fuente_marca: "", observaciones: "", solucion_propuesta: "",
      });
    }
  }, [open]);

  const addAlmacenamiento = () => setForm({ ...form, almacenamientos: [...form.almacenamientos, { nombre: "", capacidad: "", letra: "", estado: "" }] });
  const removeAlmacenamiento = (i: number) => setForm({ ...form, almacenamientos: form.almacenamientos.filter((_, idx) => idx !== i) });
  const setAlmacenamiento = (i: number, field: 'nombre' | 'capacidad' | 'letra' | 'estado', value: string) => {
    const updated = form.almacenamientos.map((a, idx) => idx === i ? { ...a, [field]: value } : a);
    setForm({ ...form, almacenamientos: updated });
  };

  const diagShutterKey = `${garantia}-${esNotebook}-${form.almacenamientos.length}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col gap-4" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-semibold">{garantia ? "Diagnóstico (Garantía)" : "Diagnóstico técnico"}</DialogTitle>
        </DialogHeader>
        <DialogScrollBody>
        <div className="grid gap-4 py-1">
          {!garantia && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Procesador</Label>
                  <Input placeholder="Ej. Intel i5-1240P"
                    value={form.procesador} onChange={e => setForm({ ...form, procesador: e.target.value })}
                    className="text-xs capitalize" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Memoria RAM</Label>
                  <Input placeholder="Ej. 16GB DDR5"
                    value={form.memoria_ram} onChange={e => setForm({ ...form, memoria_ram: e.target.value })}
                    className="text-xs uppercase" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Gráfica</Label>
                  <Input placeholder="Ej. RTX 3060"
                    value={form.grafica} onChange={e => setForm({ ...form, grafica: e.target.value })}
                    className="text-xs uppercase" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Almacenamiento/s</Label>
                  <button type="button" onClick={addAlmacenamiento} className="text-xs text-primary hover:underline cursor-pointer">+ Agregar</button>
                </div>
                {form.almacenamientos.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input placeholder="Nombre"
                      value={a.nombre} onChange={e => setAlmacenamiento(i, 'nombre', e.target.value)}
                      className="text-xs flex-1 uppercase" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                    <Input placeholder="Capacidad"
                      value={a.capacidad || ""} onChange={e => setAlmacenamiento(i, 'capacidad', e.target.value)}
                      className="text-xs w-20 uppercase" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                    <Input placeholder="Letra"
                      value={a.letra || ""} onChange={e => setAlmacenamiento(i, 'letra', e.target.value)}
                      className="text-xs w-16 uppercase" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                    <Input placeholder="Estado"
                      value={a.estado} onChange={e => setAlmacenamiento(i, 'estado', e.target.value)}
                      className="text-xs w-24 capitalize" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                    {form.almacenamientos.length > 1 && (
                      <button onClick={() => removeAlmacenamiento(i)} style={{ color: "#DC2626" }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Usuario</Label>
                  <Input placeholder="Nombre"
                    value={form.usuario_nombre} onChange={e => setForm({ ...form, usuario_nombre: e.target.value })}
                    className="text-xs capitalize" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Información almacenada</Label>
                  <Input placeholder="Cantidad aprox."
                    value={form.usuario_informacion} onChange={e => setForm({ ...form, usuario_informacion: e.target.value })}
                    className="text-xs capitalize" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Pico de estrés CPU</Label>
                  <Input placeholder="Ej. 85°C"
                    value={form.pico_estres_cpu} onChange={e => setForm({ ...form, pico_estres_cpu: e.target.value })}
                    className="text-xs uppercase" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Pico de estrés GPU</Label>
                  <Input placeholder="Ej. 78°C"
                    value={form.pico_estres_gpu} onChange={e => setForm({ ...form, pico_estres_gpu: e.target.value })}
                    className="text-xs uppercase" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Medición de pila</Label>
                  <Input placeholder="Ej. 3.0V"
                    value={form.medicion_pila || ""} onChange={e => setForm({ ...form, medicion_pila: e.target.value })}
                    className="text-xs uppercase" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                </div>
                {esNotebook ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Estado de batería</Label>
                    <Input placeholder="Ej. Bueno, 80%"
                      value={form.estado_bateria || form.bateria || ""} onChange={e => setForm({ ...form, estado_bateria: e.target.value, bateria: e.target.value })}
                      className="text-xs capitalize" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fuente (Marca)</Label>
                    <Input placeholder="Ej. Corsair"
                      value={form.fuente_marca || ""} onChange={e => setForm({ ...form, fuente_marca: e.target.value })}
                      className="text-xs capitalize" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                  </div>
                )}
              </div>

              {!esNotebook && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fuente (Potencia)</Label>
                    <Input placeholder="Ej. 650W"
                      value={form.fuente_potencia || ""} onChange={e => setForm({ ...form, fuente_potencia: e.target.value })}
                      className="text-xs uppercase" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Observaciones</Label>
            <Textarea placeholder="Observaciones adicionales..."
              value={form.observaciones || ""} onChange={e => setForm({ ...form, observaciones: e.target.value })}
              className="text-xs h-16 resize-none" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{garantia ? "Descripción del problema y solución aplicada" : "Solución propuesta"}</Label>
            <Textarea placeholder="Describe la solución recomendada..."
              value={form.solucion_propuesta} onChange={e => setForm({ ...form, solucion_propuesta: e.target.value })}
              className="text-xs h-20 resize-none" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
          </div>
        </div>
        </DialogScrollBody>
        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            Cancelar
          </Button>
          <Button onClick={() => { 
            const formToSave = {
              ...form,
              almacenamientos: form.almacenamientos.map(a => {
                let cleanLetra = (a.letra || "").replace(/[^A-Za-z]/g, "").toUpperCase();
                return { ...a, letra: cleanLetra ? `(:${cleanLetra})` : "" };
              })
            };
            onSave(formToSave); 
            onOpenChange(false); 
          }} className="text-xs" style={{ background: "var(--primary)", color: "white" }} isLoading={isLoading}>
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
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showFinalizacion, setShowFinalizacion] = useState(false);
  const [presupuestoMonto, setPresupuestoMonto] = useState("");
  const [presupuestoDesc, setPresupuestoDesc] = useState("");
  const [conVariaciones, setConVariaciones] = useState(false);
  const [variacionMonto, setVariacionMonto] = useState("");
  const [variacionDesc, setVariacionDesc] = useState("");
  const [piezas, setPiezas] = useState<PiezaUtilizada[]>([{ stockItemId: "", quantity: 1, reemplazaA: "" }]);
  const [searchQueries, setSearchQueries] = useState<string[]>([""]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const diagOptions = useMemo(() => {
    if (!ordenActual?.diagnostico) return [];
    const d = ordenActual.diagnostico;
    const opts = [];
    if (d.procesador) opts.push(`CPU: ${d.procesador}`);
    if (d.memoria_ram) opts.push(`RAM: ${d.memoria_ram}`);
    if (d.grafica) opts.push(`GPU: ${d.grafica}`);
    if (d.estado_bateria || d.bateria) opts.push(`Batería`);
    if (d.medicion_pila) opts.push(`Pila`);
    if (d.fuente_potencia || d.fuente_marca) opts.push(`Fuente`);
    d.almacenamientos.forEach(a => {
      if (a.nombre) opts.push(`Almacenamiento: ${a.nombre}`);
    });
    return opts;
  }, [ordenActual?.diagnostico]);

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
      setPiezas([{ stockItemId: "", quantity: 1, reemplazaA: "" }]);
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
    setIsSubmitting(true);
    try {
      await actions.updateOrden(ordenActual.id, {
        diagnostico: diag,
        estado: ordenActual.garantia ? "en_proceso" : "diagnosticado",
      });
      toast.success(ordenActual.garantia ? "Diagnóstico guardado" : "Diagnóstico guardado, estado actualizado a diagnosticado");
    } finally { setIsSubmitting(false); }
  };

  const handlePresupuestoSave = async () => {
    const monto = Number(presupuestoMonto);
    if (!monto) { toast.info("Ingresa un monto de presupuesto"); return; }
    setIsSubmitting(true);
    try {
      await actions.updateOrden(ordenActual.id, {
        presupuesto: { monto, descripcion: presupuestoDesc },
        estado: "en_espera",
      });
      toast.success("Presupuesto enviado");
    } finally { setIsSubmitting(false); }
  };

  const handleRechazar = async () => {
    setIsSubmitting(true);
    try {
      await actions.updateOrden(ordenActual.id, {
        respuesta_cliente: "rechazado",
        estado: "rechazado",
      });
      toast.success("Orden rechazada por el cliente");
    } finally { setIsSubmitting(false); }
  };

  const handleAceptar = async () => {
    const presupuestoOriginal = ordenActual.presupuesto;
    if (!presupuestoOriginal) return;
    const aceptado = conVariaciones
      ? { monto: Number(variacionMonto), descripcion: variacionDesc }
      : { monto: presupuestoOriginal.monto, descripcion: presupuestoOriginal.descripcion };
    if (conVariaciones && !Number(variacionMonto)) { toast.info("Ingresa el nuevo monto acordado"); return; }
    
    setIsSubmitting(true);
    try {
      await actions.updateOrden(ordenActual.id, {
        respuesta_cliente: "aceptado",
        presupuesto_aceptado: aceptado,
        estado: "en_proceso",
      });
      toast.success("Presupuesto aceptado, orden en proceso");
    } finally { setIsSubmitting(false); }
  };

  const addPieza = () => setPiezas([...piezas, { stockItemId: "", quantity: 1, reemplazaA: "" }]);
  const removePieza = (i: number) => setPiezas(piezas.filter((_, idx) => idx !== i));
  const setPieza = (i: number, field: 'stockItemId' | 'quantity' | 'reemplazaA', value: string | number) => {
    setPiezas(piezas.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const handleFinalizar = async () => {
    setIsSubmitting(true);
    try {
      await actions.finalizarOrden(ordenActual.id, piezas.filter(p => p.stockItemId));
      toast.success("Orden finalizada correctamente");
    } finally { setIsSubmitting(false); }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
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
          {ordenActual.falla_segun_cliente && (<div className="col-span-2"><span className="text-muted-foreground">Falla según cliente:</span><p className="mt-1 leading-relaxed" style={{ color: "var(--foreground)" }}>{capitalizeWords(ordenActual.falla_segun_cliente)}</p></div>)}
          {ordenActual.solicitud_adicional && (<div className="col-span-2"><span className="text-muted-foreground">Solicitud adicional:</span><p className="mt-1 leading-relaxed" style={{ color: "var(--foreground)" }}>{capitalizeWords(ordenActual.solicitud_adicional)}</p></div>)}
          {ordenActual.fotos.length > 0 && (<div className="col-span-2"><span className="text-muted-foreground">Fotos:</span><div className="flex flex-wrap gap-2 mt-1">{ordenActual.fotos.map((url, i) => (<img key={i} src={url} alt="" onClick={() => { setPhotoIndex(i); setPhotoOpen(true); }} className="size-20 object-cover border rounded cursor-pointer hover:opacity-80 transition-opacity" style={{ borderColor: "var(--border)" }} />))}</div></div>)}
        </div>
      );
      case 1: {
        if (!ordenActual.diagnostico) {
          return (<div><Button onClick={() => setShowDiagnostico(true)} className="text-xs" style={{ background: "#2563EB", color: "white" }}>{ordenActual.garantia ? "Realizar diagnóstico (Garantía)" : "Realizar diagnóstico"}</Button></div>);
        }
        return (
          <div className="text-xs space-y-3">
            {!ordenActual.garantia && (<><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2"><div><span className="text-muted-foreground">CPU:</span> <span className="font-medium ml-1">{capitalizeWords(ordenActual.diagnostico.procesador)}</span></div><div><span className="text-muted-foreground">RAM:</span> <span className="font-medium ml-1">{capitalizeWords(ordenActual.diagnostico.memoria_ram)}</span></div><div><span className="text-muted-foreground">GPU:</span> <span className="font-medium ml-1">{capitalizeWords(ordenActual.diagnostico.grafica)}</span></div><div><span className="text-muted-foreground">Batería:</span> <span className="font-medium ml-1">{capitalizeWords(ordenActual.diagnostico.estado_bateria || ordenActual.diagnostico.bateria || "—")}</span></div><div><span className="text-muted-foreground">Pila:</span> <span className="font-medium ml-1">{ordenActual.diagnostico.medicion_pila || "—"}</span></div><div><span className="text-muted-foreground">Fuente:</span> <span className="font-medium ml-1">{[ordenActual.diagnostico.fuente_potencia, ordenActual.diagnostico.fuente_marca].filter(Boolean).map(capitalizeWords).join(" - ") || "—"}</span></div></div>{ordenActual.diagnostico.almacenamientos.length > 0 && (<div className="border-t pt-2" style={{ borderColor: "var(--border)" }}><span className="text-muted-foreground">Almacenamiento:</span><div className="mt-1 space-y-1">{ordenActual.diagnostico.almacenamientos.map((a, i) => (<div key={i} className="flex items-center gap-2 ml-2"><span className="font-medium">{capitalizeWords(a.nombre)} {a.capacidad ? `(${a.capacidad})` : ""} {a.letra || ""}</span><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: a.estado.toLowerCase() === "bien" ? "rgba(5,150,105,0.1)" : "rgba(217,119,6,0.1)", color: a.estado.toLowerCase() === "bien" ? "#059669" : "#D97706" }}>{capitalizeWords(a.estado)}</span></div>))}</div></div>)}<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 border-t pt-2" style={{ borderColor: "var(--border)" }}><div><span className="text-muted-foreground">Usuario:</span> <span className="font-medium ml-1">{ordenActual.diagnostico.usuario_nombre}</span></div><div><span className="text-muted-foreground">Información:</span> <span className="font-medium ml-1">{ordenActual.diagnostico.usuario_informacion}</span></div><div><span className="text-muted-foreground">Pico estrés CPU:</span> <span className="font-medium ml-1">{ordenActual.diagnostico.pico_estres_cpu}</span></div><div><span className="text-muted-foreground">Pico estrés GPU:</span> <span className="font-medium ml-1">{ordenActual.diagnostico.pico_estres_gpu}</span></div></div></>)}
            {ordenActual.diagnostico.observaciones && (<div className="border-t pt-2" style={{ borderColor: "var(--border)" }}><span className="text-muted-foreground">Observaciones:</span><p className="mt-1 leading-relaxed" style={{ color: "var(--foreground)" }}>{capitalizeWords(ordenActual.diagnostico.observaciones)}</p></div>)}
            <div className={`${ordenActual.garantia ? "" : "border-t pt-2"} p-3 rounded`} style={Object.assign({ background: "rgba(0,71,171,0.04)" }, ordenActual.garantia ? {} : { borderColor: "var(--border)" })}>
              <span className="font-semibold" style={{ color: "var(--primary)" }}>{ordenActual.garantia ? "Descripción y solución aplicada" : "Solución propuesta"}</span>
              <p className="mt-1.5 leading-relaxed" style={{ color: "var(--foreground)" }}>{capitalizeWords(ordenActual.diagnostico.solucion_propuesta)}</p>
            </div>
            {ordenActual.garantia && ordenActual.estado === "en_proceso" && (<Button onClick={() => { actions.finalizarOrden(ordenActual.id, []); }} className="text-xs w-full" style={{ background: "#059669", color: "white" }}>Finalizado</Button>)}
            {ordenActual.garantia && ordenActual.estado === "finalizado" && (<div className="flex items-center justify-center gap-2 p-4 rounded border" style={{ background: "rgba(5,150,105,0.06)", borderColor: "rgba(5,150,105,0.25)" }}><svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg><span className="text-sm font-semibold" style={{ color: "#059669" }}>Equipo finalizado</span></div>)}
          </div>
        );
      }
      case 2: {
        if (ordenActual.presupuesto || ordenActual.estado === "en_espera" || ordenActual.estado === "finalizado" || ordenActual.estado === "rechazado" || ordenActual.estado === "entregado") {
          return (
            <div className="text-xs space-y-2">
              {ordenActual.presupuesto && (<div className="p-2 rounded" style={{ background: "var(--muted)" }}>Presupuesto enviado: <strong>{ordenActual.presupuesto.monto.toLocaleString("es-PY")}₲</strong>{ordenActual.presupuesto.descripcion && <> — {capitalizeWords(ordenActual.presupuesto.descripcion)}</>}</div>)}
              {ordenActual.respuesta_cliente && (<div className="flex items-center gap-1.5 py-1 px-2"><span className="text-muted-foreground">Respuesta cliente:</span><span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide" style={{ background: ordenActual.respuesta_cliente === "aceptado" ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)", color: ordenActual.respuesta_cliente === "aceptado" ? "#059669" : "#DC2626" }}>{ordenActual.respuesta_cliente === "aceptado" ? "ACEPTADO" : "RECHAZADO"}</span></div>)}
              {ordenActual.presupuesto_aceptado && (<div className="p-2 rounded" style={{ background: "var(--muted)" }}>Presupuesto aceptado: <strong>{ordenActual.presupuesto_aceptado.monto.toLocaleString("es-PY")}₲</strong>{ordenActual.presupuesto_aceptado.descripcion && <> — {capitalizeWords(ordenActual.presupuesto_aceptado.descripcion)}</>}</div>)}
              {ordenActual.estado === "en_espera" && (<Button onClick={() => setShowPresupuesto(true)} className="text-xs" style={{ background: "#7C3AED", color: "white" }}>Responder presupuesto</Button>)}
            </div>
          );
        }
        return (<div><Button onClick={() => setShowPresupuesto(true)} className="text-xs" style={{ background: "#7C3AED", color: "white" }}>Registrar presupuesto</Button></div>);
      }
      case 3: {
        if (ordenActual.estado === "finalizado" || ordenActual.estado === "entregado" || ordenActual.estado === "rechazado") {
          return (
            <div className="text-xs space-y-2">
              {ordenActual.respuesta_cliente && (<div className="flex items-center gap-1.5 py-1"><span className="text-muted-foreground">Respuesta cliente:</span><span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide" style={{ background: ordenActual.respuesta_cliente === "aceptado" ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)", color: ordenActual.respuesta_cliente === "aceptado" ? "#059669" : "#DC2626" }}>{ordenActual.respuesta_cliente === "aceptado" ? "ACEPTADO" : "RECHAZADO"}</span></div>)}
              {ordenActual.presupuesto_aceptado && (<div className="p-2 rounded mt-2" style={{ background: "var(--muted)" }}>Presupuesto aceptado: <strong>{ordenActual.presupuesto_aceptado.monto.toLocaleString("es-PY")}₲</strong>{ordenActual.presupuesto_aceptado.descripcion && <> — {capitalizeWords(ordenActual.presupuesto_aceptado.descripcion)}</>}</div>)}
              {ordenActual.piezas_utilizadas && ordenActual.piezas_utilizadas.length > 0 && (<div className="border-t pt-2 mt-2" style={{ borderColor: "var(--border)" }}><span className="text-muted-foreground font-medium mb-1.5 block">Piezas utilizadas:</span><div className="space-y-1.5 ml-1">{ordenActual.piezas_utilizadas.map((p, i) => { const stockItem = state.stock.find(s => s.id === p.stockItemId); const itemName = (stockItem?.name ?? p.stockItemId).toUpperCase(); return (<div key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--primary)" }}></div><span className="font-semibold">{itemName}</span><span className="text-muted-foreground">({p.quantity} UD{p.quantity > 1 ? "S" : ""})</span>{p.reemplazaA && <span className="text-[10px] px-1.5 py-0.5 rounded ml-1" style={{ background: "rgba(0,71,171,0.1)", color: "var(--primary)" }}>Reemplaza: {p.reemplazaA.toUpperCase()}</span>}</div>); })}</div></div>)}
            </div>
          );
        }
        return (<div><Button onClick={() => setShowFinalizacion(true)} className="text-xs" style={{ background: "#059669", color: "white" }}>Agregar piezas y finalizar</Button></div>);
      }
      default: return null;
    }
  };

  const handleEntregar = async () => {
    if (ordenActual.estado !== "finalizado") return;
    setIsSubmitting(true);
    try {
      await actions.updateOrden(ordenActual.id, { estado: "entregado" });
      toast.success("Equipo marcado como entregado");
    } finally { setIsSubmitting(false); }
  };

  // Resolve linked client and equipo for the sidebar
  const linkedEquipo = ordenActual.equipo_id ? state.equipos.find(e => e.id === ordenActual.equipo_id) : null;
  const linkedClient = ordenActual.ci ? state.clients.find(c => c.ci === ordenActual.ci) : null;

  return (
    <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "var(--background)" }}>

      {/* Top bar: back button */}
      <div className="px-6 pt-5 pb-2 flex justify-between items-center">
        <button type="button" onClick={() => navigate("/ordenes")}
          className="flex items-center gap-1.5 text-xs transition-colors hover:text-primary cursor-pointer"
          style={{ color: "var(--muted-foreground)" }}>
          <ArrowLeft size={13} /> Volver a órdenes
        </button>
        
        <button type="button" onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1.5 text-xs transition-colors cursor-pointer opacity-70 hover:opacity-100"
          style={{ color: "#DC2626" }}>
          <Trash2 size={13} /> Eliminar orden
        </button>
      </div>

      {/* Main: left (problema + proceso) | right (cliente, equipo, orden) */}
      <div className="flex flex-1 gap-6 px-6 pb-6 min-h-0 overflow-hidden">

        {/* Left: problema reportado + flujo de trabajo */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">
          <div
            className="rounded border p-4 shrink-0"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              borderLeft: "3px solid var(--primary)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <div className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "var(--primary)" }}>
              Problema reportado
            </div>
            <div className="text-base font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
              {ordenActual.falla_segun_cliente
                ? capitalizeWords(ordenActual.falla_segun_cliente)
                : "Sin descripción de falla"}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div
              className="rounded border overflow-hidden"
              style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              <div className="flex items-center gap-0 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
                {steps.map((s, i) => (
                  <button
                    key={s.key}
                    onClick={() => setStep(i)}
                    className="px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer"
                    style={{
                      color: i === step ? "var(--primary)" : "var(--muted-foreground)",
                      background: "transparent",
                      outline: "none",
                      border: "none",
                      borderBottom: i === step ? "2px solid var(--primary)" : "2px solid transparent",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <ShutterPanel panelKey={step}>
                <div className="p-5">{renderStep()}</div>
              </ShutterPanel>
            </div>
          </div>
        </div>

        {/* Right: cliente, equipo y orden */}
        <div className="w-[340px] shrink-0 overflow-y-auto space-y-3">

          <div className="rounded border p-4 space-y-2" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--muted-foreground)" }}>Cliente</div>
            <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {linkedClient ? linkedClient.name : capitalizeWords(ordenActual.nombre_cliente)}
            </div>
            <div className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>CI: {ordenActual.ci || "—"}</div>
            {ordenActual.numero_celular && (
              <div className="text-xs flex items-center gap-1.5" style={{ color: "var(--foreground)" }}>
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 11 19.79 19.79 0 0 1 1.07 2.35 2 2 0 0 1 3.04.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 14.92v2z"/></svg>
                {ordenActual.numero_celular}
              </div>
            )}
          </div>

          {/* Equipment card */}
          <div className="rounded border p-4 space-y-2.5" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--muted-foreground)" }}>Equipo</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span style={{ color: "var(--muted-foreground)" }}>Marca</span>
                <span className="font-medium text-right" style={{ color: "var(--foreground)" }}>{capitalizeWords(ordenActual.marca || "—")}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span style={{ color: "var(--muted-foreground)" }}>Modelo</span>
                <span className="font-medium text-right" style={{ color: "var(--foreground)" }}>{capitalizeWords(ordenActual.modelo)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span style={{ color: "var(--muted-foreground)" }}>ID</span>
                <span className="font-mono font-semibold" style={{ color: "var(--primary)" }}>
                  {linkedEquipo?.id || ordenActual.equipo_id || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Order card + entrega */}
          <div className="rounded border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <div className="p-4 space-y-2.5">
              <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--muted-foreground)" }}>Orden</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span style={{ color: "var(--muted-foreground)" }}>Número</span>
                  <span className="font-mono font-semibold" style={{ color: "var(--primary)" }}>#{ordenActual.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span style={{ color: "var(--muted-foreground)" }}>Fecha ingreso</span>
                  <span style={{ color: "var(--foreground)" }}>{new Date(ordenActual.fecha_recepcion).toLocaleDateString("es-ES")}</span>
                </div>
                <div className="flex justify-between gap-2 items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Estado</span>
                  <EstadoBadge estado={ordenActual.estado} />
                </div>
              </div>
            </div>
            {ordenActual.estado === "finalizado" && (
              <button
                type="button"
                onClick={handleEntregar}
                className="w-full py-2.5 text-sm font-semibold border-t transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: "var(--primary)", color: "white", borderColor: "var(--border)" }}
              >
                Marcar como entregado
              </button>
            )}
            {ordenActual.estado === "entregado" && (
              <div
                className="flex items-center justify-center gap-2 py-2.5 border-t text-sm font-semibold"
                style={{ background: "rgba(8,145,178,0.06)", borderColor: "rgba(8,145,178,0.25)", color: "#0891B2" }}
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Equipo entregado
              </div>
            )}
            {ordenActual.estado === "rechazado" && (
              <label
                className={`flex items-center justify-center gap-2 py-3 border-t text-sm font-semibold transition-colors ${ordenActual.equipo_retirado ? "cursor-default" : "cursor-pointer hover:bg-muted/50"}`}
                style={{ 
                  background: ordenActual.equipo_retirado ? "rgba(220,38,38,0.04)" : "transparent", 
                  borderColor: "var(--border)", 
                  color: ordenActual.equipo_retirado ? "#DC2626" : "var(--foreground)",
                  opacity: ordenActual.equipo_retirado ? 0.9 : 1
                }}
              >
                <input
                  type="checkbox"
                  checked={!!ordenActual.equipo_retirado}
                  disabled={!!ordenActual.equipo_retirado}
                  onChange={async (e) => {
                    if (ordenActual.equipo_retirado) return;
                    await actions.updateOrden(ordenActual.id, { equipo_retirado: true });
                    toast.success("Equipo marcado como devuelto al cliente");
                  }}
                  className={`rounded w-4 h-4 ${ordenActual.equipo_retirado ? "cursor-default" : "cursor-pointer"}`}
                  style={{ accentColor: "#DC2626" }}
                />
                {ordenActual.equipo_retirado ? "Equipo devuelto al cliente" : "Marcar como devuelto al cliente"}
              </label>
            )}
          </div>
        </div>
      </div>

      <DiagnosticoModal
        open={showDiagnostico}
        onOpenChange={setShowDiagnostico}
        onSave={handleDiagnosticoSave}
        esNotebook={esNotebook}
        garantia={ordenActual.garantia}
        isLoading={isSubmitting}
      />

      <Dialog open={showPresupuesto} onOpenChange={setShowPresupuesto}>
        <DialogContent className="overflow-hidden flex flex-col gap-4" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", maxWidth: 450 }}>
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-base font-semibold">
              {ordenActual.estado === "en_espera" ? "Responder presupuesto" : "Registrar presupuesto"}
            </DialogTitle>
          </DialogHeader>
          <DialogShutterBody panelKey={ordenActual.estado === "en_espera" ? `resp-${conVariaciones}` : "reg"} scrollClassName="py-1">
          {ordenActual.estado === "en_espera" ? (
            <div className="space-y-3">
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
                  style={{ background: "#DC2626", color: "white" }} isLoading={isSubmitting}>Rechazado</Button>
                <Button onClick={() => { handleAceptar(); setShowPresupuesto(false); }} className="text-xs flex-1"
                  style={{ background: "#059669", color: "white" }} isLoading={isSubmitting}>Aceptado</Button>
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
                style={{ background: "#7C3AED", color: "white" }} isLoading={isSubmitting}>Registrar presupuesto</Button>
            </div>
          )}
          </DialogShutterBody>
        </DialogContent>
      </Dialog>

      <Dialog open={showFinalizacion} onOpenChange={setShowFinalizacion}>
        <DialogContent className="overflow-hidden flex flex-col gap-4" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", maxWidth: 450 }}>
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-base font-semibold">Finalizar orden</DialogTitle>
          </DialogHeader>
          <DialogShutterBody panelKey={`fin-${piezas.length}`} scrollClassName="py-1">
          <div className="space-y-3">
            {piezas.map((p, i) => {
              const selected = state.stock.find(s => s.id === p.stockItemId);
              const sq = searchQueries[i] ?? (selected?.name || "");
              return (
                <div key={i} className="border p-2 rounded flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Buscar producto en stock..."
                        value={sq}
                        onChange={e => {
                          setSearchQuery(i, e.target.value);
                          if (p.stockItemId) setPieza(i, 'stockItemId', "");
                        }}
                        className="w-full pl-2 pr-2 py-1.5 text-xs border outline-none"
                        style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }}
                      />
                      {sq && !p.stockItemId && (
                        <div className="absolute top-full left-0 right-0 z-10 max-h-32 overflow-y-auto border"
                          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                          {state.stock.filter(s => s.name.toLowerCase().includes(sq.toLowerCase())).map(s => (
                            <button
                              key={s.id}
                              onClick={() => { setPieza(i, 'stockItemId', s.id); setSearchQuery(i, s.name.toUpperCase()); }}
                              className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted transition-colors font-medium"
                              style={{ color: "var(--foreground)" }}
                            >{s.name.toUpperCase()} <span className="text-muted-foreground font-normal">({s.stock} ud{s.stock !== 1 ? "s" : ""})</span></button>
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
                  {diagOptions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] w-16" style={{ color: "var(--muted-foreground)" }}>Reemplaza:</span>
                      <Select value={p.reemplazaA || "ninguno"} onValueChange={v => setPieza(i, 'reemplazaA', v === "ninguno" ? "" : v)}>
                        <SelectTrigger className="h-7 text-[10px] flex-1" style={{ background: "var(--input)", borderColor: "var(--border)" }}>
                          <SelectValue placeholder="Opcional..." />
                        </SelectTrigger>
                        <SelectContent style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                          <SelectItem value="ninguno" className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Ninguno</SelectItem>
                          {diagOptions.map(opt => (
                            <SelectItem key={opt} value={opt} className="text-[10px]">{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={addPieza} className="text-xs text-primary hover:underline cursor-pointer">+ Agregar pieza</button>
            <Button onClick={() => { handleFinalizar(); setShowFinalizacion(false); }} className="text-xs w-full"
              style={{ background: "#059669", color: "white" }} isLoading={isSubmitting}>Finalizar orden</Button>
          </div>
          </DialogShutterBody>
        </DialogContent>
      </Dialog>
      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-w-4xl p-1 bg-black/95 border-none" style={{ color: "white" }}>
          <DialogHeader className="sr-only">
            <DialogTitle>Visor de Fotos</DialogTitle>
          </DialogHeader>
          {ordenActual.fotos[photoIndex] && (
            <div className="relative flex items-center justify-center h-[80vh] w-full">
              <img src={ordenActual.fotos[photoIndex]} alt="" className="max-w-full max-h-full object-contain" />
              {ordenActual.fotos.length > 1 && (
                <>
                  <button type="button" onClick={() => setPhotoIndex((photoIndex - 1 + ordenActual.fotos.length) % ordenActual.fotos.length)} className="absolute left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors cursor-pointer backdrop-blur-sm">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button type="button" onClick={() => setPhotoIndex((photoIndex + 1) % ordenActual.fotos.length)} className="absolute right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors cursor-pointer backdrop-blur-sm">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 size={18} /> Confirmar eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm" style={{ color: "var(--foreground)" }}>
              ¿Estás seguro de que quieres eliminar esta orden de trabajo?
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
              Esta acción no se puede deshacer y los datos se borrarán permanentemente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} style={{ borderColor: "var(--border)" }}>Cancelar</Button>
            <Button style={{ background: "#DC2626", color: "white" }} isLoading={isSubmitting} onClick={async () => {
              setIsSubmitting(true);
              try {
                await actions.deleteOrden(ordenActual.id);
                toast.success("Orden eliminada correctamente");
                navigate("/ordenes");
              } catch (err: any) {
                toast.error("Error al eliminar: " + err.message);
              } finally {
                setIsSubmitting(false);
                setShowDeleteConfirm(false);
              }
            }}>Sí, eliminar orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



export function OrdenesPage() {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  const [showReception, setShowReception] = useState(false);
  const [filter, setFilter] = useState("activas");
  const [q, setQ] = useState("");

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    state.orders.forEach(o => {
      if (o.fecha_recepcion) months.add(o.fecha_recepcion.slice(0, 7));
      if (o.fecha_entrega) months.add(o.fecha_entrega.slice(0, 7));
    });
    const current = new Date().toISOString().slice(0, 7);
    months.add(current);
    return Array.from(months).sort().reverse();
  }, [state.orders]);

  const filtered = state.orders.filter(o => {
    const matchMonth = state.globalMonthFilter === "todos" || o.fecha_recepcion?.startsWith(state.globalMonthFilter);
    const matchEstado =
      filter === "todas"
      || (filter === "activas" && isOrdenEnTaller(o))
      || o.estado === filter;
    const matchQ = !q
      || o.nombre_cliente.toLowerCase().includes(q.toLowerCase())
      || o.modelo.toLowerCase().includes(q.toLowerCase())
      || o.marca?.toLowerCase().includes(q.toLowerCase())
      || o.recepcionado_por.toLowerCase().includes(q.toLowerCase())
      || o.id.toLowerCase().includes(q.toLowerCase());
    return matchEstado && matchQ && matchMonth;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Órdenes de trabajo</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-48">
            <Select value={state.globalMonthFilter} onValueChange={actions.setGlobalMonthFilter}>
              <SelectTrigger className="h-8 text-xs bg-card border-border">
                <Calendar size={13} className="mr-2 opacity-70" />
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Histórico Completo (Todos)</SelectItem>
                {availableMonths.map(m => (
                  <SelectItem key={m} value={m}>
                    {format(parseISO(`${m}-01`), "MMMM yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={() => setShowReception(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all hover:opacity-90 rounded shadow-sm w-full sm:w-auto justify-center sm:justify-start flex-1 sm:flex-none"
            style={{ background: "var(--primary)", color: "white" }}
          >
            <Plus size={14} /> Nueva recepción
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b gap-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-6 flex-wrap w-full md:w-auto">
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`relative pb-3 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${filter === f.value ? "" : "text-muted-foreground hover:text-foreground"}`}
              style={filter === f.value ? { color: "var(--foreground)" } : {}}
            >
              {f.label}
              {filter === f.value && (
                <motion.div
                  layoutId="ordenesTabIndicator"
                  className="absolute bottom-[-1px] left-0 right-0 h-[2px]"
                  style={{ background: "var(--primary)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        <div className="pb-2 w-full md:w-auto">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              placeholder="Buscar..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs border outline-none focus:border-primary/60 w-full md:w-[200px]"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="border overflow-hidden rounded"
        style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
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

