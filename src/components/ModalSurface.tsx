import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

interface ModalSurfaceProps {
  children: ReactNode;
  className: string;
  labelledBy: string;
  onClose: () => void;
}

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export const ModalSurface = ({ children, className, labelledBy, onClose }: ModalSurfaceProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  const focusableElements = () =>
    Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []).filter(
      (node) => node.getAttribute("aria-hidden") !== "true",
    );

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const timeout = window.setTimeout(() => {
      (focusableElements()[0] ?? dialogRef.current)?.focus();
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = focusableElements();
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex === -1 || nextIndex < 0 || nextIndex >= focusable.length) {
      event.preventDefault();
      focusable[event.shiftKey ? focusable.length - 1 : 0]?.focus();
    }
  };

  return (
    <div
      aria-labelledby={labelledBy}
      aria-modal="true"
      className={className}
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      {children}
    </div>
  );
};
