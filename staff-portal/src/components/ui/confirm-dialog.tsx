"use client";

import React from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  variant?: "primary" | "destructive" | "danger";
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  description,
  confirmText,
  confirmLabel,
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
}) => {
  const handleClose = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  const isDestructive = variant === "destructive" || variant === "danger";
  const btnLabel = confirmLabel || confirmText || "Confirm";
  const bodyText = description || message || "Are you sure you want to proceed?";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isDestructive ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{bodyText}</p>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
        <Button variant="outline" size="sm" onClick={handleClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={isDestructive ? "destructive" : "primary"}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {btnLabel}
        </Button>
      </div>
    </Modal>
  );
};