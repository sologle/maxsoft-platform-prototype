import { Ban, CheckCircle2, Plus, Search, Trash2, UserCog, UserRoundCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { UserRole } from "../../app/types";
import { ActionMenu } from "../../components/ActionMenu";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Button, Field, PageHeading, SelectField } from "../../components/ui";
import { users as initialUsers, type UserRecord } from "../../data/platform-data";

interface UsersPageProps {
  onNotice: (message: string) => void;
  role: UserRole;
}

const UserRows = ({
  clientOnly = false,
  onAction,
  records,
  role,
}: {
  clientOnly?: boolean;
  onAction: (user: UserRecord, action: "role" | "delete" | "block") => void;
  records: UserRecord[];
  role: UserRole;
}) => {
  const [menu, setMenu] = useState<string | null>(null);
  const canAdministerRoles = role === "portal-admin";
  const menuItems = (user: UserRecord) => (
    <>
      {canAdministerRoles && !clientOnly ? (
        <button
          className="menu-action"
          onClick={() => {
            setMenu(null);
            onAction(user, "role");
          }}
          role="menuitem"
          type="button"
        >
          <UserCog className="h-4 w-4" aria-hidden="true" />
          Изменить роль
        </button>
      ) : null}
      <button
        className="menu-action"
        onClick={() => {
          setMenu(null);
          onAction(user, "block");
        }}
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
      {canAdministerRoles && !clientOnly ? (
        <button
          className="menu-action text-red-600"
          onClick={() => {
            setMenu(null);
            onAction(user, "delete");
          }}
          role="menuitem"
          type="button"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Удалить
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
              {!clientOnly ? <th className="px-5 py-4">Компания</th> : null}
              <th className="px-5 py-4">Роль</th>
              <th className="px-5 py-4">Статус</th>
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
                {!clientOnly ? <td className="px-5 py-4 text-[var(--ms-muted)]">{user.company}</td> : null}
                <td className="px-5 py-4">{user.role}</td>
                <td className="px-5 py-4">
                  <Badge
                    tone={
                      user.status === "Активен" ? "green" : user.status === "Заблокирован" ? "red" : "amber"
                    }
                  >
                    {user.status}
                  </Badge>
                </td>
                <td className="px-3">
                  <ActionMenu
                    label={`Действия: ${user.name}`}
                    onOpenChange={(open) => setMenu(open ? user.id : null)}
                    open={menu === user.id}
                    panelClassName="w-56"
                  >
                    {menuItems(user)}
                  </ActionMenu>
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
                    user.status === "Активен" ? "green" : user.status === "Заблокирован" ? "red" : "amber"
                  }
                >
                  {user.status}
                </Badge>
                <ActionMenu
                  label={`Действия: ${user.name}`}
                  onOpenChange={(open) => setMenu(open ? user.id : null)}
                  open={menu === user.id}
                  panelClassName="w-56"
                >
                  {menuItems(user)}
                </ActionMenu>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-[var(--ms-muted)]">
              <p>{user.role}</p>
              {!clientOnly ? <p>{user.company}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
};

export const UsersPage = ({ onNotice, role }: UsersPageProps) => {
  const [records, setRecords] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [action, setAction] = useState<{ type: "role" | "delete" | "block"; user: UserRecord } | null>(null);
  const visible = useMemo(
    () =>
      records.filter(
        (user) =>
          (status === "all" || user.status === status) &&
          `${user.name} ${user.email} ${user.company}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, records, status],
  );
  const invite = () => {
    setInviteOpen(false);
    onNotice("Приглашение отправлено на корпоративную почту.");
  };
  const completeAction = () => {
    if (!action) return;
    if (action.type === "delete")
      setRecords((current) => current.filter((user) => user.id !== action.user.id));
    if (action.type === "block")
      setRecords((current) =>
        current.map((user) =>
          user.id === action.user.id
            ? { ...user, status: user.status === "Заблокирован" ? "Активен" : "Заблокирован" }
            : user,
        ),
      );
    if (action.type === "role")
      setRecords((current) =>
        current.map((user) => (user.id === action.user.id ? { ...user, role: "Менеджер" } : user)),
      );
    onNotice(
      action.type === "delete"
        ? "Пользователь удалён."
        : action.type === "role"
          ? "Роль пользователя изменена."
          : action.user.status === "Заблокирован"
            ? "Пользователь разблокирован."
            : "Пользователь заблокирован.",
    );
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
      <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--ms-border)] bg-white p-3 shadow-[var(--ms-card-shadow)] sm:flex-row">
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
        <select
          aria-label="Статус пользователя"
          className="h-11 rounded-xl border border-[var(--ms-border-strong)] bg-white px-3 text-sm font-medium sm:w-52"
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="all">Все статусы</option>
          <option>Активен</option>
          <option>Заблокирован</option>
          <option>Приглашён</option>
        </select>
      </div>
      <UserRows onAction={(user, type) => setAction({ type, user })} records={visible} role={role} />
      <ResponsiveOverlay
        desktop="modal"
        label="Пригласить пользователя"
        onClose={() => setInviteOpen(false)}
        open={inviteOpen}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            invite();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Имя" required />
            <Field label="Фамилия" required />
            <Field className="sm:col-span-2" label="Корпоративная почта" required type="email" />
            <SelectField className="sm:col-span-2" label="Компания">
              <option>ООО «СеверПромБИМ»</option>
              <option>АО «Интегратор Про»</option>
            </SelectField>
            {role === "portal-admin" ? (
              <SelectField className="sm:col-span-2" label="Роль">
                <option>Сотрудник клиента</option>
                <option>Администратор клиента</option>
                <option>Менеджер</option>
                <option>Инженер ТП / автор</option>
              </SelectField>
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--ms-muted)]">
            Пользователь получит письмо со ссылкой для установки пароля.
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
            ? "Удалить пользователя"
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
          <SelectField defaultValue="Менеджер" label="Новая роль">
            <option>Менеджер</option>
            <option>Инженер ТП / автор</option>
            <option>Администратор портала</option>
          </SelectField>
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

export const ClientUsersPage = ({ onNotice, role }: UsersPageProps) => {
  const [records, setRecords] = useState(initialUsers.filter((user) => user.company.includes("СеверПром")));
  const [inviteOpen, setInviteOpen] = useState(false);
  const [action, setAction] = useState<UserRecord | null>(null);
  const toggle = () => {
    if (!action) return;
    setRecords((current) =>
      current.map((user) =>
        user.id === action.id
          ? { ...user, status: user.status === "Заблокирован" ? "Активен" : "Заблокирован" }
          : user,
      ),
    );
    onNotice(
      action.status === "Заблокирован"
        ? "Сотрудник разблокирован."
        : "Сотрудник заблокирован. История изменения сохранена.",
    );
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
        eyebrow="ООО «СеверПромБИМ»"
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
            setInviteOpen(false);
            onNotice("Сотрудник добавлен, приглашение отправлено.");
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Имя" required />
            <Field label="Фамилия" required />
            <Field className="sm:col-span-2" label="Корпоративная почта" required type="email" />
          </div>
          <label className="option-row mt-4">
            <input defaultChecked type="checkbox" />
            <span>Разрешить просмотр базы знаний</span>
          </label>
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
