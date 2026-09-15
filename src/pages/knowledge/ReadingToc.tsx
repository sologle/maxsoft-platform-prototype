import { useRef, useState } from "react";
export interface ReadingSection {
  id: string;
  title: string;
  level?: number;
}
export const ReadingToc = ({
  sections,
  active,
  jump,
}: {
  sections: ReadingSection[];
  active: string;
  jump: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const suppressFocus = useRef(false);
  const close = () => {
    setOpen(false);
    suppressFocus.current = true;
    trigger.current?.focus();
    suppressFocus.current = false;
  };
  return (
    <aside
      className="reading-toc"
      data-open={open}
      onMouseEnter={(event) => {
        if (window.matchMedia("(hover: hover)").matches && event.buttons === 0)
          setOpen(true);
      }}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement))
          setOpen(false);
      }}
      onFocus={() => {
        if (!suppressFocus.current) setOpen(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
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
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">Содержание статьи</span>
        {sections.map((s) => (
          <span
            key={s.id}
            className={`toc-bar ${active === s.id ? "toc-bar-active" : ""}`}
            style={{ width: (s.level ?? 2) > 2 ? 14 : 22 }}
          />
        ))}
      </button>
      {open ? (
        <nav
          id="reading-toc-panel"
          className="reading-toc-panel"
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
