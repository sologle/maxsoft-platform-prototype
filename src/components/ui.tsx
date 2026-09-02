import { AlertCircle, Check, ChevronRight, SearchX } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  tone?: ButtonTone;
}

const buttonTone: Record<ButtonTone, string> = {
  primary:
    "bg-[var(--ms-primary)] text-white shadow-[0_5px_14px_rgba(20,120,189,.2)] hover:bg-[var(--ms-primary-hover)] hover:-translate-y-px",
  secondary:
    "border border-[var(--ms-border-strong)] bg-white text-[var(--ms-text)] hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)]",
  ghost: "text-[var(--ms-muted)] hover:bg-slate-100 hover:text-[var(--ms-text)]",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export const Button = ({ children, className = "", icon, tone = "primary", ...props }: ButtonProps) => (
  <button
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ms-primary)] disabled:cursor-not-allowed disabled:opacity-50 ${buttonTone[tone]} ${className}`}
    type="button"
    {...props}
  >
    {icon}
    {children}
  </button>
);

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label: string;
}

export const Field = ({ className = "", error, label, id, ...props }: FieldProps) => {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className={`block ${className}`} htmlFor={fieldId}>
      <span className="mb-1.5 block text-sm font-semibold text-[var(--ms-text)]">{label}</span>
      <input
        aria-invalid={Boolean(error)}
        className="h-12 w-full min-w-0 rounded-xl border border-[var(--ms-border-strong)] bg-white px-3.5 text-[15px] outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[var(--ms-primary)] focus:ring-4 focus:ring-[var(--ms-primary-ring)]"
        id={fieldId}
        {...props}
      />
      {error ? (
        <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-650">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </span>
      ) : null}
    </label>
  );
};

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  label: string;
}

export const SelectField = ({ children, className = "", label, id, ...props }: SelectFieldProps) => {
  const fieldId = id ?? `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className={`block ${className}`} htmlFor={fieldId}>
      <span className="mb-1.5 block text-sm font-semibold text-[var(--ms-text)]">{label}</span>
      <select
        className="h-12 w-full min-w-0 rounded-xl border border-[var(--ms-border-strong)] bg-white px-3.5 text-[15px] outline-none transition hover:border-slate-400 focus:border-[var(--ms-primary)] focus:ring-4 focus:ring-[var(--ms-primary-ring)]"
        id={fieldId}
        {...props}
      >
        {children}
      </select>
    </label>
  );
};

export const Badge = ({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "amber" | "slate" | "red";
}) => {
  const tones = {
    blue: "bg-sky-50 text-sky-700 ring-sky-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    red: "bg-red-50 text-red-700 ring-red-100",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

export const PageHeading = ({
  actions,
  eyebrow,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  eyebrow?: string;
  subtitle: string;
  title: string;
}) => (
  <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      {eyebrow ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--ms-primary)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-heading text-[clamp(1.75rem,4vw,2.4rem)] font-bold leading-tight tracking-[-.025em] text-[var(--ms-text)]">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ms-muted)] sm:text-base">{subtitle}</p>
    </div>
    {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
  </div>
);

export const EmptyState = ({ action, text, title }: { action?: ReactNode; text: string; title: string }) => (
  <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--ms-border-strong)] bg-white p-8 text-center">
    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
      <SearchX className="h-6 w-6" aria-hidden="true" />
    </span>
    <h2 className="font-heading text-lg font-bold">{title}</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-[var(--ms-muted)]">{text}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

export const Switch = ({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) => (
  <button
    aria-checked={checked}
    aria-label={label}
    className={`relative h-7 w-12 shrink-0 rounded-full transition duration-200 ${checked ? "bg-[var(--ms-primary)]" : "bg-slate-300"}`}
    onClick={onChange}
    role="switch"
    type="button"
  >
    <span
      className={`absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition duration-200 ${checked ? "left-6" : "left-1"}`}
    >
      {checked ? <Check className="h-3 w-3 text-[var(--ms-primary)]" aria-hidden="true" /> : null}
    </span>
  </button>
);

export const Breadcrumbs = ({ items }: { items: Array<{ label: string; onClick?: () => void }> }) => (
  <nav
    aria-label="Хлебные крошки"
    className="mb-5 flex min-w-0 items-center gap-1.5 overflow-hidden text-sm text-[var(--ms-muted)]"
  >
    {items.map((item, index) => (
      <span className="flex min-w-0 items-center gap-1.5" key={`${item.label}-${index}`}>
        {index > 0 ? <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /> : null}
        {item.onClick ? (
          <button
            className="truncate transition hover:text-[var(--ms-primary)]"
            onClick={item.onClick}
            type="button"
          >
            {item.label}
          </button>
        ) : (
          <span className="truncate">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
);
