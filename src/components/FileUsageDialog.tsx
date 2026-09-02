import { Download, FileText, X } from "lucide-react";
import { mockFileUsage } from "../data/mock-data";

interface FileUsageDialogProps {
  onClose: () => void;
  onDownload: () => void;
  onOpenArticle: (kind: "article" | "video") => void;
}

export const FileUsageDialog = ({ onClose, onDownload, onOpenArticle }: FileUsageDialogProps) => (
  <div
    aria-labelledby="file-usage-title"
    aria-modal="true"
    className="fixed inset-0 z-[80] flex justify-end bg-[#0b1726]/55 backdrop-blur-[2px]"
    role="dialog"
  >
    <aside className="flex h-full w-full max-w-[520px] animate-[drawer-in_200ms_ease-out] flex-col bg-white shadow-[-18px_0_60px_rgba(0,0,0,0.22)]">
      <header className="flex items-start gap-4 border-b border-[var(--ms-border)] p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ms-primary)]">
            инструкция_активации.pdf
          </p>
          <h2 className="font-heading mt-1 text-2xl font-bold text-[var(--ms-text)]" id="file-usage-title">
            Места использования
          </h2>
        </div>
        <button
          aria-label="Закрыть места использования"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--ms-muted)] transition hover:bg-slate-100 hover:text-[var(--ms-text)]"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-auto p-5 sm:p-6">
        <p className="text-sm leading-6 text-[var(--ms-muted)]">
          Файл используется в опубликованных материалах. Перед заменой проверьте связанные статьи.
        </p>
        <div className="mt-5 grid gap-3">
          {mockFileUsage.map((item) => (
            <button
              aria-label={`${item.articleKind === "video" ? "Видео" : "Статья"}: ${item.title}`}
              className="w-full rounded-xl border border-[var(--ms-border)] p-4 text-left transition hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ms-primary)]"
              key={item.id}
              onClick={() => onOpenArticle(item.articleKind)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-bold leading-5 text-[var(--ms-text)]">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--ms-muted)]">{item.path}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <footer className="border-t border-[var(--ms-border)] p-5 sm:p-6">
        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--ms-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--ms-primary-hover)]"
          onClick={onDownload}
          type="button"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Скачать файл
        </button>
      </footer>
    </aside>
  </div>
);
