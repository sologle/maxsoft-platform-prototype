import { BookOpen, ChevronRight, FileText, Filter, Search, SlidersHorizontal, Video, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppPage, UserRole } from "../../app/types";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Button, EmptyState, PageHeading } from "../../components/ui";
import { articles } from "../../data/platform-data";

interface SearchPageProps {
  onNavigate: (page: AppPage) => void;
  role: UserRole;
}

const availableTags = ["НАВИСА", "Лицензирование", "Интеграция", "Обновление", "Проекты"];

export const SearchPage = ({ onNavigate, role }: SearchPageProps) => {
  const [query, setQuery] = useState("лицензия");
  const [draftQuery, setDraftQuery] = useState("лицензия");
  const [tags, setTags] = useState<string[]>([]);
  const [section, setSection] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const canSeeDrafts = role === "portal-admin" || role === "support-engineer" || role === "manager";

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return articles.filter((article) => {
      if (!canSeeDrafts && article.status === "Черновик") return false;
      const haystack = `${article.title} ${article.description} ${article.tags.join(" ")}`.toLowerCase();
      const words = normalized.split(/\s+/).filter(Boolean);
      const matchesText = words.some((word) => haystack.includes(word));
      const matchesTags = tags.length === 0 || tags.every((tag) => article.tags.includes(tag));
      const matchesSection = section === "all" || article.section.includes(section);
      return matchesText && matchesTags && matchesSection;
    });
  }, [canSeeDrafts, query, section, tags]);

  const toggleTag = (tag: string) =>
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  const submit = () => {
    setQuery(draftQuery);
    setFocused(false);
  };

  const Filters = ({ showApply = false }: { showApply?: boolean }) => (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-bold">Раздел</h3>
        <div className="space-y-2">
          {["all", "НАВИСА", "Продукты"].map((value) => (
            <label className="option-row" key={value}>
              <input
                checked={section === value}
                name="search-section"
                onChange={() => setSection(value)}
                type="radio"
              />
              <span>{value === "all" ? "Вся база знаний" : value}</span>
            </label>
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-bold">Теги</h3>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              aria-pressed={tags.includes(tag)}
              className={`rounded-full px-3 py-2 text-sm font-semibold ring-1 transition ${tags.includes(tag) ? "bg-[var(--ms-primary)] text-white ring-[var(--ms-primary)]" : "bg-white text-[var(--ms-muted)] ring-[var(--ms-border-strong)] hover:ring-[var(--ms-primary)]"}`}
              key={tag}
              onClick={() => toggleTag(tag)}
              type="button"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>
      {showApply ? (
        <Button
          className="w-full"
          onClick={() => {
            submit();
            setFiltersOpen(false);
          }}
        >
          Показать результаты
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      <PageHeading
        eyebrow="Поиск"
        subtitle="По статьям и текстовому содержимому документов с учётом ваших прав доступа."
        title="Найдите нужный материал"
      />
      <form
        className="relative mx-auto mb-6 max-w-4xl"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Search
          className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          aria-label="Поиск по базе знаний"
          className="h-14 w-full min-w-0 rounded-2xl border border-[var(--ms-border-strong)] bg-white pl-12 pr-28 text-base shadow-[var(--ms-card-shadow)] outline-none transition focus:border-[var(--ms-primary)] focus:ring-4 focus:ring-[var(--ms-primary-ring)] sm:h-16 sm:pr-36 sm:text-lg"
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onChange={(event) => setDraftQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Название, термин или фраза"
          value={draftQuery}
        />
        {draftQuery ? (
          <button
            aria-label="Очистить поиск"
            className="absolute right-[84px] top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:right-[116px]"
            onClick={() => {
              setDraftQuery("");
              setQuery("");
            }}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
        <button
          className="absolute bottom-1.5 right-1.5 top-1.5 rounded-xl bg-[var(--ms-primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--ms-primary-hover)] sm:px-7"
          type="submit"
        >
          Найти
        </button>
        {focused && draftQuery ? (
          <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-[var(--ms-border)] bg-white p-2 shadow-[0_18px_50px_rgba(24,43,66,.18)]">
            {["лицензия активация", "лицензия сервер", "лицензирование НАВИСА"]
              .filter((item) => item.includes(draftQuery.toLowerCase()) || draftQuery.length < 4)
              .map((item) => (
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-[var(--ms-primary-soft)]"
                  key={item}
                  onClick={() => {
                    setDraftQuery(item);
                    setQuery(item);
                    setFocused(false);
                  }}
                  type="button"
                >
                  <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {item}
                </button>
              ))}
          </div>
        ) : null}
      </form>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] lg:sticky lg:top-28 lg:block">
          <div className="mb-5 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-[var(--ms-primary)]" aria-hidden="true" />
            <h2 className="font-heading font-bold">Фильтры</h2>
          </div>
          <Filters />
        </aside>
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-[var(--ms-muted)]">
              По запросу <strong className="text-[var(--ms-text)]">«{query}»</strong> найдено:{" "}
              {results.length}
            </p>
            <Button
              className="ml-auto lg:hidden"
              icon={<Filter className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setFiltersOpen(true)}
              tone="secondary"
            >
              Фильтры{tags.length ? ` · ${tags.length}` : ""}
            </Button>
          </div>
          {tags.length ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)} type="button">
                  <Badge>{tag} ×</Badge>
                </button>
              ))}
            </div>
          ) : null}
          {results.length ? (
            <div className="space-y-3">
              {results.map((article) => (
                <article
                  className="group min-w-0 rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] transition hover:border-[var(--ms-primary)] hover:shadow-[var(--ms-card-shadow-hover)] sm:p-6"
                  key={article.id}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                      {article.kind === "video" ? (
                        <Video className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <BookOpen className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--ms-muted)]">
                        {article.section} · совпадение в{" "}
                        {article.id === "network-license" ? "тексте PDF" : "статье"}
                      </p>
                      <h2 className="mt-1 font-heading text-lg font-bold sm:text-xl">{article.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-[var(--ms-muted)]">{article.description}</p>
                    </div>
                    <button
                      aria-label={`Открыть: ${article.title}`}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--ms-primary)] transition group-hover:translate-x-1 group-hover:bg-[var(--ms-primary-soft)]"
                      onClick={() => onNavigate(article.kind === "video" ? "video" : "article")}
                      type="button"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                  {article.id === "network-license" ? (
                    <div className="mt-4 flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-[var(--ms-muted)]">
                      <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        инструкция_активации.pdf · «…проверьте адрес сервера лицензии…»
                      </span>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              action={
                <Button
                  onClick={() => {
                    setDraftQuery("лицензия");
                    setQuery("лицензия");
                    setTags([]);
                    setSection("all");
                  }}
                >
                  Сбросить поиск
                </Button>
              }
              text="Попробуйте убрать часть фильтров или изменить формулировку запроса."
              title="Ничего не найдено"
            />
          )}
        </section>
      </div>

      <ResponsiveOverlay label="Фильтры поиска" onClose={() => setFiltersOpen(false)} open={filtersOpen}>
        <Filters showApply />
      </ResponsiveOverlay>
    </>
  );
};
