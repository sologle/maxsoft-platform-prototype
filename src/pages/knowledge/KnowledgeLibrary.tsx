import { ArrowRight, FileText, Filter, FolderTree, Plus, Search, Video } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppPage, UserRole } from "../../app/types";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Button, EmptyState, PageHeading } from "../../components/ui";
import { articles } from "../../data/platform-data";
import { KnowledgeTree } from "./KnowledgeTree";

interface KnowledgeLibraryProps {
  onNavigate: (page: AppPage) => void;
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

export const KnowledgeLibrary = ({ onNavigate, role }: KnowledgeLibraryProps) => {
  const [section, setSection] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("updated");
  const [treeOpen, setTreeOpen] = useState(false);
  const canEdit = role === "portal-admin" || role === "support-engineer";
  const visibleArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = articles.filter((article) => {
      if (!canEdit && article.status === "Черновик") return false;
      const matchesSection =
        section === "all" || article.section.toLowerCase().includes(sectionLabels[section].toLowerCase());
      const matchesQuery =
        !normalized ||
        `${article.title} ${article.description} ${article.tags.join(" ")}`
          .toLowerCase()
          .includes(normalized);
      return matchesSection && matchesQuery;
    });
    return sort === "title"
      ? [...filtered].sort((left, right) => left.title.localeCompare(right.title, "ru"))
      : filtered;
  }, [canEdit, query, section, sort]);

  const selectSection = (next: string) => {
    setSection(next);
    setTreeOpen(false);
  };

  return (
    <>
      <PageHeading
        actions={
          canEdit ? (
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => onNavigate("editor")}
            >
              Новая статья
            </Button>
          ) : undefined
        }
        eyebrow="База знаний"
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
            <label className="relative min-w-0 sm:w-52">
              <span className="sr-only">Сортировка</span>
              <Filter
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <select
                className="h-11 w-full appearance-none rounded-xl border border-[var(--ms-border-strong)] bg-white pl-10 pr-3 text-sm font-medium outline-none focus:border-[var(--ms-primary)]"
                onChange={(event) => setSort(event.target.value)}
                value={sort}
              >
                <option value="updated">Сначала обновлённые</option>
                <option value="title">По названию</option>
              </select>
            </label>
          </div>

          {visibleArticles.length ? (
            <div className="grid min-w-0 gap-3 lg:grid-cols-2">
              {visibleArticles.map((article) => (
                <article
                  className="group flex min-w-0 flex-col rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--ms-primary)] hover:shadow-[var(--ms-card-shadow-hover)]"
                  key={article.id}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                      {article.kind === "video" ? (
                        <Video className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <FileText className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--ms-muted)]">
                          {article.section}
                        </span>
                        {article.status === "Черновик" ? <Badge tone="amber">Черновик</Badge> : null}
                      </div>
                      <h2 className="mt-2 font-heading text-lg font-bold leading-snug">{article.title}</h2>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--ms-muted)]">{article.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="text-xs text-slate-400">Обновлено: {article.updated}</span>
                    <button
                      aria-label={`Открыть: ${article.title}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ms-primary)] transition group-hover:translate-x-1 group-hover:bg-[var(--ms-primary-soft)]"
                      onClick={() =>
                        onNavigate(
                          article.status === "Черновик"
                            ? "editor"
                            : article.kind === "video"
                              ? "video"
                              : "article",
                        )
                      }
                      type="button"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
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
