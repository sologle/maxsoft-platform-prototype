import { AlertCircle, Check, ChevronDown } from "lucide-react";
import {
  Children, isValidElement, useId, useLayoutEffect, useRef, useState,
  type KeyboardEvent, type ReactNode, type SelectHTMLAttributes,
} from "react";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  error?: string;
  label: string;
  labelHidden?: boolean;
  leadingIcon?: ReactNode;
  variant?: "dark" | "light";
}

type SelectOption = { disabled: boolean; label: string; value: string };

export const SelectField = ({
  children,
  className = "",
  defaultValue,
  disabled,
  error,
  id,
  label,
  labelHidden = false,
  leadingIcon,
  onChange,
  value,
  variant = "light",
  ...props
}: SelectFieldProps) => {
  const generatedId = useId();
  const fieldId = id ?? `select-${generatedId.replace(/:/g, "")}`;
  const labelId = `${fieldId}-label`;
  const listboxId = `${fieldId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const options = Children.toArray(children).flatMap<SelectOption>((child) => {
    if (!isValidElement<{ children?: ReactNode; disabled?: boolean; value?: string | number }>(child))
      return [];
    const optionValue = child.props.value ?? child.props.children;
    return [{
      disabled: Boolean(child.props.disabled),
      label: String(child.props.children ?? optionValue),
      value: String(optionValue),
    }];
  });
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    String(defaultValue ?? options[0]?.value ?? ""),
  );
  const selectedValue = String(value ?? uncontrolledValue);
  const selectedLabel = options.find((option) => option.value === selectedValue)?.label ?? selectedValue;

  // The native control remains the source for form submission and programmatic changes.
  useLayoutEffect(() => {
    if (selectRef.current) setUncontrolledValue(selectRef.current.value);
  }, [children, value, defaultValue]);

  useLayoutEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!menu || !trigger) throw new Error("UI_SELECT_ELEMENT_MISSING: список не найден");
    const position = () => {
      const rect = trigger.getBoundingClientRect();
      const gap = 8;
      const below = window.innerHeight - rect.bottom - gap * 2;
      const above = rect.top - gap * 2;
      const upwards = below < Math.min(menu.scrollHeight, 288) && above > below;
      const width = Math.min(Math.max(rect.width, 192), window.innerWidth - gap * 2);
      menu.style.width = `${width}px`;
      menu.style.maxHeight = `${Math.max(0, Math.min(288, upwards ? above : below))}px`;
      menu.style.left = `${Math.max(gap, Math.min(rect.left, window.innerWidth - width - gap))}px`;
      menu.style.top = `${upwards ? rect.top - menu.getBoundingClientRect().height - gap : rect.bottom + gap}px`;
    };
    menu.showPopover();
    position();
    const selected = menu.querySelector<HTMLButtonElement>('[aria-selected="true"]:not(:disabled)');
    (selected ?? menu.querySelector<HTMLButtonElement>('button:not(:disabled)'))?.focus({ preventScroll: true });
    selected?.scrollIntoView({ block: "nearest" });
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      if (menu.matches(":popover-open")) menu.hidePopover();
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (!open) {
      setOpen(true);
      return;
    }
    const enabled = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    const current = enabled.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1
      : (current + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length;
    enabled[next]?.focus();
  };

  const chooseOption = (nextValue: string) => {
    const select = selectRef.current;
    if (!select) throw new Error("UI_SELECT_ELEMENT_MISSING: связанный select не найден");
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    if (!setter) throw new Error("UI_SELECT_VALUE_SETTER_MISSING: select нельзя изменить");
    setter.call(select, nextValue);
    select.dispatchEvent(new Event("change", { bubbles: true }));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const surface =
    variant === "dark"
      ? "border-white/15 bg-white/10 text-white hover:border-white/30"
      : "border-[var(--ms-border-strong)] bg-[var(--ms-surface)] text-[var(--ms-text)] hover:border-[var(--ms-primary)]";
  return (
    <div
      className={`relative block ${className}`}
      ref={rootRef}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label
        className={`${labelHidden ? "sr-only" : variant === "dark" ? "mb-1.5 block text-[11px] font-bold uppercase tracking-[.12em] text-white/55" : "mb-1.5 block text-sm font-semibold text-[var(--ms-text)]"}`}
        htmlFor={fieldId}
        id={labelId}
        onClick={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        {label}
      </label>
      <select
        aria-hidden="true"
        tabIndex={-1}
        aria-invalid={Boolean(error)}
        className="sr-only"
        defaultValue={defaultValue}
        disabled={disabled}
        id={fieldId}
        onFocus={() => triggerRef.current?.focus()}
        onChange={(event) => {
          setUncontrolledValue(event.target.value);
          onChange?.(event);
        }}
        ref={selectRef}
        value={value}
        {...props}
      >
        {children}
      </select>
      <button
        ref={triggerRef}
        aria-controls={open ? listboxId : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={labelId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Открыть варианты. Выбрано: ${selectedLabel}`}
        className={`flex h-12 w-full min-w-0 items-center gap-2 rounded-xl border px-3.5 text-left text-[15px] outline-none transition focus:border-[var(--ms-primary)] focus:ring-4 focus:ring-[var(--ms-primary-ring)] disabled:cursor-not-allowed disabled:opacity-50 ${surface}`}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {leadingIcon ? <span className="shrink-0 opacity-65">{leadingIcon}</span> : null}
        <span className="min-w-0 flex-1 truncate" id={`${fieldId}-value`}>{selectedLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 opacity-65 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          aria-labelledby={labelId}
          className={`fixed inset-auto m-0 overflow-y-auto rounded-xl border p-1.5 shadow-[0_18px_50px_rgba(24,43,66,.2)] ${variant === "dark" ? "border-white/15 bg-[#172b42] text-white" : "border-[var(--ms-border)] bg-[var(--ms-surface-raised)] text-[var(--ms-text)]"}`}
          id={listboxId}
          ref={menuRef}
          popover="manual"
          role="listbox"
        >
          {options.map((option) => (
            <button
              aria-selected={option.value === selectedValue}
              className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition ${option.value === selectedValue ? "bg-[var(--ms-primary)] font-semibold text-white" : variant === "dark" ? "hover:bg-white/10" : "hover:bg-[var(--ms-primary-soft)]"}`}
              disabled={option.disabled}
              key={option.value}
              onClick={() => chooseOption(option.value)}
              role="option"
              tabIndex={-1}
              type="button"
            >
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.value === selectedValue ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
      {error ? (
        <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-650" role="alert">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </span>
      ) : null}
    </div>
  );
};

