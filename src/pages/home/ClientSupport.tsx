import { Headset } from "lucide-react";
import type { UserRole } from "../../app/types";
import { getPrototypeCompanies } from "../../data/prototype-entities";
import { getCompanyFields } from "../../data/registration-fields";
import { companyFieldVisible } from "../../data/company-field-policy";

export const ClientSupport = ({
  role,
  companyId,
}: {
  role: UserRole;
  companyId?: string;
}) => {
  if (role !== "client-admin" && role !== "client-employee") return null;
  if (!companyId)
    throw new Error(
      "ACC_ACTIVE_COMPANY_MISSING: Не удалось определить вашу компанию. Войдите заново.",
    );
  const company = getPrototypeCompanies().find(
    (record) => record.id === companyId,
  );
  if (!company)
    throw new Error(
      "ACC_ACTIVE_COMPANY_MISSING: Ваша компания не найдена. Обратитесь к администратору.",
    );
  const fields = getCompanyFields();
  const visible = (id: string) =>
    fields.some((field) => field.id === id && companyFieldVisible(field, role));
  const showStatus = visible("status");
  if (
    showStatus &&
    company.status !== "Активна" &&
    company.status !== "Приостановлена"
  )
    throw new Error(
      "ACC_COMPANY_STATUS_INVALID: Не удалось определить статус доступа. Обратитесь к администратору.",
    );
  return (
    <section aria-label="Поддержка и доступ" className="home-support">
      <h2>
        <Headset size={20} aria-hidden="true" />
        Поддержка и доступ
      </h2>
      <dl>
        {showStatus && (
          <div>
            <dt>Статус доступа</dt>
            <dd>
              {company.status === "Активна" ? "Активен" : "Приостановлен"}
            </dd>
          </div>
        )}
        {visible("statusUntil") && (
          <div>
            <dt>Срок статуса доступа</dt>
            <dd>
              {company.statusUntil ? (
                <time dateTime={company.statusUntil}>
                  {company.statusUntil.split("-").reverse().join(".")}
                </time>
              ) : (
                "Не указан"
              )}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
};
