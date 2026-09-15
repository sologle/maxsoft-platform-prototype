import { MoreHorizontal } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

interface ActionMenuProps {
  children: ReactNode;
  label: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  panelClassName?: string;
}

export const ActionMenu = ({
  children,
  label,
  onOpenChange,
  open,
  panelClassName = "w-52",
}: ActionMenuProps) => {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const menuItems = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    ).filter((item) => !item.hasAttribute("disabled"));

  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!menu || !trigger)
      throw new Error(
        "UI_ACTION_MENU_MISSING: Не удалось открыть меню. Обновите страницу.",
      );
    const position = () => {
      const gap = 8;
      const rect = trigger.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - gap * 2;
      const above = rect.top - gap * 2;
      const upwards = below < menu.scrollHeight && above > below;
      menu.style.maxWidth = `${window.innerWidth - gap * 2}px`;
      menu.style.maxHeight = `${Math.max(0, upwards ? above : below)}px`;
      const bounds = menu.getBoundingClientRect();
      menu.style.left = `${Math.max(gap, Math.min(rect.right - bounds.width, window.innerWidth - bounds.width - gap))}px`;
      menu.style.top = `${upwards ? rect.top - bounds.height - gap : rect.bottom + gap}px`;
    };
    menu.showPopover();
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChange(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    const focusFrame = window.requestAnimationFrame(() =>
      menuItems()[0]?.focus(),
    );
    return () => {
      window.cancelAnimationFrame(focusFrame);
      if (menu.matches(":popover-open")) menu.hidePopover();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onOpenChange, open]);

  const moveFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = menuItems();
    if (!items.length) return;
    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Home") items[0].focus();
    else if (event.key === "End") items[items.length - 1].focus();
    else {
      const step = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + step + items.length) % items.length;
      items[nextIndex].focus();
    }
  };

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className="icon-button"
        onClick={() => onOpenChange(!open)}
        ref={triggerRef}
        type="button"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>
      {open ? (
        <div
          popover="manual"
          className={`fixed inset-auto m-0 overflow-y-auto animate-[popover-in_140ms_ease-out] rounded-xl border border-[var(--ms-border)] bg-[var(--ms-surface)] text-[var(--ms-text)] p-1.5 shadow-[0_14px_40px_rgba(24,43,66,.16)] ${panelClassName}`}
          id={menuId}
          onKeyDown={moveFocus}
          ref={menuRef}
          role="menu"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};
