import { SearchHighlight } from "./SearchHighlight";
import { ArrowRight, FileText, Video } from "lucide-react";
import { useState } from "react";
import type { Navigate } from "../../app/types";
import { FileTypeIcon } from "../../components/FileTypeIcon";
import { Badge } from "../../components/ui";
import type { MaterialResult } from "../../data/material-query";
import { canPreviewFile } from "../../data/file-types";
import { downloadDemoFile } from "../../data/download";
export type KnowledgeView = "cards" | "table";
const Tags = ({ tags }: { tags: string[] }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
      {(expanded ? tags : tags.slice(0, 2)).map((tag) => (
        <Badge key={tag}>{tag}</Badge>
      ))}
      {tags.length > 2 ? (
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--ms-primary)]"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Свернуть теги" : `Ещё тегов: ${tags.length - 2}`}
        </button>
      ) : null}
    </div>
  );
};
export const KnowledgeResults = ({
  results,
  onNavigate,
  view,
  search = false,
  query = "",
}: {
  results: MaterialResult[];
  onNavigate: Navigate;
  view: KnowledgeView;
  search?: boolean;
  query?: string;
}) => (
  <div
    className={
      view === "cards"
        ? "grid min-w-0 gap-3 lg:grid-cols-2"
        : "min-w-0 space-y-2"
    }
    data-testid={
      view === "cards" ? "knowledge-card-view" : "knowledge-table-view"
    }
  >
    {results.map((result) => {
      const open = () =>
        result.file && !canPreviewFile(result.file)
          ? downloadDemoFile(result.file)
          : onNavigate(
              result.kind === "file"
                ? "file-preview"
                : result.kind === "video"
                  ? "video"
                  : "article",
              result.id,
            );
      const label = result.file
        ? `${canPreviewFile(result.file) ? "Просмотреть" : "Скачать"} файл: ${result.title}`
        : `Открыть материал: ${result.title}`;
      return (
        <article
          key={`${result.kind}:${result.id}`}
          className="min-w-0 rounded-xl border border-[var(--ms-border)] bg-white p-4"
          data-material-id={result.id}
        >
          <div
            className={
              view === "table"
                ? "grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_180px]"
                : ""
            }
          >
            <div className="min-w-0">
              <button
                type="button"
                aria-label={label}
                onClick={open}
                className="group flex w-full min-w-0 items-start gap-3 text-left"
              >
                {result.file ? (
                  <FileTypeIcon type={result.file.type} />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                    {result.kind === "video" ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[var(--ms-muted)]">
                    {result.kind === "file"
                      ? `Файл ${result.file!.type}`
                      : result.kind === "video"
                        ? "Видео · демонстрация"
                        : "Статья"}{" "}
                    · {result.match}
                  </span>
                  <span
                    role="heading"
                    aria-level={2}
                    className="mt-1 block font-heading font-bold leading-snug [overflow-wrap:anywhere] group-hover:text-[var(--ms-primary)]"
                  >
                    <SearchHighlight text={result.title} query={query} />
                  </span>
                  <span className="mt-1 block text-sm text-[var(--ms-muted)]">
                    {result.description}
                  </span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--ms-primary)]" />
              </button>
              <Tags tags={result.tags} />
            </div>
            <div className="min-w-0 text-xs leading-5 text-[var(--ms-muted)]">
              <p>{result.sections.join(" · ")}</p>
              <p>Обновлено: {result.updated}</p>
            </div>
          </div>
          {search && result.snippet ? (
            <p className="mt-3 rounded-lg bg-[var(--ms-surface-subtle)] p-3 text-sm [overflow-wrap:anywhere]">
              {result.kind === "file" ? "Фрагмент файла" : "Фрагмент статьи"}: «
              <SearchHighlight text={result.snippet} query={query} />»
            </p>
          ) : null}
          {result.related.length ? (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-[var(--ms-primary)]">
                Связанные статьи · {result.related.length}
              </summary>
              <ul className="mt-2 max-h-56 space-y-2 overflow-auto">
                {result.related.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="text-left text-[var(--ms-primary)] hover:underline"
                      onClick={() =>
                        onNavigate(
                          a.kind === "video" ? "video" : "article",
                          a.id,
                        )
                      }
                    >
                      {a.title}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </article>
      );
    })}
  </div>
);
