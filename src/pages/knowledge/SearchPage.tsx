import { BookOpen, ChevronRight, FileText, Filter, Search, SlidersHorizontal, Video, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Navigate, UserRole } from "../../app/types";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Button, EmptyState, PageHeading } from "../../components/ui";
import {
  articles,
  canRoleAccessArticle,
  isArticlePublished,
  tagGroups,
  type ArticleSummary,
} from "../../data/platform-data";
import { getArticleSections, getArticleTags } from "../../data/prototype-entities";
import { prototypeStorageKeys, readPrototypeValue } from "../../data/prototype-store";

interface SearchPageProps {
  companyType?: string;
  onNavigate: Navigate;
  role: UserRole;
}

const searchableContent: Record<
  string,
  { articleText: string; file?: { name: string; text: string; type: string } }
> = {
  "network-license": {
    articleText: "Установка сервера лицензий, подключение рабочего места и диагностика соединения.",
    file: {
      name: "инструкция_активации.pdf",
      text: "Проверьте адрес сервера лицензии и доступность порта 1947 из корпоративной сети.",
      type: "PDF",
    },
  },
  "cad-integration": {
    articleText: "Подключение модуля, настройка обмена и проверка первой синхронизации.",
  },
  "project-template": {
    articleText: "Структура каталогов, шаблоны именования и совместная работа над проектом.",
  },
  "server-migration": {
    articleText: "Перенос службы лицензирования на новый сервер без остановки рабочих мест.",
  },
  "update-2026": {
    articleText: "Резервная копия, обновление компонентов и проверка совместимости модулей.",
  },
};

type SearchMatch = {
  label: string;
  snippet?: string;
  source: "article" | "description" | "file" | "tag" | "title";
};

const wordMatches = (text: string, words: string[]) => {
  const normalized = text.toLowerCase();
  return words.every(
    (word) => normalized.includes(word) || (word.length > 5 && normalized.includes(word.slice(0, -1))),
  );
};

const findMatch = (
  article: ArticleSummary,
  articleTags: string[],
  words: string[],
  availableTags: string[],
): SearchMatch | null => {
  const content = searchableContent[article.id];
  const candidates: Array<{ label: string; source: SearchMatch["source"]; text?: string }> = [
    { label: "Совпадение в заголовке статьи", source: "title", text: article.title },
    { label: "Совпадение в описании статьи", source: "description", text: article.description },
    {
      label: "Совпадение в теге",
      source: "tag",
      text: articleTags.filter((tag) => availableTags.includes(tag)).join(" "),
    },
    { label: "Совпадение в тексте статьи", source: "article", text: content?.articleText },
    {
      label: content?.file ? `Совпадение в тексте ${content.file.type}` : "",
      source: "file",
      text: content?.file?.text,
    },
  ];
  const match = candidates.find((candidate) => candidate.text && wordMatches(candidate.text, words));
  if (!match) return null;
  return {
    label: match.label,
    snippet: match.text,
    source: match.source,
  };
};

const Highlight = ({ query, text }: { query: string; text: string }) => {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .flatMap((term) => (term.length > 5 ? [term, term.slice(0, -1)] : [term]))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  if (!terms.length) return text;
  const escaped = [...new Set(terms)].map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const matcher = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(matcher).map((part, index) =>
    terms.includes(part.toLowerCase()) ? (
      <mark className="search-highlight" key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

export const SearchPage = ({ companyType, onNavigate, role }: SearchPageProps) => {
  const [availableTags] = useState(() =>
    readPrototypeValue<Array<{ tags: Array<{ name: string }> }>>(
      prototypeStorageKeys.tags,
      tagGroups.map((group) => ({ tags: group.tags.map((name) => ({ name })) })),
    ).flatMap((group) => group.tags.map((tag) => tag.name)),
  );
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
    return articles.flatMap((article) => {
      if (!canSeeDrafts && !isArticlePublished(article)) return [];
      if (!canRoleAccessArticle(article, role, companyType)) return [];
      const words = normalized.split(/\s+/).filter(Boolean);
      const articleTags = getArticleTags(article);
      const articleSections = getArticleSections(article);
      const match = findMatch(article, articleTags, words, availableTags);
      const matchesTags = tags.length === 0 || tags.every((tag) => articleTags.includes(tag));
      const matchesSection =
        section === "all" || articleSections.some((articleSection) => articleSection.includes(section));
      return match && matchesTags && matchesSection ? [{ article, match }] : [];
    });
  }, [availableTags, canSeeDrafts, companyType, query, role, section, tags]);

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
        subtitle="Совпадения в статьях, описаниях, тегах и текстовом содержимом файлов."
        title="Результаты поиска"
      />
      <form
        className="relative mb-5"
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
          className="h-12 w-full min-w-0 rounded-xl border border-[var(--ms-border-strong)] bg-white pl-11 pr-28 text-sm outline-none transition focus:border-[var(--ms-primary)] focus:ring-4 focus:ring-[var(--ms-primary-ring)] sm:pr-36"
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
          <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-[var(--ms-border)] bg-white p-2 shadow-[0_18px_50px_rgba(24,43,66,.18)]">
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

      <div className="grid min-w-0 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-xl border border-[var(--ms-border)] bg-white p-4 lg:sticky lg:top-28 lg:block">
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
              {results.map(({ article, match }) => (
                <article
                  aria-label={`Открыть материал: ${article.title}`}
                  className="group min-w-0 cursor-pointer rounded-xl border border-[var(--ms-border)] border-l-[3px] border-l-[var(--ms-primary)] bg-white p-4 transition hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ms-primary)]"
                  key={article.id}
                  onClick={() => onNavigate(article.kind === "video" ? "video" : "article", article.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    onNavigate(article.kind === "video" ? "video" : "article", article.id);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                      {article.kind === "video" ? (
                        <Video className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <BookOpen className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--ms-muted)]">
                        <span>{getArticleSections(article).join(" · ")}</span>
                        <span className="rounded-full bg-[var(--ms-primary-soft)] px-2 py-1 text-[var(--ms-primary)]">{match.label}</span>
                      </div>
                      <h2 className="mt-1.5 font-heading text-base font-bold sm:text-lg">
                        <Highlight query={query} text={article.title} />
                      </h2>
                      <p className="mt-1.5 text-sm leading-5 text-[var(--ms-muted)]">
                        <Highlight query={query} text={article.description} />
                      </p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--ms-primary)] transition group-hover:translate-x-1 group-hover:bg-white">
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  {match.source === "file" ? (
                    <div className="mt-4 flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-[var(--ms-muted)]">
                      <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {searchableContent[article.id]?.file?.name} · «
                        <Highlight query={query} text={match.snippet ?? ""} />»
                      </span>
                    </div>
                  ) : null}
                  {match.source === "article" || match.source === "tag" ? (
                    <div className="mt-4 flex min-w-0 items-center gap-2 rounded-xl bg-[var(--ms-primary-soft)] px-3 py-2 text-xs text-[var(--ms-muted)]">
                      <BookOpen
                        className="h-4 w-4 shrink-0 text-[var(--ms-primary)]"
                        aria-hidden="true"
                      />
                      <span>
                        {match.source === "tag" ? "Тег: " : "Фрагмент статьи: «"}
                        <Highlight query={query} text={match.snippet ?? ""} />
                        {match.source === "article" ? "»" : ""}
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
