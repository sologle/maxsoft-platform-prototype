import {
  BookOpen,
  Building2,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { roleProfile } from "../app/routes";
import type { AppLocation, AppPage } from "../app/types";
import { usePresence } from "../hooks/usePresence";
import { ModalSurface } from "./ModalSurface";

interface AppShellProps {
  children: ReactNode;
  location: AppLocation;
  onExit: () => void;
  onNavigate: (page: AppPage) => void;
}

interface NavigationItem {
  icon: typeof Home;
  label: string;
  page: AppPage;
}

const navigationForRole = (location: AppLocation): NavigationItem[] => {
  const common: NavigationItem[] = [
    { icon: Home, label: "Главная", page: "home" },
    { icon: BookOpen, label: "База знаний", page: "knowledge" },
    { icon: Search, label: "Поиск", page: "search" },
  ];
  if (["portal-admin", "support-engineer", "manager"].includes(location.role)) {
    common.push(
      { icon: Building2, label: "Компании", page: "companies" },
      { icon: UsersRound, label: "Пользователи", page: "users" },
    );
  }
  if (location.role === "client-admin") {
    common.push({ icon: UsersRound, label: "Сотрудники", page: "client-users" });
  }
  if (location.role === "portal-admin") {
    common.push({ icon: Settings, label: "Администрирование", page: "administration" });
  }
  return common;
};

const NavLinks = ({
  location,
  onNavigate,
  stacked = false,
}: {
  location: AppLocation;
  onNavigate: (page: AppPage) => void;
  stacked?: boolean;
}) => (
  <nav className={stacked ? "flex flex-col gap-1" : "flex items-center gap-1"}>
    {navigationForRole(location).map(({ icon: Icon, label, page }) => {
      const active =
        location.page === page ||
        (page === "knowledge" && ["article", "video", "editor"].includes(location.page));
      return (
        <a
          aria-current={active ? "page" : undefined}
          className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200 ${
            active
              ? "bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]"
              : "text-[var(--ms-muted)] hover:bg-slate-100 hover:text-[var(--ms-text)]"
          } ${stacked ? "w-full" : "whitespace-nowrap"}`}
          href={`?page=${page}&role=${location.role}`}
          key={page}
          onClick={(event) => {
            event.preventDefault();
            onNavigate(page);
          }}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {label}
        </a>
      );
    })}
  </nav>
);

export const AppShell = ({ children, location, onExit, onNavigate }: AppShellProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuMounted = usePresence(menuOpen);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profile = roleProfile(location.role);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.page]);

  useEffect(() => {
    if (!menuMounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuMounted]);

  useEffect(() => {
    if (!profileOpen) return;
    const closeOutside = (event: MouseEvent) => {
      const container = profileButtonRef.current?.parentElement;
      if (event.target instanceof Node && !container?.contains(event.target)) setProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  return (
    <div className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--ms-background)] text-[var(--ms-text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--ms-border)] bg-white/94 shadow-[0_2px_12px_rgba(27,51,75,.06)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <button
            aria-label="Открыть меню"
            className="icon-button mobile-menu-trigger"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            aria-label="На главную"
            className="flex shrink-0 items-center gap-2 rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-[var(--ms-primary)]"
            onClick={() => onNavigate("home")}
            type="button"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--ms-primary)] text-sm font-black text-white shadow-[0_5px_14px_rgba(20,120,189,.25)]">
              M
            </span>
            <span className="font-heading text-lg font-extrabold tracking-[-.02em] max-sm:hidden">
              MaxSoft
            </span>
          </button>

          <div className="mx-3 hidden min-w-0 flex-1 xl:block" data-testid="desktop-navigation">
            <NavLinks location={location} onNavigate={onNavigate} />
          </div>

          <button
            aria-label="Открыть поиск"
            className="icon-button ml-auto lg:ml-0"
            onClick={() => onNavigate("search")}
            type="button"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="relative">
            <button
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="flex min-w-0 items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[var(--ms-primary)]"
              onClick={() => setProfileOpen((current) => !current)}
              ref={profileButtonRef}
              type="button"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#d9edf9] font-heading text-sm font-bold text-[var(--ms-primary)]">
                {profile.shortLabel.slice(0, 1)}
              </span>
              <span className="hidden min-w-0 xl:block">
                <span className="block max-w-48 truncate text-sm font-semibold">{profile.shortLabel}</span>
                <span className="block text-xs text-[var(--ms-muted)]">Демо-профиль</span>
              </span>
              <ChevronDown
                className={`hidden h-4 w-4 transition xl:block ${profileOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {profileOpen ? (
              <div
                className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(300px,calc(100vw-24px))] origin-top-right animate-[popover-in_160ms_ease-out] rounded-2xl border border-[var(--ms-border)] bg-white p-2 shadow-[0_18px_50px_rgba(24,43,66,.18)]"
                role="menu"
              >
                <div className="border-b border-[var(--ms-border)] px-3 py-3">
                  <p className="text-sm font-bold">{profile.label}</p>
                  <p className="mt-1 text-xs text-[var(--ms-muted)]">demo@maxsoft.ru</p>
                </div>
                <button
                  className="menu-action"
                  onClick={() => setProfileOpen(false)}
                  role="menuitem"
                  type="button"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Профиль
                </button>
                <button className="menu-action text-red-600" onClick={onExit} role="menuitem" type="button">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Сменить роль
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-[1480px] px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="page-enter min-w-0" key={location.page}>
          {children}
        </div>
      </main>

      {menuMounted
        ? createPortal(
            <ModalSurface
              className="fixed inset-0 z-[80] xl:hidden"
              labelledBy="mobile-navigation-title"
              onClose={() => setMenuOpen(false)}
              surfaceRole="presentation"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[#0c1b2c]/48 backdrop-blur-[2px] transition-opacity duration-200"
                data-state={menuOpen ? "open" : "closed"}
                onMouseDown={() => setMenuOpen(false)}
              />
              <aside
                aria-label="Навигационное меню"
                aria-modal="true"
                className="mobile-navigation fixed inset-y-0 left-0 flex w-[min(340px,88vw)] flex-col bg-white shadow-[20px_0_60px_rgba(10,28,48,.24)]"
                data-state={menuOpen ? "open" : "closed"}
                role="dialog"
              >
                <div className="flex h-16 items-center gap-3 border-b border-[var(--ms-border)] px-4">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--ms-primary)] text-sm font-black text-white">
                    M
                  </span>
                  <h2 className="font-heading text-lg font-extrabold" id="mobile-navigation-title">
                    MaxSoft
                  </h2>
                  <button
                    aria-label="Закрыть меню"
                    className="icon-button ml-auto"
                    onClick={() => setMenuOpen(false)}
                    type="button"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                  <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
                    Разделы
                  </p>
                  <NavLinks location={location} onNavigate={onNavigate} stacked />
                </div>
                <div className="border-t border-[var(--ms-border)] p-4">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d9edf9] font-heading font-bold text-[var(--ms-primary)]">
                      {profile.shortLabel.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{profile.shortLabel}</p>
                      <p className="truncate text-xs text-[var(--ms-muted)]">demo@maxsoft.ru</p>
                    </div>
                  </div>
                </div>
              </aside>
            </ModalSurface>,
            document.body,
          )
        : null}
    </div>
  );
};
