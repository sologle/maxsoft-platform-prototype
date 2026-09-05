import type { Navigate } from "../../../app/types";
import { Button } from "../../ui";
import "./minimal.css";

export default function ArchivedLanding({ onNavigate }: { onNavigate: Navigate }) {
  return (
      <section className="grid min-h-dvh place-items-center px-5 py-20 text-center">
        <div className="portal-auth-hero portal-auth-glass max-w-2xl">
          <h1 className="font-heading text-[clamp(2.6rem,8vw,5.6rem)] font-black leading-none tracking-[-.055em]">
            Портал MaxSoft
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-[var(--ms-muted)] sm:text-lg">
            База знаний, документы и рабочие сервисы MaxSoft в одном защищённом пространстве.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button className="sm:min-w-40" onClick={() => onNavigate("login")}>
              Вход
            </Button>
            <Button className="sm:min-w-40" onClick={() => onNavigate("register")} tone="secondary">
              Регистрация
            </Button>
          </div>
        </div>
      </section>
  );
}
