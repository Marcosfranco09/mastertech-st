import { useState, useEffect, useRef } from "react";

type ToastType = "success" | "error" | "info";

const _toastRef: { fn: (msg: string, type?: ToastType) => void } = { fn: () => {} };

export const toast = {
  success: (msg: string) => { try { _toastRef.fn(msg, "success"); } catch {} },
  error:   (msg: string) => { try { _toastRef.fn(msg, "error");   } catch {} },
  info:    (msg: string) => { try { _toastRef.fn(msg, "info");    } catch {} },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<{id:number;msg:string;type:ToastType}[]>([]);
  const setToastsRef = useRef(setToasts);
  setToastsRef.current = setToasts;

  useEffect(() => {
    _toastRef.fn = (msg: string, type: ToastType = "info") => {
      const id = Date.now() + Math.random();
      setToastsRef.current(t => [...t, { id, msg, type }]);
      setTimeout(() => setToastsRef.current(t => t.filter(x => x.id !== id)), 3500);
    };
    return () => { _toastRef.fn = () => {}; };
  }, []);

  const colors: Record<ToastType, string> = {
    success: "#059669", error: "#DC2626", info: "#2563EB"
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: "var(--card)",
          border: `1px solid ${colors[t.type]}40`,
          borderLeft: `3px solid ${colors[t.type]}`,
          color: "var(--foreground)",
          padding: "10px 16px",
          fontSize: 13,
          fontFamily: "Inter, sans-serif",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          minWidth: 260,
          maxWidth: 380,
          opacity: 1,
          transition: "opacity 0.3s",
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
