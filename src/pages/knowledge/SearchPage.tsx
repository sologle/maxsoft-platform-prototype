import { useId, useRef, useState } from "react";
import { SearchSuggestions } from "./SearchSuggestions";
import { Filter, Search, X } from "lucide-react";
import type { Navigate, UserRole } from "../../app/types";
import { usePageState } from "../../hooks/usePageState";
import {
  GroupedTagPicker,
  getTagGroups,
} from "../../components/GroupedTagPicker";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Button, EmptyState, PageHeading } from "../../components/ui";
import { articles } from "../../data/platform-data";
import { getArticleTags } from "../../data/prototype-entities";
import {
  queryMaterials,
  visibleArticleIds,
  type MaterialKind,
} from "../../data/material-query";
import { KnowledgeTree } from "./KnowledgeTree";
import { KnowledgeResults } from "./KnowledgeResults";
import { MaterialFilters } from "./MaterialFilters";
export const SearchPage = ({
  companyType,
  onNavigate,
  role,
}: {
  companyType?: string;
  onNavigate: Navigate;
  role: UserRole;
}) => {
  const initialQuery =
    new URL(window.location.href).searchParams.get("resource") ?? "лицензия";
  const [query, setQuery] = usePageState("query", initialQuery);
  const [draft, setDraft] = usePageState("draftQuery", initialQuery);
  const [tags, setTags] = usePageState<string[]>("tags", []);
  const [section, setSection] = usePageState("section", "all");
  const [kind, setKind] = usePageState<MaterialKind>("kind", "all");
  const [sort, setSort] = usePageState("sort", "updated");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const suggestionsId = useId();
  const ids = visibleArticleIds({ role, companyType });
  const names = new Set(
    articles.filter((a) => ids.includes(a.id)).flatMap(getArticleTags),
  );
  const suggestions = [...names].filter((name) =>
    name.toLowerCase().includes(draft.toLowerCase()),
  );
  const suggestionsOpen = focused && Boolean(draft) && suggestions.length > 0;
  const groups = getTagGroups()
    .map((g) => ({ ...g, tags: g.tags.filter((t) => names.has(t.name)) }))
    .filter((g) => g.tags.length);
  const results = queryMaterials({
    role,
    companyType,
    query,
    tags,
    section,
    kind,
    sort,
  });
  const toggle = (tag: string) =>
    setTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    );
  const reset = () => {
    setQuery("");
    setDraft("");
    setTags([]);
    setSection("all");
    setKind("all");
  };
  const filters = () => (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 text-sm font-bold">Раздел</h3>
        <KnowledgeTree
          selected={section}
          onSelect={setSection}
          articleIds={ids}
        />
      </section>
      <section>
        <h3 className="mb-3 text-sm font-bold">Теги</h3>
        <GroupedTagPicker groups={groups} selected={tags} onToggle={toggle} />
      </section>
      <Button
        tone="ghost"
        onClick={() => {
          setTags([]);
          setSection("all");
          setKind("all");
        }}
      >
        Сбросить фильтры
      </Button>
    </div>
  );
  return (
    <>
      <PageHeading
        eyebrow="Поиск"
        title="Результаты поиска"
        subtitle="Поиск по статьям, тегам и доступному тексту PDF/DOCX в демокаталоге. Загрузка новых файлов не создаёт поисковый индекс."
      />
      <form
        className="relative mb-5"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !suggestionsOpen) return;
          event.preventDefault();
          event.stopPropagation();
          searchInput.current?.focus({ preventScroll: true });
          setFocused(false);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(draft);
          setFocused(false);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-4 h-5 w-5 text-slate-400" />
        <input
          ref={searchInput}
          aria-label="Поиск по базе знаний"
          aria-controls={suggestionsId}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          onClick={() => setFocused(true)}
          placeholder="Название, термин или фраза"
          className="h-12 w-full min-w-0 rounded-xl border border-[var(--ms-border)] bg-white pl-10 pr-32 text-sm"
        />
        {draft ? (
          <button
            type="button"
            aria-label="Очистить поиск"
            className="icon-button absolute right-20 top-1"
            onClick={() => {
              setDraft("");
              setQuery("");
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="submit"
          className="absolute bottom-1 right-1 top-1 rounded-lg bg-[var(--ms-primary)] px-4 text-sm font-bold text-white"
        >
          Найти
        </button>
        <SearchSuggestions
          id={suggestionsId}
          anchor={searchInput}
          open={suggestionsOpen}
          suggestions={suggestions}
          onSelect={(name) => {
            if (!tags.includes(name)) setTags([...tags, name]);
            setDraft("");
            setQuery("");
            searchInput.current?.focus({ preventScroll: true });
            setFocused(false);
          }}
        />
      </form>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-xl border border-[var(--ms-border)] bg-white p-4 lg:block">
          <h2 className="mb-4 font-bold">Фильтры</h2>
          {filters()}
        </aside>
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <MaterialFilters
              kind={kind}
              setKind={setKind}
              sort={sort}
              setSort={setSort}
            />
            <Button
              className="lg:hidden"
              tone="secondary"
              icon={<Filter className="h-4 w-4" />}
              onClick={() => setFiltersOpen(true)}
            >
              Фильтры{tags.length ? ` · ${tags.length}` : ""}
            </Button>
          </div>
          <p className="mb-3 text-sm text-[var(--ms-muted)]">
            По запросу «{query}» найдено: {results.length}
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                aria-label={`Убрать тег ${tag}`}
              >
                <Badge>{tag} ×</Badge>
              </button>
            ))}
          </div>
          {results.length ? (
            <KnowledgeResults
              results={results}
              onNavigate={onNavigate}
              view="table"
              search
              query={query}
            />
          ) : (
            <EmptyState
              title="Ничего не найдено"
              text="Попробуйте убрать часть фильтров или изменить формулировку запроса."
              action={<Button onClick={reset}>Сбросить поиск</Button>}
            />
          )}
        </section>
      </div>
      <ResponsiveOverlay
        label="Фильтры поиска"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      >
        {filters()}
        <Button className="mt-5 w-full" onClick={() => setFiltersOpen(false)}>
          Показать результаты
        </Button>
      </ResponsiveOverlay>
    </>
  );
};
