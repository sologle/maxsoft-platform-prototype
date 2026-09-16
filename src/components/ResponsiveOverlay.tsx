import { X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePresence } from "../hooks/usePresence";
import { ModalSurface } from "./ModalSurface";

interface ResponsiveOverlayProps {
  children: ReactNode;
  description?: string;
  desktop?: "drawer" | "modal";
  label: string;
  onClose: () => void;
  open: boolean;
}

export const ResponsiveOverlay = ({
  children,
  description,
  desktop = "drawer",
  label,
  onClose,
  open,
}: ResponsiveOverlayProps) => {
  const mounted = usePresence(open);
  const labelId = useId();
  const [snapshot, setSnapshot] = useState({ children, label, description });
  if (
    open &&
    (snapshot.children !== children ||
      snapshot.label !== label ||
      snapshot.description !== description)
  )
    setSnapshot({ children, label, description });
  // Dialog owners often clear the selected record on close. Keep the last frame for its fade.
  const content = open ? { children, label, description } : snapshot;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <ModalSurface
      className="fixed inset-0 z-[90] overflow-hidden"
      open={open}
      labelledBy={labelId}
      onClose={onClose}
      surfaceRole="presentation"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#0c1b2c]/48 backdrop-blur-[2px] motion-surface"
        data-state={open ? "open" : "closed"}
        onMouseDown={onClose}
      />
      <section
        aria-labelledby={labelId}
        aria-modal="true"
        className={`responsive-overlay-panel motion-surface absolute inset-x-0 bottom-0 flex max-h-[88%] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_-18px_60px_rgba(14,32,52,0.24)] md:rounded-none ${
          desktop === "drawer"
            ? "md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[min(520px,48%)]"
            : "md:inset-x-1/2 md:inset-y-1/2 md:h-fit md:max-h-[calc(100%-48px)] md:w-[min(620px,calc(100%-48px))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[24px]"
        }`}
        data-desktop={desktop}
        data-state={open ? "open" : "closed"}
        role="dialog"
      >
        <div
          className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300 md:hidden"
          aria-hidden="true"
        />
        <header className="flex shrink-0 items-start gap-4 border-b border-[var(--ms-border)] px-5 py-4 md:px-6 md:py-5">
          <div className="min-w-0 flex-1">
            <h2
              className="[overflow-wrap:anywhere] font-heading text-xl font-bold text-[var(--ms-text)]"
              id={labelId}
            >
              {content.label}
            </h2>
            {content.description ? (
              <p className="mt-1 text-sm text-[var(--ms-muted)]">
                {content.description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="Закрыть"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 min-w-0 flex-1 [overflow-wrap:anywhere] overflow-y-auto overscroll-contain overlay-content px-5 py-5 md:px-6">
          {content.children}
        </div>
      </section>
    </ModalSurface>,
    document.body,
  );
};
