import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Activity, Search, CheckCircle2, Box, Plus, Calendar, AlertCircle, ClipboardList, PackageOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useAppContext } from "@/store/AppContext";
import { KPICard, isOrdenActiva, isOrdenEnTaller } from "@/app/helpers";
import { ReceptionModal } from "./OrdenesPage";
import { BarChart, Bar, Cell, LabelList, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { DialogScrollBody } from "@/app/components/ShutterPanel";
import { format, parseISO, getDaysInMonth, addDays } from "date-fns";
import { es } from "date-fns/locale";

const fadeUp = {
  hidden: { y: 20, opacity: 0 },
  visible: (i: number) => ({ y: 0, opacity: 1, transition: { delay: i * 0.06, type: "spring", stiffness: 200, damping: 22 } }),
};

export function Dashboard() {
  const navigate = useNavigate();
  const { state, actions } = useAppContext();
  const [showReception, setShowReception] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  const filter = state.globalMonthFilter;

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

  const { ingresosChartData, entregadosChartData, monthOrders, monthEntregados } = useMemo(() => {
    const filteredIngresos = state.orders.filter(o => filter === "todos" || o.fecha_recepcion?.startsWith(filter));
    const filteredEntregados = state.orders.filter(o => o.estado === "entregado" && (filter === "todos" || o.fecha_entrega?.startsWith(filter)));

    // Grouping for charts
    const ingresosMap: Record<string, number> = {};
    const entregadosMap: Record<string, number> = {};

    filteredIngresos.forEach(o => {
      if (!o.fecha_recepcion) return;
      const day = filter === "todos" ? o.fecha_recepcion.slice(0, 7) : o.fecha_recepcion.slice(0, 10);
      ingresosMap[day] = (ingresosMap[day] || 0) + 1;
    });

    filteredEntregados.forEach(o => {
      if (!o.fecha_entrega) return;
      const day = filter === "todos" ? o.fecha_entrega.slice(0, 7) : o.fecha_entrega.slice(0, 10);
      entregadosMap[day] = (entregadosMap[day] || 0) + 1;
    });

    const sortAndFormat = (map: Record<string, number>) => {
      if (filter === "todos") {
        return Object.entries(map)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, count]) => ({
            date: format(parseISO(`${date}-01`), "MMM yyyy", { locale: es }),
            count,
            isSunday: false
          }));
      } else {
        const start = parseISO(`${filter}-01`);
        const days = getDaysInMonth(start);
        return Array.from({ length: days }, (_, i) => {
          const currentDay = addDays(start, i);
          const dateStr = currentDay.toISOString().slice(0, 10);
          return {
            date: format(currentDay, "dd MMM", { locale: es }),
            count: map[dateStr] || 0,
            isSunday: currentDay.getDay() === 0
          };
        });
      }
    };

    return {
      ingresosChartData: sortAndFormat(ingresosMap),
      entregadosChartData: sortAndFormat(entregadosMap),
      monthOrders: filteredIngresos,
      monthEntregados: filteredEntregados
    };
  }, [state.orders, filter]);

  const activas = state.orders.filter(o => isOrdenActiva(o.estado)); // Total en servicio nunca se reinicia

  const maxIngresos = Math.max(6, ingresosChartData.length > 0 ? Math.max(...ingresosChartData.map(d => d.count)) : 0);
  const ingresosTicks = maxIngresos <= 15 ? Array.from({ length: maxIngresos + 1 }, (_, i) => i) : undefined;

  const maxEntregados = Math.max(6, entregadosChartData.length > 0 ? Math.max(...entregadosChartData.map(d => d.count)) : 0);
  const entregadosTicks = maxEntregados <= 15 ? Array.from({ length: maxEntregados + 1 }, (_, i) => i) : undefined;

  const ingresosCount = monthOrders.length;
  const entregadosCount = monthEntregados.length;
  const efficiencyRate = ingresosCount > 0 ? Math.round((entregadosCount / ingresosCount) * 100) : 0;

  const avgTurnaroundTime = useMemo(() => {
    if (monthEntregados.length === 0) return "0.0";
    const totalDays = monthEntregados.reduce((sum, o) => {
      if (!o.fecha_recepcion || !o.fecha_entrega) return sum;
      const rec = new Date(o.fecha_recepcion);
      const ent = new Date(o.fecha_entrega);
      const diffTime = Math.abs(ent.getTime() - rec.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    return (totalDays / monthEntregados.length).toFixed(1);
  }, [monthEntregados]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Panel de Control</h1>
          <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Resumen general de gestión y servicio técnico</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-48">
            <Select value={filter} onValueChange={actions.setGlobalMonthFilter}>
              <SelectTrigger className="h-8 text-xs font-medium bg-card border-border shadow-sm">
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
          <motion.button
            onClick={() => setShowInventory(true)}
            className="h-8 px-3 text-xs font-medium flex items-center transition-all rounded shadow-sm border"
            style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PackageOpen size={13} className="mr-2 opacity-70" /> Equipos en Local
          </motion.button>
          <motion.button
            onClick={() => setShowReception(true)}
            className="h-8 px-3 text-xs font-medium flex items-center hover:opacity-90 transition-all rounded shadow-sm"
            style={{ background: "var(--primary)", color: "white" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={13} className="mr-2 opacity-70" /> Nueva Recepción
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Órdenes activas", value: activas.length, sub: "Total físico en servicio", color: "#2563EB", icon: <Activity size={15} /> },
          { label: "Equipos Ingresados", value: monthOrders.length, sub: filter === "todos" ? "Total histórico" : "Este mes", color: "#64748B", icon: <Search size={15} /> },
          { label: "Rechazados", value: monthOrders.filter(o => o.estado === "rechazado").length, sub: "Del periodo actual", color: "#DC2626", icon: <AlertCircle size={15} /> },
          { label: "Equipos Entregados", value: monthEntregados.length, sub: filter === "todos" ? "Total histórico" : "Este mes", color: "#059669", icon: <CheckCircle2 size={15} /> },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="border rounded-lg p-5"
          style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Equipos Entrantes</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ingresosChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} dy={10} />
                <YAxis allowDecimals={false} domain={[0, maxIngresos]} ticks={ingresosTicks} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  itemStyle={{ color: "var(--primary)" }}
                  labelStyle={{ color: "var(--muted-foreground)", marginBottom: "4px" }}
                />
                <Bar dataKey="count" name="Ingresados" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={50} minPointSize={4}>
                  {ingresosChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isSunday ? 'rgba(37, 99, 235, 0.4)' : '#2563EB'} />
                  ))}
                  <LabelList dataKey="count" position="top" style={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="border rounded-lg p-5"
          style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Equipos Entregados</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entregadosChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} dy={10} />
                <YAxis allowDecimals={false} domain={[0, maxEntregados]} ticks={entregadosTicks} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  itemStyle={{ color: "#059669" }}
                  labelStyle={{ color: "var(--muted-foreground)", marginBottom: "4px" }}
                />
                <Bar dataKey="count" name="Entregados" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={50} minPointSize={4}>
                  {entregadosChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isSunday ? 'rgba(5, 150, 105, 0.4)' : '#059669'} />
                  ))}
                  <LabelList dataKey="count" position="top" style={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        </div>

        <div className="col-span-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="border rounded-lg p-5 flex flex-col items-center justify-center bg-card text-card-foreground"
            style={{ borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <h3 className="text-sm font-semibold mb-4 w-full text-left text-muted-foreground">Ratio de Resolución</h3>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" stroke="var(--border)" strokeWidth="12" fill="none" />
                <circle cx="64" cy="64" r="56" stroke={efficiencyRate >= 100 ? "#059669" : efficiencyRate >= 70 ? "#D97706" : "#DC2626"} strokeWidth="12" fill="none" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * Math.min(efficiencyRate, 100)) / 100} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute flex flex-col items-center mt-2">
                <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{efficiencyRate}%</span>
                <span className="text-[10px] text-muted-foreground mt-1">{entregadosCount} / {ingresosCount}</span>
              </div>
            </div>
            
            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Equipos Ingresados:</span>
                <span className="font-medium" style={{ color: "var(--foreground)" }}>{ingresosCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Equipos Entregados:</span>
                <span className="font-medium" style={{ color: "var(--foreground)" }}>{entregadosCount}</span>
              </div>
              <div className="flex justify-between text-xs border-t pt-2 mt-2" style={{ borderColor: "var(--border)" }}>
                <span className="text-muted-foreground">Saldo Neto (Mes):</span>
                <span className={`font-medium ${ingresosCount - entregadosCount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                  {ingresosCount - entregadosCount > 0 ? "+" : ""}{ingresosCount - entregadosCount}
                </span>
              </div>
            </div>
            
            <p className="text-[11px] text-center mt-4 text-muted-foreground">
              {efficiencyRate >= 100 ? "¡Servicio al día! Limpiando trabajo pendiente." : "Atención: Acumulando trabajo pendiente en el mes."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="border rounded-lg p-5 flex flex-col justify-center bg-card text-card-foreground h-full max-h-[220px]"
            style={{ borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Tiempo Medio de Reparación</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold" style={{ color: "var(--foreground)" }}>{avgTurnaroundTime}</span>
              <span className="text-sm text-muted-foreground">días</span>
            </div>
            <p className="text-xs mt-4 text-muted-foreground">
              Promedio de días que demora un equipo desde el ingreso hasta la entrega en el mes seleccionado.
            </p>
          </motion.div>
        </div>
      </div>

      <ReceptionModal open={showReception} onOpenChange={setShowReception} />

      <Dialog open={showInventory} onOpenChange={setShowInventory}>
        <DialogContent className="w-[90vw] max-w-[1100px] sm:max-w-[1100px]" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <PackageOpen size={18} /> Equipos en el Local (Auditoría Física)
            </DialogTitle>
          </DialogHeader>
          <DialogScrollBody className="max-h-[60vh]">
            <div className="space-y-2 p-1">
              <div className="grid grid-cols-12 gap-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b mb-2" style={{ borderColor: "var(--border)" }}>
                <div className="col-span-5">Equipo / Cliente</div>
                <div className="col-span-4 text-center">Fecha de Ingreso</div>
                <div className="col-span-3 text-right">Estado Actual</div>
              </div>

              {state.orders.filter(o => isOrdenEnTaller(o)).length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No hay equipos físicos en el local en este momento.</p>
              ) : (
                state.orders.filter(o => isOrdenEnTaller(o)).map(orden => {
                  const linkedEquipo = orden.equipo_id ? state.equipos.find(e => e.id === orden.equipo_id) : null;
                  const marca = orden.marca || linkedEquipo?.marca || "—";
                  return (
                    <div 
                      key={orden.id} 
                      onClick={() => {
                        setShowInventory(false);
                        navigate(`/ordenes/${orden.id}`);
                      }}
                      className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg border text-sm hover:bg-muted/50 transition-colors cursor-pointer" 
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="col-span-5 flex flex-col">
                        <span className="font-semibold">{marca} {orden.modelo}</span>
                        <span className="text-xs text-muted-foreground">ID: #{orden.id.slice(0,8)} • Cliente: {orden.nombre_cliente}</span>
                      </div>
                      <div className="col-span-4 flex justify-center text-sm items-center gap-2" style={{ color: "var(--foreground)" }}>
                        <span>{new Date(orden.fecha_recepcion).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span className="text-muted-foreground opacity-50">|</span>
                        <span className={`font-semibold ${Math.floor((new Date().getTime() - new Date(orden.fecha_recepcion).getTime()) / (1000 * 3600 * 24)) > 30 ? "text-red-500" : "text-muted-foreground"}`}>
                          {Math.floor((new Date().getTime() - new Date(orden.fecha_recepcion).getTime()) / (1000 * 3600 * 24))} días
                        </span>
                      </div>
                      <div className="col-span-3 flex justify-end">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider text-center" 
                              style={{ 
                                background: orden.estado === "rechazado" ? "rgba(220,38,38,0.1)" : orden.estado === "finalizado" ? "rgba(5,150,105,0.1)" : "rgba(37,99,235,0.1)",
                                color: orden.estado === "rechazado" ? "#DC2626" : orden.estado === "finalizado" ? "#059669" : "#2563EB"
                              }}>
                          {orden.estado.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </DialogScrollBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
