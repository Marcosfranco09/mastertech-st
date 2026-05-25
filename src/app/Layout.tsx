import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { LayoutDashboard, ClipboardList, Monitor, Package, Layers, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/store/AppContext";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logoImg from "@/imports/473046427_917832650556773_1093528259182468086_n.png";

const NAV_ITEMS = [
  { id: "dashboard", label: "Panel",     icon: LayoutDashboard, path: "/" },
  { id: "orders",    label: "Órdenes",   icon: ClipboardList,   path: "/ordenes" },
  { id: "equipment", label: "Clientes",  icon: Monitor,         path: "/equipos" },
  { id: "stock",     label: "Stock",     icon: Package,         path: "/stock" },
  { id: "assemblies",label: "Ensambles", icon: Layers,          path: "/ensambles" },
];

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const sidebarItem = {
  hidden: { x: -12, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

const TECNICOS = ["Oscar Gomez", "Orlando Moreno", "Marcos Franco"];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase();
}

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const [tech, setTech] = useState("Oscar Gomez");
  const [techOpen, setTechOpen] = useState(false);
  const techRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (techRef.current && !techRef.current.contains(e.target as Node)) {
        setTechOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeId = NAV_ITEMS.find(i => 
    i.path === "/" ? location.pathname === "/" : location.pathname.startsWith(i.path)
  )?.id || "dashboard";

  return (
    <aside
      className="flex flex-col w-[220px] min-h-screen shrink-0 border-r"
      style={{ background: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}
    >
      <div className="flex items-center justify-center px-4 py-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <ImageWithFallback
          src={logoImg}
          alt="MasterTech Gamer Store"
          className="w-full max-w-[160px] object-contain"
          style={{ height: 64 }}
        />
      </div>

      <motion.nav
        className="flex-1 px-3 py-4 space-y-0.5"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => {
          const active = activeId === id;
          return (
            <motion.button
              key={id}
              variants={sidebarItem}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all duration-150"
              whileHover={{ x: 4 }}
              style={{
                background: active ? "var(--sidebar-accent)" : "transparent",
                color: active ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
              }}
            >
              <Icon size={15} />
              {label}
            </motion.button>
          );
        })}
      </motion.nav>

      <div className="px-4 py-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <div
          className="text-[10px] uppercase tracking-widest mb-2.5 font-semibold"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          En vivo
        </div>
        <div className="space-y-2">
          {[
            { label: "Recepcionado",  val: state.orders.filter(o => o.estado === "recepcionado").length,  color: "#94A3B8" },
            { label: "Diagnosticado", val: state.orders.filter(o => o.estado === "diagnosticado").length, color: "#93C5FD" },
            { label: "En proceso",    val: state.orders.filter(o => o.estado === "en_proceso" || o.estado === "en_espera").length, color: "#FED7AA" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--sidebar-foreground)" }}>{label}</span>
              <span className="text-xs font-semibold font-mono" style={{ color }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative px-4 py-3 border-t" style={{ borderColor: "var(--sidebar-border)" }} ref={techRef}>
        <button
          onClick={() => setTechOpen(!techOpen)}
          className="w-full flex items-center gap-2.5"
        >
          <div
            className="size-7 flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "#2563EB", color: "white" }}
          >
            {getInitials(tech)}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="text-xs font-medium truncate" style={{ color: "white" }}>{tech}</div>
            <div className="text-[10px]" style={{ color: "var(--sidebar-foreground)" }}>Técnico</div>
          </div>
          <motion.div animate={{ rotate: techOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronUp size={13} style={{ color: "var(--sidebar-foreground)" }} />
          </motion.div>
        </button>

        <AnimatePresence>
          {techOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: 8, scaleY: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-2 right-2 mb-2 overflow-hidden"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 -4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {TECNICOS.map(t => (
                <button
                  key={t}
                  onClick={() => { setTech(t); setTechOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-muted"
                  style={{
                    background: t === tech ? "var(--muted)" : "transparent",
                    color: t === tech ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                >
                  <div className="size-5 flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "#2563EB", color: "white" }}>
                    {getInitials(t)}
                  </div>
                  {t}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function Header({ title }: { title: string }) {
  return (
    <header
      className="flex items-center justify-between px-6 h-[56px] border-b shrink-0 select-none"
      style={{ 
        background: "var(--card)", 
        borderColor: "var(--border)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-3.5 rounded-full" style={{ background: "var(--primary)" }} />
        <span 
          className="text-xs uppercase tracking-widest font-semibold" 
          style={{ color: "var(--muted-foreground)", fontSize: "10px" }}
        >
          MasterTech
        </span>
        <span className="text-[10px] font-light" style={{ color: "var(--border)" }}>/</span>
        <h1 
          className="text-xs font-bold tracking-wide" 
          style={{ color: "var(--foreground)" }}
        >
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span 
          className="text-[9px] font-semibold font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider"
          style={{ 
            background: "rgba(37,99,235,0.06)", 
            color: "#2563EB", 
            border: "1px solid rgba(37,99,235,0.12)" 
          }}
        >
          Servicio Técnico
        </span>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const titles: Record<string, string> = {
    "/": "Panel",
    "/ordenes": "Órdenes de trabajo",
    "/equipos": "Clientes",
    "/stock": "Gestión de stock",
    "/ensambles": "Ensambles y armados",
  };
  const title = titles[location.pathname] || (location.pathname.startsWith("/ordenes") ? "Detalle de orden" : "");

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      translate="no"
      style={{ fontFamily: "Inter, sans-serif", background: "var(--background)" }}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} />
        <main className="flex flex-1 min-h-0 overflow-hidden" style={{ background: "var(--background)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
