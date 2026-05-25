import { useState, useEffect } from "react";
import { Layers, Plus, CheckCheck } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { capitalize, capitalizeWords } from "@/app/helpers";
import { toast } from "@/app/Toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";

function AssemblyDetailsModal({ assembly, open, onOpenChange }: {
  assembly: any; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const { actions } = useAppContext();
  const [localWarranty, setLocalWarranty] = useState(false);
  const [localReason, setLocalReason] = useState("");
  const [localSolution, setLocalSolution] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!assembly || !open) return;
    const hasSavedWarranty = !!assembly.warranty && !!(assembly.warrantyReason || assembly.warrantySolution);
    setLocalWarranty(!!assembly.warranty);
    setLocalReason(assembly.warrantyReason || "");
    setLocalSolution(assembly.warrantySolution || "");
    setIsEditing(!hasSavedWarranty);
  }, [assembly?.id, open]);

  if (!assembly) return null;

  const handleSaveChanges = () => {
    actions.updateAssembly(assembly.id, {
      warranty: localWarranty,
      warrantyReason: localWarranty ? localReason : "",
      warrantySolution: localWarranty ? localSolution : "",
    });
    toast.success("Cambios guardados correctamente");
    onOpenChange(false);
  };

  const isReadOnly = !isEditing && !!assembly.warranty && !!(assembly.warrantyReason || assembly.warrantySolution);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", maxWidth: 500 }}>
        <DialogHeader>
          <div className="flex justify-between items-center pr-6">
            <DialogTitle className="text-base font-semibold">Detalles del Ensamble</DialogTitle>
            <span className="font-mono text-xs font-semibold px-2 py-0.5" style={{ color: "var(--primary)", background: "rgba(3, 2, 19, 0.08)" }}>
              {assembly.id}
            </span>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-2" style={{ maxHeight: "72vh", overflowY: "auto" }}>
          <div className="grid grid-cols-2 gap-3 text-xs border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div><span className="text-muted-foreground block mb-0.5">Cliente:</span><span className="font-medium text-foreground">{assembly.client}</span></div>
            <div><span className="text-muted-foreground block mb-0.5">CI / RUC:</span><span className="font-mono text-foreground">{assembly.ci}</span></div>
            <div><span className="text-muted-foreground block mb-0.5">Técnico Asignado:</span><span className="font-medium text-foreground">{assembly.tech || "Sin asignar"}</span></div>
            <div><span className="text-muted-foreground block mb-0.5">Fecha:</span><span className="font-medium text-foreground">{assembly.date}</span></div>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground block mb-0.5">Equipo:</span>
            <span className="text-sm font-semibold text-foreground">{assembly.equipment}</span>
          </div>
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground font-medium block">Componentes Instalados:</span>
            <div className="border rounded p-2.5 space-y-1.5 max-h-40 overflow-y-auto" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
              {assembly.components && assembly.components.length > 0 ? (
                assembly.components.map((c: any, i: number) => (
                  <div key={i} className="text-xs flex justify-between py-0.5 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                    <span className="text-foreground">{c.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{c.sku}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-center opacity-50 py-2">Sin componentes registrados</div>
              )}
            </div>
          </div>
          <div className="border rounded overflow-hidden" style={{ borderColor: localWarranty ? "rgba(217,119,6,0.5)" : "var(--border)", background: localWarranty ? "rgba(217,119,6,0.03)" : "transparent" }}>
            <div className="flex items-center justify-between px-3 py-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold block text-foreground">Estado de Garantía</span>
                {isReadOnly && <span className="text-[10px] text-muted-foreground block">Información guardada (solo lectura)</span>}
                {!isReadOnly && <span className="text-[10px] text-muted-foreground block">Marcar si este equipo ingresó bajo garantía de taller</span>}
              </div>
              <div className="flex items-center space-x-2">
                {isReadOnly ? (
                  <span className="text-xs font-medium" style={{ color: "#D97706" }}>Garantía ✓</span>
                ) : (
                  <>
                    <Checkbox id="modal-warranty" checked={localWarranty}
                      onCheckedChange={(checked) => {
                        setLocalWarranty(!!checked);
                        if (!checked) { setLocalReason(""); setLocalSolution(""); }
                      }} />
                    <label htmlFor="modal-warranty" className="text-xs font-medium cursor-pointer select-none" style={{ color: localWarranty ? "#D97706" : "var(--foreground)" }}>Garantía</label>
                  </>
                )}
              </div>
            </div>
            {isReadOnly ? (
              <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: "rgba(217,119,6,0.25)" }}>
                <div className="space-y-1.5 pt-3">
                  <Label className="text-xs font-semibold" style={{ color: "#D97706" }}>Motivo de garantía</Label>
                  <p className="text-xs leading-relaxed p-2.5 rounded" style={{ background: "rgba(217,119,6,0.06)", color: "var(--foreground)" }}>
                    {assembly.warrantyReason || "—"}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: "#D97706" }}>Solución aplicada</Label>
                  <p className="text-xs leading-relaxed p-2.5 rounded" style={{ background: "rgba(217,119,6,0.06)", color: "var(--foreground)" }}>
                    {assembly.warrantySolution || "—"}
                  </p>
                </div>
                <Button onClick={() => setIsEditing(true)} className="w-full text-xs h-8 mt-1" variant="outline" style={{ borderColor: "#D97706", color: "#D97706" }}>
                  Editar información de garantía
                </Button>
              </div>
            ) : (
              <div style={{ maxHeight: localWarranty ? "260px" : "0px", overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: "rgba(217,119,6,0.25)" }}>
                  <div className="space-y-1.5 pt-3">
                    <Label className="text-xs font-semibold" style={{ color: "#D97706" }}>Motivo de garantía</Label>
                    <Textarea placeholder="Describe el motivo por el cual ingresa por garantía..." value={localReason}
                      onChange={e => setLocalReason(e.target.value)} className="text-xs resize-none" rows={2}
                      style={{ background: "var(--input)", borderColor: "rgba(217,119,6,0.35)" }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold" style={{ color: "#D97706" }}>Solución aplicada</Label>
                    <Textarea placeholder="Describe la solución o intervención realizada..." value={localSolution}
                      onChange={e => setLocalSolution(e.target.value)} className="text-xs resize-none" rows={2}
                      style={{ background: "var(--input)", borderColor: "rgba(217,119,6,0.35)" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-2 flex gap-2">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="text-xs h-9" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cerrar</Button>
          {!isReadOnly && (
            <Button onClick={handleSaveChanges} className="text-xs h-9" style={{ background: "var(--primary)", color: "white" }}>
              <CheckCheck size={13} className="mr-1.5" /> Guardar cambios
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewAssemblyModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { state, actions } = useAppContext();
  const [formData, setFormData] = useState({
    client: "", ci: "", processor: "", ram: "", graphicsCard: "", storage: "", motherboard: "", cabinet: "", powerSupply: "", additional: "", tech: "Oscar Gomez",
  });
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [ciFilledBySuggestion, setCiFilledBySuggestion] = useState(false);
  const [clientLocked, setClientLocked] = useState(false);

  const filteredClients = state.clients.filter(c =>
    c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    c.ci.toLowerCase().includes(clientSearchQuery.toLowerCase())
  );

  const existingClientForCi = formData.ci
    ? state.clients.find(c => c.ci.toLowerCase() === formData.ci.toLowerCase())
    : null;
  const lockedClient = clientLocked && formData.ci
    ? state.clients.find(c => c.ci.toLowerCase() === formData.ci.toLowerCase())
    : null;

  useEffect(() => {
    if (!formData.ci || ciFilledBySuggestion) return;
    const match = state.clients.find(c => c.ci.toLowerCase() === formData.ci.toLowerCase());
    if (match) {
      setFormData(prev => ({ ...prev, client: capitalizeWords(match.name) }));
      setClientLocked(true);
    }
  }, [formData.ci]);

  useEffect(() => {
    if (!open) return;
    setFormData({ client: "", ci: "", processor: "", ram: "", graphicsCard: "", storage: "", motherboard: "", cabinet: "", powerSupply: "", additional: "", tech: "Oscar Gomez" });
    setClientSearchQuery("");
    setCiFilledBySuggestion(false);
    setClientLocked(false);
  }, [open]);

  const handleSave = async () => {
    if (!formData.client.trim()) { toast.error("Por favor completa el nombre del cliente."); return; }
    if (!formData.processor.trim()) { toast.error("Por favor ingresa el procesador."); return; }
    if (!formData.ram.trim()) { toast.error("Por favor ingresa la memoria RAM."); return; }
    if (!formData.storage.trim()) { toast.error("Por favor ingresa el almacenamiento."); return; }
    if (!formData.motherboard.trim()) { toast.error("Por favor ingresa la placa madre."); return; }
    if (!formData.cabinet.trim()) { toast.error("Por favor ingresa el gabinete."); return; }
    if (!formData.powerSupply.trim()) { toast.error("Por favor ingresa la fuente de alimentación."); return; }

    const components = [
      { name: `Procesador: ${capitalize(formData.processor)}`, sku: "CPU" },
      { name: `Memoria RAM: ${capitalize(formData.ram)}`, sku: "RAM" },
      ...(formData.graphicsCard.trim() ? [{ name: `Tarjeta Gráfica: ${capitalize(formData.graphicsCard)}`, sku: "GPU" }] : []),
      { name: `Almacenamiento: ${capitalize(formData.storage)}`, sku: "ALM" },
      { name: `Placa: ${capitalize(formData.motherboard)}`, sku: "PLACA" },
      { name: `Gabinete: ${capitalize(formData.cabinet)}`, sku: "GAB" },
      { name: `Fuente de Alimentación: ${capitalize(formData.powerSupply)}`, sku: "PSU" },
      ...(formData.additional.trim() ? [{ name: `Adicionales: ${capitalize(formData.additional)}`, sku: "ADIC" }] : []),
    ];

    await actions.createAssembly({
      client: formData.client.trim(),
      ci: formData.ci.trim() || "Sin RUT",
      date: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
      equipment: `${formData.client.trim()} (${new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })})`,
      warranty: false,
      tech: formData.tech,
      components,
    });

    toast.success("Ensamble registrado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", maxWidth: 550 }}>
        <DialogHeader><DialogTitle className="text-base font-semibold">Registrar Nuevo Ensamble</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-medium">Cliente</Label>
              <Input placeholder="Nombre completo" value={formData.client}
                disabled={clientLocked}
                onChange={e => { setFormData({ ...formData, client: e.target.value }); setClientSearchQuery(e.target.value); setClientLocked(false); }}
                onFocus={() => setClientSearchQuery(formData.client)}
                onBlur={e => { setFormData({ ...formData, client: capitalizeWords(e.target.value) }); setTimeout(() => setClientSearchQuery(""), 200); }}
                className="text-xs h-9" style={{ background: clientLocked ? "var(--muted)" : "var(--input)", borderColor: "var(--border)" }} />
              {clientSearchQuery && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full border rounded p-1 max-h-32 overflow-y-auto space-y-1" style={{ borderColor: "var(--border)", background: "var(--card)", top: "100%", marginTop: 2 }}>
                  {filteredClients.map(c => (
                    <div key={c.ci} className="flex flex-col p-1.5 hover:bg-muted/50 rounded cursor-pointer"
                      onMouseDown={() => { setFormData({ ...formData, client: capitalizeWords(c.name), ci: c.ci }); setClientSearchQuery(""); setCiFilledBySuggestion(true); setClientLocked(true); }}>
                      <div className="text-[11px] font-medium" style={{ color: "var(--foreground)" }}>{c.name}</div>
                      <div className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>CI: {c.ci}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">CI / RUC</Label>
              <Input placeholder="Ej. 1234567-8" value={formData.ci}
                disabled={clientLocked}
                onChange={e => { setFormData({ ...formData, ci: e.target.value.replace(/[^\d-]/g, "") }); setCiFilledBySuggestion(false); setClientLocked(false); }}
                className="text-xs h-9" style={{ background: clientLocked ? "var(--muted)" : "var(--input)", borderColor: "var(--border)" }} />
              {existingClientForCi && !ciFilledBySuggestion && (
                <div className="text-[11px] flex items-center gap-1 mt-1" style={{ color: "#D97706" }}>
                  <span>Ya existe un cliente con este CI: <strong>{existingClientForCi.name}</strong></span>
                </div>
              )}
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-medium">Técnico Asignado</Label>
              <Select value={formData.tech} onValueChange={v => setFormData({ ...formData, tech: v })}>
                <SelectTrigger className="text-xs h-9" style={{ background: "var(--input)", borderColor: "var(--border)" }}>
                  <SelectValue placeholder="Seleccionar Técnico" />
                </SelectTrigger>
                <SelectContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                  <SelectItem value="Oscar Gomez">Oscar Gomez</SelectItem>
                   <SelectItem value="Orlando Moreno">Orlando Moreno</SelectItem>
                  <SelectItem value="Marcos Franco">Marcos Franco</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border-t my-2" style={{ borderColor: "var(--border)" }} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Procesador</Label>
              <Input placeholder="Ej. AMD Ryzen 7 5700X, Intel i5-13400..." value={formData.processor} onChange={e => setFormData({ ...formData, processor: e.target.value })} className="text-xs h-9" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Memoria RAM</Label>
              <Input placeholder="Ej. 16GB DDR4 3200MHz, 32GB DDR5..." value={formData.ram} onChange={e => setFormData({ ...formData, ram: e.target.value })} className="text-xs h-9" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center justify-between">
                <span>Tarjeta Gráfica</span><span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span>
              </Label>
              <Input placeholder="Ej. Nvidia RTX 4060, AMD RX 7600..." value={formData.graphicsCard} onChange={e => setFormData({ ...formData, graphicsCard: e.target.value })} className="text-xs h-9" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Almacenamiento</Label>
              <Input placeholder="Ej. SSD NVMe 1TB Kingston NV2..." value={formData.storage} onChange={e => setFormData({ ...formData, storage: e.target.value })} className="text-xs h-9" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Placa Madre</Label>
              <Input placeholder="Ej. ASUS TUF B550M-PLUS..." value={formData.motherboard} onChange={e => setFormData({ ...formData, motherboard: e.target.value })} className="text-xs h-9" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Gabinete</Label>
              <Input placeholder="Ej. MSI Forge 100R, Corsair 4000D..." value={formData.cabinet} onChange={e => setFormData({ ...formData, cabinet: e.target.value })} className="text-xs h-9" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-medium">Fuente de Alimentación</Label>
              <Input placeholder="Ej. Corsair RM750e 750W 80+ Gold..." value={formData.powerSupply} onChange={e => setFormData({ ...formData, powerSupply: e.target.value })} className="text-xs h-9" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center justify-between">
              <span>Componentes Adicionales</span><span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span>
            </Label>
            <Input placeholder="Ej. Water Cooling 240mm, ventiladores adicionales..." value={formData.additional} onChange={e => setFormData({ ...formData, additional: e.target.value })} className="text-xs h-9" style={{ background: "var(--input)", borderColor: "var(--border)" }} />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-9" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar</Button>
          <Button onClick={handleSave} className="text-xs h-9" style={{ background: "var(--primary)", color: "white" }}>Guardar Ensamble</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Assemblies() {
  const { state, actions } = useAppContext();
  const [selectedAssembly, setSelectedAssembly] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewAssemblyOpen, setIsNewAssemblyOpen] = useState(false);
  const assemblies = state.assemblies;

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
        <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Ensambles de Equipos</h2>
        <Button onClick={() => setIsNewAssemblyOpen(true)} className="text-xs" style={{ background: "var(--primary)", color: "white" }}>
          <Plus size={14} className="mr-1.5" /> Registrar Ensamble
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {assemblies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: "var(--muted-foreground)" }}>
            <Layers size={48} className="mb-4 opacity-20" />
            <p className="text-sm">No hay ensambles registrados.</p>
            <p className="text-xs mt-1">Registra un ensamble para guardar un equipo y sus componentes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assemblies.map(a => (
              <div key={a.id}
                className="border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/45 hover:-translate-y-0.5 transition-all duration-150"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
                onClick={() => { setSelectedAssembly(a); setIsDetailsOpen(true); }}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{a.equipment}</h3>
                  {a.warranty && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#D9770620", color: "#D97706" }}>
                      Garantía
                    </span>
                  )}
                </div>
                <div className="text-xs space-y-1 mb-4" style={{ color: "var(--muted-foreground)" }}>
                  <div>Cliente: {a.client} (CI: {a.ci})</div>
                  {a.tech && <div>Técnico: {a.tech}</div>}
                  <div>Fecha: {a.date}</div>
                  <div>Componentes: {a.components.length}</div>
                </div>
                <div className="border-t pt-3 space-y-2 max-h-32 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
                  {a.components.map((c: any, i: number) => (
                    <div key={i} className="text-xs flex justify-between" style={{ color: "var(--foreground)" }}>
                      <span className="truncate pr-2">- {c.name}</span>
                      <span className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>{c.sku}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AssemblyDetailsModal assembly={selectedAssembly} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      <NewAssemblyModal open={isNewAssemblyOpen} onOpenChange={setIsNewAssemblyOpen} />
    </div>
  );
}
