import { AlertTriangle, CheckCircle2, FileUp, X } from "lucide-react";
import { mockImportFile } from "../data/mock-data";
import type { ImportOutcome } from "../prototype/navigation";
import { ModalSurface } from "./ModalSurface";

interface ImportOutcomeDialogProps {
  onCancel: () => void;
  onSelect: (outcome: ImportOutcome) => void;
}

export const ImportOutcomeDialog = ({ onCancel, onSelect }: ImportOutcomeDialogProps) => (
  <ModalSurface
    className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0b1726]/60 p-4 backdrop-blur-[2px]"
    labelledBy="import-outcome-title"
    onClose={onCancel}
  >
    <section className="w-full max-w-[540px] animate-[modal-in_180ms_ease-out] rounded-2xl bg-white p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
          <FileUp className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ms-primary)]">
            Демонстрационный импорт
          </p>
          <h2 className="font-heading mt-1 text-2xl font-bold text-[var(--ms-text)]" id="import-outcome-title">
            Результат импорта Word
          </h2>
          <p className="mt-2 text-sm text-[var(--ms-muted)]">
            {mockImportFile.filename} · {mockImportFile.sizeLabel}
          </p>
        </div>
        <button
          aria-label="Закрыть выбор результата импорта"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--ms-muted)] transition hover:bg-slate-100"
          onClick={onCancel}
          type="button"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          className="rounded-xl border border-[#a6d7b9] bg-[#effaf3] p-4 text-left transition hover:border-[#3a9661] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3a9661]"
          onClick={() => onSelect("success")}
          type="button"
        >
          <CheckCircle2 className="h-5 w-5 text-[#28794a]" aria-hidden="true" />
          <span className="mt-3 block text-sm font-bold text-[var(--ms-text)]">Успешный импорт</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--ms-muted)]">
            Показать обработку и готовый черновик.
          </span>
        </button>
        <button
          className="rounded-xl border border-[#efb5b5] bg-[#fff4f4] p-4 text-left transition hover:border-[#d64545] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d64545]"
          onClick={() => onSelect("error")}
          type="button"
        >
          <AlertTriangle className="h-5 w-5 text-[#b62f2f]" aria-hidden="true" />
          <span className="mt-3 block text-sm font-bold text-[var(--ms-text)]">Ошибка импорта</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--ms-muted)]">
            Показать отклонённый или повреждённый файл.
          </span>
        </button>
      </div>
    </section>
  </ModalSurface>
);
