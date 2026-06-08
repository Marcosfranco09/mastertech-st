import { Search, Wrench, Clock, CheckCircle2, AlertCircle, Laptop, Monitor, Gamepad2 } from "lucide-react";
import type { EstadoOrden } from "@/types";

/** Cuenta en KPI «órdenes activas» (en curso; sin finalizar, entregar ni rechazar) */
export function isOrdenActiva(estado: EstadoOrden | string): boolean {
  return estado !== "finalizado" && estado !== "entregado" && estado !== "rechazado";
}

/** Visible en listados «Activas» (incluye finalizado pendiente de entrega al cliente) */
export function isOrdenEnTaller(orden: { estado: EstadoOrden | string, equipo_retirado?: boolean }): boolean {
  if (orden.estado === "entregado") return false;
  if (orden.estado === "rechazado" && orden.equipo_retirado) return false;
  return true;
}

export const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  recepcionado:  { label: "Recepcionado",  color: "#64748B", bg: "rgba(100,116,139,0.1)" },
  diagnosticado: { label: "Diagnosticado", color: "#2563EB", bg: "rgba(37,99,235,0.1)"   },
  en_espera:     { label: "En espera",     color: "#D97706", bg: "rgba(217,119,6,0.1)"   },
  en_proceso:    { label: "En proceso",    color: "#EA580C", bg: "rgba(234,88,12,0.1)"   },
  finalizado:    { label: "Finalizado",    color: "#059669", bg: "rgba(5,150,105,0.1)"   },
  entregado:     { label: "Entregado",     color: "#0891B2", bg: "rgba(8,145,178,0.1)"   },
  rechazado:     { label: "Rechazado",     color: "#DC2626", bg: "rgba(220,38,38,0.1)"   },
};

export function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, color: "#64748B", bg: "rgba(100,116,139,0.1)" };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  diagnosis:     { label: "Diagnóstico",   color: "#2563EB", bg: "rgba(37,99,235,0.1)",   icon: <Search size={11} /> },
  in_progress:   { label: "En proceso",    color: "#D97706", bg: "rgba(217,119,6,0.1)",   icon: <Wrench size={11} /> },
  waiting_parts: { label: "Espera piezas", color: "#7C3AED", bg: "rgba(124,58,237,0.1)",  icon: <Clock size={11} /> },
  completed:     { label: "Finalizado",    color: "#059669", bg: "rgba(5,150,105,0.1)",   icon: <CheckCircle2 size={11} /> },
  urgent:        { label: "Urgente",       color: "#DC2626", bg: "rgba(220,38,38,0.1)",   icon: <AlertCircle size={11} /> },
  recepcionado:  { label: "Recepcionado",  color: "#64748B", bg: "rgba(100,116,139,0.1)", icon: <Search size={11} /> },
  diagnosticado: { label: "Diagnosticado", color: "#2563EB", bg: "rgba(37,99,235,0.1)",   icon: <Search size={11} /> },
  en_espera:     { label: "En espera",     color: "#D97706", bg: "rgba(217,119,6,0.1)",   icon: <Clock size={11} /> },
  en_proceso:    { label: "En proceso",    color: "#EA580C", bg: "rgba(234,88,12,0.1)",   icon: <Wrench size={11} /> },
  finalizado:    { label: "Finalizado",    color: "#059669", bg: "rgba(5,150,105,0.1)",   icon: <CheckCircle2 size={11} /> },
  rechazado:     { label: "Rechazado",     color: "#DC2626", bg: "rgba(220,38,38,0.1)",   icon: <AlertCircle size={11} /> },
};

export const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgente", color: "#DC2626" },
  high:   { label: "Alta",    color: "#D97706" },
  normal: { label: "Normal",  color: "#94A3B8" },
  low:    { label: "Baja",    color: "#CBD5E1" },
};

const EQUIPMENT_ICONS: Record<string, React.ReactNode> = {
  "MacBook": <Laptop size={14} />,
  "Dell":    <Laptop size={14} />,
  "HP":      <Laptop size={14} />,
  "Lenovo":  <Laptop size={14} />,
  "ASUS":    <Laptop size={14} />,
  "iMac":    <Monitor size={14} />,
  "Surface": <Laptop size={14} />,
  "Acer":    <Laptop size={14} />,
  "Play":    <Gamepad2 size={14} />,
  "Ninten":  <Gamepad2 size={14} />,
};

export function getEquipIcon(equipment: string) {
  for (const [key, icon] of Object.entries(EQUIPMENT_ICONS)) {
    if (equipment.startsWith(key)) return icon;
  }
  return <Monitor size={14} />;
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#64748B", bg: "rgba(100,116,139,0.1)", icon: null };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? { label: priority, color: "#94A3B8" };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: cfg.color }}>
      <span className="size-1.5" style={{ background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

export function KPICard({ label, value, sub, color, icon }: {
  label: string; value: number | string; sub: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div
      className="p-5 border flex flex-col gap-3"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
        borderLeft: `3px solid ${color}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "Inter, sans-serif" }}>
          {value}
        </div>
        <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{sub}</div>
      </div>
    </div>
  );
}

export function capitalize(str: string) {
  if (!str) return "";
  return str.trim().charAt(0).toUpperCase() + str.trim().slice(1);
}

export function capitalizeWords(str: string) {
  if (!str) return "";
  return str.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}
