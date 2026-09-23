import { UserRows } from "./UserRows";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Navigate, UserRole } from "../../app/types";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import {
  Button,
  EmptyState,
  PageHeading,
  SelectField,
} from "../../components/ui";
import { type AuditEvent, type UserRecord } from "../../data/platform-data";
import {
  changeCompanyUserCount,
  getPrototypeCompanies,
  getPrototypeUsers,
  moveCompanyUserCount,
  writePrototypeUsers,
} from "../../data/prototype-entities";
import {
  appendPrototypeValue,
  prototypeStorageKeys,
} from "../../data/prototype-store";
import { InviteUserForm, inviteCompanyUser } from "./InviteUserForm";

interface UsersPageProps {
  onNavigate: Navigate;
  onNotice: (message: string) => void;
  role: UserRole;
}

export const UsersPage = ({ onNavigate, onNotice, role }: UsersPageProps) => {
  const [records, setRecords] = useState<UserRecord[]>(getPrototypeUsers);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [company, setCompany] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [action, setAction] = useState<{
    type: "role" | "delete" | "block";
    user: UserRecord;
  } | null>(null);
  const [nextRole, setNextRole] = useState("Менеджер");
  const [nextCompany, setNextCompany] = useState(
    "Внутренний пользователь MaxSoft",
  );
  const availableCompanies = getPrototypeCompanies();
  const visible = useMemo(
    () =>
      records.filter(
        (user) =>
          (status === "all" || user.status === status) &&
          (company === "all" || user.company === company) &&
          (roleFilter === "all" || user.role === roleFilter) &&
          `${user.name} ${user.email} ${user.company}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [company, query, records, roleFilter, status],
  );
  const invite = (form: FormData) => {
    inviteCompanyUser(form, role);
    setRecords(getPrototypeUsers());
    setInviteOpen(false);
    onNotice("Приглашение отправлено на корпоративную почту.");
  };
  const completeAction = () => {
    if (!action) return;
    const nextRecords: UserRecord[] = records.map((user) => {
      if (user.id !== action.user.id) return user;
      if (action.type === "delete")
        return { ...user, status: "Доступ отозван" };
      if (action.type === "block")
        return {
          ...user,
          status: user.status === "Заблокирован" ? "Активен" : "Заблокирован",
        };
      return { ...user, role: nextRole, company: nextCompany };
    });
    setRecords(nextRecords);
    writePrototypeUsers(nextRecords);
    if (action.type === "delete")
      changeCompanyUserCount(action.user.company, -1);
    if (action.type === "role")
      moveCompanyUserCount(action.user.company, nextCompany);
    onNotice(
      action.type === "delete"
        ? "Доступ пользователя отозван. История и авторство сохранены."
        : action.type === "role"
          ? "Роль пользователя изменена."
          : action.user.status === "Заблокирован"
            ? "Пользователь разблокирован."
            : "Пользователь заблокирован.",
    );
    appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
      action:
        action.type === "delete"
          ? "Отозвал доступ пользователя"
          : action.type === "role"
            ? "Изменил роль или компанию пользователя"
            : action.user.status === "Заблокирован"
              ? "Разблокировал пользователя"
              : "Заблокировал пользователя",
      category: "user",
      date: "Только что",
      object: action.user.name,
      page: "users",
      result: "Успешно",
      user: "Администратор портала",
    });
    setAction(null);
  };
  return (
    <>
      {role === "portal-admin" ? (
        <div className="mb-3">
          <Button icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />} onClick={() => onNavigate("administration")} tone="secondary">
            В администрирование
          </Button>
        </div>
      ) : null}
      <PageHeading
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setInviteOpen(true)}
          >
            Пригласить пользователя
          </Button>
        }
        eyebrow="Доступ"
        subtitle={
          role === "portal-admin"
            ? "Аккаунты, компании, роли и статусы пользователей портала."
            : "Создание пользователей и привязка к компании без изменения системных ролей."
        }
        title="Пользователи"
      />
      <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--ms-border)] bg-white p-3 shadow-[var(--ms-card-shadow)] sm:flex-row sm:flex-wrap">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Поиск пользователей</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            className="h-11 w-full min-w-0 rounded-xl border border-[var(--ms-border-strong)] pl-10 pr-3 text-sm outline-none focus:border-[var(--ms-primary)] focus:ring-4 focus:ring-[var(--ms-primary-ring)]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Имя, почта или компания"
            value={query}
          />
        </label>
        <SelectField
          className="sm:w-56"
          label="Компания пользователя"
          labelHidden
          onChange={(event) => setCompany(event.target.value)}
          value={company}
        >
          <option value="all">Все компании</option>
          <option>Внутренний пользователь MaxSoft</option>
          {availableCompanies.map((company) => (
            <option key={company.id}>{company.name}</option>
          ))}
        </SelectField>
        <SelectField
          className="sm:w-52"
          label="Роль пользователя"
          labelHidden
          onChange={(event) => setRoleFilter(event.target.value)}
          value={roleFilter}
        >
          <option value="all">Все роли</option>
          <option>Администратор портала</option>
          <option>Инженер ТП / автор</option>
          <option>Менеджер</option>
          <option>Администратор клиента</option>
          <option>Сотрудник клиента</option>
        </SelectField>
        <SelectField
          className="sm:w-52"
          label="Статус пользователя"
          labelHidden
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="all">Все статусы</option>
          <option>Активен</option>
          <option>Заблокирован</option>
          <option>Приглашён</option>
          <option>Доступ отозван</option>
        </SelectField>
        {query ||
        company !== "all" ||
        roleFilter !== "all" ||
        status !== "all" ? (
          <Button
            onClick={() => {
              setQuery("");
              setCompany("all");
              setRoleFilter("all");
              setStatus("all");
            }}
            tone="ghost"
          >
            Сбросить
          </Button>
        ) : null}
      </div>
      {visible.length ? (
        <UserRows
          onAction={(user, type) => {
            setAction({ type, user });
            if (type === "role") {
              setNextRole(user.role);
              setNextCompany(user.company);
            }
          }}
          onOpenAudit={() => onNavigate("audit")}
          records={visible}
          role={role}
        />
      ) : (
        <EmptyState
          action={
            <Button
              onClick={() => {
                setQuery("");
                setCompany("all");
                setRoleFilter("all");
                setStatus("all");
              }}
            >
              Сбросить фильтры
            </Button>
          }
          text="Измените имя, компанию, роль или статус пользователя."
          title="Пользователи не найдены"
        />
      )}
      <ResponsiveOverlay
        desktop="modal"
        label="Пригласить пользователя"
        onClose={() => setInviteOpen(false)}
        open={inviteOpen}
      >
        <InviteUserForm
          onCancel={() => setInviteOpen(false)}
          onSubmit={invite}
          role={role}
        />
      </ResponsiveOverlay>
      <ResponsiveOverlay
        desktop="modal"
        label={
          action?.type === "delete"
            ? "Отозвать доступ"
            : action?.type === "role"
              ? "Изменить роль"
              : action?.user.status === "Заблокирован"
                ? "Разблокировать пользователя"
                : "Заблокировать пользователя"
        }
        onClose={() => setAction(null)}
        open={Boolean(action)}
      >
        {action?.type === "role" ? (
          <div className="grid gap-4">
            <SelectField
              label="Новая роль"
              onChange={(event) => setNextRole(event.target.value)}
              value={nextRole}
            >
              <option>Менеджер</option>
              <option>Инженер ТП / автор</option>
              <option>Администратор портала</option>
              <option>Администратор клиента</option>
              <option>Сотрудник клиента</option>
            </SelectField>
            <SelectField
              label="Компания"
              onChange={(event) => setNextCompany(event.target.value)}
              value={nextCompany}
            >
              <option>Внутренний пользователь MaxSoft</option>
              {availableCompanies.map((company) => (
                <option key={company.id}>{company.name}</option>
              ))}
            </SelectField>
            <p className="text-sm leading-6 text-[var(--ms-muted)]">
              Новые права применятся сразу. Изменение будет записано в журнал.
            </p>
          </div>
        ) : (
          <p className="text-sm leading-6 text-[var(--ms-muted)]">
            Подтвердите действие для пользователя «{action?.user.name}».
            Изменение будет записано в журнал.
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => setAction(null)} tone="ghost">
            Отмена
          </Button>
          <Button
            onClick={completeAction}
            tone={action?.type === "delete" ? "danger" : "primary"}
          >
            Подтвердить
          </Button>
        </div>
      </ResponsiveOverlay>
    </>
  );
};
