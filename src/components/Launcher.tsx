import {
  BookOpen,
  Building2,
  Monitor,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import { demoProfiles } from "../data/mock-data";
import type { ScreenFormat } from "../generated/screens";
import type { UserRole } from "../prototype/navigation";

interface LauncherProps {
  onStart: (role: UserRole, format: ScreenFormat) => void;
}

const icons: Record<UserRole, ComponentType<{ className?: string }>> = {
  guest: UserRound,
  "portal-admin": ShieldCheck,
  "support-engineer": Wrench,
  manager: Building2,
  "client-admin": UsersRound,
  "client-employee": BookOpen,
};

export const Launcher = ({ onStart }: LauncherProps) => (
  <main className="min-h-screen bg-[var(--ms-background)] text-[var(--ms-text)]">
    <header className="border-b border-[var(--ms-border)] bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-2 px-5 md:px-16">
        <span className="h-7 w-7 rounded bg-[var(--ms-primary)]" aria-hidden="true" />
        <span className="font-heading text-lg font-bold">MaxSoft</span>
        <span className="ml-auto rounded-full bg-[var(--ms-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--ms-primary)]">
          Прототип · этап 1
        </span>
      </div>
    </header>

    <section className="mx-auto max-w-[1240px] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto mb-9 max-w-3xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ms-primary)] text-white shadow-[0_8px_28px_rgba(20,120,189,0.25)]">
          <Search className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-[-0.02em] md:text-[42px]">
          Выберите сценарий
        </h1>
        <p className="mt-3 text-base leading-7 text-[var(--ms-muted)] md:text-lg">
          Запустите самостоятельный маршрут нужной роли. Desktop и mobile остаются раздельными на всём протяжении сценария.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {demoProfiles.map((profile) => {
          const Icon = icons[profile.role];
          return (
            <article
              className="group flex min-h-[286px] flex-col rounded-xl border border-[var(--ms-border)] bg-white p-6 shadow-[0_5px_22px_rgba(27,51,75,0.07)] transition duration-200 hover:-translate-y-1 hover:border-[var(--ms-primary)] hover:shadow-[0_12px_34px_rgba(20,120,189,0.13)]"
              data-testid="role-entry"
              id={`role-${profile.role}`}
              key={profile.role}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--ms-primary-soft)] text-[var(--ms-primary)] transition group-hover:bg-[var(--ms-primary)] group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-heading text-xl font-bold">{profile.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--ms-muted)]">{profile.description}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.capabilities.map((capability) => (
                  <span
                    className="rounded-full border border-[var(--ms-border)] bg-[var(--ms-background)] px-2.5 py-1 text-xs font-medium text-[var(--ms-muted)]"
                    key={capability}
                  >
                    {capability}
                  </span>
                ))}
              </div>
              <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                <button
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--ms-border)] bg-white text-sm font-semibold transition hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ms-primary)]"
                  onClick={() => onStart(profile.role, "desktop")}
                  type="button"
                >
                  <Monitor className="h-4 w-4" aria-hidden="true" />
                  Desktop
                </button>
                <button
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--ms-primary)] text-sm font-semibold text-white shadow-[0_4px_12px_rgba(20,120,189,0.22)] transition hover:bg-[var(--ms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ms-primary)]"
                  onClick={() => onStart(profile.role, "mobile")}
                  type="button"
                >
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                  Мобильный
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  </main>
);
