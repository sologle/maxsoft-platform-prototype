import { ArrowLeft, Home, Monitor, PanelRightClose, Settings2, Smartphone } from "lucide-react";
import { useState } from "react";
import { demoProfiles } from "../data/mock-data";
import type { ScreenDefinition, ScreenFormat } from "../generated/screens";
import type { UserRole } from "../prototype/navigation";

interface PrototypeToolbarProps {
  format: ScreenFormat;
  role: UserRole;
  screen: ScreenDefinition;
  onBack: () => void;
  onHome: () => void;
  onOpenScreen: (screenId: string) => void;
  onRestart: (role: UserRole, format: ScreenFormat) => void;
  screens: ScreenDefinition[];
}

export const PrototypeToolbar = ({
  format,
  role,
  screen,
  onBack,
  onHome,
  onOpenScreen,
  onRestart,
  screens,
}: PrototypeToolbarProps) => {
  const [open, setOpen] = useState(false);
  const profile = demoProfiles.find((candidate) => candidate.role === role);
  if (!profile) {
    throw new Error(`PROTOTYPE_ROLE_MISSING: профиль роли ${role} не найден`);
  }

  if (!open) {
    return (
      <button
        aria-label="Открыть панель прототипа"
        className="fixed bottom-4 right-4 z-50 flex h-12 items-center justify-center gap-2 rounded-full bg-[#172433] px-4 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[var(--ms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ms-primary)]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Settings2 className="h-5 w-5" aria-hidden="true" />
        Сценарии
      </button>
    );
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-32px))] animate-[toolbar-in_180ms_ease-out] rounded-2xl border border-white/15 bg-[#172433]/95 p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">Панель прототипа</p>
          <p className="mt-1 truncate text-sm font-semibold">{screen.name}</p>
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

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <label className="sr-only" htmlFor="prototype-role">Роль</label>
        <select
          className="h-10 min-w-0 rounded-lg border border-white/15 bg-white/10 px-3 text-sm font-medium outline-none transition focus:border-[#54b4f2]"
          id="prototype-role"
          onChange={(event) => onRestart(event.target.value as UserRole, format)}
          value={role}
        >
          {demoProfiles.map((candidate) => (
            <option className="bg-[#172433]" key={candidate.role} value={candidate.role}>
              {candidate.shortLabel}
            </option>
          ))}
        </select>
        <div className="flex rounded-lg bg-white/10 p-1">
          <button
            aria-label="Desktop"
            className={`flex h-8 w-9 items-center justify-center rounded-md transition ${format === "desktop" ? "bg-white text-[#172433]" : "text-white/60 hover:text-white"}`}
            onClick={() => onRestart(role, "desktop")}
            type="button"
          >
            <Monitor className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label="Мобильный"
            className={`flex h-8 w-9 items-center justify-center rounded-md transition ${format === "mobile" ? "bg-white text-[#172433]" : "text-white/60 hover:text-white"}`}
            onClick={() => onRestart(role, "mobile")}
            type="button"
          >
            <Smartphone className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <label className="mt-3 block text-[11px] font-bold uppercase tracking-[0.12em] text-white/55" htmlFor="prototype-screen">
        Состояние экрана
      </label>
      <select
        className="mt-1.5 h-10 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm font-medium outline-none transition focus:border-[#54b4f2]"
        id="prototype-screen"
        onChange={(event) => onOpenScreen(event.target.value)}
        value={screen.id}
      >
        {screens.map((candidate) => (
          <option className="bg-[#172433]" key={candidate.id} value={candidate.id}>
            {candidate.name}
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
          onClick={onHome}
          type="button"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Сменить роль
        </button>
      </div>
    </aside>
  );
};
