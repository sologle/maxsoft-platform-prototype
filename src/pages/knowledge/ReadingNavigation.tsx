import {
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Minus,
  Plus,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useRef, useState, useEffect, type RefObject } from "react";
import type { Navigate, UserRole } from "../../app/types";
import { goBack } from "../../components/BackButton";
import { MotionRegion } from "../../components/MotionRegion";
import { articles, canRoleAccessArticle } from "../../data/platform-data";
import {
  getKnowledgeTree,
  flattenTree,
  sectionArticleIds,
} from "../../data/knowledge-tree";
import { KnowledgeTree } from "./KnowledgeTree";
import { articleTrail } from "./reading-navigation";

export const ReadingNavigation = ({
  onNavigate,
  articleId,
  role,
  companyType,
  mobile,
  open,
  setOpen,
  scale,
  setScale,
  reading,
  toggleReading,
  modeButton,
  toolbar,
}: {
  onNavigate: Navigate;
  articleId: string;
  role: UserRole;
  companyType?: string;
  mobile: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  scale: number;
  setScale: (scale: number) => void;
  reading: boolean;
  toggleReading: () => void;
  modeButton: RefObject<HTMLButtonElement | null>;
  toolbar: RefObject<HTMLDivElement | null>;
}) => {
  const tree = getKnowledgeTree();
  const article = articles.find((a) => a.id === articleId)!;
  const [selected, setSelected] = useState(
    () => articleTrail(tree, article).at(-1)?.id ?? "",
  );
  const selectedNode = flattenTree(tree).find((node) => node.id === selected);
  const visible = articles.filter((a) =>
    canRoleAccessArticle(a, role, companyType),
  );
  const ids =
    selected === "all"
      ? visible.map((a) => a.id)
      : selectedNode
        ? sectionArticleIds(tree, selected)
        : [];
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (!mobile || !open) return;
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !toolbar.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [mobile, open, setOpen, toolbar]);
  return (
    <div
      ref={toolbar}
      className="reading-sidebar"
      data-expanded={open}
      onKeyDown={(event) => {
        if (event.key === "Escape" && mobile && open) {
          event.stopPropagation();
          event.preventDefault();
          close();
        }
      }}
    >
      <div className="reading-sidebar-bar">
        <button
          className="icon-button"
          type="button"
          title="Назад"
          aria-label="Назад"
          onClick={() => goBack(onNavigate, "knowledge")}
        >
          <ArrowLeft size={18} />
        </button>
        <button
          ref={trigger}
          className="icon-button"
          type="button"
          title={
            mobile
              ? "Меню статьи"
              : open
                ? "Свернуть панель чтения"
                : "Развернуть панель чтения"
          }
          aria-label={
            mobile
              ? "Меню статьи"
              : open
                ? "Свернуть панель чтения"
                : "Развернуть панель чтения"
          }
          aria-expanded={open}
          aria-controls="reading-navigation-panel"
          onClick={() => setOpen(!open)}
        >
          {mobile ? (
            <Menu size={18} />
          ) : open ? (
            <PanelLeftClose size={18} />
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </button>
      </div>
      <MotionRegion
        open={open}
        id="reading-navigation-panel"
        role="region"
        aria-label="Инструменты чтения"
        className="reading-navigation-panel"
      >
        <div>
          <div className="reading-settings">
            <div
              className="reading-size"
              role="group"
              aria-label="Размер текста"
            >
              <button
                type="button"
                className="icon-button"
                aria-label="Уменьшить размер текста"
                disabled={scale <= 0.7}
                onClick={() =>
                  setScale(Math.max(0.7, +(scale - 0.1).toFixed(1)))
                }
              >
                <Minus size={16} />
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
                  setScale(Math.min(1.4, +(scale + 0.1).toFixed(1)))
                }
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              ref={modeButton}
              type="button"
              className="icon-button"
              title={
                reading ? "Выйти из полноэкранного режима" : "На весь экран"
              }
              aria-label={
                reading ? "Выйти из полноэкранного режима" : "На весь экран"
              }
              onClick={toggleReading}
            >
              {reading ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            {mobile && (
              <button
                className="icon-button"
                type="button"
                aria-label="Закрыть меню статьи"
                onClick={close}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <KnowledgeTree
            persistExpansion
            currentArticleId={articleId}
            selected={selected}
            onSelect={setSelected}
            articleIds={visible.map((a) => a.id)}
          />
          <section
            className="reading-section-list"
            aria-label="Материалы раздела"
          >
            <h2>
              {selected === "all"
                ? "Статьи всей базы знаний"
                : selectedNode
                  ? `Статьи раздела «${selectedNode.name}»`
                  : "Раздел статьи недоступен"}
            </h2>
            {visible
              .filter((a) => ids.includes(a.id))
              .map((a) => (
                <button
                  type="button"
                  key={a.id}
                  aria-current={a.id === articleId ? "page" : undefined}
                  onClick={() => {
                    if (mobile) close();
                    if (a.id !== articleId)
                      onNavigate(
                        a.kind === "video" ? "video" : "article",
                        a.id,
                      );
                  }}
                >
                  {a.title}
                </button>
              ))}
          </section>
        </div>
      </MotionRegion>
    </div>
  );
};
