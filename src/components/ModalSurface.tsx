import { useOverlayViewport } from "../hooks/useOverlayViewport";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

interface ModalSurfaceProps {
  children: ReactNode;
  className: string;
  labelledBy: string;
  onClose: () => void;
  open?: boolean;
  surfaceRole?: "dialog" | "presentation";
}

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export const ModalSurface = ({
  children,
  className,
  labelledBy,
  onClose,
  surfaceRole = "dialog",
  open = true,
}: ModalSurfaceProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useOverlayViewport(dialogRef);

  const focusableElements = () =>
    Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    ).filter(
      (node) =>
        !node.closest('[inert], [aria-hidden="true"]') &&
        node.getClientRects().length > 0,
    );

  useEffect(() => {
    if (!open) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const appRoot = document.getElementById("root");
    const rootWasInert = appRoot?.hasAttribute("inert") ?? false;
    const previousAriaHidden = appRoot
      ? appRoot.getAttribute("aria-hidden")
      : null;
    appRoot?.setAttribute("inert", "");
    appRoot?.setAttribute("aria-hidden", "true");
    const timeout = window.setTimeout(() => {
      (
        dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]") ??
        focusableElements()[0] ??
        dialogRef.current
      )?.focus();
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      if (!rootWasInert) appRoot?.removeAttribute("inert");
      if (previousAriaHidden === null) appRoot?.removeAttribute("aria-hidden");
      else if (appRoot) appRoot.setAttribute("aria-hidden", previousAriaHidden);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = focusableElements();
    const currentIndex = focusable.indexOf(
      document.activeElement as HTMLElement,
    );
    const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex === -1 || nextIndex < 0 || nextIndex >= focusable.length) {
      event.preventDefault();
      (
        focusable[event.shiftKey ? focusable.length - 1 : 0] ??
        dialogRef.current
      )?.focus();
    }
  };

  return (
    <div
      aria-labelledby={surfaceRole === "dialog" ? labelledBy : undefined}
      aria-modal={surfaceRole === "dialog" ? "true" : undefined}
      className={`modal-surface ${className}`}
      inert={!open || undefined}
      aria-hidden={!open || undefined}
      data-state={open ? "open" : "closed"}
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      ref={dialogRef}
      role={surfaceRole}
      tabIndex={-1}
    >
      {children}
    </div>
  );
};
