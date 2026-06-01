import { useState } from "react";
import { useNavigate } from "react-router";
import { Activity, Search, CheckCircle2, Box, ArrowUpRight, Laptop, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useAppContext } from "@/store/AppContext";
import { EstadoBadge, KPICard, isOrdenActiva, isOrdenEnTaller } from "@/app/helpers";
import { ReceptionModal } from "./OrdenesPage";

const fadeUp = {
  hidden: { y: 20, opacity: 0 },
  visible: (i: number) => ({ y: 0, opacity: 1, transition: { delay: i * 0.06, type: "spring", stiffness: 200, damping: 22 } }),
};

const rowVariant = {
  hidden: { x: -12, opacity: 0 },
  visible: (i: number) => ({ x: 0, opacity: 1, transition: { delay: i * 0.04, type: "spring", stiffness: 200, damping: 22 } }),
};

export function Dashboard() {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const [showReception, setShowReception] = useState(false);

  const activas = state.orders.filter(o => isOrdenActiva(o.estado));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent = state.orders
    .filter(o => isOrdenEnTaller(o.estado) && new Date(o.fecha_recepcion) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.fecha_recepcion).getTime() - new Date(a.fecha_recepcion).getTime())
    .slice(0, 8);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Panel de Control</h1>
          <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Resumen general de gestión técnica y taller</p>
        </div>
        <motion.button
          onClick={() => setShowReception(true)}
          className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-all"
          style={{ background: "var(--primary)", color: "white" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={13} /> Nueva Recepción
        </motion.button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Órdenes activas", value: activas.length, sub: "Total en taller", color: "#2563EB", icon: <Activity size={15} /> },
          { label: "Recepcionado", value: state.orders.filter(o => o.estado === "recepcionado").length, sub: "Sin diagnosticar", color: "#64748B", icon: <Search size={15} /> },
          { label: "En proceso", value: state.orders.filter(o => o.estado === "en_proceso" || o.estado === "en_espera").length, sub: "Pendientes", color: "#D97706", icon: <Box size={15} /> },
          { label: "Finalizados", value: state.orders.filter(o => o.estado === "finalizado").length, sub: "Completados", color: "#059669", icon: <CheckCircle2 size={15} /> },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="border overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Órdenes recientes (7 días)</span>
          <button
            onClick={() => navigate("/ordenes")}
            className="text-xs flex items-center gap-1 transition-colors hover:text-primary"
            style={{ color: "var(--muted-foreground)" }}
          >
            Ver todas <ArrowUpRight size={12} />
          </button>
        </div>
        <div>
          {recent.map((o, i) => (
            <motion.div
              key={o.id}
              custom={i}
              variants={rowVariant}
              initial="hidden"
              animate="visible"
              onClick={() => navigate("/ordenes")}
              className="flex items-center gap-4 px-5 py-3 border-b cursor-pointer transition-colors hover:bg-muted/40"
              style={{ borderColor: i < recent.length - 1 ? "var(--border)" : "transparent" }}
            >
              <span className="font-mono text-xs font-semibold" style={{ color: "var(--primary)", minWidth: 72 }}>{o.id.slice(0, 8)}</span>
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span style={{ color: "var(--muted-foreground)" }}><Laptop size={14} /></span>
                <span className="text-xs truncate" style={{ color: "var(--foreground)" }}>{o.marca} {o.modelo}</span>
              </div>
              <span className="text-xs truncate" style={{ color: "var(--muted-foreground)", minWidth: 120 }}>{o.nombre_cliente}</span>
              <EstadoBadge estado={o.estado} />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{o.recepcionado_por.split(" ")[0]}</span>
            </motion.div>
          ))}
          {recent.length === 0 && (
            <div className="py-12 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
              No hay órdenes en los últimos 7 días.
            </div>
          )}
        </div>
      </motion.div>

      <ReceptionModal open={showReception} onOpenChange={setShowReception} />
    </div>
  );
}
