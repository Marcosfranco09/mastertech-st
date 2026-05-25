const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/app/App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add new imports
const newImports = `
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/app/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/components/ui/alert-dialog";
`;
content = content.replace('import { Button } from "@/app/components/ui/button";', 'import { Button } from "@/app/components/ui/button";' + newImports);

// 2. Change static STOCK and CLIENTS to be exported or just leave them as initial data
// We'll move them to state inside App, so let's rename them to INITIAL_STOCK, INITIAL_CLIENTS
content = content.replace('const STOCK = [', 'const INITIAL_STOCK = [');
content = content.replace('const CLIENTS = [', 'const INITIAL_CLIENTS = [');

// 3. Update Sidebar settings button
content = content.replace(
  '<Settings size={13} style={{ color: "var(--sidebar-foreground)" }} />',
  '<button onClick={() => window.dispatchEvent(new CustomEvent("open-settings"))} className="p-1 hover:bg-white/10 rounded transition-colors"><Settings size={13} style={{ color: "var(--sidebar-foreground)" }} /></button>'
);

// 4. Update Header bell button
content = content.replace(
  '<button\n          className="relative p-2 transition-colors hover:bg-muted"\n          style={{ color: "var(--muted-foreground)" }}\n        >',
  '<button\n          onClick={() => window.dispatchEvent(new CustomEvent("open-notifications"))}\n          className="relative p-2 transition-colors hover:bg-muted"\n          style={{ color: "var(--muted-foreground)" }}\n        >'
);

// 5. Update Dashboard quick actions
content = content.replace(
  '{ label: "Registrar equipo",        icon: <Monitor size={13} />, color: "#7C3AED" },',
  '{ label: "Registrar equipo",        icon: <Monitor size={13} />, color: "#7C3AED", onClick: () => window.dispatchEvent(new CustomEvent("open-register-equipment")) },'
);
content = content.replace(
  '{ label: "Buscar por CI",           icon: <User size={13} />, color: "#059669" },',
  '{ label: "Buscar por CI",           icon: <User size={13} />, color: "#059669", onClick: () => { const el = document.querySelector("input[placeholder^=\'Buscar\']") as HTMLInputElement; if(el) el.focus(); } },'
);
content = content.replace(
  '{ label: "Ingreso de stock",        icon: <Package size={13} />, color: "#D97706" },',
  '{ label: "Ingreso de stock",        icon: <Package size={13} />, color: "#D97706", onClick: () => window.dispatchEvent(new CustomEvent("open-add-stock")) },'
);

// 6. OrdersView MoreHorizontal
const ordersViewMore = `
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 transition-colors hover:bg-muted"
                        style={{ color: "var(--muted-foreground)" }}
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedOrder(o.id); setView("order-detail"); }}>Ver detalles</DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info("Función de editar próxima a implementarse"); }}>Editar orden</DropdownMenuItem>
                      <DropdownMenuSeparator style={{ background: "var(--border)" }} />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.error("Orden eliminada"); }} style={{ color: "#DC2626" }}>Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
`;
content = content.replace(
  /<button\s+className="p-1 transition-colors hover:bg-muted"[\s\S]*?<MoreHorizontal size=\{14\} \/>\s+<\/button>/g,
  (match) => {
    if (match.includes('onClick={e => e.stopPropagation()}')) {
      return ordersViewMore;
    }
    return match;
  }
);

// 7. OrderDetailView actions
content = content.replace(
  '{[Share2, Download, Edit3].map((Icon, i) => (',
  `{[ 
    { Icon: Share2, onClick: () => { navigator.clipboard.writeText(window.location.href); toast.success("Enlace de orden copiado al portapapeles"); } },
    { Icon: Download, onClick: () => toast.success("Descargando PDF de la orden...") },
    { Icon: Edit3, onClick: () => toast.info("Abriendo modo edición...") }
  ].map(({Icon, onClick}, i) => (`
);
content = content.replace(
  'className="p-1.5 transition-colors hover:bg-muted"',
  'className="p-1.5 transition-colors hover:bg-muted"\n              onClick={onClick}'
);

// Add part button
content = content.replace(
  '<button className="text-xs flex items-center gap-1" style={{ color: "var(--primary)" }}>\n                      <Plus size={11} /> Agregar pieza\n                    </button>',
  '<button onClick={() => window.dispatchEvent(new CustomEvent("open-add-part"))} className="text-xs flex items-center gap-1 transition-opacity hover:opacity-80" style={{ color: "var(--primary)" }}>\n                      <Plus size={11} /> Agregar pieza\n                    </button>'
);

