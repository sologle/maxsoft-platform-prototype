import { Ban, CheckCircle2, FileClock, Plus, Search, Trash2, UserCog, UserRoundCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { UserRole } from "../../app/types";
import { ActionMenu } from "../../components/ActionMenu";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Button, EmptyState, Field, PageHeading, SelectField } from "../../components/ui";
import { type AuditEvent, type UserRecord } from "../../data/platform-data";
import {
  changeCompanyUserCount,
  getPrototypeCompanies,
  getPrototypeUsers,
  moveCompanyUserCount,
  writePrototypeUsers,
} from "../../data/prototype-entities";
import { appendPrototypeValue, prototypeStorageKeys } from "../../data/prototype-store";

interface UsersPageProps {
  companyId?: string;
  onNavigate?: (page: "audit") => void;
  onNotice: (message: string) => void;
  role: UserRole;
}

const UserRows = ({
  clientOnly = false,
  onAction,
  onOpenAudit,
  records,
  role,
}: {
  clientOnly?: boolean;
  onAction: (user: UserRecord, action: "role" | "delete" | "block") => void;
  onOpenAudit?: (user: UserRecord) => void;
  records: UserRecord[];
  role: UserRole;
}) => {
  const [menu, setMenu] = useState<string | null>(null);
  const canAdministerRoles = role === "portal-admin";
  const canManageAccess = role === "portal-admin" || clientOnly;
  const hasActions = (user: UserRecord) =>
    (user.status !== "Доступ отозван" && (canAdministerRoles || canManageAccess)) ||
    (canAdministerRoles && !clientOnly && Boolean(onOpenAudit));
  const chooseAction = (user: UserRecord, action: "role" | "delete" | "block") => {
    setMenu(null);
    onAction(user, action);
  };
  const menuItems = (user: UserRecord) => (
    <>
      {canAdministerRoles && !clientOnly && user.status !== "Доступ отозван" ? (
        <button
          className="menu-action"
          onClick={() => chooseAction(user, "role")}
          role="menuitem"
          type="button"
        >
          <UserCog className="h-4 w-4" aria-hidden="true" />
          Изменить роль
        </button>
      ) : null}
      {canAdministerRoles && !clientOnly && onOpenAudit ? (
        <button
          className="menu-action"
          onClick={() => {
            setMenu(null);
            onOpenAudit(user);
          }}
          role="menuitem"
          type="button"
        >
          <FileClock className="h-4 w-4" aria-hidden="true" />
          Открыть записи журнала
        </button>
      ) : null}
      {canManageAccess && user.status !== "Доступ отозван" ? (
        <button
          className="menu-action"
          onClick={() => chooseAction(user, "block")}
          role="menuitem"
          type="button"
        >
          {user.status === "Заблокирован" ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Ban className="h-4 w-4" aria-hidden="true" />
          )}
          {user.status === "Заблокирован" ? "Разблокировать" : "Заблокировать"}
        </button>
      ) : null}
      {canAdministerRoles && !clientOnly && user.status !== "Доступ отозван" ? (
        <button
          className="menu-action text-red-600"
          onClick={() => chooseAction(user, "delete")}
          role="menuitem"
          type="button"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Отозвать доступ
        </button>
      ) : null}
    </>
  );
  return (
    <>
      <div className="hidden overflow-visible rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)] md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--ms-border)] text-xs uppercase tracking-[.08em] text-[var(--ms-muted)]">
              <th className="px-5 py-4">Пользователь</th>
              <th className="px-5 py-4">{clientOnly ? "Должность" : "Компания"}</th>
              <th className="px-5 py-4">Роль</th>
              <th className="px-5 py-4">Статус</th>
              <th className="px-5 py-4">Последний вход</th>
              <th className="w-16 px-3">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((user) => (
              <tr
                className="border-b border-[var(--ms-border)] last:border-0 hover:bg-slate-50"
                key={user.id}
              >
                <td className="px-5 py-4">
                  <p className="font-bold">{user.name}</p>
                  <p className="mt-1 text-xs text-[var(--ms-muted)]">{user.email}</p>
                </td>
                <td className="px-5 py-4 text-[var(--ms-muted)]">
                  {clientOnly ? user.position : user.company}
                </td>
                <td className="px-5 py-4">{user.role}</td>
                <td className="px-5 py-4">
                  <Badge
                    tone={
                      user.status === "Активен" ? "green" : user.status === "Заблокирован" ? "red" : user.status === "Доступ отозван" ? "slate" : "amber"
                    }
                  >
                    {user.status}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-[var(--ms-muted)]">{user.lastLogin}</td>
                <td className="px-3">
                  {hasActions(user) ? (
                    <ActionMenu
                      label={`Действия: ${user.name}`}
                      onOpenChange={(open) => setMenu(open ? `desktop:${user.id}` : null)}
                      open={menu === `desktop:${user.id}`}
                      panelClassName="w-56"
                    >
                      {menuItems(user)}
                    </ActionMenu>
                  ) : (
                    <span className="text-xs text-[var(--ms-muted)]">Просмотр</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">
        {records.map((user) => (
          <article
            className="min-w-0 rounded-2xl border border-[var(--ms-border)] bg-white p-4 shadow-[var(--ms-card-shadow)]"
            key={user.id}
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ms-primary-soft)] font-bold text-[var(--ms-primary)]">
                {user.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold">{user.name}</h2>
                <p className="mt-1 break-all text-xs text-[var(--ms-muted)]">{user.email}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge
                  tone={
                    user.status === "Активен" ? "green" : user.status === "Заблокирован" ? "red" : user.status === "Доступ отозван" ? "slate" : "amber"
                  }
                >
                  {user.status}
                </Badge>
                {hasActions(user) ? (
                  <ActionMenu
                    label={`Действия: ${user.name}`}
                    onOpenChange={(open) => setMenu(open ? `mobile:${user.id}` : null)}
                    open={menu === `mobile:${user.id}`}
                    panelClassName="w-56"
                  >
                    {menuItems(user)}
                  </ActionMenu>
                ) : null}
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-[var(--ms-muted)]">
              <p>{user.role}</p>
              <p>{clientOnly ? user.position : user.company}</p>
              <p>Последний вход: {user.lastLogin}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};

export const UsersPage = ({ onNavigate, onNotice, role }: UsersPageProps) => {
  const [records, setRecords] = useState<UserRecord[]>(getPrototypeUsers);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [company, setCompany] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [action, setAction] = useState<{ type: "role" | "delete" | "block"; user: UserRecord } | null>(null);
  const [nextRole, setNextRole] = useState("Менеджер");
  const [nextCompany, setNextCompany] = useState("Внутренний пользователь MaxSoft");
  const availableCompanies = getPrototypeCompanies();
  const visible = useMemo(
    () =>
      records.filter(
        (user) =>
          (status === "all" || user.status === status) &&
          (company === "all" || user.company === company) &&
          (roleFilter === "all" || user.role === roleFilter) &&
          `${user.name} ${user.email} ${user.company}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [company, query, records, roleFilter, status],
  );
  const invite = (formElement: HTMLFormElement) => {
    const form = new FormData(formElement);
    const firstName = form.get("firstName");
    const lastName = form.get("lastName");
    const email = form.get("email");
    const selectedCompany = form.get("company");
    const selectedRole = form.get("role");
    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof selectedCompany !== "string"
    )
      throw new Error("ACC_USER_INVITE_FIELDS_MISSING: обязательные поля приглашения отсутствуют");
    const invitedUser: UserRecord = {
      id: `user-${Date.now()}`,
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      company: selectedCompany,
      role:
        role === "portal-admin" && typeof selectedRole === "string"
          ? selectedRole
          : "Ожидает назначения",
      position: "Не указана",
      status: "Приглашён",
      lastLogin: "Ещё не входил",
    };
    const nextRecords = [...records, invitedUser];
    setRecords(nextRecords);
    writePrototypeUsers(nextRecords);
    changeCompanyUserCount(invitedUser.company, 1);
    setInviteOpen(false);
    appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
      action: "Пригласил пользователя",
      category: "user",
      date: "Только что",
      object: invitedUser.name,
      page: "users",
      result: "Успешно",
      user: "Сотрудник MaxSoft",
    });
    onNotice("Приглашение отправлено на корпоративную почту.");
  };
  const completeAction = () => {
    if (!action) return;
    const nextRecords: UserRecord[] = records.map((user) => {
      if (user.id !== action.user.id) return user;
      if (action.type === "delete") return { ...user, status: "Доступ отозван" };
      if (action.type === "block")
        return {
          ...user,
          status: user.status === "Заблокирован" ? "Активен" : "Заблокирован",
        };
      return { ...user, role: nextRole, company: nextCompany };
    });
    setRecords(nextRecords);
    writePrototypeUsers(nextRecords);
    if (action.type === "delete") changeCompanyUserCount(action.user.company, -1);
    if (action.type === "role") moveCompanyUserCount(action.user.company, nextCompany);
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
      <PageHeading
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setInviteOpen(true)}>
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
        {query || company !== "all" || roleFilter !== "all" || status !== "all" ? (
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
      {visible.length ? <UserRows
        onAction={(user, type) => {
          setAction({ type, user });
          if (type === "role") {
            setNextRole(user.role);
            setNextCompany(user.company);
          }
        }}
        onOpenAudit={() => onNavigate?.("audit")}
        records={visible}
        role={role}
      /> : (
        <EmptyState
          action={<Button onClick={() => { setQuery(""); setCompany("all"); setRoleFilter("all"); setStatus("all"); }}>Сбросить фильтры</Button>}
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            invite(event.currentTarget);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Имя" name="firstName" required />
            <Field label="Фамилия" name="lastName" required />
            <Field className="sm:col-span-2" label="Корпоративная почта" name="email" required type="email" />
            <SelectField className="sm:col-span-2" label="Компания" name="company" required>
              {availableCompanies.map((company) => (
                <option key={company.id}>{company.name}</option>
              ))}
            </SelectField>
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
            <Button onClick={() => setInviteOpen(false)} tone="ghost">
              Отмена
            </Button>
            <Button type="submit">Отправить приглашение</Button>
          </div>
        </form>
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
            <SelectField label="Новая роль" onChange={(event) => setNextRole(event.target.value)} value={nextRole}>
              <option>Менеджер</option><option>Инженер ТП / автор</option><option>Администратор портала</option><option>Администратор клиента</option><option>Сотрудник клиента</option>
            </SelectField>
            <SelectField label="Компания" onChange={(event) => setNextCompany(event.target.value)} value={nextCompany}>
              <option>Внутренний пользователь MaxSoft</option>
              {availableCompanies.map((company) => <option key={company.id}>{company.name}</option>)}
            </SelectField>
            <p className="text-sm leading-6 text-[var(--ms-muted)]">Новые права применятся сразу. Изменение будет записано в журнал.</p>
          </div>
        ) : (
          <p className="text-sm leading-6 text-[var(--ms-muted)]">
            Подтвердите действие для пользователя «{action?.user.name}». Изменение будет записано в журнал.
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => setAction(null)} tone="ghost">
            Отмена
          </Button>
          <Button onClick={completeAction} tone={action?.type === "delete" ? "danger" : "primary"}>
            Подтвердить
          </Button>
        </div>
      </ResponsiveOverlay>
    </>
  );
};

export const ClientUsersPage = ({ companyId, onNotice, role }: UsersPageProps) => {
  const clientCompany = getPrototypeCompanies().find((company) => company.id === companyId);
  if (!clientCompany)
    throw new Error(`ACC_CLIENT_COMPANY_MISSING: компания ${companyId ?? "не задана"} не найдена`);
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
          ? { ...user, status: user.status === "Заблокирован" ? "Активен" : "Заблокирован" }
          : user,
    );
    setRecords(nextRecords);
    const changedUser = nextRecords.find((user) => user.id === action.id);
    if (!changedUser)
      throw new Error(`ACC_CLIENT_USER_NOT_FOUND: пользователь ${action.id} отсутствует`);
    writePrototypeUsers(
      getPrototypeUsers().map((user) => (user.id === changedUser.id ? changedUser : user)),
    );
    onNotice(
      action.status === "Заблокирован"
        ? "Сотрудник разблокирован."
        : "Сотрудник заблокирован. История изменения сохранена.",
    );
    appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
      action: action.status === "Заблокирован" ? "Разблокировал сотрудника" : "Заблокировал сотрудника",
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
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setInviteOpen(true)}>
            Добавить сотрудника
          </Button>
        }
        eyebrow={clientCompanyName}
        subtitle="Пользователи вашей компании и их доступ к клиентскому порталу."
        title="Сотрудники"
      />
      <UserRows clientOnly onAction={(user) => setAction(user)} records={records} role={role} />
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
            <Field className="sm:col-span-2" label="Корпоративная почта" name="email" required type="email" />
            <Field label="Должность" name="position" required />
            <Field label="Отдел" name="department" />
            <Field label="Телефон" name="phone" type="tel" />
            <SelectField label="Клиентская роль" name="role" required>
              <option>Сотрудник клиента</option>
              <option>Администратор клиента</option>
            </SelectField>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--ms-muted)]">
            Роль определяет действия сотрудника, а доступ к статьям наследуется от типа компании.
          </p>
          <Button className="mt-6 w-full" type="submit">
            Отправить приглашение
          </Button>
        </form>
      </ResponsiveOverlay>
      <ResponsiveOverlay
        desktop="modal"
        label={action?.status === "Заблокирован" ? "Разблокировать сотрудника" : "Заблокировать сотрудника"}
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
            {action?.status === "Заблокирован" ? "Разблокировать" : "Заблокировать"}
          </Button>
        </div>
      </ResponsiveOverlay>
    </>
  );
};
