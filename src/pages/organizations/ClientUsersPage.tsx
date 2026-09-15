import { Ban, Plus, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import type { UserRole } from "../../app/types";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Button, Field, PageHeading, SelectField } from "../../components/ui";
import type { AuditEvent, UserRecord } from "../../data/platform-data";
import {
  changeCompanyUserCount,
  getPrototypeCompanies,
  getPrototypeUsers,
  writePrototypeUsers,
} from "../../data/prototype-entities";
import {
  appendPrototypeValue,
  prototypeStorageKeys,
} from "../../data/prototype-store";
import { UserRows } from "./UserRows";

export const ClientUsersPage = ({
  companyId,
  onNotice,
  role,
}: {
  companyId?: string;
  onNotice: (message: string) => void;
  role: UserRole;
}) => {
  const clientCompany = getPrototypeCompanies().find(
    (company) => company.id === companyId,
  );
  if (!clientCompany)
    throw new Error(
      `ACC_CLIENT_COMPANY_MISSING: компания ${companyId ?? "не задана"} не найдена`,
    );
  const clientCompanyName = clientCompany.name;
  const [records, setRecords] = useState(() =>
    getPrototypeUsers().filter((user) => user.company === clientCompanyName),
  );
  const [inviteOpen, setInviteOpen] = useState(false);
  const [action, setAction] = useState<UserRecord | null>(null);
  const toggle = () => {
    if (!action) return;
    const nextRecords: UserRecord[] = records.map((user) =>
      user.id === action.id
        ? {
            ...user,
            status: user.status === "Заблокирован" ? "Активен" : "Заблокирован",
          }
        : user,
    );
    setRecords(nextRecords);
    const changedUser = nextRecords.find((user) => user.id === action.id);
    if (!changedUser)
      throw new Error(
        `ACC_CLIENT_USER_NOT_FOUND: пользователь ${action.id} отсутствует`,
      );
    writePrototypeUsers(
      getPrototypeUsers().map((user) =>
        user.id === changedUser.id ? changedUser : user,
      ),
    );
    onNotice(
      action.status === "Заблокирован"
        ? "Сотрудник разблокирован."
        : "Сотрудник заблокирован. История изменения сохранена.",
    );
    appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
      action:
        action.status === "Заблокирован"
          ? "Разблокировал сотрудника"
          : "Заблокировал сотрудника",
      category: "user",
      date: "Только что",
      object: action.name,
      page: "client-users",
      result: "Успешно",
      user: "Администратор клиента",
    });
    setAction(null);
  };
  return (
    <>
      <PageHeading
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setInviteOpen(true)}
          >
            Добавить сотрудника
          </Button>
        }
        eyebrow={clientCompanyName}
        subtitle="Пользователи вашей компании и их доступ к клиентскому порталу."
        title="Сотрудники"
      />
      <UserRows
        clientOnly
        onAction={(user) => setAction(user)}
        records={records}
        role={role}
      />
      <ResponsiveOverlay
        desktop="modal"
        label="Добавить сотрудника"
        onClose={() => setInviteOpen(false)}
        open={inviteOpen}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const firstName = form.get("firstName");
            const lastName = form.get("lastName");
            const email = form.get("email");
            const position = form.get("position");
            const selectedRole = form.get("role");
            if (
              typeof firstName !== "string" ||
              typeof lastName !== "string" ||
              typeof email !== "string" ||
              typeof position !== "string" ||
              typeof selectedRole !== "string"
            )
              throw new Error(
                "ACC_CLIENT_USER_INVITE_FIELDS_MISSING: обязательные поля сотрудника отсутствуют",
              );
            const invitedUser: UserRecord = {
              id: `client-user-${Date.now()}`,
              name: `${firstName.trim()} ${lastName.trim()}`,
              email: email.trim(),
              company: clientCompanyName,
              role: selectedRole,
              position: position.trim(),
              department: String(form.get("department") ?? "").trim(),
              phone: String(form.get("phone") ?? "").trim(),
              status: "Приглашён",
              lastLogin: "Ещё не входил",
            };
            setRecords((current) => [...current, invitedUser]);
            writePrototypeUsers([...getPrototypeUsers(), invitedUser]);
            changeCompanyUserCount(clientCompanyName, 1);
            setInviteOpen(false);
            appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
              action: "Пригласил сотрудника",
              category: "user",
              date: "Только что",
              object: invitedUser.name,
              page: "client-users",
              result: "Успешно",
              user: "Администратор клиента",
            });
            onNotice("Сотрудник добавлен, приглашение отправлено.");
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Имя" name="firstName" required />
            <Field label="Фамилия" name="lastName" required />
            <Field
              className="sm:col-span-2"
              label="Корпоративная почта"
              name="email"
              required
              type="email"
            />
            <Field label="Должность" name="position" required />
            <Field label="Отдел" name="department" />
            <Field label="Телефон" name="phone" type="tel" />
            <SelectField label="Роль" name="role" required>
              <option value="Сотрудник клиента">Сотрудник</option>
              <option value="Администратор клиента">Администратор</option>
            </SelectField>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--ms-muted)]">
            Сотрудник читает доступные материалы. Администратор также управляет
            сотрудниками своей компании.
          </p>
          <Button className="mt-6 w-full" type="submit">
            Отправить приглашение
          </Button>
        </form>
      </ResponsiveOverlay>
      <ResponsiveOverlay
        desktop="modal"
        label={
          action?.status === "Заблокирован"
            ? "Разблокировать сотрудника"
            : "Заблокировать сотрудника"
        }
        onClose={() => setAction(null)}
        open={Boolean(action)}
      >
        <div className="text-center">
          <span
            className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${action?.status === "Заблокирован" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
          >
            {action?.status === "Заблокирован" ? (
              <UserRoundCheck className="h-7 w-7" aria-hidden="true" />
            ) : (
              <Ban className="h-7 w-7" aria-hidden="true" />
            )}
          </span>
          <p className="mt-4 text-sm leading-6 text-[var(--ms-muted)]">
            {action?.status === "Заблокирован"
              ? "Сотрудник снова получит доступ к материалам компании."
              : "Сотрудник потеряет доступ, но его история сохранится."}
          </p>
          <Button className="mt-6 w-full" onClick={toggle}>
            {action?.status === "Заблокирован"
              ? "Разблокировать"
              : "Заблокировать"}
          </Button>
        </div>
      </ResponsiveOverlay>
    </>
  );
};
