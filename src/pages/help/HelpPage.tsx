import type { Navigate, UserRole } from "../../app/types";
import { canOpenPage, roleProfile } from "../../app/routes";
import { clientRoleLabel } from "../../app/client-role-label";
import { Button, PageHeading } from "../../components/ui";
import { helpByRole } from "./role-help";
export const HelpPage = ({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate: Navigate;
}) => {
  if (role === "guest")
    throw new Error(
      "APP_HELP_AUTH_REQUIRED: Войдите в портал, чтобы открыть помощь.",
    );
  const steps = helpByRole[role];
  return (
    <>
      <PageHeading
        title="Как пользоваться порталом"
        eyebrow="Помощь"
        subtitle={`Ваша роль: ${clientRoleLabel(roleProfile(role).label)}.`}
        onBack={() => onNavigate("home")}
      />
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        {steps
          .filter((step) => canOpenPage(step.page, role))
          .map((step, index) => (
            <section
              key={step.page}
              className="flex min-w-0 flex-col rounded-2xl border border-[var(--ms-border)] bg-white p-5 sm:p-6"
            >
              <h2 className="font-heading text-xl font-bold">
                {index + 1}. {step.title}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-[var(--ms-muted)]">
                {step.text}
              </p>
              <Button
                className="mt-5 scroll-mb-24 scroll-mt-28 self-start"
                tone="secondary"
                data-help-page={step.page}
                onClick={() => onNavigate(step.page)}
              >
                {step.action}
              </Button>
            </section>
          ))}
      </div>
      <section className="mt-5 rounded-2xl border border-[var(--ms-border)] bg-white p-5 text-sm leading-6">
        <h2 className="font-bold">Что сохраняется в демо</h2>
        <p className="mt-2 text-[var(--ms-muted)]">
          Изменения и личные списки хранятся в этом браузере и не передаются
          другим участникам. Они сохраняются после перезагрузки, но могут
          исчезнуть при очистке данных браузера. Переключатель деморолей служит
          для просмотра сценариев; это не вход под реальной учётной записью.
        </p>
        <p className="mt-2 text-[var(--ms-muted)]">
          Helpdesk, рассылки и общая работа с данными появятся на следующих
          этапах. Демонстрационное напоминание не отправляет сообщения.
        </p>
      </section>
    </>
  );
};
