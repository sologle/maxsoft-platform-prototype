import { Download } from "lucide-react";
import type { Navigate } from "../../app/types";
import { FileTypeIcon } from "../../components/FileTypeIcon";
import { files } from "../../data/platform-data";
import { canPreviewFile } from "../../data/file-types";
import { downloadDemoFile } from "../../data/download";
import { licensingFileName } from "../../data/licensing/catalog";
export const ArticleAttachments = ({
  articleId,
  onNavigate,
}: {
  articleId: string;
  onNavigate: Navigate;
}) => {
  const attachments = files.filter((file) =>
    file.relatedArticleIds.includes(articleId),
  );
  if (!attachments.length) return null;
  return (
    <section
      className="reading-attachments"
      aria-labelledby="attachments-title"
    >
      <h2 id="attachments-title" tabIndex={-1}>
        Вложения
      </h2>
      <div className="mt-3 space-y-2">
        {attachments.map((file) => (
          <div
            key={file.name}
            className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-[var(--ms-border)] p-3"
          >
            <FileTypeIcon type={file.type} />
            <div className="min-w-0 flex-1 basis-36">
              {canPreviewFile(file) ? (
                <button
                  type="button"
                  className="block text-left text-sm font-bold text-[var(--ms-primary)] [overflow-wrap:anywhere]"
                  aria-label={`Открыть файл: ${file.name}`}
                  onClick={() => onNavigate("file-preview", file.name)}
                >
                  {file.name}
                </button>
              ) : (
                <span className="text-sm font-bold [overflow-wrap:anywhere]">
                  {file.name}
                </span>
              )}
              <span className="block text-xs text-[var(--ms-muted)]">
                {file.type} · {file.size}
                {file.name === licensingFileName
                  ? " · Исходный PDF"
                  : " · Демонстрационный файл"}
              </span>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-[var(--ms-border)] p-2 text-sm"
              aria-label={`Скачать ${file.name}`}
              onClick={() => downloadDemoFile(file)}
            >
              <Download className="h-4 w-4 shrink-0" />
              Скачать{file.name === licensingFileName ? "" : " демо .txt"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
