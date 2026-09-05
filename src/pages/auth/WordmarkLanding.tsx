import type { Navigate } from "../../app/types";
import { Button } from "../../components/ui";

export const WordmarkLanding = ({ onNavigate }: { onNavigate: Navigate }) => (
  <section className="auth-wordmark-landing" data-testid="wordmark-landing">
    <h1 className="sr-only">MaxSoft</h1>
    <div className="auth-wordmark-actions">
      <Button className="auth-wordmark-primary" onClick={() => onNavigate("login")}>Войти</Button>
      <Button className="auth-wordmark-secondary" onClick={() => onNavigate("register")} tone="secondary">Регистрация</Button>
    </div>
  </section>
);
