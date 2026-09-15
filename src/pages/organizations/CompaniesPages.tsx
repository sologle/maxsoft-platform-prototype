import { companyFieldVisible } from "../../data/company-field-policy";
import { getCompanyFields } from "../../data/registration-fields";
import { BackButton } from "../../components/BackButton";
import { usePageState } from "../../hooks/usePageState";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Link2,
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
  const [tab, setTab] = useState<"general" | "users">("general");
  const [editOpen, setEditOpen] = useState(false);
  const [company, setCompany] = useState(() => {
    const record = getPrototypeCompanies().find(
      (candidate) => candidate.id === (resource ?? "severprom"),
    );
    if (!record)
      throw new Error(`ACC_COMPANY_NOT_FOUND: ${resource ?? "severprom"}`);
    return record;
  });
  const canSee = (id: string) =>
    getCompanyFields().some(
      (field) => field.id === id && companyFieldVisible(field, role),
    );
  const companyUsers = getPrototypeUsers().filter(
    (user) => user.company === company.name,
  );
  return (
    <>
      <div className="mb-4">
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
        subtitle={[
          canSee("inn") ? `ИНН ${company.inn}` : "",
          canSee("domains") ? company.domains.join(", ") : "",
        ]
          .filter(Boolean)
          .join(" · ")}
        title={canSee("name") ? company.name : "Компания"}
      />
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-[var(--ms-border)] bg-white p-1 shadow-[var(--ms-card-shadow)] sm:w-fit">
        <button
          aria-selected={tab === "general"}
          className={`tab-button ${tab === "general" ? "tab-button-active" : ""}`}
          onClick={() => setTab("general")}
          role="tab"
          type="button"
        >
          Общее
        </button>
        <button
          aria-selected={tab === "users"}
          className={`tab-button ${tab === "users" ? "tab-button-active" : ""}`}
          onClick={() => setTab("users")}
          role="tab"
          type="button"
        >
          Пользователи · {companyUsers.length}
        </button>
        <button
          aria-label="Запросы — Этап 2"
          className="tab-button cursor-not-allowed opacity-55"
          disabled
          role="tab"
          type="button"
        >
          Запросы · Этап 2
        </button>
      </div>
      {tab === "general" ? (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] sm:p-6">
            <h2 className="font-heading text-xl font-bold">Данные компании</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              {getCompanyFields()
                .filter((field) => companyFieldVisible(field, role))
                .map((field) => {
                  const value =
                    company[
                      (field.id === "bitrix"
                        ? "bitrixUrl"
                        : field.id) as keyof CompanyRecord
                    ];
                  const text = Array.isArray(value)
                    ? value.join(", ")
                    : String(value);
                  return (
                    <div key={field.id} className="min-w-0">
                      <dt className="text-xs font-bold uppercase tracking-[.08em] text-[var(--ms-muted)]">
                        {field.label}
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-semibold leading-6 [overflow-wrap:anywhere]">
                        {["statusUntil", "contractDate"].includes(field.id)
                          ? formatDate(text)
                          : text || "Не указано"}
                      </dd>
                    </div>
                  );
                })}
            </dl>
          </section>
          <aside className="space-y-4">
            {canSee("bitrix") ? (
              <div className="rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <Link2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-bold">Битрикс24</h2>
                    <p className="text-xs text-[var(--ms-muted)]">
                      Карточка клиента
                    </p>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
                  icon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
                  onClick={() =>
                    onNotice(
                      "В рабочей версии откроется карточка компании в Битрикс24.",
                    )
                  }
                  tone="secondary"
                >
                  Открыть карточку
                </Button>
              </div>
            ) : null}
            {canSee("statusUntil") && canSee("status") ? (
              <div className="rounded-2xl bg-[#123b5a] p-5 text-white">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
                <h2 className="mt-3 font-heading text-lg font-bold">
                  Статус действует
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  {company.status === "Активна"
                    ? `Доступ пользователей активен до ${formatDate(company.statusUntil)}.`
                    : `Доступ приостановлен. Последний срок — ${formatDate(company.statusUntil)}.`}
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      ) : (
        <section className="rounded-2xl border border-[var(--ms-border)] bg-white p-4 shadow-[var(--ms-card-shadow)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold">
              Пользователи компании
            </h2>
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => onNavigate("users")}
            >
              Добавить
            </Button>
          </div>
          <div className="space-y-2">
            {companyUsers.map((user) => (
              <div
                className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3"
                key={user.id}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ms-primary-soft)] font-bold text-[var(--ms-primary)]">
                  {user.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{user.name}</p>
                  <p className="truncate text-xs text-[var(--ms-muted)]">
                    {user.email}
                  </p>
                  <p className="mt-1 truncate text-xs text-[var(--ms-muted)]">
                    {user.position} · {user.role} · вход: {user.lastLogin}
                  </p>
                </div>
                <Badge tone={user.status === "Активен" ? "green" : "amber"}>
                  {user.status}
                </Badge>
                <button
                  aria-label={`Открыть действия пользователя: ${user.name}`}
                  className="icon-button"
                  onClick={() => onNavigate("users")}
                  type="button"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      <ResponsiveOverlay
        desktop="modal"
        label="Редактирование компании"
        onClose={() => setEditOpen(false)}
        open={editOpen}
      >
        <CompanyForm
          company={company}
          onCancel={() => setEditOpen(false)}
          onSave={(record) => {
            setCompany(record);
            setEditOpen(false);
            onNotice("Изменения компании сохранены.");
          }}
          role={role}
        />
      </ResponsiveOverlay>
    </>
  );
};
