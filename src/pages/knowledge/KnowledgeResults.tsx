import { ArrowRight, FileText, Video } from "lucide-react";
import type { Navigate } from "../../app/types";
import { FileTypeIcon } from "../../components/FileTypeIcon";
import type { MaterialResult } from "../../data/material-query";
import { canPreviewFile } from "../../data/file-types";
import { downloadDemoFile } from "../../data/download";
import { SearchHighlight } from "./SearchHighlight";
import { CompactMaterialTags, MaterialTagGroups } from "./MaterialTags";
import "./materials.css";
export type KnowledgeView = "cards" | "table";
const MaterialIcon = ({ result }: { result: MaterialResult }) =>
  result.file ? (
    <FileTypeIcon type={result.file.type} />
  ) : (
    <span className="material-icon">
      {result.kind === "video" ? (
        <Video aria-hidden="true" />
      ) : (
        <FileText aria-hidden="true" />
      )}
    </span>
  );
const MaterialLinks = ({
  result,
  onNavigate,
}: {
  result: MaterialResult;
  onNavigate: Navigate;
}) =>
  result.related.length > 0 && (
    <details className="material-related">
      <summary>Связанные статьи · {result.related.length}</summary>
      <ul>
        {result.related.map((article) => (
          <li key={article.id}>
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  article.kind === "video" ? "video" : "article",
                  article.id,
                )
              }
            >
              {article.title}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
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
    className={`material-results material-results-${view}`}
    data-testid={
      view === "cards" ? "knowledge-card-view" : "knowledge-table-view"
    }
  >
    {view === "table" && (
      <div className="material-columns" aria-hidden="true">
        <span />
        <span>Материал</span>
        <span>Раздел</span>
        <span>Обновлено</span>
        <span />
      </div>
    )}
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
          className="material-result"
          data-material-id={result.id}
        >
          <div className="material-row">
            <div className="material-type">
              <MaterialIcon result={result} />
            </div>
            <div className="material-main">
              <p className="material-kind">
                {result.file
                  ? `Файл ${result.file.type}`
                  : result.kind === "video"
                    ? "Видео · демонстрация"
                    : "Статья"}{" "}
                · {result.match}
              </p>
              <h2 className="material-title" aria-label={result.title}>
                <button type="button" aria-label={label} onClick={open}>
                  <SearchHighlight text={result.title} query={query} />
                </button>
              </h2>
              {view === "table" ? (
                <CompactMaterialTags tags={result.tags} />
              ) : (
                <p className="material-description">{result.description}</p>
              )}
            </div>
            <div className="material-section">
              {result.sections[0]}
              {result.sections.length > 1
                ? ` (+${result.sections.length - 1})`
                : ""}
            </div>
            <div className="material-date">
              <span className="material-date-label">Обновлено: </span>
              <time dateTime={result.updatedAt}>{result.updated}</time>
            </div>
            <button
              type="button"
              className="material-go"
              aria-label={`${result.file && !canPreviewFile(result.file) ? "Скачать" : "Перейти"}: ${result.title}`}
              onClick={open}
            >
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
          {view === "cards" && <MaterialTagGroups tags={result.tags} />}
          {view === "table" ? (
            <details className="material-details">
              <summary>Подробности материала</summary>
              <div className="material-details-body">
                <p className="font-semibold">
                  <SearchHighlight text={result.title} query={query} />
                </p>
                <p>{result.description}</p>
                <p>Разделы: {result.sections.join(" · ")}</p>
                <p>
                  Обновлено:{" "}
                  <time dateTime={result.updatedAt}>{result.updated}</time>
                </p>
              </div>
            </details>
          ) : (
            <p className="material-paths">
              Разделы: {result.sections.join(" · ")}
            </p>
          )}
          {search && result.snippet && (
            <p className="material-snippet">
              {result.kind === "file" ? "Фрагмент файла" : "Фрагмент статьи"}: «
              <SearchHighlight text={result.snippet} query={query} />»
            </p>
          )}
          <MaterialLinks result={result} onNavigate={onNavigate} />
        </article>
      );
    })}
  </div>
);
