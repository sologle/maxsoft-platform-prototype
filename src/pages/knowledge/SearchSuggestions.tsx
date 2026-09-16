import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { MotionRegion } from "../../components/MotionRegion";
import { visibleViewport } from "../../hooks/viewport";

export const SearchSuggestions = ({
  id,
  anchor,
  open,
  suggestions,
  onSelect,
}: {
  id: string;
  anchor: RefObject<HTMLInputElement | null>;
  open: boolean;
  suggestions: string[];
  onSelect: (name: string) => void;
}) => {
  const content = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState(suggestions);
  if (open && snapshot !== suggestions) setSnapshot(suggestions);
  // Selecting a tag clears the query immediately; keep its last list for exit.
  const items = open ? suggestions : snapshot;
  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const viewport = visibleViewport();
      const rect = anchor.current!.getBoundingClientRect();
      const panel = content.current!.parentElement!;
      const gap = 8;
      const below = Math.max(0, viewport.bottom - rect.bottom - gap);
      const above = Math.max(0, rect.top - viewport.top - gap);
      const upwards = below < content.current!.scrollHeight && above > below;
      const width = Math.min(rect.width, viewport.width - gap * 2);
      panel.style.width = `${width}px`;
      panel.style.maxHeight = `${Math.min(240, upwards ? above : below)}px`;
      panel.style.left = `${Math.max(viewport.left + gap, Math.min(rect.left, viewport.right - width - gap))}px`;
      panel.style.top = `${upwards ? rect.top - panel.getBoundingClientRect().height : rect.bottom}px`;
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    window.visualViewport?.addEventListener("resize", position);
    window.visualViewport?.addEventListener("scroll", position);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      window.visualViewport?.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("scroll", position);
    };
  }, [open, suggestions, anchor]);
  return (
    <MotionRegion
      open={open}
      id={id}
      role="region"
      aria-label="Подсказки тегов"
      className="fixed z-[60] overflow-y-auto overscroll-contain rounded-xl border border-[var(--ms-border)] bg-[var(--ms-surface)] shadow-lg"
    >
      <div ref={content}>
        {items.map((name) => (
          <button
            key={name}
            type="button"
            className="block min-h-11 w-full p-3 text-left [overflow-wrap:anywhere] hover:bg-[var(--ms-primary-soft)]"
            onClick={() => onSelect(name)}
          >
            {name}
          </button>
        ))}
      </div>
    </MotionRegion>
  );
};
