import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "../../components/ui";
import { BackButton } from "../../components/BackButton";
import type { Navigate } from "../../app/types";
import "./reading.css";
export const ReadingLayout = ({
  children,
  sections,
  onNavigate,
}: {
  children: ReactNode;
  sections: Array<{ id: string; title: string }>;
  onNavigate: Navigate;
}) => {
  const [scale, setScale] = useState(1);
  const [reading, setReading] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  useEffect(() => {
    if (!reading) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (root.current) root.current.scrollTop = savedScroll.current;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setReading(false);
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", escape);
      window.scrollTo({ top: savedScroll.current, behavior: "instant" });
    };
  }, [reading]);
  const jump = (id: string) => {
    const target = root.current?.querySelector<HTMLElement>(`#${id}`);
    if (!target) return;
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    const panel = root.current!.querySelector<HTMLElement>(".reading-tools")!;
    if (mobile) setOpen(false);
    requestAnimationFrame(() => {
      const header = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const offset =
        (reading ? 0 : header) + (mobile ? panel.getBoundingClientRect().height : 0) + 16;
      if (reading)
        root.current!.scrollTo({
          top: root.current!.scrollTop + target.getBoundingClientRect().top - offset,
          behavior: "instant",
        });
      else
        window.scrollTo({
          top: window.scrollY + target.getBoundingClientRect().top - offset,
          behavior: "instant",
        });
    });
  };
  return (
    <div
      ref={root}
      className={`reading-layout ${reading ? "reading-fullscreen" : ""} ${open ? "reading-expanded" : ""}`}
      data-reading-mode={reading ? "fullscreen" : "standard"}
    >
      <aside className="reading-tools" aria-label="Панель чтения">
        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-label={open ? "Свернуть содержание статьи" : "Развернуть содержание статьи"}
            aria-expanded={open}
            className="icon-button bg-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <span className="text-sm font-bold lg:hidden">Чтение · {Math.round(scale * 100)}%</span>
          {reading ? (
            <Button
              aria-label="Выйти из полноэкранного режима"
              className="reading-exit"
              tone="secondary"
              onClick={() => setReading(false)}
            >
              <Minimize2 className="h-4 w-4" />
              <span className={open ? "" : "lg:sr-only"}>Выйти</span>
            </Button>
          ) : null}
        </div>
        {open ? (
          <div className="reading-options">
            <p className="my-3 text-xs font-bold uppercase text-[var(--ms-muted)]">Размер текста</p>
            <div className="flex items-center justify-between gap-1">
              <button
                className="icon-button"
                aria-label="Уменьшить размер текста"
                disabled={scale <= 0.7}
                onClick={() => setScale((value) => Math.max(0.7, +(value - 0.1).toFixed(1)))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                className="text-sm font-bold"
                aria-label="Сбросить размер текста до 100%"
                onClick={() => setScale(1)}
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                className="icon-button"
                aria-label="Увеличить размер текста"
                disabled={scale >= 1.4}
                onClick={() => setScale((value) => Math.min(1.4, +(value + 0.1).toFixed(1)))}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {!reading ? (
              <Button
                aria-label="На весь экран"
                className="my-3 w-full"
                tone="secondary"
                onClick={() => {
                  savedScroll.current = window.scrollY;
                  setReading(true);
                }}
              >
                <Maximize2 className="h-4 w-4" />
                Режим чтения
              </Button>
            ) : null}
            <nav aria-label="Содержание статьи">
              <p className="my-3 text-xs font-bold uppercase text-[var(--ms-muted)]">
                В этой статье
              </p>
              {sections.map((section) => (
                <a
                  className="block rounded-lg py-2 text-sm hover:text-[var(--ms-primary)]"
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    jump(section.id);
                  }}
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        ) : null}
      </aside>
      <div className="reading-material min-w-0">
        <div className="mb-4">
          <BackButton onNavigate={onNavigate} />
        </div>
        <article
          className="article-scaled rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] sm:p-8"
          style={{ "--article-scale": scale } as CSSProperties}
        >
          {children}
        </article>
      </div>
    </div>
  );
};
