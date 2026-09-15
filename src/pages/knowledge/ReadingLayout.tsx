import { FolderTree, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Button } from "../../components/ui";
import { BackButton } from "../../components/BackButton";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import type { Navigate, UserRole } from "../../app/types";
import {
  articles,
  canRoleAccessArticle,
  files,
} from "../../data/platform-data";
import { KnowledgeTree } from "./KnowledgeTree";
import { ReadingToc, type ReadingSection } from "./ReadingToc";
import { getKnowledgeTree, sectionArticleIds } from "../../data/knowledge-tree";
import "./reading.css";
export const ReadingLayout = ({
  children,
  sections,
  onNavigate,
  articleId,
  role,
  companyType,
}: {
  children: ReactNode;
  sections: ReadingSection[];
  onNavigate: Navigate;
  articleId: string;
  role: UserRole;
  companyType?: string;
}) => {
  const [scale, setScale] = useState(1);
  const [reading, setReading] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [treeSection, setTreeSection] = useState("all");
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const root = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const modeButton = useRef<HTMLButtonElement>(null);
  const savedScroll = useRef(0);
  const visible = articles.filter((a) =>
    canRoleAccessArticle(a, role, companyType),
  );
  const attachmentCount = files.filter((f) =>
    f.relatedArticleIds.includes(articleId),
  ).length;
  const headingOffset = () => {
    const header = reading
      ? 0
      : (document.querySelector("header")?.getBoundingClientRect().height ??
        72);
    return header + (toolbar.current?.getBoundingClientRect().height ?? 0) + 20;
  };
  useEffect(() => {
    if (!reading) return;
    const background: HTMLElement[] = [];
    let ancestor: HTMLElement | null = root.current;
    while (ancestor && ancestor !== document.body) {
      for (const sibling of Array.from(
        ancestor.parentElement?.children ?? [],
      )) {
        if (
          sibling !== ancestor &&
          sibling instanceof HTMLElement &&
          !sibling.inert
        ) {
          sibling.inert = true;
          background.push(sibling);
        }
      }
      ancestor = ancestor.parentElement;
    }
    root.current!.scrollTop = savedScroll.current;
    return () => {
      background.forEach((node) => {
        node.inert = false;
      });
      if (root.current?.isConnected)
        window.scrollTo({ top: savedScroll.current, behavior: "instant" });
    };
  }, [reading]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const offset = headingOffset();
        const targets = sections
          .map((s) => root.current?.querySelector<HTMLElement>(`#${s.id}`))
          .filter((s): s is HTMLElement => Boolean(s));
        const passed = targets.filter(
          (t) => t.getBoundingClientRect().top <= offset + 24,
        );
        const current = passed.at(-1) ?? targets[0];
        if (current) setActive(current.id);
      });
    };
    const container = reading ? root.current! : window;
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(root.current!.querySelector("article")!);
    update();
    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [reading, sections, scale]);
  const jump = (id: string) => {
    const target = root.current?.querySelector<HTMLElement>(
      `#${CSS.escape(id)}`,
    );
    if (!target) return;
    const top = target.getBoundingClientRect().top - headingOffset();
    if (reading)
      root.current!.scrollTo({
        top: root.current!.scrollTop + top,
        behavior: "instant",
      });
    else window.scrollTo({ top: window.scrollY + top, behavior: "instant" });
    setActive(id);
    target.focus({ preventScroll: true });
  };
  return (
    <div
      ref={root}
      className={`reading-layout ${reading ? "reading-fullscreen" : ""}`}
      data-reading-mode={reading ? "fullscreen" : "standard"}
      onKeyDown={(event) => {
        if (event.key === "Escape" && reading && !treeOpen) {
          event.preventDefault();
          setReading(false);
          modeButton.current?.focus();
        }
      }}
      onClick={(event) => {
        const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
          'a[href^="#"]',
        );
        if (link && root.current?.contains(link)) {
          event.preventDefault();
          jump(link.hash.slice(1));
        }
      }}
    >
      <div ref={toolbar} className="reading-tools" aria-label="Панель чтения">
        <Button
          tone="secondary"
          icon={<FolderTree className="h-4 w-4" />}
          onClick={() => setTreeOpen(true)}
        >
          Дерево БЗ
        </Button>
        <div className="reading-size" role="group" aria-label="Размер текста">
          <button
            type="button"
            className="icon-button"
            aria-label="Уменьшить размер текста"
            disabled={scale <= 0.7}
            onClick={() =>
              setScale((v) => Math.max(0.7, +(v - 0.1).toFixed(1)))
            }
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Сбросить размер текста до 100%"
            onClick={() => setScale(1)}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Увеличить размер текста"
            disabled={scale >= 1.4}
            onClick={() =>
              setScale((v) => Math.min(1.4, +(v + 0.1).toFixed(1)))
            }
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          ref={modeButton}
          type="button"
          className="reading-mode-button"
          aria-label={
            reading ? "Выйти из полноэкранного режима" : "На весь экран"
          }
          onClick={() => {
            if (!reading) savedScroll.current = window.scrollY;
            setReading((v) => !v);
          }}
        >
          {reading ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
          {reading ? "Выйти" : "Режим чтения"}
        </button>
        {attachmentCount ? (
          <button
            type="button"
            className="reading-attachments-link"
            onClick={() => jump("attachments-title")}
          >
            Вложения · {attachmentCount}
          </button>
        ) : null}
      </div>
      <ReadingToc sections={sections} active={active} jump={jump} />
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
      <ResponsiveOverlay
        label="Дерево базы знаний"
        open={treeOpen}
        onClose={() => setTreeOpen(false)}
      >
        <KnowledgeTree
          persistExpansion
          currentArticleId={articleId}
          selected={treeSection}
          onSelect={setTreeSection}
          articleIds={visible.map((a) => a.id)}
        />
        <div className="mt-5 space-y-2" aria-label="Материалы раздела">
          {visible
            .filter(
              (a) =>
                treeSection === "all" ||
                sectionArticleIds(getKnowledgeTree(), treeSection).includes(
                  a.id,
                ),
            )
            .map((a) => (
              <button
                key={a.id}
                type="button"
                aria-current={a.id === articleId ? "page" : undefined}
                className="block w-full rounded-xl border border-[var(--ms-border)] p-3 text-left text-sm hover:bg-[var(--ms-primary-soft)] aria-[current=page]:bg-[var(--ms-primary-soft)]"
                onClick={() => {
                  setTreeOpen(false);
                  if (a.id !== articleId)
                    onNavigate(a.kind === "video" ? "video" : "article", a.id);
                }}
              >
                {a.title}
              </button>
            ))}
        </div>
      </ResponsiveOverlay>
    </div>
  );
};
