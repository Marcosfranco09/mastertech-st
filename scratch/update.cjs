const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/app/App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
const imports = `
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
`;
content = content.replace('import logoImg', imports.trim() + '\nimport logoImg');

// 2. Rename ORDERS to INITIAL_ORDERS
content = content.replace('const ORDERS = [', 'const INITIAL_ORDERS = [');

// 3. Update Dashboard
content = content.replace(
  'function Dashboard({ setView, setSelectedOrder }: { setView: (v: string) => void; setSelectedOrder: (o: string) => void }) {',
  'function Dashboard({ setView, setSelectedOrder, orders, onNewOrder }: { setView: (v: string) => void; setSelectedOrder: (o: string) => void; orders: any[]; onNewOrder: () => void }) {'
);
content = content.replace('const recent = ORDERS.slice(0, 6);', 'const recent = orders.slice(0, 6);');
content = content.replace('ORDERS.filter(o => o.priority === "urgent")', 'orders.filter(o => o.priority === "urgent")');
content = content.replace(
  '{ label: "Nueva orden de trabajo", icon: <Plus size={13} />, color: "#0047AB" },',
  '{ label: "Nueva orden de trabajo", icon: <Plus size={13} />, color: "#0047AB", onClick: onNewOrder },'
);
content = content.replace(
  'onClick={() => setView("orders")}', // might be multiple, but we only want the one in "Accesos rápidos" which we are changing below
  'onClick={() => setView("orders")}' 
);

// Fix the map for Accesos rapidos
content = content.replace(
  '.map(({ label, icon, color }) => (',
  '.map(({ label, icon, color, onClick }) => ('
);
content = content.replace(
  '<button\n                  key={label}\n                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-muted/40"\n                  style={{ color: "var(--foreground)" }}\n                >',
  '<button\n                  key={label}\n                  onClick={onClick}\n                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-muted/40"\n                  style={{ color: "var(--foreground)" }}\n                >'
);

// 4. Update OrdersView
content = content.replace(
  'function OrdersView({ setView, setSelectedOrder }: { setView: (v: string) => void; setSelectedOrder: (o: string) => void }) {',
  'function OrdersView({ setView, setSelectedOrder, orders }: { setView: (v: string) => void; setSelectedOrder: (o: string) => void; orders: any[] }) {'
);
content = content.replace('const filtered = ORDERS.filter(o => {', 'const filtered = orders.filter(o => {');
content = content.replace('Mostrando {filtered.length} de {ORDERS.length} órdenes', 'Mostrando {filtered.length} de {orders.length} órdenes');

// 5. Update OrderDetailView
content = content.replace(
  'function OrderDetailView({ orderId, setView }: { orderId: string; setView: (v: string) => void }) {',
  'function OrderDetailView({ orderId, setView, orders }: { orderId: string; setView: (v: string) => void; orders: any[] }) {'
);
content = content.replace('const order = ORDERS.find(o => o.id === orderId) ?? ORDERS[0];', 'const order = orders.find(o => o.id === orderId) ?? orders[0];');

