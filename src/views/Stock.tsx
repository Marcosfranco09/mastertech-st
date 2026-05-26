import { Plus, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { motion } from "@/app/motion";

export function Stock() {
  const { state, actions } = useAppContext();
  const lowStock = state.stock.filter(p => p.stock <= p.min);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 border border-l-4" style={{
          background: "rgba(217,119,6,0.06)", borderColor: "rgba(217,119,6,0.2)", borderLeftColor: "#D97706", color: "#D97706",
        }}>
          <AlertTriangle size={14} />
          <span className="text-xs font-medium">
            {lowStock.length} {lowStock.length === 1 ? "pieza" : "piezas"} con stock bajo o agotado:&nbsp;
            {lowStock.map(p => p.name.split(" ").slice(0, 3).join(" ")).join(", ")}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <motion.button onClick={() => window.dispatchEvent(new CustomEvent("open-add-stock"))}
          className="px-3 py-1.5 text-xs font-medium flex items-center gap-1"
          style={{ background: "var(--primary)", color: "white" }}
          whileHover={{ opacity: 0.9, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}>
          <Plus size={11} /> Agregar pieza
        </motion.button>

        {state.stock.length > 0 && (
          <motion.button onClick={async () => {
            if (confirm("¿Estás seguro de que deseas eliminar todos los productos del stock?")) {
              await actions.clearStock();
            }
          }}
            className="px-3 py-1.5 text-xs font-medium flex items-center gap-1 border"
            style={{ borderColor: "rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.06)", color: "#DC2626" }}
            whileHover={{ opacity: 0.9, scale: 1.02, background: "rgba(220,38,38,0.12)" }}
            whileTap={{ scale: 0.96 }}>
            Eliminar todo
          </motion.button>
        )}
      </div>

      <div className="border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
              {["Nombre", "Categoría", "Stock", "Estado", "Precio"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.stock.map((p, i) => {
              const isOut = p.stock === 0;
              const isLow = !isOut && p.stock <= p.min;
              return (
                <motion.tr key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  whileHover={{ backgroundColor: "var(--muted)" }}
                  style={{ borderBottom: i < state.stock.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{p.name}</span>
                      {p.recent && <span className="text-[9px] px-1.5 py-0.5 font-semibold" style={{ background: "rgba(0,71,171,0.1)", color: "var(--primary)" }}>NUEVO</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{p.category}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold font-mono" style={{ color: isOut ? "#DC2626" : isLow ? "#D97706" : "var(--foreground)" }}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    {isOut ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5" style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}>
                        <XCircle size={10} /> Agotado
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5" style={{ background: "rgba(217,119,6,0.1)", color: "#D97706" }}>
                        <AlertTriangle size={10} /> Stock bajo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>
                        <CheckCircle2 size={10} /> Disponible
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className="text-xs font-mono" style={{ color: "var(--foreground)" }}>₲ {p.price.toLocaleString()}</span></td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {state.stock.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
            No hay piezas en stock.
          </div>
        )}
      </div>
    </div>
  );
}