// Add note button
content = content.replace(
  '<button className="px-3 py-2 text-xs" style={{ background: "var(--primary)", color: "white" }}>\n                      <Send size={12} />\n                    </button>',
  '<button onClick={() => { if(note.trim()){ toast.success("Nota añadida exitosamente"); setNote(""); } }} className="px-3 py-2 text-xs hover:opacity-90 transition-opacity" style={{ background: "var(--primary)", color: "white" }}>\n                      <Send size={12} />\n                    </button>'
);

// Client history
content = content.replace(
  '<button\n                className="w-full text-xs py-1.5 border transition-colors hover:bg-muted/60"\n                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}\n              >\n                Ver historial del cliente\n              </button>',
  '<button\n                onClick={() => { setView("equipment"); toast.info("Mostrando historial de " + order.client); }}\n                className="w-full text-xs py-1.5 border transition-colors hover:bg-muted/60"\n                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}\n              >\n                Ver historial del cliente\n              </button>'
);

// Finalizar / Presupuesto / Cancelar
content = content.replace(
  '<button\n              className="w-full py-2 text-xs font-semibold transition-all hover:opacity-90"\n              style={{ background: "var(--primary)", color: "white" }}\n            >\n              Marcar como finalizado\n            </button>',
  '<button\n              onClick={() => toast.success("Orden marcada como finalizada")}\n              className="w-full py-2 text-xs font-semibold transition-all hover:opacity-90"\n              style={{ background: "var(--primary)", color: "white" }}\n            >\n              Marcar como finalizado\n            </button>'
);
content = content.replace(
  '<button\n              className="w-full py-2 text-xs font-medium border transition-colors hover:bg-muted/60"\n              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}\n            >\n              Generar presupuesto PDF\n            </button>',
  '<button\n              onClick={() => toast.success("Presupuesto en PDF generado")}\n              className="w-full py-2 text-xs font-medium border transition-colors hover:bg-muted/60"\n              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}\n            >\n              Generar presupuesto PDF\n            </button>'
);
content = content.replace(
  '<button\n              className="w-full py-2 text-xs font-medium transition-colors"\n              style={{ color: "#DC2626" }}\n            >\n              Cancelar orden\n            </button>',
  '<button\n              onClick={() => window.dispatchEvent(new CustomEvent("open-cancel-order"))}\n              className="w-full py-2 text-xs font-medium transition-colors hover:bg-red-500/10 rounded"\n              style={{ color: "#DC2626" }}\n            >\n              Cancelar orden\n            </button>'
);

// 8. EquipmentView Eye button
content = content.replace(
  '<button className="p-1 hover:bg-muted transition-colors" style={{ color: "var(--muted-foreground)" }}>\n                    <Eye size={12} />\n                  </button>',
  '<button onClick={(e) => { e.stopPropagation(); toast.info("Mostrando orden " + eq.lastOrder); }} className="p-1 hover:bg-muted transition-colors rounded" style={{ color: "var(--muted-foreground)" }}>\n                    <Eye size={12} />\n                  </button>'
);

// 9. StockView Add and More
content = content.replace(
  '<button\n          className="ml-auto px-3 py-1 text-xs font-medium flex items-center gap-1"\n          style={{ background: "var(--primary)", color: "white" }}\n        >\n          <Plus size={11} /> Agregar pieza\n        </button>',
  '<button\n          onClick={() => window.dispatchEvent(new CustomEvent("open-add-stock"))}\n          className="ml-auto px-3 py-1 text-xs font-medium flex items-center gap-1 hover:opacity-90 transition-opacity"\n          style={{ background: "var(--primary)", color: "white" }}\n        >\n          <Plus size={11} /> Agregar pieza\n        </button>'
);

const stockMore = `
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-muted transition-colors rounded" style={{ color: "var(--muted-foreground)" }}>
                          <MoreHorizontal size={13} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                        <DropdownMenuItem onClick={() => toast.info("Editando " + p.name)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Actualizando stock de " + p.name)}>Ajustar Stock</DropdownMenuItem>
                        <DropdownMenuSeparator style={{ background: "var(--border)" }} />
                        <DropdownMenuItem style={{ color: "#DC2626" }} onClick={() => toast.error("Pieza eliminada")}>Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
`;
content = content.replace(
  /<button className="p-1 hover:bg-muted transition-colors" style=\{\{ color: "var\(--muted-foreground\)" \}\}>\s*<MoreHorizontal size=\{13\} \/>\s*<\/button>/g,
  stockMore
);

