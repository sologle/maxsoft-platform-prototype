import { CheckCircle2, X } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast = ({ message, onClose }: ToastProps) => (
  <div
    aria-live="polite"
    className="fixed left-1/2 top-4 z-[70] flex w-[min(520px,calc(100vw-32px))] -translate-x-1/2 animate-[toast-in_180ms_ease-out] items-start gap-3 rounded-xl border border-[#a6d7b9] bg-[#effaf3] px-4 py-3 text-[#184f2e] shadow-[0_14px_38px_rgba(20,52,36,0.16)]"
    role="status"
  >
    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
    <span className="flex-1 text-sm font-medium leading-5">{message}</span>
    <button
      aria-label="Закрыть уведомление"
      className="flex h-6 w-6 items-center justify-center rounded text-[#184f2e]/60 transition hover:bg-[#184f2e]/10 hover:text-[#184f2e]"
      onClick={onClose}
      type="button"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  </div>
);
