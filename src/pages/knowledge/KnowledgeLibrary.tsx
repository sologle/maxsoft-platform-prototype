import { Filter, FolderTree, LayoutGrid, List, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Navigate, UserRole } from "../../app/types";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Button, EmptyState, PageHeading, SelectField } from "../../components/ui";
import { articles, canRoleAccessArticle, canRoleAccessFile, files, isArticlePublished } from "../../data/platform-data";
import { getArticleSections, getArticleTags } from "../../data/prototype-entities";
import { KnowledgeTree } from "./KnowledgeTree";
import { KnowledgeResults, type KnowledgeView } from "./KnowledgeResults";

interface KnowledgeLibraryProps {
  companyType?: string;
  onNavigate: Navigate;
  role: UserRole;
}

const sectionLabels: Record<string, string> = {
  all: "Все материалы",
  navisa: "НАВИСА",
  installation: "Установка",
  settings: "Настройка",
  updates: "Обновление",
  cases: "Кейсы внедрения",
  administration: "Администрирование",
  "model-studio": "Model Studio CS",
};

export const KnowledgeLibrary = ({ companyType, onNavigate, role }: KnowledgeLibraryProps) => {
  const [section, setSection] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("updated");
  const [treeOpen, setTreeOpen] = useState(false);
  const [view, setView] = useState<KnowledgeView>("table");
  const canEdit = role === "portal-admin" || role === "support-engineer";
  const visibleArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = articles.filter((article) => {
      if (!canEdit && !isArticlePublished(article)) return false;
      if (!canRoleAccessArticle(article, role, companyType)) return false;
      const articleSections = getArticleSections(article);
      const matchesSection =
        section === "all" ||
        articleSections.some((articleSection) =>
          articleSection.toLowerCase().includes(sectionLabels[section].toLowerCase()),
        );
      const matchesQuery =
        !normalized ||
        `${article.title} ${article.description} ${getArticleTags(article).join(" ")}`
          .toLowerCase()
          .includes(normalized);
      return matchesSection && matchesQuery;
    });
    return sort === "title"
      ? [...filtered].sort((left, right) => left.title.localeCompare(right.title, "ru"))
      : filtered;
  }, [canEdit, companyType, query, role, section, sort]);
  const attachedFile = files.find((file) => file.name === "инструкция_активации.pdf");
  if (!attachedFile) throw new Error("KB_FILE_MISSING: файл инструкции не найден");
  const showAttachedFile =
    canRoleAccessFile(attachedFile, role, companyType) &&
    ["all", "navisa", "installation"].includes(section) &&
    (!query.trim() || "инструкция активации pdf лицензия".includes(query.trim().toLowerCase()));

  const selectSection = (next: string) => {
    setSection(next);
    setTreeOpen(false);
  };

  return (
    <>
      <PageHeading
        actions={
          <>
            <div className="inline-flex rounded-xl border border-[var(--ms-border-strong)] bg-white p-1" role="group" aria-label="Вид материалов">
              <button aria-label="Табличный вид" aria-pressed={view === "table"} className={`icon-button !h-9 !w-9 ${view === "table" ? "bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]" : ""}`} onClick={() => setView("table")} type="button"><List className="h-4 w-4" aria-hidden="true" /></button>
              <button aria-label="Крупные карточки" aria-pressed={view === "cards"} className={`icon-button !h-9 !w-9 ${view === "cards" ? "bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]" : ""}`} onClick={() => setView("cards")} type="button"><LayoutGrid className="h-4 w-4" aria-hidden="true" /></button>
            </div>
            {canEdit ? (
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => onNavigate("editor")}
            >
              Новая статья
            </Button>
            ) : null}
          </>
        }
        backLabel="Вернуться ко всем материалам"
        eyebrow="База знаний"
        onBack={section === "all" ? undefined : () => setSection("all")}
        subtitle="Инструкции, регламенты и материалы по продуктам MaxSoft."
        title={sectionLabels[section]}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-2xl border border-[var(--ms-border)] bg-white p-4 shadow-[var(--ms-card-shadow)] xl:sticky xl:top-28 xl:block">
          <div className="mb-3 flex items-center gap-2 px-2">
            <FolderTree className="h-5 w-5 text-[var(--ms-primary)]" aria-hidden="true" />
            <h2 className="font-heading font-bold">Разделы</h2>
          </div>
          <KnowledgeTree onSelect={setSection} selected={section} />
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--ms-border)] bg-white p-3 shadow-[var(--ms-card-shadow)] sm:flex-row sm:items-center">
            <button
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--ms-border-strong)] bg-white px-4 text-sm font-semibold transition hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)] xl:hidden"
              onClick={() => setTreeOpen(true)}
              type="button"
            >
              <FolderTree className="h-4 w-4" aria-hidden="true" />
              Показать разделы
            </button>
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Фильтр материалов</span>
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                className="h-11 w-full min-w-0 rounded-xl border border-[var(--ms-border-strong)] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[var(--ms-primary)] focus:ring-4 focus:ring-[var(--ms-primary-ring)]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти в разделе"
                value={query}
              />
            </label>
            <SelectField
              className="min-w-0 sm:w-52"
              label="Сортировка"
              labelHidden
              leadingIcon={<Filter className="h-4 w-4" aria-hidden="true" />}
              onChange={(event) => setSort(event.target.value)}
              value={sort}
            >
                <option value="updated">Сначала обновлённые</option>
                <option value="title">По названию</option>
            </SelectField>
          </div>

          {visibleArticles.length || showAttachedFile ? (
            <KnowledgeResults articles={visibleArticles} onNavigate={onNavigate} showAttachedFile={showAttachedFile} view={view} />
          ) : (
            <EmptyState
              action={
                <Button
                  onClick={() => {
                    setQuery("");
                    setSection("all");
                  }}
                >
                  Сбросить фильтры
                </Button>
              }
              text="Измените запрос или выберите другой раздел дерева."
              title="Материалы не найдены"
            />
          )}
        </section>
      </div>

      <ResponsiveOverlay
        desktop="modal"
        label="Разделы базы знаний"
        onClose={() => setTreeOpen(false)}
        open={treeOpen}
      >
        <KnowledgeTree onSelect={selectSection} selected={section} />
      </ResponsiveOverlay>
    </>
  );
};
