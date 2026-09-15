import { Download, Eye } from "lucide-react";
import type { Navigate } from "../../app/types";
import { FileTypeIcon } from "../../components/FileTypeIcon";
import { files } from "../../data/platform-data";
import { canPreviewFile } from "../../data/file-types";
import { downloadDemoFile } from "../../data/download";
export const ArticleAttachments = ({
  articleId,
  onNavigate,
}: {
  articleId: string;
  onNavigate: Navigate;
}) => {
  const attachments = files.filter((file) => file.relatedArticleIds.includes(articleId));
  if (!attachments.length) return null;
  return (
    <section
      className="mt-10 border-t border-[var(--ms-border)] pt-7"
      aria-labelledby="attachments-title"
    >
      <h2 id="attachments-title">Вложения</h2>
      <div className="mt-4 space-y-3">
        {attachments.map((file) => (
          <button
            key={file.name}
            className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-[var(--ms-border)] p-4 text-left hover:bg-[var(--ms-primary-soft)]"
            onClick={() =>
              canPreviewFile(file) ? onNavigate("file-preview", file.name) : downloadDemoFile(file)
            }
          >
            <FileTypeIcon type={file.type} />
            <span className="min-w-0 flex-1">
              <span className="block break-words text-sm font-bold">{file.name}</span>
              <span className="block text-xs text-[var(--ms-muted)]">
                {file.type} ·{" "}
                {canPreviewFile(file) ? "Открыть предпросмотр" : "Скачать демозаглушку (.txt)"}
              </span>
            </span>
            {canPreviewFile(file) ? (
              <Eye className="h-5 w-5 shrink-0" />
            ) : (
              <Download className="h-5 w-5 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
