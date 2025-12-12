"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./button";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative z-50 fade-in-scale">{children}</div>
    </div>
  );
}

export interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  showClose?: boolean;
  onClose?: () => void;
}

export function DialogContent({
  className,
  children,
  showClose = true,
  onClose,
}: DialogContentProps) {
  return (
    <div
      className={cn(
        "relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-lg border border-border bg-card p-6 shadow-2xl",
        "glass",
        className
      )}
    >
      {showClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      {children}
    </div>
  );
}

export interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function DialogHeader({ className, children }: DialogHeaderProps) {
  return (
    <div className={cn("space-y-2 mb-6", className)}>
      {children}
    </div>
  );
}

export interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function DialogTitle({ className, children }: DialogTitleProps) {
  return (
    <h2 className={cn("text-2xl font-bold text-foreground", className)}>
      {children}
    </h2>
  );
}

export interface DialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export function DialogDescription({
  className,
  children,
}: DialogDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export interface DialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function DialogFooter({ className, children }: DialogFooterProps) {
  return (
    <div className={cn("flex items-center justify-end gap-3 mt-6", className)}>
      {children}
    </div>
  );
}

// Confirmation Dialog Helper
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
