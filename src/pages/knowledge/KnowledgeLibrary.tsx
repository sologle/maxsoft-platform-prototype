import {
  GroupedTagPicker,
  getTagGroups,
} from "../../components/GroupedTagPicker";
import { articles } from "../../data/platform-data";
import { getArticleTags } from "../../data/prototype-entities";
import { MaterialFilters } from "./MaterialFilters";
import {
  queryMaterials,
  visibleArticleIds,
  type MaterialKind,
} from "../../data/material-query";
import { usePageState } from "../../hooks/usePageState";
import { flattenTree, getKnowledgeTree } from "../../data/knowledge-tree";
import { FolderTree, LayoutGrid, List, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import type { Navigate, UserRole } from "../../app/types";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Button, EmptyState, PageHeading } from "../../components/ui";
import { KnowledgeTree } from "./KnowledgeTree";
import { KnowledgeResults, type KnowledgeView } from "./KnowledgeResults";

interface KnowledgeLibraryProps {
  companyType?: string;
  resource?: string;
  onNavigate: Navigate;
  role: UserRole;
}

export const KnowledgeLibrary = ({
  companyType,
  resource,
  onNavigate,
  role,
}: KnowledgeLibraryProps) => {
  const tree = getKnowledgeTree();
  const sectionLabels = Object.fromEntries(
    [{ id: "all", name: "Все материалы" }, ...flattenTree(tree)].map((node) => [
      node.id,
      node.name,
    ]),
  );
  const [section, setSection] = usePageState("section", resource ?? "all");
  const [query, setQuery] = usePageState("query", "");
  const [sort, setSort] = usePageState("sort", "updated");
  const [treeOpen, setTreeOpen] = useState(false);
  const [view, setView] = usePageState<KnowledgeView>("view", "table");
  const [kind, setKind] = usePageState<MaterialKind>("kind", "all");
  const canEdit = role === "portal-admin" || role === "support-engineer";
  const [tags, setTags] = usePageState<string[]>("tags", []);
  const results = queryMaterials({
    role,
    companyType,
    query,
    section,
    sort,
    kind,
    tags,
    content: false,
  });
  const articleIds = visibleArticleIds({ role, companyType });

  const visibleTags = new Set(
    articles.filter((a) => articleIds.includes(a.id)).flatMap(getArticleTags),
  );
  const tagGroups = getTagGroups()
    .map((g) => ({ ...g, tags: g.tags.filter((t) => visibleTags.has(t.name)) }))
    .filter((g) => g.tags.length);
  const selectSection = (next: string) => {
    setSection(next);
    setTreeOpen(false);
  };

  return (
    <>
      <PageHeading
        actions={
          <>
            <div
              className="inline-flex rounded-xl border border-[var(--ms-border-strong)] bg-white p-1"
              role="group"
              aria-label="Вид материалов"
            >
              <button
                aria-label="Табличный вид"
                aria-pressed={view === "table"}
                className={`icon-button !h-9 !w-9 ${view === "table" ? "bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]" : ""}`}
                onClick={() => setView("table")}
                type="button"
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                aria-label="Крупные карточки"
                aria-pressed={view === "cards"}
                className={`icon-button !h-9 !w-9 ${view === "cards" ? "bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]" : ""}`}
                onClick={() => setView("cards")}
                type="button"
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              </button>
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
            <FolderTree
              className="h-5 w-5 text-[var(--ms-primary)]"
              aria-hidden="true"
            />
            <h2 className="font-heading font-bold">Разделы</h2>
          </div>
          <KnowledgeTree
            onSelect={setSection}
            selected={section}
            articleIds={articleIds}
          />
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--ms-border)] bg-white p-3 shadow-[var(--ms-card-shadow)] sm:flex-row sm:flex-wrap sm:items-end">
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
                className="h-11 w-full min-w-0 rounded-xl border border-[var(--ms-border-strong)] bg-white pl-10 pr-11 text-sm outline-none transition focus:border-[var(--ms-primary)] focus:ring-4 focus:ring-[var(--ms-primary-ring)]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Фильтр по названию и тегам"
                value={query}
              />
              {query ? (
                <button
                  aria-label="Очистить фильтр материалов"
                  className="icon-button absolute right-1 top-1"
                  type="button"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </label>
            <MaterialFilters
              kind={kind}
              setKind={setKind}
              sort={sort}
              setSort={setSort}
            />
          </div>

          <details className="mb-4 rounded-xl border border-[var(--ms-border)] bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold">
              Фильтр по тегам · {tags.length}
            </summary>
            <div className="mt-3">
              <GroupedTagPicker
                groups={tagGroups}
                selected={tags}
                onToggle={(tag) =>
                  setTags((current) =>
                    current.includes(tag)
                      ? current.filter((t) => t !== tag)
                      : [...current, tag],
                  )
                }
              />
            </div>
          </details>
          <Button
            className="mb-4"
            tone="ghost"
            onClick={() => {
              onNavigate("search", query || undefined);
            }}
          >
            Поиск по тексту статей и файлов
          </Button>
          <p className="mb-3 text-sm text-[var(--ms-muted)]">
            Найдено материалов: {results.length}
          </p>
          {results.length ? (
            <KnowledgeResults
              results={results}
              onNavigate={onNavigate}
              view={view}
            />
          ) : (
            <EmptyState
              action={
                <Button
                  onClick={() => {
                    setQuery("");
                    setSection("all");
                    setKind("all");
                    setTags([]);
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
        <KnowledgeTree
          onSelect={selectSection}
          selected={section}
          articleIds={articleIds}
        />
      </ResponsiveOverlay>
    </>
  );
};
