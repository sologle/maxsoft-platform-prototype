import { Ban, CheckCircle2, FileClock, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import type { UserRole } from "../../app/types";
import { clientRoleLabel } from "../../app/client-role-label";
import { ActionMenu } from "../../components/ActionMenu";
import { Badge } from "../../components/ui";
import type { UserRecord } from "../../data/platform-data";

export const UserRows = ({
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
    (user.status !== "Доступ отозван" &&
      (canAdministerRoles || canManageAccess)) ||
    (canAdministerRoles && !clientOnly && Boolean(onOpenAudit));
  const chooseAction = (
    user: UserRecord,
    action: "role" | "delete" | "block",
  ) => {
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
      <div className="hidden overflow-visible rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)] md:block ms-table-scroll">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--ms-border)] text-xs uppercase tracking-[.08em] text-[var(--ms-muted)]">
              <th className="px-5 py-4">Пользователь</th>
              <th className="px-5 py-4">
                {clientOnly ? "Должность" : "Компания"}
              </th>
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
                  <p className="font-bold [overflow-wrap:anywhere]">
                    {user.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ms-muted)]">
                    {user.email}
                  </p>
                </td>
                <td className="px-5 py-4 text-[var(--ms-muted)]">
                  {clientOnly ? user.position : user.company}
                </td>
                <td className="px-5 py-4">
                  {clientOnly ? clientRoleLabel(user.role) : user.role}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    tone={
                      user.status === "Активен"
                        ? "green"
                        : user.status === "Заблокирован"
                          ? "red"
                          : user.status === "Доступ отозван"
                            ? "slate"
                            : "amber"
                    }
                  >
                    {user.status}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-[var(--ms-muted)]">
                  {user.lastLogin}
                </td>
                <td className="px-3">
                  {hasActions(user) ? (
                    <ActionMenu
                      label={`Действия: ${user.name}`}
                      onOpenChange={(open) =>
                        setMenu(open ? `desktop:${user.id}` : null)
                      }
                      open={menu === `desktop:${user.id}`}
                      panelClassName="w-56"
                    >
                      {menuItems(user)}
                    </ActionMenu>
                  ) : (
                    <span className="text-xs text-[var(--ms-muted)]">
                      Просмотр
                    </span>
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
                <h2 className="font-bold [overflow-wrap:anywhere]">
                  {user.name}
                </h2>
                <p className="mt-1 break-all text-xs text-[var(--ms-muted)]">
                  {user.email}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge
                  tone={
                    user.status === "Активен"
                      ? "green"
                      : user.status === "Заблокирован"
                        ? "red"
                        : user.status === "Доступ отозван"
                          ? "slate"
                          : "amber"
                  }
                >
                  {user.status}
                </Badge>
                {hasActions(user) ? (
                  <ActionMenu
                    label={`Действия: ${user.name}`}
                    onOpenChange={(open) =>
                      setMenu(open ? `mobile:${user.id}` : null)
                    }
                    open={menu === `mobile:${user.id}`}
                    panelClassName="w-56"
                  >
                    {menuItems(user)}
                  </ActionMenu>
                ) : null}
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-[var(--ms-muted)]">
              <p>{clientOnly ? clientRoleLabel(user.role) : user.role}</p>
              <p>{clientOnly ? user.position : user.company}</p>
              <p>Последний вход: {user.lastLogin}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};
