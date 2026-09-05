import type { Navigate } from "../../app/types";
import { Button } from "../../components/ui";

export const WordmarkLanding = ({ onNavigate }: { onNavigate: Navigate }) => (
  <section className="auth-wordmark-landing" data-testid="wordmark-landing">
    <h1 className="sr-only">MaxSoft</h1>
    <div className="auth-wordmark-actions">
      <Button onClick={() => onNavigate("login")}>Войти</Button>
      <Button onClick={() => onNavigate("register")} tone="secondary">Регистрация</Button>
    </div>
  </section>
);
