import {
  Building2,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { AppPage, Navigate, UserRole } from "../../app/types";
import { ActionMenu } from "../../components/ActionMenu";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Breadcrumbs, Button, EmptyState, Field, PageHeading, SelectField } from "../../components/ui";
import { companyTypes as initialCompanyTypes, type AuditEvent, type CompanyRecord } from "../../data/platform-data";
import {
  countCompanyTypeReferences,
  getPrototypeCompanies,
  getPrototypeUsers,
  renameCompanyRelationships,
  renameCompanyTypeRelationships,
  writePrototypeCompanies,
} from "../../data/prototype-entities";
import { appendPrototypeValue, prototypeStorageKeys, readPrototypeValue, writePrototypeValue } from "../../data/prototype-store";
import { CompanyForm } from "./CompanyForm";

interface OrganizationProps {
  onNavigate: Navigate;
  onNotice: (message: string) => void;
  resource?: string;
  role: UserRole;
}

const formatDate = (value: string) => value.split("-").reverse().join(".");
const instrumentalCount = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

export const CompaniesPage = ({ onNavigate, onNotice, role }: OrganizationProps) => {
  const [records, setRecords] = useState<CompanyRecord[]>(getPrototypeCompanies);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [formCompany, setFormCompany] = useState<CompanyRecord | undefined>();
  const [menu, setMenu] = useState<string | null>(null);
  const availableCompanyTypes = readPrototypeValue(prototypeStorageKeys.companyTypes, initialCompanyTypes);
  const visible = useMemo(
    () =>
      records.filter(
        (company) =>
          (status === "all" || company.status === status) &&
          (typeFilter === "all" || company.type === typeFilter) &&
          `${company.name} ${company.inn} ${company.domains.join(" ")}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, records, status, typeFilter],
  );
  return (
    <>
      <PageHeading
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => { setFormCompany(undefined); setFormOpen(true); }}>
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
        <SelectField
          className="sm:w-48"
          label="Тип компании"
          labelHidden
          onChange={(event) => setTypeFilter(event.target.value)}
          value={typeFilter}
        >
          <option value="all">Все типы</option>
          {availableCompanyTypes.map((type) => (
            <option key={type.name} value={type.name}>{type.name}</option>
          ))}
        </SelectField>
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
      {visible.length ? <><div className="hidden overflow-visible rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)] md:block">
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
                    aria-label={`Открыть компанию: ${company.name}`}
                    className="font-bold hover:text-[var(--ms-primary)]"
                    onClick={() => onNavigate("company", company.id)}
                    type="button"
                  >
                    {company.name}
                  </button>
                  <p className="mt-1 text-xs text-[var(--ms-muted)]">
                    ИНН {company.inn} · {company.domains.join(", ")}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <Badge>{company.type}</Badge>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={company.status === "Активна" ? "green" : "amber"}>{company.status}</Badge>
                  <p className="mt-1 text-xs text-[var(--ms-muted)]">до {formatDate(company.statusUntil)}</p>
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
                    label={`Действия: ${company.name}`}
                    onOpenChange={(open) => setMenu(open ? company.id : null)}
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
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
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
            aria-label={`Открыть компанию: ${company.name}`}
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
                <span className="block font-bold leading-snug">{company.name}</span>
                <span className="mt-1 block break-all text-xs text-[var(--ms-muted)]">
                  {company.domains.join(", ")} · ИНН {company.inn}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-[var(--ms-primary)]" aria-hidden="true" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{company.type}</Badge>
              <Badge tone={company.status === "Активна" ? "green" : "amber"}>{company.status}</Badge>
              <Badge tone="slate">до {formatDate(company.statusUntil)}</Badge>
              <Badge tone="slate">{company.users} пользователей</Badge>
            </div>
          </button>
        ))}
      </div>
      </> : (
        <EmptyState
          action={<Button onClick={() => { setQuery(""); setStatus("all"); setTypeFilter("all"); }}>Сбросить фильтры</Button>}
          text="Измените строку поиска, тип или статус компании."
          title="Компании не найдены"
        />
      )}
      <ResponsiveOverlay desktop="modal" label={formCompany ? "Редактирование компании" : "Новая компания"} onClose={() => setFormOpen(false)} open={formOpen}>
        <CompanyForm
          company={formCompany}
          onCancel={() => setFormOpen(false)}
          onSave={(record) => {
            if (formCompany) renameCompanyRelationships(formCompany.name, record.name);
            const nextRecords = formCompany
              ? records.map((company) => (company.id === record.id ? record : company))
              : [...records, record];
            setRecords(nextRecords);
            writePrototypeCompanies(nextRecords);
            setFormOpen(false);
            onNotice("Компания сохранена.");
          }}
          role={role}
        />
      </ResponsiveOverlay>
    </>
  );
};

export const CompanyPage = ({ onNavigate, onNotice, resource, role }: OrganizationProps) => {
  const [tab, setTab] = useState<"general" | "users">("general");
  const [editOpen, setEditOpen] = useState(false);
  const [company, setCompany] = useState(() => {
    const record = getPrototypeCompanies().find(
      (candidate) => candidate.id === (resource ?? "severprom"),
    );
    if (!record) throw new Error(`ACC_COMPANY_NOT_FOUND: ${resource ?? "severprom"}`);
    return record;
  });
  const companyUsers = getPrototypeUsers().filter((user) => user.company === company.name);
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Компании", onClick: () => onNavigate("companies") },
          { label: company.name },
        ]}
      />
      <PageHeading
        actions={
          <Button icon={<Pencil className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditOpen(true)}>
            Редактировать
          </Button>
        }
        subtitle={`ИНН ${company.inn} · ${company.domains.join(", ")}`}
        title={company.name}
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
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] sm:p-6">
            <h2 className="font-heading text-xl font-bold">Данные компании</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              {[
                [
                  "Тип компании",
                  company.type,
                ],
                ["Статус и срок", `${company.status} до ${formatDate(company.statusUntil)}`],
                ["Договор", `${company.contract} от ${formatDate(company.contractDate)}`],
                ["Проект", company.project],
                ["Юридический адрес", company.legalAddress],
                ["Основной email", company.primaryEmail],
                ["Телефон", company.phone],
                ["Рабочие домены", company.domains.join(", ")],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="text-xs font-bold uppercase tracking-[.08em] text-slate-400">{term}</dt>
                  <dd className="mt-1.5 text-sm font-semibold leading-6">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <aside className="space-y-4">
            <div className="rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Link2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-bold">Битрикс24</h2>
                  <p className="text-xs text-[var(--ms-muted)]">Карточка клиента</p>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                icon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
                onClick={() => onNotice("В рабочей версии откроется карточка компании в Битрикс24.")}
                tone="secondary"
              >
                Открыть карточку
              </Button>
            </div>
            <div className="rounded-2xl bg-[#123b5a] p-5 text-white">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
              <h2 className="mt-3 font-heading text-lg font-bold">Статус действует</h2>
              <p className="mt-2 text-sm text-white/70">
                {company.status === "Активна"
                  ? `Доступ пользователей активен до ${formatDate(company.statusUntil)}.`
                  : `Доступ приостановлен. Последний срок — ${formatDate(company.statusUntil)}.`}
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <section className="rounded-2xl border border-[var(--ms-border)] bg-white p-4 shadow-[var(--ms-card-shadow)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold">Пользователи компании</h2>
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => onNavigate("users")}
            >
              Добавить
            </Button>
          </div>
          <div className="space-y-2">
            {companyUsers.map((user) => (
              <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3" key={user.id}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ms-primary-soft)] font-bold text-[var(--ms-primary)]">
                  {user.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{user.name}</p>
                  <p className="truncate text-xs text-[var(--ms-muted)]">{user.email}</p>
                  <p className="mt-1 truncate text-xs text-[var(--ms-muted)]">
                    {user.position} · {user.role} · вход: {user.lastLogin}
                  </p>
                </div>
                <Badge tone={user.status === "Активен" ? "green" : "amber"}>{user.status}</Badge>
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
            renameCompanyRelationships(company.name, record.name);
            const nextRecords = getPrototypeCompanies().map((candidate) =>
              candidate.id === record.id ? record : candidate,
            );
            writePrototypeCompanies(nextRecords);
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

export const CompanyTypesPage = ({ onNavigate, onNotice }: OrganizationProps) => {
  const [types, setTypes] = useState(() =>
    readPrototypeValue(prototypeStorageKeys.companyTypes, initialCompanyTypes),
  );
  const [dialog, setDialog] = useState<"confirm-default" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<(typeof types)[number] | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState("");
  useEffect(() => {
    writePrototypeValue(prototypeStorageKeys.companyTypes, types);
  }, [types]);
  const recordAudit = (action: string, object: string) =>
    appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
      action,
      category: "company",
      date: "Только что",
      object,
      page: "company-types",
      result: "Успешно",
      user: "Администратор портала",
    });
  const persistType = () => {
    if (!name.trim()) return;
    if (selected) {
      if (selected.name !== name.trim())
        renameCompanyTypeRelationships(selected.name, name.trim());
      setTypes((current) =>
        current.map((type) => {
          if (type.name === selected.name)
            return { ...type, name: name.trim(), description: description.trim(), isDefault };
          return isDefault ? { ...type, isDefault: false } : type;
        }),
      );
    } else {
      setTypes((current) => [
        ...current.map((type) => (isDefault ? { ...type, isDefault: false } : type)),
        { name: name.trim(), description: description.trim(), companies: 0, articles: 0, isDefault },
      ]);
    }
    setDialog(null);
    recordAudit(selected ? "Изменил тип компании" : "Создал тип компании", name.trim());
    onNotice(
      isDefault
        ? "Тип компании сохранён и назначен базовым. Существующие компании не изменены."
        : "Тип компании сохранён.",
    );
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    const normalizedName = name.trim().toLocaleLowerCase("ru");
    const duplicate = types.some(
      (type) =>
        type.name !== selected?.name &&
        type.name.toLocaleLowerCase("ru") === normalizedName,
    );
    if (duplicate) {
      setFormError(
        "Тип компании с таким названием уже существует. Код: ACC_COMPANY_TYPE_DUPLICATE.",
      );
      return;
    }
    setFormError("");
    if (isDefault && !selected?.isDefault) {
      setDialog("confirm-default");
      return;
    }
    persistType();
  };
  const removeType = () => {
    if (!selected) return;
    const references = countCompanyTypeReferences(selected.name);
    if (selected.isDefault || references.companies > 0 || references.articles > 0) return;
    setTypes((current) => current.filter((type) => type.name !== selected.name));
    recordAudit("Удалил тип компании", selected.name);
    setDialog(null);
    onNotice("Неиспользуемый тип компании удалён.");
  };
  const selectedReferences = selected
    ? countCompanyTypeReferences(selected.name)
    : { articles: 0, companies: 0 };
  return (
    <>
      <PageHeading
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setSelected(null);
              setName("");
              setDescription("");
              setIsDefault(false);
              setFormError("");
              setDialog("edit");
            }}
          >
            Новый тип
          </Button>
        }
        eyebrow="Компании"
        subtitle="Тип определяет доступ компании к статьям и функциям портала."
        title="Типы компаний"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {types.map((type) => {
          const references = countCompanyTypeReferences(type.name);
          return (
          <article
            className="rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)]"
            key={type.name}
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-lg font-bold">{type.name}</h2>
                {type.isDefault ? <Badge tone="green">Базовый тип</Badge> : null}
                <p className="mt-1 text-xs text-[var(--ms-muted)]">
                  {references.companies} компаний · {references.articles} статей
                </p>
              </div>
            </div>
            <p className="mt-4 min-h-12 text-sm leading-6 text-[var(--ms-muted)]">{type.description}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                onClick={() => {
                  setSelected(type);
                  setName(type.name);
                  setDescription(type.description);
                  setIsDefault(type.isDefault);
                  setFormError("");
                  setDialog("edit");
                }}
                tone="secondary"
              >
                Изменить
              </Button>
              <Button
                icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                onClick={() => {
                  setSelected(type);
                  setDialog("delete");
                }}
                tone="ghost"
              >
                Удалить
              </Button>
            </div>
          </article>
          );
        })}
      </div>
      <ResponsiveOverlay
        desktop="modal"
        label={
          dialog === "delete"
            ? "Удалить тип компании"
            : dialog === "confirm-default"
              ? "Назначить базовый тип"
              : selected
                ? "Изменить тип"
                : "Новый тип"
        }
        onClose={() => {
          setDialog(null);
          setFormError("");
        }}
        open={dialog !== null}
      >
        {dialog === "confirm-default" ? (
          <div>
            <p className="text-sm leading-6 text-[var(--ms-muted)]">
              Тип «{name.trim()}» станет базовым для всех новых компаний. Текущие компании и их права не изменятся.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setDialog("edit")} tone="ghost">Вернуться</Button>
              <Button onClick={persistType}>Назначить базовым</Button>
            </div>
          </div>
        ) : dialog === "delete" ? (
          <div>
            {selected ? (
              <p className="text-sm leading-6 text-[var(--ms-muted)]">
                {selected.isDefault
                  ? `Тип «${selected.name}» назначен базовым. Сначала выберите другой базовый тип.`
                  : selectedReferences.companies > 0 || selectedReferences.articles > 0
                    ? `Тип «${selected.name}» связан с ${instrumentalCount(selectedReferences.companies, "компанией", "компаниями")} и ${instrumentalCount(selectedReferences.articles, "статьёй", "статьями")}. Удаление запрещено: сначала переназначьте связанные объекты.`
                    : `Тип «${selected.name}» не используется. После удаления он исчезнет из форм выбора.`}
              </p>
            ) : null}
            {selected &&
            (selectedReferences.companies > 0 || selectedReferences.articles > 0) ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button onClick={() => onNavigate("companies")} tone="secondary">
                  Открыть компании · {selectedReferences.companies}
                </Button>
                <Button onClick={() => onNavigate("knowledge")} tone="secondary">
                  Открыть статьи · {selectedReferences.articles}
                </Button>
              </div>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setDialog(null)} tone="ghost">Отмена</Button>
              <Button
                disabled={Boolean(
                  selected &&
                    (selected.isDefault ||
                      selectedReferences.companies > 0 ||
                      selectedReferences.articles > 0),
                )}
                onClick={removeType}
                tone="danger"
              >
                Удалить тип
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={save}>
            {selected ? (
              <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm leading-6 text-sky-900">
                Тип связан с {instrumentalCount(selectedReferences.companies, "компанией", "компаниями")} и {instrumentalCount(selectedReferences.articles, "статьёй", "статьями")}. Изменение названия
                увидят сотрудники MaxSoft; все связи и права сохранятся.
              </div>
            ) : null}
            <Field
              autoFocus
              error={formError}
              label="Название типа"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
            <Field
              className="mt-4"
              label="Описание"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Для каких компаний используется тип"
              value={description}
            />
            <label className="option-row mt-4">
              <input
                aria-label="Сделать базовым типом"
                checked={isDefault}
                disabled={selected?.isDefault}
                onChange={(event) => setIsDefault(event.target.checked)}
                type="checkbox"
              />
              <span>
                Сделать базовым типом
                <small className="mt-1 block font-normal text-[var(--ms-muted)]">
                  Он будет назначаться новым компаниям; существующие компании не изменятся.
                </small>
              </span>
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => setDialog(null)} tone="ghost">
                Отмена
              </Button>
              <Button disabled={!name.trim()} type="submit">
                Сохранить
              </Button>
            </div>
          </form>
        )}
      </ResponsiveOverlay>
    </>
  );
};
