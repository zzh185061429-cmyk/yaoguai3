import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PopCard } from "./ui/PopCard";
import { AlertTriangle, Info } from "lucide-react";
import { sfx } from "../audio/sfxPlayer";

type ToastType = "normal" | "alert";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "normal") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    sfx.play(type === "alert" ? "toastAlert" : "toastNormal");
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-10 right-4 z-50 flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ x: 100, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 100, opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="pointer-events-auto"
            >
              {toast.type === "alert" ? (
                <PopCard variant="pink" skew className="flex items-center gap-3 p-4 shadow-pop-lg max-w-xs border-pop-pink">
                  <AlertTriangle className="w-8 h-8 text-white animate-pulse shrink-0" />
                  <span className="font-black text-lg leading-tight uppercase text-white">
                    {toast.message}
                  </span>
                </PopCard>
              ) : (
                <PopCard variant="cyan" className="flex items-center gap-3 p-3 shadow-pop max-w-xs clip-diagonal">
                  <Info className="w-6 h-6 shrink-0" />
                  <span className="font-bold text-sm">
                    {toast.message}
                  </span>
                </PopCard>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
