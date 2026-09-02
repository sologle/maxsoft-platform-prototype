import {
  ArrowRight,
  BookOpen,
  Building2,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import { roleProfiles } from "../app/routes";
import type { UserRole } from "../app/types";

interface LauncherProps {
  onStart: (role: UserRole) => void;
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
  <main className="min-h-dvh overflow-x-clip bg-[var(--ms-background)] text-[var(--ms-text)]">
    <header className="border-b border-[var(--ms-border)] bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.06)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:px-6 lg:h-[76px] lg:px-12">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--ms-primary)] text-sm font-black text-white">
          M
        </span>
        <span className="font-heading text-lg font-extrabold">MaxSoft</span>
        <span className="ml-auto rounded-full bg-[var(--ms-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--ms-primary)]">
          Интерактивный прототип
        </span>
      </div>
    </header>

    <section className="mx-auto max-w-[1280px] px-4 py-9 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ms-primary)] text-white shadow-[0_10px_30px_rgba(20,120,189,.24)]">
          <Search className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-[clamp(2rem,6vw,2.75rem)] font-bold tracking-[-.03em]">
          Выберите сценарий
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--ms-muted)] sm:text-lg sm:leading-7">
          Откройте платформу с нужными правами. Интерфейс автоматически подстроится под телефон, планшет или
          большой экран.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roleProfiles.map((profile) => {
          const Icon = icons[profile.role];
          return (
            <article
              className="group flex min-w-0 flex-col rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[0_5px_22px_rgba(27,51,75,.06)] transition duration-200 hover:-translate-y-1 hover:border-[var(--ms-primary)] hover:shadow-[0_14px_36px_rgba(20,120,189,.12)] sm:min-h-[286px] sm:p-6"
              data-testid="role-entry"
              id={`role-${profile.role}`}
              key={profile.role}
            >
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)] transition group-hover:bg-[var(--ms-primary)] group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-heading text-xl font-bold leading-tight">{profile.label}</h2>
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
              <button
                className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ms-primary)] px-4 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(20,120,189,.2)] transition hover:-translate-y-px hover:bg-[var(--ms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ms-primary)] sm:mt-auto"
                onClick={() => onStart(profile.role)}
                type="button"
              >
                Открыть платформу
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  </main>
);