// 6. Add NewOrderModal
const newOrderModal = `
function NewOrderModal({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (o: any) => void }) {
  const [formData, setFormData] = useState({
    client: "", ci: "", equipment: "", model: "", serial: "", priority: "normal", issue: ""
  });

  const handleSave = () => {
    const newOrder = {
      id: \`OT-\${Math.floor(Math.random() * 1000) + 3000}\`,
      ...formData,
      status: "diagnosis",
      tech: "Sin asignar",
      date: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).replace(".", ""),
    };
    onSave(newOrder);
    onOpenChange(false);
    setFormData({ client: "", ci: "", equipment: "", model: "", serial: "", priority: "normal", issue: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Nueva Orden de Trabajo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Cliente</Label>
              <Input
                placeholder="Nombre del cliente"
                value={formData.client}
                onChange={e => setFormData({ ...formData, client: e.target.value })}
                className="text-xs"
                style={{ background: "var(--input)", borderColor: "var(--border)" }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">CI / RUT</Label>
              <Input
                placeholder="Ej. 12.345.678-9"
                value={formData.ci}
                onChange={e => setFormData({ ...formData, ci: e.target.value })}
                className="text-xs"
                style={{ background: "var(--input)", borderColor: "var(--border)" }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-1">
              <Label className="text-xs">Tipo de equipo</Label>
              <Select value={formData.equipment} onValueChange={v => setFormData({ ...formData, equipment: v })}>
                <SelectTrigger className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }}>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <SelectItem value="MacBook Pro">MacBook Pro</SelectItem>
                  <SelectItem value="Dell XPS">Dell XPS</SelectItem>
                  <SelectItem value="HP Pavilion">HP Pavilion</SelectItem>
                  <SelectItem value="PlayStation 5">PlayStation 5</SelectItem>
                  <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-1">
              <Label className="text-xs">Modelo</Label>
              <Input
                placeholder="Modelo"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                className="text-xs"
                style={{ background: "var(--input)", borderColor: "var(--border)" }}
              />
            </div>
            <div className="space-y-2 col-span-1">
              <Label className="text-xs">Serial</Label>
              <Input
                placeholder="Número de serie"
                value={formData.serial}
                onChange={e => setFormData({ ...formData, serial: e.target.value })}
                className="text-xs"
                style={{ background: "var(--input)", borderColor: "var(--border)" }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Prioridad</Label>
            <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
              <SelectTrigger className="text-xs" style={{ background: "var(--input)", borderColor: "var(--border)" }}>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Problema reportado</Label>
            <Textarea
              placeholder="Descripción detallada del problema..."
              value={formData.issue}
              onChange={e => setFormData({ ...formData, issue: e.target.value })}
              className="text-xs h-24 resize-none"
              style={{ background: "var(--input)", borderColor: "var(--border)" }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="text-xs" style={{ background: "var(--primary)", color: "white" }}>
            Crear orden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

`;
content = content.replace('export default function App() {', newOrderModal + 'export default function App() {');

// 7. Update App state and returns
content = content.replace(
  'const [selectedOrder, setSelectedOrder] = useState("OT-2847");',
  'const [selectedOrder, setSelectedOrder] = useState("OT-2847");\n  const [orders, setOrders] = useState(INITIAL_ORDERS);\n  const [isModalOpen, setIsModalOpen] = useState(false);'
);

content = content.replace(
  '<Header title={VIEW_TITLES[view] ?? ""} onNewOrder={() => setView("orders")} />',
  '<Header title={VIEW_TITLES[view] ?? ""} onNewOrder={() => setIsModalOpen(true)} />'
);

content = content.replace(
  '{view === "dashboard"    && <Dashboard setView={setView} setSelectedOrder={setSelectedOrder} />}',
  '{view === "dashboard"    && <Dashboard setView={setView} setSelectedOrder={setSelectedOrder} orders={orders} onNewOrder={() => setIsModalOpen(true)} />}'
);

content = content.replace(
  '{view === "orders"       && <OrdersView setView={setView} setSelectedOrder={setSelectedOrder} />}',
  '{view === "orders"       && <OrdersView setView={setView} setSelectedOrder={setSelectedOrder} orders={orders} />}'
);

content = content.replace(
  '{view === "order-detail" && <OrderDetailView orderId={selectedOrder} setView={setView} />}',
  '{view === "order-detail" && <OrderDetailView orderId={selectedOrder} setView={setView} orders={orders} />}'
);

content = content.replace(
  '</div>\n    </div>\n  );\n}',
  '</div>\n      <NewOrderModal open={isModalOpen} onOpenChange={setIsModalOpen} onSave={(o) => setOrders([o, ...orders])} />\n    </div>\n  );\n}'
);

fs.writeFileSync(file, content);
console.log('App.tsx updated');
