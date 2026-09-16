import { visibleViewport } from "../hooks/viewport";
import { Info } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePresence } from "../hooks/usePresence";
const HOVER_CLOSE_DELAY_MS = 80;

export const InfoHint = ({ label, text }: { label: string; text: string }) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  const mounted = usePresence(open);
  const trigger = useRef<HTMLButtonElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const hoverClose = useRef<number | undefined>(undefined);
  const cancelClose = () => window.clearTimeout(hoverClose.current);
  const show = () => {
    cancelClose();
    setOpen(true);
  };
  const close = () => {
    cancelClose();
    setOpen(false);
  };
  const leave = () => {
    if (document.activeElement === trigger.current) return;
    cancelClose();
    // Let the pointer cross the small gap from the trigger to scrollable help text.
    hoverClose.current = window.setTimeout(
      () => setOpen(false),
      HOVER_CLOSE_DELAY_MS,
    );
  };
  useEffect(() => () => window.clearTimeout(hoverClose.current), []);
  const [position, setPosition] = useState({ left: 12, top: 12 });
  useLayoutEffect(() => {
    if (!open || !mounted) return;
    const place = () => {
      const viewport = visibleViewport();
      const box = trigger.current!.getBoundingClientRect();
      const hint = tooltip.current!;
      const gap = 8;
      const below = Math.max(0, viewport.bottom - box.bottom - gap - 12);
      const above = Math.max(0, box.top - viewport.top - gap - 12);
      hint.style.maxWidth = `${Math.max(0, viewport.width - 24)}px`;
      hint.style.maxHeight = `${Math.max(above, below)}px`;
      const bounds = hint.getBoundingClientRect();
      const upwards = below < bounds.height && above > below;
      hint.style.maxHeight = `${upwards ? above : below}px`;
      const height = hint.getBoundingClientRect().height;
      setPosition({
        left: Math.max(
          viewport.left + 12,
          Math.min(box.left, viewport.right - bounds.width - 12),
        ),
        top: upwards ? box.top - height - gap : box.bottom + gap,
      });
    };
    const outside = (event: PointerEvent) => {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !tooltip.current?.contains(event.target as Node)
      )
        close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    place();
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape, true);
    return () => {
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open, mounted]);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--ms-muted)] hover:bg-[var(--ms-primary-soft)] focus-visible:outline-2 focus-visible:outline-[var(--ms-primary)]"
        aria-label={`Пояснение: ${label}`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={leave}
        onFocus={show}
        onBlur={close}
        onClick={show}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      {mounted
        ? createPortal(
            <div
              onMouseEnter={show}
              onMouseLeave={leave}
              ref={tooltip}
              id={id}
              role="tooltip"
              style={position}
              data-state={open ? "open" : "closed"}
              inert={!open || undefined}
              aria-hidden={!open || undefined}
              className="motion-surface fixed z-[120] w-[min(280px,calc(100vw-24px))] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-xl border border-[var(--ms-border)] bg-[var(--ms-surface)] p-3 text-sm leading-5 text-[var(--ms-text)] shadow-lg"
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
