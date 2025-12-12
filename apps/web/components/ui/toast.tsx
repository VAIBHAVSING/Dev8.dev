"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: (id: string) => void;
}

const variantStyles = {
  default: "bg-card border-border",
  success: "bg-card border-accent text-accent",
  error: "bg-card border-destructive text-destructive",
  warning: "bg-card border-warning text-warning",
  info: "bg-card border-info text-info",
};

const variantIcons = {
  default: "ℹ️",
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "💡",
};

export function Toast({
  id,
  title,
  description,
  variant = "default",
  onClose,
}: ToastProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-md rounded-lg border-2 p-4 shadow-lg backdrop-blur fade-in-scale",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{variantIcons[variant]}</span>
        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold text-sm mb-1">{title}</p>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 rounded-md p-1 hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {children}
    </div>
  );
}

// Toast manager hook
type ToastType = Omit<ToastProps, "id" | "onClose">;

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback((toast: ToastType) => {
    const id = `toast-${toastId++}`;
    const duration = toast.duration || 5000;

    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      },
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success: (title: string, description?: string) =>
      addToast({ title, description, variant: "success" }),
    error: (title: string, description?: string) =>
      addToast({ title, description, variant: "error" }),
    warning: (title: string, description?: string) =>
      addToast({ title, description, variant: "warning" }),
    info: (title: string, description?: string) =>
      addToast({ title, description, variant: "info" }),
  };
}
