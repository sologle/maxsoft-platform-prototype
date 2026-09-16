import { usePresence } from "../../hooks/usePresence";
import { useRef, useEffect, useLayoutEffect } from "react";
import { visibleViewport } from "../../hooks/viewport";
const HOVER_INTENT_MS = 80;

export interface ReadingSection {
  id: string;
  title: string;
  level?: number;
}
export const ReadingToc = ({
  sections,
  active,
  jump,
  open,
  setOpen,
}: {
  sections: ReadingSection[];
  active: string;
  jump: (id: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const region = useRef<HTMLElement>(null);
  const panel = useRef<HTMLElement>(null);
  const mounted = usePresence(open);
  const trigger = useRef<HTMLButtonElement>(null);
  const suppressFocus = useRef(false);
  const close = () => {
    clearTimeout(hoverTimer.current);
    setOpen(false);
    suppressFocus.current = true;
    trigger.current?.focus({ preventScroll: true });
    suppressFocus.current = false;
  };
  useLayoutEffect(() => {
    if (!mounted) return;
    const update = () => {
      const viewport = visibleViewport();
      const rect = trigger.current!.getBoundingClientRect();
      const width = Math.min(360, viewport.width - 16);
      const top = Math.max(
        viewport.top + 8,
        Math.min(rect.top, viewport.bottom - 160),
      );
      Object.assign(panel.current!.style, {
        width: `${width}px`,
        left: `${Math.max(viewport.left + 8, Math.min(rect.right - width, viewport.right - width - 8))}px`,
        top: `${top}px`,
        maxHeight: `${viewport.bottom - top - 8}px`,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [mounted]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !region.current?.contains(event.target)
      )
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, setOpen]);
  return (
    <aside
      ref={region}
      className="reading-toc"
      data-open={open}
      onMouseEnter={(event) => {
        if (
          window.matchMedia("(hover: hover) and (min-width: 1024px)").matches &&
          event.buttons === 0
        )
          hoverTimer.current = setTimeout(() => {
            if (
              window.matchMedia("(hover: hover) and (min-width: 1024px)")
                .matches
            )
              setOpen(true);
          }, HOVER_INTENT_MS);
      }}
      onMouseLeave={(event) => {
        clearTimeout(hoverTimer.current);
        if (!event.currentTarget.contains(document.activeElement))
          setOpen(false);
      }}
      onFocus={() => {
        clearTimeout(hoverTimer.current);
        if (!suppressFocus.current) setOpen(true);
      }}
      onBlur={(event) => {
        clearTimeout(hoverTimer.current);
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="reading-toc-trigger"
        aria-label="Развернуть содержание статьи"
        aria-expanded={open}
        aria-controls="reading-toc-panel"
        onClick={() => {
          clearTimeout(hoverTimer.current);
          setOpen(true);
        }}
      >
        <span className="sr-only">Содержание статьи</span>
        {sections.map((s) => (
          <span
            aria-hidden="true"
            key={s.id}
            className={`toc-bar ${active === s.id ? "toc-bar-active" : ""}`}
            style={{ width: (s.level ?? 2) > 2 ? 14 : 22 }}
          />
        ))}
      </button>
      {mounted ? (
        <nav
          ref={panel}
          id="reading-toc-panel"
          className="reading-toc-panel motion-surface"
          data-state={open ? "open" : "closed"}
          inert={!open || undefined}
          aria-hidden={!open || undefined}
          aria-label="Содержание статьи"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <strong>В этой статье</strong>
            <button
              type="button"
              aria-label="Закрыть содержание"
              className="icon-button"
              onClick={close}
            >
              ×
            </button>
          </div>
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active === section.id ? "location" : undefined}
              style={{
                paddingLeft: 8 + Math.max(0, (section.level ?? 2) - 2) * 12,
              }}
              onClick={(event) => {
                event.preventDefault();
                setOpen(false);
                jump(section.id);
              }}
            >
              {section.title}
            </a>
          ))}
        </nav>
      ) : null}
    </aside>
  );
};
