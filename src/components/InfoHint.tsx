import { Info } from "lucide-react";
import { useId, useState } from "react";
import { createPortal } from "react-dom";
export const InfoHint = ({ label, text }: { label: string; text: string }) => {
  const id = useId();
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const show = (element: HTMLElement) => {
    const box = element.getBoundingClientRect();
    setPosition({
      left: Math.max(12, Math.min(box.left, window.innerWidth - 300)),
      top: Math.max(12, Math.min(box.bottom + 8, window.innerHeight - 180)),
    });
  };
  return (
    <>
      <button
        type="button"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ms-muted)] hover:bg-[var(--ms-primary-soft)]"
        aria-label={`Пояснение: ${label}`}
        aria-describedby={position ? id : undefined}
        aria-expanded={Boolean(position)}
        onMouseEnter={(event) => show(event.currentTarget)}
        onMouseLeave={() => setPosition(null)}
        onFocus={(event) => show(event.currentTarget)}
        onBlur={() => setPosition(null)}
        onClick={(event) => show(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setPosition(null);
        }}
      >
        <Info className="h-4 w-4" />
      </button>
      {position
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              style={position}
              className="fixed z-[120] w-[280px] rounded-xl border border-[var(--ms-border)] bg-white p-3 text-sm leading-5 shadow-lg"
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
