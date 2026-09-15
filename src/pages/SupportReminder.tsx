import type { Navigate, UserRole } from "../app/types";
import { canOpenPage } from "../app/routes";
import { Badge, Button } from "../components/ui";
import { getPrototypeCompanies } from "../data/prototype-entities";
import { getCompanyFields } from "../data/registration-fields";
import { companyFieldVisible } from "../data/company-field-policy";
// A selected demo company, not a production date threshold or list of recipients.
export const supportReminderCompanyId = "severprom";
export const SupportReminder = ({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate: Navigate;
}) => {
  if (!canOpenPage("company", role)) return null;
  const fields = getCompanyFields();
  if (
    !["name", "statusUntil"].every((id) =>
      fields.some(
        (field) => field.id === id && companyFieldVisible(field, role),
      ),
    )
  )
    return null;
  const company = getPrototypeCompanies().find(
    (company) => company.id === supportReminderCompanyId,
  );
  if (!company)
    throw new Error(
      "ACC_SUPPORT_EXAMPLE_COMPANY_MISSING: Компания для примера поддержки не найдена.",
    );
  return (
    <section
      aria-label="Пример напоминания о поддержке"
      className="mb-5 min-w-0 rounded-2xl border border-[var(--ms-border)] bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-heading text-xl font-bold">
          {company.statusUntil
            ? "Поддержка подходит к концу"
            : "Укажите срок поддержки"}
        </h2>
        <Badge tone="amber">Демонстрационный пример</Badge>
      </div>
      <p className="mt-3 break-words font-semibold [overflow-wrap:anywhere]">
        {company.name}
      </p>
      <p className="mt-1 text-sm">
        Дата окончания:{" "}
        {company.statusUntil ? (
          <time dateTime={company.statusUntil}>
            {company.statusUntil.split("-").reverse().join(".")}
          </time>
        ) : (
          "не указана в карточке"
        )}
        .
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ms-muted)]">
        Так может выглядеть напоминание о поддержке MaxSoft перед её окончанием.
        Для примера используется срок статуса из карточки компании. Срок
        лицензии nanoCAD не меняется. Сообщения не отправляются.
      </p>
      <Button
        className="mt-4"
        tone="secondary"
        onClick={() => onNavigate("company", company.id)}
      >
        Открыть компанию
      </Button>
    </section>
  );
};
