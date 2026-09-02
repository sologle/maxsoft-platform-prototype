import { Building2, Check, Clock3, X } from "lucide-react";
import type { RegistrationOutcome } from "../prototype/navigation";
import { ModalSurface } from "./ModalSurface";

interface RegistrationOutcomeDialogProps {
  onCancel: () => void;
  onSelect: (outcome: RegistrationOutcome) => void;
}

const outcomes: Array<{
  id: RegistrationOutcome;
  title: string;
  description: string;
  icon: typeof Check;
}> = [
  {
    id: "existing-company",
    title: "Существующая компания",
    description: "Домен найден — сотрудник получает доступ к базе знаний.",
    icon: Check,
  },
  {
    id: "new-company",
    title: "Новая компания",
    description: "Компания создаётся, пользователь становится её администратором.",
    icon: Building2,
  },
  {
    id: "manual-review",
    title: "Ручная проверка",
    description: "Заявка отправляется на проверку без выдачи доступа.",
    icon: Clock3,
  },
];

export const RegistrationOutcomeDialog = ({
  onCancel,
  onSelect,
}: RegistrationOutcomeDialogProps) => (
  <ModalSurface
    className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0b1726]/60 p-4 backdrop-blur-[2px]"
    labelledBy="registration-outcome-title"
    onClose={onCancel}
  >
    <section className="w-full max-w-[560px] animate-[modal-in_180ms_ease-out] rounded-2xl bg-white p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] sm:p-6">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ms-primary)]">
            Демонстрационный выбор
          </p>
          <h2 className="font-heading mt-1 text-2xl font-bold text-[var(--ms-text)]" id="registration-outcome-title">
            Результат регистрации
          </h2>
          <p className="mt-2 text-sm leading-5 text-[var(--ms-muted)]">
            Выберите исход, который нужно показать в прототипе.
          </p>
        </div>
        <button
          aria-label="Закрыть выбор результата"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--ms-muted)] transition hover:bg-slate-100 hover:text-[var(--ms-text)]"
          onClick={onCancel}
          type="button"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {outcomes.map((outcome) => {
          const Icon = outcome.icon;
          return (
            <button
              className="group flex w-full items-start gap-4 rounded-xl border border-[var(--ms-border)] p-4 text-left transition hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ms-primary)]"
              key={outcome.id}
              onClick={() => onSelect(outcome.id)}
              type="button"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ms-primary-soft)] text-[var(--ms-primary)] group-hover:bg-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-bold text-[var(--ms-text)]">{outcome.title}</span>
                <span className="mt-1 block text-sm leading-5 text-[var(--ms-muted)]">
                  {outcome.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  </ModalSurface>
);