// Replace INITIAL_STOCK usages inside StockView
content = content.replace(/STOCK\.filter/g, 'INITIAL_STOCK.filter');
content = content.replace(/STOCK\.map/g, 'INITIAL_STOCK.map');
content = content.replace(/CLIENTS\.length/g, 'INITIAL_CLIENTS.length');
content = content.replace(/CLIENTS\.reduce/g, 'INITIAL_CLIENTS.reduce');
content = content.replace(/CLIENTS\.map/g, 'INITIAL_CLIENTS.map');

// 10. App Shell Listeners and Modals
const appShellAdditions = `
  const [stock, setStock] = useState(INITIAL_STOCK);
  const [clients, setClients] = useState(INITIAL_CLIENTS);

  // Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRegisterEqOpen, setIsRegisterEqOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isCancelOrderOpen, setIsCancelOrderOpen] = useState(false);
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);

  // Global listeners
  import { useEffect } from "react";
  useEffect(() => {
    const handleSettings = () => setIsSettingsOpen(true);
    const handleNotif = () => setIsNotificationsOpen(true);
    const handleReg = () => setIsRegisterEqOpen(true);
    const handleStock = () => setIsAddStockOpen(true);
    const handleCancel = () => setIsCancelOrderOpen(true);
    const handleAddPart = () => setIsAddPartOpen(true);

    window.addEventListener("open-settings", handleSettings);
    window.addEventListener("open-notifications", handleNotif);
    window.addEventListener("open-register-equipment", handleReg);
    window.addEventListener("open-add-stock", handleStock);
    window.addEventListener("open-cancel-order", handleCancel);
    window.addEventListener("open-add-part", handleAddPart);

    return () => {
      window.removeEventListener("open-settings", handleSettings);
      window.removeEventListener("open-notifications", handleNotif);
      window.removeEventListener("open-register-equipment", handleReg);
      window.removeEventListener("open-add-stock", handleStock);
      window.removeEventListener("open-cancel-order", handleCancel);
      window.removeEventListener("open-add-part", handleAddPart);
    };
  }, []);
`;
content = content.replace('const [orders, setOrders] = useState(INITIAL_ORDERS);', 'const [orders, setOrders] = useState(INITIAL_ORDERS);\n' + appShellAdditions);

// In App return: Toaster and Dialogs
const globalModals = `
      <Toaster theme="dark" position="bottom-right" />
      
      {/* Modals placeholders */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader><DialogTitle>Configuración del Sistema</DialogTitle></DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">Opciones de configuración de la tienda.</div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader><DialogTitle>Notificaciones</DialogTitle></DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">No hay notificaciones nuevas.</div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRegisterEqOpen} onOpenChange={setIsRegisterEqOpen}>
        <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader><DialogTitle>Registrar Equipo Rápido</DialogTitle></DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">Formulario de registro de equipo...</div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader><DialogTitle>Añadir Pieza a Stock</DialogTitle></DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">Formulario de nueva pieza de inventario...</div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddPartOpen} onOpenChange={setIsAddPartOpen}>
        <DialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader><DialogTitle>Asignar Pieza a la Orden</DialogTitle></DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">Seleccionar pieza de inventario...</div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCancelOrderOpen} onOpenChange={setIsCancelOrderOpen}>
        <AlertDialogContent style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar orden de trabajo?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. La orden quedará archivada como cancelada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={() => toast.success("Orden cancelada")} style={{ background: "#DC2626", color: "white" }}>Sí, cancelar orden</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
`;

content = content.replace(
  '<NewOrderModal open={isModalOpen} onOpenChange={setIsModalOpen} onSave={(o) => setOrders([o, ...orders])} />',
  '<NewOrderModal open={isModalOpen} onOpenChange={setIsModalOpen} onSave={(o) => { setOrders([o, ...orders]); toast.success("Orden creada exitosamente"); }} />\n' + globalModals
);

// Fix the import { useEffect } which is placed after other things, better move it top
content = content.replace('import { useEffect } from "react";', '');
content = content.replace('import { useState } from "react";', 'import { useState, useEffect } from "react";');

fs.writeFileSync(appPath, content);
console.log("App.tsx updated successfully.");
