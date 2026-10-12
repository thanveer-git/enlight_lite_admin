"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  /** Label for the confirm button (defaults to "Confirm"). */
  confirmLabel?: string;
  /** Label for the cancel button (defaults to "Cancel"). */
  cancelLabel?: string;
  /** Visual style of the confirm button. */
  variant?: "default" | "destructive";
  /** Optional leading icon for the confirm button. */
  icon?: LucideIcon;
  /** When true the confirm button shows a spinner and both buttons are disabled. */
  loading?: boolean;
  /** Called when the confirm button is clicked. */
  onConfirm: () => void;
  /** Optional extra content rendered between the description and the footer. */
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  icon: Icon,
  loading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description != null && description !== "" && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            className="rounded-xl"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              Icon && <Icon className="mr-1.5 size-4" />
            )}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
