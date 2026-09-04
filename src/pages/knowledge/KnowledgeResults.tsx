import { ArrowRight, FileText, Video } from "lucide-react";
import type { Navigate } from "../../app/types";
import { FileTypeIcon } from "../../components/FileTypeIcon";
import { Badge } from "../../components/ui";
import { isArticlePublished, type ArticleSummary } from "../../data/platform-data";
import { getArticleSections, getArticleTags } from "../../data/prototype-entities";

export type KnowledgeView = "cards" | "table";

const openArticle = (article: ArticleSummary, onNavigate: Navigate) =>
  onNavigate(
    !isArticlePublished(article) ? "editor" : article.kind === "video" ? "video" : "article",
    article.id,
  );

const MaterialIcon = ({ kind }: { kind: ArticleSummary["kind"] }) => (
  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
    {kind === "video" ? <Video className="h-5 w-5" aria-hidden="true" /> : <FileText className="h-5 w-5" aria-hidden="true" />}
  </span>
);

export const KnowledgeResults = ({
  articles,
  onNavigate,
  showAttachedFile,
  view,
}: {
  articles: ArticleSummary[];
  onNavigate: Navigate;
  showAttachedFile: boolean;
  view: KnowledgeView;
}) => {
  if (view === "table") {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--ms-border)] bg-white" data-testid="knowledge-table-view">
        <div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(160px,.8fr)_120px_36px] gap-4 border-b border-[var(--ms-border)] bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-[.08em] text-slate-400 md:grid">
          <span>Материал</span><span>Раздел</span><span>Обновлено</span><span />
        </div>
        {articles.map((article) => (
          <button
            aria-label={`Открыть материал: ${article.title}`}
            className="group grid w-full min-w-0 grid-cols-[40px_minmax(0,1fr)_28px] items-center gap-3 border-b border-[var(--ms-border)] px-4 py-3 text-left transition last:border-b-0 hover:bg-[var(--ms-primary-soft)] md:grid-cols-[40px_minmax(0,1.35fr)_minmax(160px,.8fr)_120px_28px]"
            key={article.id}
            onClick={() => openArticle(article, onNavigate)}
            type="button"
          >
            <MaterialIcon kind={article.kind} />
            <span className="min-w-0">
              <span className="flex min-w-0 items-center gap-2"><span className="truncate text-sm font-bold">{article.title}</span>{!isArticlePublished(article) ? <Badge tone="amber">Черновик</Badge> : null}</span>
              <span className="mt-1 block truncate text-xs text-[var(--ms-muted)]">{article.description}</span>
            </span>
            <span className="hidden min-w-0 truncate text-xs text-[var(--ms-muted)] md:block">{getArticleSections(article).join(" · ")}</span>
            <span className="hidden text-xs text-slate-400 md:block">{article.updated}</span>
            <ArrowRight className="h-4 w-4 text-[var(--ms-primary)] transition group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        ))}
        {showAttachedFile ? (
          <button
            aria-label="Просмотреть файл: инструкция_активации.pdf"
            className="group grid w-full min-w-0 grid-cols-[40px_minmax(0,1fr)_28px] items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--ms-primary-soft)] md:grid-cols-[40px_minmax(0,1.35fr)_minmax(160px,.8fr)_120px_28px]"
            onClick={() => onNavigate("file-preview", "инструкция_активации.pdf")}
            type="button"
          >
            <FileTypeIcon type="PDF" />
            <span className="min-w-0"><span className="block truncate text-sm font-bold">инструкция_активации.pdf</span><span className="mt-1 block text-xs text-[var(--ms-muted)]">PDF · 2,4 МБ</span></span>
            <span className="hidden truncate text-xs text-[var(--ms-muted)] md:block">НАВИСА · Установка</span>
            <span className="hidden text-xs text-slate-400 md:block">Сегодня</span>
            <ArrowRight className="h-4 w-4 text-[var(--ms-primary)] transition group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-2" data-testid="knowledge-card-view">
      {articles.map((article) => (
        <button
          aria-label={`Открыть материал: ${article.title}`}
          className="group flex min-w-0 flex-col rounded-2xl border border-[var(--ms-border)] bg-white p-5 text-left shadow-[var(--ms-card-shadow)] transition hover:border-[var(--ms-primary)] hover:shadow-[var(--ms-card-shadow-hover)]"
          key={article.id}
          onClick={() => openArticle(article, onNavigate)}
          type="button"
        >
          <div className="flex min-w-0 items-start gap-3">
            <MaterialIcon kind={article.kind} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--ms-muted)]">
                <span>{getArticleSections(article).join(" · ")}</span>
                {!isArticlePublished(article) ? <Badge tone="amber">Черновик</Badge> : null}
              </div>
              <h2 className="mt-2 font-heading text-lg font-bold leading-snug">{article.title}</h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--ms-muted)]">{article.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">{getArticleTags(article).map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
          <div className="mt-auto flex items-center justify-between gap-3 pt-5"><span className="text-xs text-slate-400">Обновлено: {article.updated}</span><ArrowRight className="h-4 w-4 text-[var(--ms-primary)] transition group-hover:translate-x-1" aria-hidden="true" /></div>
        </button>
      ))}
      {showAttachedFile ? (
        <button
          aria-label="Просмотреть файл: инструкция_активации.pdf"
          className="group flex min-w-0 flex-col rounded-2xl border border-[var(--ms-border)] bg-white p-5 text-left shadow-[var(--ms-card-shadow)] transition hover:border-[var(--ms-primary)] hover:shadow-[var(--ms-card-shadow-hover)]"
          onClick={() => onNavigate("file-preview", "инструкция_активации.pdf")}
          type="button"
        >
          <div className="flex items-start gap-3"><FileTypeIcon type="PDF" /><div><Badge tone="red">PDF</Badge><h2 className="mt-2 break-words font-heading text-lg font-bold">инструкция_активации.pdf</h2></div></div>
          <p className="mt-3 text-sm leading-6 text-[var(--ms-muted)]">Инструкция по активации сетевой лицензии. Файл наследует доступ связанной статьи.</p>
          <span className="mt-auto pt-5 text-xs text-slate-400">PDF · 2,4 МБ · обновлено сегодня</span>
        </button>
      ) : null}
    </div>
  );
};
