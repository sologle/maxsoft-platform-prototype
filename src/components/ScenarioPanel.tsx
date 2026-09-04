import { ArrowLeft, LogOut, PanelRightClose, Settings2 } from "lucide-react";
import { useState } from "react";
import { pageDefinitions, pagesForRole, roleProfile, roleProfiles } from "../app/routes";
import type { AppLocation, AppPage, Navigate, UserRole } from "../app/types";

interface ScenarioPanelProps {
  location: AppLocation;
  onBack: () => void;
  onExit: () => void;
  onNavigate: Navigate;
  onRoleChange: (role: UserRole) => void;
}

export const ScenarioPanel = ({ location, onBack, onExit, onNavigate, onRoleChange }: ScenarioPanelProps) => {
  const [open, setOpen] = useState(false);
  const profile = roleProfile(location.role);
  const currentPage = pageDefinitions.find((page) => page.id === location.page);

  if (!open) {
    return (
      <button
        aria-label="Открыть панель сценариев"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[70] flex h-12 items-center justify-center gap-2 rounded-full bg-[#172b42] px-4 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(0,0,0,.26)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--ms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ms-primary)]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Settings2 className="h-5 w-5" aria-hidden="true" />
        Сценарии
      </button>
    );
  }

  return (
    <aside className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[70] w-[min(370px,calc(100vw-24px))] animate-[toolbar-in_180ms_ease-out] rounded-2xl border border-white/10 bg-[#172b42]/96 p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.34)] backdrop-blur-xl sm:right-4">
      <div className="mb-3 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/50">Текущий экран</p>
        <p className="mt-1 truncate text-sm font-bold text-white">{currentPage?.label ?? location.page}</p>
      </div>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/55">Демонстрация</p>
          <p className="mt-1 truncate text-sm font-semibold">{profile.label}</p>
        </div>
        <button
          aria-label="Свернуть панель"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
          onClick={() => setOpen(false)}
          type="button"
        >
          <PanelRightClose className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <label
        className="mt-4 block text-[11px] font-bold uppercase tracking-[.12em] text-white/55"
        htmlFor="scenario-role"
      >
        Роль
      </label>
      <select
        className="mt-1.5 h-10 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm font-medium outline-none transition focus:border-[#54b4f2]"
        id="scenario-role"
        onChange={(event) => onRoleChange(event.target.value as UserRole)}
        value={location.role}
      >
        {roleProfiles.map((candidate) => (
          <option className="bg-[#172b42]" key={candidate.role} value={candidate.role}>
            {candidate.shortLabel}
          </option>
        ))}
      </select>

      <label
        className="mt-3 block text-[11px] font-bold uppercase tracking-[.12em] text-white/55"
        htmlFor="scenario-page"
      >
        Экран
      </label>
      <select
        className="mt-1.5 h-10 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm font-medium outline-none transition focus:border-[#54b4f2]"
        id="scenario-page"
        onChange={(event) => onNavigate(event.target.value as AppPage)}
        value={location.page}
      >
        {pagesForRole(location.role).map((page) => (
          <option className="bg-[#172b42]" key={page.id} value={page.id}>
            {page.label}
          </option>
        ))}
      </select>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white/10 text-sm font-semibold transition hover:bg-white/15"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад
        </button>
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--ms-primary)] text-sm font-semibold transition hover:bg-[var(--ms-primary-hover)]"
          onClick={onExit}
          type="button"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Сменить роль
        </button>
      </div>
    </aside>
  );
};
