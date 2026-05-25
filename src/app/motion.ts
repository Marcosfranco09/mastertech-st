import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

export { motion, AnimatePresence };

export const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

export const cardHover = {
  whileHover: { y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.1)", transition: { duration: 0.2, ease: "easeOut" } },
  whileTap: { scale: 0.99 },
};

export const sidebarItem = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
};