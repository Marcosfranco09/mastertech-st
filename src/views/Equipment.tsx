import { useState, useEffect, useMemo, cloneElement } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, DollarSign, Search, ExternalLink, Pencil, Monitor, Laptop, HelpCircle } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { EstadoBadge, StatusBadge, getEquipIcon, capitalizeWords } from "@/app/helpers";
import { motion } from "@/app/motion";
import { AnimatePresence } from "framer-motion";
import type { Client, Equipo, ClienteEquipo, OrdenTrabajo } from "@/types";
import { Input } from "@/app/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { DialogShutterBody } from "@/app/components/ShutterPanel";

function ServiceCountBadge({ count }: { count: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium shrink-0 rounded"
      style={{ color: "#64748B", background: "rgba(100,116,139,0.1)" }}
    >
      {count} Service{count !== 1 ? "s" : ""}
    </span>
  );
}

function OrderCard({ orden, open, onToggle }: {
  orden: OrdenTrabajo;
  open: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  const { state } = useAppContext();
  return (
    <motion.div className="border rounded" style={{ borderColor: "var(--border)" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="size-7 flex items-center justify-center shrink-0 rounded" style={{ background: "rgba(0,71,171,0.08)", color: "var(--primary)" }}>
          {getEquipIcon(orden.marca)}
        </div>
        <div className="flex-1 text-left">
          <div className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
            Orden de servicio {new Date(orden.fecha_recepcion).toLocaleDateString("es-ES")}
          </div>
          <div className="text-[11px] font-mono mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            #{orden.id.slice(0, 8)}
          </div>
        </div>
        <EstadoBadge estado={orden.estado} />
        {orden.garantia && (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded" style={{ color: "#D97706", background: "rgba(217,119,6,0.1)" }}>
            GARANTÍA
          </span>
        )}
        <ChevronDown size={14} style={{ color: "var(--muted-foreground)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: "var(--border)" }}>
          {orden.garantia && (
            <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "#D97706" }}>
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded" style={{ color: "#D97706", background: "rgba(217,119,6,0.1)" }}>GARANTÍA</span>
              Servicio cubierto por garantía
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <div><span className="text-muted-foreground">Fecha recepción:</span> {new Date(orden.fecha_recepcion).toLocaleDateString("es-ES")}</div>
            <div><span className="text-muted-foreground">Técnico:</span> {orden.recepcionado_por}</div>
            <div><span className="text-muted-foreground">Cliente:</span> {capitalizeWords(orden.nombre_cliente)}</div>
            <div><span className="text-muted-foreground">CI / RUC:</span> {orden.ci || "—"}</div>
            <div><span className="text-muted-foreground">Celular:</span> {orden.numero_celular || "—"}</div>
            <div><span className="text-muted-foreground">Categoría:</span> {capitalizeWords(orden.categoria || "") || "—"}</div>
            <div><span className="text-muted-foreground">Marca:</span> {capitalizeWords(orden.marca || "") || "—"}</div>
            <div><span className="text-muted-foreground">Modelo:</span> {capitalizeWords(orden.modelo || "") || "—"}</div>
            <div className="col-span-2"><span className="text-muted-foreground">Contraseña:</span> {orden.contrasena_equipo || "—"}</div>
            <div className="col-span-2"><span className="text-muted-foreground">Accesorios:</span> {capitalizeWords(orden.accesorios || "") || "—"}</div>
          </div>

          {orden.falla_segun_cliente && (
            <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs font-semibold mb-1 text-muted-foreground">Falla reportada</div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{capitalizeWords(orden.falla_segun_cliente)}</p>
            </div>
          )}

          {orden.diagnostico && (
            <div className="pt-3 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Search size={12} /> Diagnóstico {orden.garantia ? "(Garantía)" : ""}
              </div>
              {orden.garantia ? (
                <div className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {orden.diagnostico.solucion_propuesta}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">CPU:</span> <span className="font-medium ml-1">{capitalizeWords(orden.diagnostico.procesador)}</span></div>
                    <div><span className="text-muted-foreground">RAM:</span> <span className="font-medium ml-1">{capitalizeWords(orden.diagnostico.memoria_ram)}</span></div>
                    <div><span className="text-muted-foreground">GPU:</span> <span className="font-medium ml-1">{capitalizeWords(orden.diagnostico.grafica)}</span></div>
                    <div><span className="text-muted-foreground">Usuario:</span> <span className="font-medium ml-1">{capitalizeWords(orden.diagnostico.usuario_nombre)}</span></div>
                    <div><span className="text-muted-foreground">Estrés CPU:</span> <span className="font-medium ml-1">{capitalizeWords(orden.diagnostico.pico_estres_cpu)}</span></div>
                    <div><span className="text-muted-foreground">Estrés GPU:</span> <span className="font-medium ml-1">{capitalizeWords(orden.diagnostico.pico_estres_gpu)}</span></div>
                    {(orden.diagnostico.estado_bateria || orden.diagnostico.bateria) && <div><span className="text-muted-foreground">Batería:</span> <span className="font-medium ml-1">{capitalizeWords(orden.diagnostico.estado_bateria || orden.diagnostico.bateria || "")}</span></div>}
                    {orden.diagnostico.medicion_pila && <div><span className="text-muted-foreground">Pila:</span> <span className="font-medium ml-1">{orden.diagnostico.medicion_pila}</span></div>}
                    {(orden.diagnostico.fuente_potencia || orden.diagnostico.fuente_marca) && <div><span className="text-muted-foreground">Fuente:</span> <span className="font-medium ml-1">{[orden.diagnostico.fuente_potencia, orden.diagnostico.fuente_marca].filter(Boolean).map(capitalizeWords).join(" - ")}</span></div>}
                  </div>
                  {orden.diagnostico.almacenamientos.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Almacenamientos:</span>
                      <div className="mt-0.5 space-y-0.5 ml-2">
                        {orden.diagnostico.almacenamientos.map((a, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="font-medium">{capitalizeWords(a.nombre)} {a.capacidad ? `(${a.capacidad})` : ""} {a.letra ? a.letra : ""}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: a.estado.toLowerCase() === "bien" ? "rgba(5,150,105,0.1)" : "rgba(217,119,6,0.1)", color: a.estado.toLowerCase() === "bien" ? "#059669" : "#D97706" }}>{capitalizeWords(a.estado)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {orden.diagnostico.observaciones && (
                    <div className="text-xs leading-relaxed pt-1 border-t mt-1.5" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                      <span className="font-semibold" style={{ color: "var(--primary)" }}>Observaciones:</span> {capitalizeWords(orden.diagnostico.observaciones)}
                    </div>
                  )}
                  <div className="text-xs leading-relaxed pt-1 border-t mt-1.5" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                    <span className="font-semibold" style={{ color: "var(--primary)" }}>Solución propuesta:</span> {capitalizeWords(orden.diagnostico.solucion_propuesta)}
                  </div>
                </>
              )}
            </div>
          )}

          {orden.presupuesto && (
            <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1.5">
                <DollarSign size={12} /> Presupuesto
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Monto:</span> Gs. {orden.presupuesto.monto.toLocaleString("es-ES")}
                {orden.presupuesto.descripcion && <> · {capitalizeWords(orden.presupuesto.descripcion)}</>}
                {orden.respuesta_cliente && (
                  <span className="ml-2">
                    · Respuesta:{" "}
                    <span style={{ color: orden.respuesta_cliente === "aceptado" ? "#059669" : "#DC2626" }}>
                      {orden.respuesta_cliente === "aceptado" ? "Aceptado" : "Rechazado"}
                    </span>
                  </span>
                )}
              </div>
              {orden.presupuesto_aceptado && (
                <div className="text-xs mt-1">
                  <span className="text-muted-foreground">Aceptado por:</span> Gs. {orden.presupuesto_aceptado.monto.toLocaleString("es-ES")}
                  {orden.presupuesto_aceptado.descripcion && <> · {capitalizeWords(orden.presupuesto_aceptado.descripcion)}</>}
                </div>
              )}
            </div>
          )}

          {orden.piezas_utilizadas && orden.piezas_utilizadas.length > 0 && (
            <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs font-semibold mb-1 text-muted-foreground">Piezas utilizadas</div>
              <div className="text-xs space-y-1">{orden.piezas_utilizadas.map((p, i) => {
                const item = state.stock.find(s => s.id === p.stockItemId);
                const itemName = (item?.name || p.stockItemId).toUpperCase();
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--primary)" }}></div>
                    <span className="font-medium">{itemName}</span>
                    <span className="text-muted-foreground">({p.quantity} UD{p.quantity > 1 ? "S" : ""})</span>
                    {p.reemplazaA && <span className="text-[9px] px-1 py-0.5 rounded ml-1" style={{ background: "rgba(0,71,171,0.1)", color: "var(--primary)" }}>Reemplaza: {p.reemplazaA.toUpperCase()}</span>}
                  </div>
                );
              })}</div>
            </div>
          )}
          <motion.button onClick={() => navigate(`/ordenes/${orden.id}`)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded"
            style={{ color: "var(--primary)" }}
            whileHover={{ backgroundColor: "var(--muted)", scale: 1.01 }}
            whileTap={{ scale: 0.98 }}>
            <ExternalLink size={12} /> Ver orden completa
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

function ServiceHistoryModal({ equip, open, onClose }: {
  equip: Equipo | null;
  open: boolean;
  onClose: () => void;
}) {
  const { state } = useAppContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setExpandedId(null);
  }, [open]);

  const allOrders = equip
    ? state.orders
        .filter(o => o.equipo_id === equip.id || o.id === equip.id)
        .sort((a, b) => new Date(b.fecha_recepcion).getTime() - new Date(a.fecha_recepcion).getTime())
    : [];

  return (
    <Dialog open={open && !!equip} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
      >
        {equip && (
          <>
            <DialogHeader className="px-6 py-4 border-b space-y-3 text-left shrink-0" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3 pr-8">
                <DialogTitle className="text-lg font-semibold">
                  {equip.marca} {equip.modelo}
                </DialogTitle>
                <div className="text-xs font-mono text-muted-foreground px-2 py-0.5 bg-muted rounded">{equip.id}</div>
                <ServiceCountBadge count={allOrders.length} />
              </div>

              {equip.especificaciones && (
                <div className="text-xs border rounded p-3" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                  <div className="font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Search size={12} /> Especificaciones actuales
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
                    {equip.especificaciones.procesador && <div><span className="text-muted-foreground">CPU:</span> <span className="font-medium ml-1">{equip.especificaciones.procesador.toUpperCase()}</span></div>}
                    {equip.especificaciones.memoria_ram && <div><span className="text-muted-foreground">RAM:</span> <span className="font-medium ml-1">{equip.especificaciones.memoria_ram.toUpperCase()}</span></div>}
                    {equip.especificaciones.grafica && <div><span className="text-muted-foreground">GPU:</span> <span className="font-medium ml-1">{equip.especificaciones.grafica.toUpperCase()}</span></div>}
                    {(equip.especificaciones.bateria || equip.especificaciones.estado_bateria) && <div><span className="text-muted-foreground">Batería:</span> <span className="font-medium ml-1">{capitalizeWords(equip.especificaciones.estado_bateria || equip.especificaciones.bateria || "")}</span></div>}
                    {equip.especificaciones.medicion_pila && <div><span className="text-muted-foreground">Pila:</span> <span className="font-medium ml-1">{equip.especificaciones.medicion_pila}</span></div>}
                    {(equip.especificaciones.fuente_potencia || equip.especificaciones.fuente_marca) && <div><span className="text-muted-foreground">Fuente:</span> <span className="font-medium ml-1">{[equip.especificaciones.fuente_potencia, equip.especificaciones.fuente_marca].filter(Boolean).map(capitalizeWords).join(" - ")}</span></div>}
                    {equip.especificaciones.almacenamientos && equip.especificaciones.almacenamientos.length > 0 && (
                      <div className="col-span-full mt-1 border-t pt-1.5" style={{ borderColor: "var(--border)" }}>
                        <span className="text-muted-foreground">Almacenamientos:</span>
                        <div className="mt-0.5 space-y-0.5 ml-2">
                          {equip.especificaciones.almacenamientos.map((a, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="font-medium">{capitalizeWords(a.nombre)} {a.capacidad ? `(${a.capacidad})` : ""} {a.letra ? a.letra : ""}</span>
                              {a.estado && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: a.estado.toLowerCase() === "bien" ? "rgba(5,150,105,0.1)" : "rgba(217,119,6,0.1)", color: a.estado.toLowerCase() === "bien" ? "#059669" : "#D97706" }}>{capitalizeWords(a.estado)}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogHeader>

            <DialogShutterBody panelKey={expandedId ?? "none"} scrollClassName="overflow-y-auto p-6 space-y-3">
              {allOrders.length > 0 ? (
                allOrders.map(o => (
                  <OrderCard
                    key={o.id}
                    orden={o}
                    open={expandedId === o.id}
                    onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
                  />
                ))
              ) : (
                <div className="text-xs text-center py-8" style={{ color: "var(--muted-foreground)" }}>
                  No se encontraron órdenes asociadas a este equipo.
                </div>
              )}
            </DialogShutterBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClientNotesModal({ client, open, onClose }: {
  client: Client | null;
  open: boolean;
  onClose: () => void;
}) {
  const { actions } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && client) {
      setNotes(client.notes || "");
      setEditing(false);
    }
  }, [open, client]);

  const initials = client
    ? client.name.split(",")[0][0] + client.name.split(" ").slice(-1)[0][0]
    : "";

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    await actions.updateClient(client.ci, { notes });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    if (!client) return;
    setNotes(client.notes || "");
    setEditing(false);
  };

  return (
    <Dialog open={open && !!client} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="sm:max-w-sm gap-0 p-0 overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
      >
        {client && (
          <>
            <DialogHeader className="px-6 pt-8 pb-5 flex flex-col items-center text-center border-b space-y-0" style={{ borderColor: "var(--border)" }}>
              <div className="size-16 flex items-center justify-center text-xl font-bold rounded-full mb-3" style={{ background: "var(--primary)", color: "white" }}>
                {initials}
              </div>
              <DialogTitle className="text-base font-semibold">{client.name}</DialogTitle>
              <p className="text-xs font-mono mt-1" style={{ color: "var(--muted-foreground)" }}>CI: {client.ci}</p>
              {client.numero_celular && (
                <p className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>Tel: {client.numero_celular}</p>
              )}
            </DialogHeader>

            <DialogShutterBody panelKey={editing ? "edit" : "view"} scrollClassName="px-6 py-5">
              {editing ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Agregar comentarios..."
                    rows={4}
                    className="w-full text-xs px-3 py-2 rounded resize-none transition-colors"
                    style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-3 py-1.5 text-xs font-medium rounded transition-colors"
                      style={{ background: "var(--muted)", color: "var(--foreground)" }}
                    >
                      Cancelar
                    </button>
                    <motion.button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-1.5 text-xs font-medium rounded transition-colors"
                      style={{ background: "var(--primary)", color: "white", opacity: saving ? 0.6 : 1 }}
                      whileHover={{ scale: saving ? 1 : 1.02 }}
                      whileTap={{ scale: saving ? 1 : 0.98 }}
                    >
                      {saving ? "Guardando..." : "Guardar"}
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="text-xs leading-relaxed min-h-[4rem] p-3 rounded" style={{ background: "var(--muted)" }}>
                    {notes ? (
                      <span style={{ color: "var(--foreground)" }}>{notes}</span>
                    ) : (
                      <span style={{ color: "var(--muted-foreground)" }}>Sin comentarios</span>
                    )}
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="absolute -top-2 -right-2 size-7 flex items-center justify-center rounded-full shadow-md"
                    style={{ background: "var(--primary)", color: "white" }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title="Editar comentarios"
                  >
                    <Pencil size={13} />
                  </motion.button>
                </div>
              )}
            </DialogShutterBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClientCard({ client, index }: { client: Client; index: number }) {
  const { state } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<{ equip: Equipo; clientCi: string } | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const clientEquipos = useMemo(() => {
    return state.clienteEquipos
      .filter(ce => ce.cliente_ci === client.ci)
      .map(ce => state.equipos.find(e => e.id === ce.equipo_id))
      .filter((e): e is Equipo => !!e);
  }, [state.clienteEquipos, state.equipos, client.ci]);

  const initials = client.name.split(",")[0][0] + client.name.split(" ").slice(-1)[0][0];

  return (
    <>
      <motion.div
        className="border rounded-lg overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        variants={index === 0 ? undefined : { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
        initial={index === 0 ? { opacity: 0, y: 12 } : "hidden"}
        animate={index === 0 ? { opacity: 1, y: 0 } : "visible"}
        transition={{ duration: 0.3, delay: index * 0.04 }}
        whileHover={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
      >
        <div className="p-5">
          <div className="flex items-start gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)} role="button" tabIndex={0}
            <motion.button onClick={(e) => { e.stopPropagation(); setShowNotes(true); }}
              className="size-10 flex items-center justify-center text-sm font-bold shrink-0 rounded cursor-pointer"
              style={{ background: "var(--primary)", color: "white" }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              title="Ver comentarios del cliente">
              {initials}
            </motion.button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{client.name}</div>
                <span className="text-[10px] px-1.5 py-0.5 font-medium shrink-0" style={{ color: "#64748B", background: "rgba(100,116,139,0.1)" }}>
                  {clientEquipos.length} equipo{clientEquipos.length !== 1 ? "s" : ""}
                </span>
              </div>
              {client.notes && (
                <div className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--foreground)" }}>{client.notes}</div>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>CI: {client.ci}</span>
                {client.numero_celular && (
                  <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>Tel: {client.numero_celular}</span>
                )}
              </div>
            </div>
            <div
              className="p-1 rounded hover:bg-muted/50 transition-colors flex items-center justify-center"
              style={{ color: "var(--muted-foreground)" }}
            >
              <ChevronDown size={16} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </div>
          </div>

          {expanded && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
            >
              <div className="border-t" style={{ borderColor: "var(--border)" }}>
                {clientEquipos.length > 0 ? (
                  clientEquipos.map(eq => {
                    const orderCount = state.orders.filter(o => o.equipo_id === eq.id || o.id === eq.id).length;
                    return (
                      <div key={eq.id} className="flex items-center gap-3 px-1 py-2.5 border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors rounded" style={{ borderColor: "var(--border)" }}
                        onClick={() => setSelectedEquip({ equip: eq, clientCi: client.ci })}
                      >
                        <div className="size-6 flex items-center justify-center shrink-0" style={{ background: "rgba(0,71,171,0.08)", color: "var(--primary)" }}>
                          {getEquipIcon(eq.marca)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>{eq.marca} {eq.modelo}</div>
                          <div className="text-[11px] font-mono truncate" style={{ color: "var(--muted-foreground)" }}>{eq.id}</div>
                        </div>
                        <ServiceCountBadge count={orderCount} />
                      </div>
                    )
                  })
                ) : (
                  <div className="text-xs py-3 text-center" style={{ color: "var(--muted-foreground)" }}>Sin equipos registrados</div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <ServiceHistoryModal
        equip={selectedEquip?.equip ?? null}
        open={!!selectedEquip}
        onClose={() => setSelectedEquip(null)}
      />

      <ClientNotesModal
        client={client}
        open={showNotes}
        onClose={() => setShowNotes(false)}
      />
    </>
  );
}

function EquipoCard({ equipo, index }: { equipo: Equipo; index: number }) {
  const { state } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const orderCount = state.orders.filter(o => o.equipo_id === equipo.id || o.id === equipo.id).length;
  
  const linkedClients = useMemo(() => {
    return state.clienteEquipos
      .filter(ce => ce.equipo_id === equipo.id)
      .map(ce => state.clients.find(c => c.ci === ce.cliente_ci))
      .filter((c): c is Client => !!c);
  }, [state.clienteEquipos, state.clients, equipo.id]);

  return (
    <>
      <motion.div
        className="border rounded-lg overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        variants={index === 0 ? undefined : { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
        initial={index === 0 ? { opacity: 0, y: 12 } : "hidden"}
        animate={index === 0 ? { opacity: 1, y: 0 } : "visible"}
        transition={{ duration: 0.3, delay: index * 0.04 }}
        whileHover={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
      >
        <div className="p-5">
          <div className="flex items-start gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)} role="button" tabIndex={0}
            <div className="size-10 flex items-center justify-center text-sm rounded shrink-0" style={{ background: "rgba(0,71,171,0.08)", color: "var(--primary)" }}>
              {(() => {
                const icon = getEquipIcon(equipo.marca);
                return cloneElement(icon as React.ReactElement, { size: 20 });
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{equipo.marca} {equipo.modelo}</div>
                <ServiceCountBadge count={orderCount} />
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>{equipo.id}</span>
                <span className="text-[11px] text-muted-foreground">{linkedClients.length} cliente{linkedClients.length !== 1 ? "s" : ""} vinculado{linkedClients.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <div
              className="p-1 rounded hover:bg-muted/50 transition-colors flex items-center justify-center"
              style={{ color: "var(--muted-foreground)" }}
            >
              <ChevronDown size={16} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </div>
          </div>

          {expanded && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
            >
              <div className="border-t pt-3 space-y-3" style={{ borderColor: "var(--border)" }}>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Clientes vinculados</span>
                  <div className="mt-1 space-y-1">
                    {linkedClients.map(c => (
                      <div key={c.ci} className="text-xs flex items-center gap-2">
                        <span style={{ color: "var(--foreground)" }}>{c.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">({c.ci})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <motion.button onClick={(e) => { e.stopPropagation(); setShowHistory(true); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded border"
                    style={{ borderColor: "var(--border)", color: "var(--primary)" }}
                    whileHover={{ backgroundColor: "var(--muted)", scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}>
                    <ExternalLink size={12} /> Ver historial de servicios
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <ServiceHistoryModal
        equip={equipo}
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </>
  );
}

export function Equipment() {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState<"clientes" | "equipos">("clientes");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    if (!searchQuery) return state.clients;
    const q = searchQuery.toLowerCase();
    return state.clients.filter(c => {
      if (c.name.toLowerCase().includes(q) || c.ci.toLowerCase().includes(q) || c.numero_celular.includes(q)) return true;
      const equipIds = state.clienteEquipos.filter(ce => ce.cliente_ci === c.ci).map(ce => ce.equipo_id);
      const equips = state.equipos.filter(e => equipIds.includes(e.id));
      return equips.some(e => e.marca.toLowerCase().includes(q) || e.modelo.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
    });
  }, [state.clients, state.clienteEquipos, state.equipos, searchQuery]);

  const filteredEquipos = useMemo(() => {
    if (!searchQuery) return state.equipos;
    const q = searchQuery.toLowerCase();
    return state.equipos.filter(e => {
      if (e.id.toLowerCase().includes(q) || e.marca.toLowerCase().includes(q) || e.modelo.toLowerCase().includes(q) || e.tipo.toLowerCase().includes(q)) return true;
      const clientCis = state.clienteEquipos.filter(ce => ce.equipo_id === e.id).map(ce => ce.cliente_ci);
      const clients = state.clients.filter(c => clientCis.includes(c.ci));
      return clients.some(c => c.name.toLowerCase().includes(q) || c.ci.toLowerCase().includes(q));
    });
  }, [state.equipos, state.clienteEquipos, state.clients, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <div className="px-6 pt-6">
        <h1 className="text-2xl font-bold tracking-tight mb-4" style={{ color: "var(--foreground)" }}>Directorio</h1>
        
        <div className="flex items-end gap-6 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-1 gap-6 relative">
            <button
              onClick={() => setActiveTab("clientes")}
              className={`relative pb-3 text-sm font-semibold transition-colors flex-1 text-center cursor-pointer ${activeTab === "clientes" ? "" : "text-muted-foreground hover:text-foreground"}`}
              style={activeTab === "clientes" ? { color: "var(--foreground)" } : {}}
            >
              Clientes
              {activeTab === "clientes" && (
                <motion.div
                  layoutId="directoryTabIndicator"
                  className="absolute bottom-[-1px] left-0 right-0 h-[2px]"
                  style={{ background: "var(--primary)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("equipos")}
              className={`relative pb-3 text-sm font-semibold transition-colors flex-1 text-center cursor-pointer ${activeTab === "equipos" ? "" : "text-muted-foreground hover:text-foreground"}`}
              style={activeTab === "equipos" ? { color: "var(--foreground)" } : {}}
            >
              Equipos
              {activeTab === "equipos" && (
                <motion.div
                  layoutId="directoryTabIndicator"
                  className="absolute bottom-[-1px] left-0 right-0 h-[2px]"
                  style={{ background: "var(--primary)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          </div>

          <div className="relative w-80 pb-2">
            <Search className="absolute left-3 top-[calc(50%-4px)] -translate-y-1/2 size-4 text-muted-foreground z-10 pointer-events-none" />
            
            <div className="absolute inset-y-0 left-9 flex items-center pointer-events-none overflow-hidden pb-2 right-2">
              <AnimatePresence mode="wait">
                {!searchQuery && (
                  <motion.span
                    key={activeTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-xs text-muted-foreground whitespace-nowrap"
                  >
                    {activeTab === "clientes" ? "Buscar por cliente o CI..." : "Buscar por MT-, marca o cliente..."}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs relative bg-transparent"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === "clientes" ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === "clientes" ? -30 : 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="absolute inset-0 overflow-y-auto p-6 space-y-3"
          >
            {activeTab === "clientes" && (
              <>
                <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                  Mostrando {filteredClients.length} clientes
                </div>
                {filteredClients.map((client, i) => (
                  <ClientCard key={client.ci} client={client} index={i} />
                ))}
                {filteredClients.length === 0 && (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    No se encontraron clientes que coincidan con la búsqueda.
                  </div>
                )}
              </>
            )}

            {activeTab === "equipos" && (
              <>
                <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                  Mostrando {filteredEquipos.length} equipos
                </div>
                {filteredEquipos.map((equipo, i) => (
                  <EquipoCard key={equipo.id} equipo={equipo} index={i} />
                ))}
                {filteredEquipos.length === 0 && (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    No se encontraron equipos que coincidan con la búsqueda.
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}