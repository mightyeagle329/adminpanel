"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type ToastVariant = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  addToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const next: Toast = { id, ...toast };
      setToasts((prev) => [...prev, next]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed z-50 top-4 right-4 space-y-2 w-80 max-w-full">
        {toasts.map((toast) => {
          const variant = toast.variant || "info";
          const base =
            "rounded-lg border px-3.5 py-2.5 text-xs shadow-lg flex flex-col gap-1 transition-transform transform";
          const styles =
            variant === "success"
              ? "bg-emerald-900/80 border-emerald-500/70 text-emerald-50"
              : variant === "error"
              ? "bg-red-900/80 border-red-500/70 text-red-50"
              : variant === "warning"
              ? "bg-yellow-900/80 border-yellow-500/70 text-yellow-50"
              : "bg-gray-800/90 border-gray-600 text-gray-50";

          return (
            <div
              key={toast.id}
              className={`${base} ${styles}`}
            >
              {toast.title && (
                <div className="font-semibold text-[11px] tracking-wide uppercase opacity-90">
                  {toast.title}
                </div>
              )}
              <div className="text-[11px] leading-snug whitespace-pre-line">
                {toast.description}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
