import { companyFieldVisible } from "../../data/company-field-policy";
import { getCompanyFields } from "../../data/registration-fields";
import { BackButton } from "../../components/BackButton";
import { usePageState } from "../../hooks/usePageState";
import {
  Building2,
  ChevronRight,
  ExternalLink,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";
import type { Navigate, UserRole } from "../../app/types";
import { ActionMenu } from "../../components/ActionMenu";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import {
  Badge,
  Breadcrumbs,
  Button,
  EmptyState,
  PageHeading,
  SelectField,
} from "../../components/ui";
import {
  companyTypes as initialCompanyTypes,
  type CompanyRecord,
} from "../../data/platform-data";
import {
  getPrototypeCompanies,
  getPrototypeUsers,
} from "../../data/prototype-entities";
import {
  prototypeStorageKeys,
  readPrototypeValue,
} from "../../data/prototype-store";
import { CompanyForm } from "./CompanyForm";
import { InviteUserForm, inviteCompanyUser } from "./InviteUserForm";
import { UserRows } from "./UserRows";

interface OrganizationProps {
  onNavigate: Navigate;
  onNotice: (message: string) => void;
  resource?: string;
  role: UserRole;
}

const formatDate = (value: string) => value.split("-").reverse().join(".");

export const CompaniesPage = ({
  onNavigate,
  onNotice,
  role,
}: OrganizationProps) => {
  const [records, setRecords] = useState<CompanyRecord[]>(
    getPrototypeCompanies,
  );
  const [query, setQuery] = usePageState("query", "");
  const [status, setStatus] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [formCompany, setFormCompany] = useState<CompanyRecord | undefined>();
  const [menu, setMenu] = useState<string | null>(null);
  const availableCompanyTypes = readPrototypeValue(
    prototypeStorageKeys.companyTypes,
    initialCompanyTypes,
  );
  const canSee = (id: string) =>
    getCompanyFields().some(
      (field) => field.id === id && companyFieldVisible(field, role),
    );
  const companyLabel = (company: CompanyRecord) =>
    canSee("name") ? company.name : "Компания";
  const summary = (company: CompanyRecord) =>
    [
      canSee("inn") ? `ИНН ${company.inn}` : "",
      canSee("domains") ? company.domains.join(", ") : "",
    ]
      .filter(Boolean)
      .join(" · ");
  const visible = records.filter(
    (company) =>
      (!canSee("status") || status === "all" || company.status === status) &&
      (!canSee("type") ||
        typeFilter === "all" ||
        company.type === typeFilter) &&
      `${companyLabel(company)} ${summary(company)}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setFormCompany(undefined);
              setFormOpen(true);
            }}
          >
            Добавить компанию
          </Button>
        }
        eyebrow="Клиенты"
        subtitle="Организации, их типы доступа, домены и пользователи портала."
        title="Компании"
      />
      <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--ms-border)] bg-white p-3 shadow-[var(--ms-card-shadow)] sm:flex-row sm:flex-wrap">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Поиск компаний</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            className="h-11 w-full min-w-0 rounded-xl border border-[var(--ms-border-strong)] pl-10 pr-3 text-sm outline-none focus:border-[var(--ms-primary)] focus:ring-4 focus:ring-[var(--ms-primary-ring)]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название, ИНН или домен"
            value={query}
          />
        </label>
        {canSee("type") ? (
          <SelectField
            className="sm:w-48"
            label="Тип компании"
            labelHidden
            onChange={(event) => setTypeFilter(event.target.value)}
            value={typeFilter}
          >
            <option value="all">Все типы</option>
            {availableCompanyTypes.map((type) => (
              <option key={type.name} value={type.name}>
                {type.name}
              </option>
            ))}
          </SelectField>
        ) : null}
        {canSee("status") ? (
          <SelectField
            className="sm:w-52"
            label="Статус компании"
            labelHidden
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="all">Все статусы</option>
            <option value="Активна">Активные</option>
            <option value="Приостановлена">Приостановленные</option>
          </SelectField>
        ) : null}
        {query || status !== "all" || typeFilter !== "all" ? (
          <Button
            onClick={() => {
              setQuery("");
              setStatus("all");
              setTypeFilter("all");
            }}
            tone="ghost"
          >
            Сбросить
          </Button>
        ) : null}
      </div>
      {visible.length ? (
        <>
          <div className="hidden overflow-visible rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)] md:block ms-table-scroll">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--ms-border)] text-xs uppercase tracking-[.08em] text-[var(--ms-muted)]">
                  <th className="px-5 py-4">Компания</th>
                  <th className="px-5 py-4">Тип</th>
                  <th className="px-5 py-4">Статус</th>
                  <th className="px-5 py-4">Пользователи</th>
                  <th className="w-16 px-3">
                    <span className="sr-only">Действия</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((company) => (
                  <tr
                    className="border-b border-[var(--ms-border)] last:border-0 hover:bg-slate-50"
                    key={company.id}
                  >
                    <td className="px-5 py-4">
                      <button
                        aria-label={`Открыть компанию: ${companyLabel(company)}`}
                        className="font-bold hover:text-[var(--ms-primary)]"
                        onClick={() => onNavigate("company", company.id)}
                        type="button"
                      >
                        {companyLabel(company)}
                      </button>
                      <p className="mt-1 text-xs text-[var(--ms-muted)]">
                        {summary(company)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {canSee("type") ? <Badge>{company.type}</Badge> : null}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          !canSee("status")
                            ? "slate"
                            : company.status === "Активна"
                              ? "green"
                              : "amber"
                        }
                      >
                        {canSee("status") ? company.status : "Скрыто"}
                      </Badge>
                      <p className="mt-1 text-xs text-[var(--ms-muted)]">
                        {canSee("statusUntil")
                          ? `до ${formatDate(company.statusUntil)}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        className="font-semibold text-[var(--ms-primary)]"
                        onClick={() => onNavigate("users")}
                        type="button"
                      >
                        {company.users}
                      </button>
                    </td>
                    <td className="px-3">
                      <ActionMenu
                        label={`Действия: ${companyLabel(company)}`}
                        onOpenChange={(open) =>
                          setMenu(open ? company.id : null)
                        }
                        open={menu === company.id}
                        panelClassName="w-48"
                      >
                        <button
                          className="menu-action"
                          onClick={() => {
                            setMenu(null);
                            onNavigate("company", company.id);
                          }}
                          role="menuitem"
                          type="button"
                        >
                          <ExternalLink
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          Открыть
                        </button>
                        <button
                          className="menu-action"
                          onClick={() => {
                            setFormCompany(company);
                            setFormOpen(true);
                            setMenu(null);
                          }}
                          role="menuitem"
                          type="button"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Редактировать
                        </button>
                      </ActionMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {visible.map((company) => (
              <button
                aria-label={`Открыть компанию: ${companyLabel(company)}`}
                className="min-w-0 rounded-2xl border border-[var(--ms-border)] bg-white p-4 text-left shadow-[var(--ms-card-shadow)] transition hover:border-[var(--ms-primary)]"
                key={company.id}
                onClick={() => onNavigate("company", company.id)}
                type="button"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                    <Building2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold leading-snug">
                      {companyLabel(company)}
                    </span>
                    <span className="mt-1 block break-all text-xs text-[var(--ms-muted)]">
                      {summary(company)}
                    </span>
                  </span>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-[var(--ms-primary)]"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {canSee("type") ? <Badge>{company.type}</Badge> : null}
                  <Badge
                    tone={
                      !canSee("status")
                        ? "slate"
                        : company.status === "Активна"
                          ? "green"
                          : "amber"
                    }
                  >
                    {canSee("status") ? company.status : "Скрыто"}
                  </Badge>
                  <Badge tone="slate">
                    {canSee("statusUntil")
                      ? `до ${formatDate(company.statusUntil)}`
                      : ""}
                  </Badge>
                  <Badge tone="slate">{company.users} пользователей</Badge>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          action={
            <Button
              onClick={() => {
                setQuery("");
                setStatus("all");
                setTypeFilter("all");
              }}
            >
              Сбросить фильтры
            </Button>
          }
          text="Измените строку поиска, тип или статус компании."
          title="Компании не найдены"
        />
      )}
      <ResponsiveOverlay
        desktop="modal"
        label={formCompany ? "Редактирование компании" : "Новая компания"}
        onClose={() => setFormOpen(false)}
        open={formOpen}
      >
        <CompanyForm
          company={formCompany}
          onCancel={() => setFormOpen(false)}
          onSave={() => {
            setRecords(getPrototypeCompanies());
            setFormOpen(false);
            onNotice("Компания сохранена.");
          }}
          role={role}
        />
      </ResponsiveOverlay>
    </>
  );
};

export const CompanyPage = ({
  onNavigate,
  onNotice,
  resource,
  role,
}: OrganizationProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [company, setCompany] = useState(() => {
    const record = getPrototypeCompanies().find(
      (candidate) => candidate.id === (resource ?? "severprom"),
    );
    if (!record)
      throw new Error(`ACC_COMPANY_NOT_FOUND: ${resource ?? "severprom"}`);
    return record;
  });
  const [companyUsers, setCompanyUsers] = useState(() =>
    getPrototypeUsers().filter((user) => user.company === company.name),
  );
  const canSee = (id: string) =>
    getCompanyFields().some(
      (field) => field.id === id && companyFieldVisible(field, role),
    );
  const detailFields = getCompanyFields().filter(
    (field) =>
      companyFieldVisible(field, role) &&
      !["name", "type", "status", "statusUntil", "bitrix"].includes(field.id),
  );
  const updateUsers = (companyName: string) =>
    setCompanyUsers(getPrototypeUsers().filter((user) => user.company === companyName));
  return (
    <>
      <div className="mb-3">
        <BackButton onNavigate={onNavigate} fallback="companies" />
      </div>
      <Breadcrumbs
        items={[
          { label: "Компании", onClick: () => onNavigate("companies") },
          { label: canSee("name") ? company.name : "Компания" },
        ]}
      />
      <PageHeading
        actions={
          <Button
            icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setEditOpen(true)}
          >
            Редактировать
          </Button>
        }
        eyebrow="Компания"
        subtitle="Пользователи и доступ компании к порталу."
        title={canSee("name") ? company.name : "Компания"}
      />
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold">Пользователи</h2>
              <p className="text-sm text-[var(--ms-muted)]">
                Показано: {companyUsers.length}
              </p>
            </div>
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setInviteOpen(true)}
            >
              Добавить
            </Button>
          </div>
          {companyUsers.length ? (
            <UserRows companyView records={companyUsers} role={role} />
          ) : (
            <EmptyState
              action={<Button onClick={() => setInviteOpen(true)}>Добавить пользователя</Button>}
              text="Пригласите первого пользователя компании."
              title="Пользователей пока нет"
            />
          )}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-[var(--ms-border-strong)] bg-slate-50 px-4 py-3 text-sm text-[var(--ms-muted)]">
            <span className="font-semibold text-[var(--ms-text)]">Запросы</span>
            <span>Будут доступны на этапе 2</span>
          </div>
        </section>
        <aside className="rounded-2xl border border-[var(--ms-border)] bg-white p-4 shadow-[var(--ms-card-shadow)] xl:sticky xl:top-[calc(var(--portal-header-height)+12px)] xl:max-h-[calc(100dvh-var(--portal-header-height)-24px)] xl:overflow-y-auto">
          <h2 className="font-heading text-lg font-bold">О компании</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {canSee("name") ? (
              <div><dt className="text-[var(--ms-muted)]">Название</dt><dd className="mt-0.5 font-semibold [overflow-wrap:anywhere]">{company.name}</dd></div>
            ) : null}
            {canSee("type") ? (
              <div><dt className="text-[var(--ms-muted)]">Тип</dt><dd className="mt-1"><Badge>{company.type}</Badge></dd></div>
            ) : null}
            {canSee("status") ? (
              <div><dt className="text-[var(--ms-muted)]">Статус</dt><dd className="mt-1"><Badge tone={company.status === "Активна" ? "green" : "amber"}>{company.status}</Badge></dd></div>
            ) : null}
            {canSee("statusUntil") ? (
              <div><dt className="text-[var(--ms-muted)]">Действует до</dt><dd className="mt-0.5 font-semibold">{company.statusUntil ? formatDate(company.statusUntil) : "Не указано"}</dd></div>
            ) : null}
          </dl>
          {canSee("bitrix") && company.bitrixUrl ? (
            <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ms-primary)] hover:underline" type="button" onClick={() => onNotice("В рабочей версии откроется карточка компании в Битрикс24.")}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Карточка в Битрикс24
            </button>
          ) : null}
          {detailFields.length ? (
            <Button className="mt-4 w-full" onClick={() => setDetailsOpen(true)} tone="secondary">
              Реквизиты и контакты
            </Button>
          ) : null}
        </aside>
      </div>
      <ResponsiveOverlay desktop="modal" label="Реквизиты и контакты" onClose={() => setDetailsOpen(false)} open={detailsOpen}>
        <dl className="grid gap-4 sm:grid-cols-2">
          {detailFields.map((field) => {
            const value = company[field.id as keyof CompanyRecord];
            const display = Array.isArray(value) ? value.join(", ") : String(value ?? "");
            return (
              <div className="min-w-0" key={field.id}>
                <dt className="text-sm text-[var(--ms-muted)]">{field.label}</dt>
                <dd className="mt-1 break-words text-sm font-semibold [overflow-wrap:anywhere]">
                  {field.id === "contractDate" && display ? formatDate(display) : display || "Не указано"}
                </dd>
              </div>
            );
          })}
        </dl>
      </ResponsiveOverlay>
      <ResponsiveOverlay desktop="modal" label="Добавить пользователя" onClose={() => setInviteOpen(false)} open={inviteOpen}>
        <InviteUserForm
          company={company.name}
          onCancel={() => setInviteOpen(false)}
          onSubmit={(form) => {
            inviteCompanyUser(form, role, company.name);
            updateUsers(company.name);
            setInviteOpen(false);
            onNotice("Приглашение отправлено на корпоративную почту.");
          }}
          role={role}
        />
      </ResponsiveOverlay>
      <ResponsiveOverlay desktop="modal" label="Редактирование компании" onClose={() => setEditOpen(false)} open={editOpen}>
        <CompanyForm
          company={company}
          onCancel={() => setEditOpen(false)}
          onSave={(record) => {
            setCompany(record);
            updateUsers(record.name);
            setEditOpen(false);
            onNotice("Изменения компании сохранены.");
          }}
          role={role}
        />
      </ResponsiveOverlay>
    </>
  );
};
