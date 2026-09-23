import type { FormEvent } from "react";
import type { UserRole } from "../../app/types";
import { Button, Field, SelectField } from "../../components/ui";
import type { AuditEvent, UserRecord } from "../../data/platform-data";
import {
  changeCompanyUserCount,
  getPrototypeCompanies,
  getPrototypeUsers,
  writePrototypeUsers,
} from "../../data/prototype-entities";
import { appendPrototypeValue, prototypeStorageKeys } from "../../data/prototype-store";

export const inviteCompanyUser = (
  form: FormData,
  role: UserRole,
  fixedCompany?: string,
): UserRecord => {
  const firstName = form.get("firstName");
  const lastName = form.get("lastName");
  const email = form.get("email");
  const selectedCompany = fixedCompany ?? form.get("company");
  const selectedRole = form.get("role");
  if (
    typeof firstName !== "string" || !firstName.trim() ||
    typeof lastName !== "string" || !lastName.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof selectedCompany !== "string" ||
    !getPrototypeCompanies().some((company) => company.name === selectedCompany)
  )
    throw new Error("ACC_USER_INVITE_FIELDS_MISSING: обязательные поля приглашения отсутствуют");
  const invitedUser: UserRecord = {
    id: `user-${crypto.randomUUID()}`,
    name: `${firstName.trim()} ${lastName.trim()}`,
    email: email.trim(),
    company: selectedCompany,
    role: role === "portal-admin" && typeof selectedRole === "string"
      ? selectedRole
      : "Ожидает назначения",
    position: "Не указана",
    status: "Приглашён",
    lastLogin: "Ещё не входил",
  };
  writePrototypeUsers([...getPrototypeUsers(), invitedUser]);
  changeCompanyUserCount(invitedUser.company, 1);
  appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
    action: "Пригласил пользователя",
    category: "user",
    date: "Только что",
    object: invitedUser.name,
    page: "users",
    result: "Успешно",
    user: "Сотрудник MaxSoft",
  });
  return invitedUser;
};

export const InviteUserForm = ({
  company,
  onCancel,
  onSubmit,
  role,
}: {
  company?: string;
  onCancel: () => void;
  onSubmit: (form: FormData) => void;
  role: UserRole;
}) => {
  const companies = getPrototypeCompanies();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
  };
  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Имя" name="firstName" required />
        <Field label="Фамилия" name="lastName" required />
        <Field className="sm:col-span-2" label="Корпоративная почта" name="email" required type="email" />
        {company ? (
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold">Компания</p>
            <p className="rounded-xl border border-[var(--ms-border)] bg-slate-50 px-3 py-2.5 text-sm">{company}</p>
          </div>
        ) : (
          <SelectField className="sm:col-span-2" label="Компания" name="company" required>
            {companies.map((item) => <option key={item.id}>{item.name}</option>)}
          </SelectField>
        )}
        {role === "portal-admin" ? (
          <SelectField className="sm:col-span-2" label="Роль" name="role" required>
            <option>Сотрудник клиента</option>
            <option>Администратор клиента</option>
            <option>Менеджер</option>
            <option>Инженер ТП / автор</option>
          </SelectField>
        ) : null}
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--ms-muted)]">
        {role === "portal-admin"
          ? "Пользователь получит письмо со ссылкой для установки пароля."
          : "Приглашение будет ждать назначения роли администратором портала; до этого вход недоступен."}
      </p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} tone="ghost">Отмена</Button>
        <Button type="submit">Отправить приглашение</Button>
      </div>
    </form>
  );
};
