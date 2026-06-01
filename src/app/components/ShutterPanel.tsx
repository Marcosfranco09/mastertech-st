import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "@/app/motion";

const SHUTTER_TRANSITION = { duration: 0.38, ease: [0.4, 0, 0.2, 1] as const, type: "tween" as const };
const CONTENT_TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const, type: "tween" as const };

/** Persiana en altura + crossfade suave al cambiar contenido */
export function ShutterPanel({
  panelKey,
  children,
  className,
}: {
  panelKey: string | number;
  children: ReactNode;
  className?: string;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [panelKey]);

  return (
    <motion.div
      initial={false}
      animate={{ height }}
      transition={SHUTTER_TRANSITION}
      className={className}
      style={{ overflow: "hidden" }}
    >
      <div ref={innerRef} className="relative">
        <AnimatePresence initial={false}>
          <motion.div
            key={panelKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
            }}
            transition={CONTENT_TRANSITION}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/** Cuerpo de modal con scroll y efecto persiana */
export function DialogShutterBody({
  panelKey,
  children,
  className,
  scrollClassName,
}: {
  panelKey: string | number;
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
}) {
  return (
    <ShutterPanel panelKey={panelKey} className={className}>
      <div className={scrollClassName ?? "max-h-[min(65vh,560px)] overflow-y-auto"}>
        {children}
      </div>
    </ShutterPanel>
  );
}
