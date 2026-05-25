import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, X, DollarSign, Search, ExternalLink, Pencil } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { EstadoBadge, StatusBadge, getEquipIcon, capitalizeWords } from "@/app/helpers";
import { motion } from "@/app/motion";
import type { Client, ClientEquipment, OrdenTrabajo } from "@/types";

function ServiceCountBadge({ history }: { history: string[] }) {
  const total = history.length;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium shrink-0"
      style={{ color: "#64748B", background: "rgba(100,116,139,0.1)" }}
    >
      {total} Service{total !== 1 ? "s" : ""}
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
        <div className="size-7 flex items-center justify-center shrink-0" style={{ background: "rgba(0,71,171,0.08)", color: "var(--primary)" }}>
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
                    {orden.diagnostico.bateria && <div><span className="text-muted-foreground">Batería:</span> <span className="font-medium ml-1">{capitalizeWords(orden.diagnostico.bateria)}</span></div>}
                  </div>
                  {orden.diagnostico.almacenamientos.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Almacenamientos:</span>
                      <div className="mt-0.5 space-y-0.5 ml-2">
                        {orden.diagnostico.almacenamientos.map((a, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="font-medium">{capitalizeWords(a.nombre)}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: a.estado.toLowerCase() === "bien" ? "rgba(5,150,105,0.1)" : "rgba(217,119,6,0.1)", color: a.estado.toLowerCase() === "bien" ? "#059669" : "#D97706" }}>{capitalizeWords(a.estado)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-xs leading-relaxed pt-1 border-t" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
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
              <div className="text-xs">{orden.piezas_utilizadas.map(p => {
                const item = state.stock.find(s => s.id === p.stockItemId);
                return `${capitalizeWords(item?.name || p.stockItemId)}${p.quantity > 1 ? ` x${p.quantity}` : ''}`;
              }).join(" · ")}</div>
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

function ServiceHistoryModal({ equip, clientCi, open, onClose }: {
  equip: ClientEquipment | null;
  clientCi: string;
  open: boolean;
  onClose: () => void;
}) {
  const { state } = useAppContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!open || !equip) return null;

  const allOrders = (equip.history ?? [equip.serial])
    .map(id => state.orders.find(o => o.id === id))
    .filter((o): o is OrdenTrabajo => !!o)
    .sort((a, b) => new Date(b.fecha_recepcion).getTime() - new Date(a.fecha_recepcion).getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{equip.name}</h2>
            <ServiceCountBadge history={equip.history ?? [equip.serial]} />
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors" style={{ color: "var(--muted-foreground)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-3">
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
        </div>
      </div>
    </div>
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

  if (!open || !client) return null;

  const initials = client.name.split(",")[0][0] + client.name.split(" ").slice(-1)[0][0];

  const handleSave = async () => {
    setSaving(true);
    await actions.updateClient(client.ci, { notes });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setNotes(client.notes || "");
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}>
      <motion.div
        className="w-full max-w-sm rounded-xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative px-6 pt-8 pb-5 flex flex-col items-center text-center border-b" style={{ borderColor: "var(--border)" }}>
          <div className="size-16 flex items-center justify-center text-xl font-bold rounded-full mb-3" style={{ background: "var(--primary)", color: "white" }}>
            {initials}
          </div>
          <div className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{client.name}</div>
          <div className="text-xs font-mono mt-1" style={{ color: "var(--muted-foreground)" }}>CI: {client.ci}</div>
          {client.numero_celular && (
            <div className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>Tel: {client.numero_celular}</div>
          )}
          <div className="text-[10px] mt-1.5 px-2 py-0.5 font-medium rounded" style={{ color: "#64748B", background: "rgba(100,116,139,0.1)" }}>
            {client.equipment.length} equipo{client.equipment.length !== 1 ? "s" : ""}
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 p-1 hover:bg-muted rounded transition-colors" style={{ color: "var(--muted-foreground)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
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
                <button onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium rounded transition-colors"
                  style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                  Cancelar
                </button>
                <motion.button onClick={handleSave} disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium rounded transition-colors"
                  style={{ background: "var(--primary)", color: "white", opacity: saving ? 0.6 : 1 }}
                  whileHover={{ scale: saving ? 1 : 1.02 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}>
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
              <motion.button onClick={() => setEditing(true)}
                className="absolute -top-2 -right-2 size-7 flex items-center justify-center rounded-full shadow-md"
                style={{ background: "var(--primary)", color: "white" }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="Editar comentarios">
                <Pencil size={13} />
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ClientCard({ client, index }: { client: Client; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<{ equip: ClientEquipment; clientCi: string } | null>(null);
  const [showNotes, setShowNotes] = useState(false);

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
          <div className="flex items-start gap-4">
            <motion.button onClick={() => setShowNotes(true)}
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
                  {client.equipment.length} equipo{client.equipment.length !== 1 ? "s" : ""}
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
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-muted/50 transition-colors"
              style={{ color: "var(--muted-foreground)" }}
            >
              <ChevronDown size={16} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
          </div>

          {expanded && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
            >
              <div className="border-t" style={{ borderColor: "var(--border)" }}>
                {client.equipment.length > 0 ? (
                  client.equipment.map(eq => (
                    <div key={eq.serial} className="flex items-center gap-3 px-1 py-2.5 border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors rounded" style={{ borderColor: "var(--border)" }}
                      onClick={() => setSelectedEquip({ equip: eq, clientCi: client.ci })}
                    >
                      <div className="size-6 flex items-center justify-center shrink-0" style={{ background: "rgba(0,71,171,0.08)", color: "var(--primary)" }}>
                        {getEquipIcon(eq.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>{eq.name}</div>
                        <div className="text-[11px] font-mono truncate" style={{ color: "var(--muted-foreground)" }}>{eq.serial.slice(0, 8)}</div>
                      </div>
                      <ServiceCountBadge history={eq.history ?? [eq.serial]} />
                    </div>
                  ))
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
        clientCi={selectedEquip?.clientCi ?? ""}
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

export function Equipment() {
  const { state } = useAppContext();

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-3">
      <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
        {state.clients.length} clientes · {state.clients.reduce((a, c) => a + c.equipment.length, 0)} equipos registrados
      </div>
      {state.clients.map((client, i) => (
        <ClientCard key={client.ci} client={client} index={i} />
      ))}
    </div>
  );
}