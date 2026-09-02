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
import { useMemo, useState, type FormEvent } from "react";
import type { AppPage, UserRole } from "../../app/types";
import { ActionMenu } from "../../components/ActionMenu";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Breadcrumbs, Button, Field, PageHeading, SelectField } from "../../components/ui";
import { companies, users } from "../../data/platform-data";

interface OrganizationProps {
  onNavigate: (page: AppPage) => void;
  onNotice: (message: string) => void;
  role: UserRole;
}

const CompanyForm = ({
  onCancel,
  onSave,
  title = "Новая компания",
}: {
  onCancel: () => void;
  onSave: () => void;
  title?: string;
}) => (
  <form
    onSubmit={(event) => {
      event.preventDefault();
      onSave();
    }}
  >
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        className="sm:col-span-2"
        defaultValue={title === "Новая компания" ? "" : "ООО «СеверПромБИМ»"}
        label="Название компании"
        required
      />
      <Field
        defaultValue={title === "Новая компания" ? "" : "2463128457"}
        inputMode="numeric"
        label="ИНН"
        required
      />
      <SelectField defaultValue="Клиент" label="Тип компании">
        <option>Базовый</option>
        <option>Клиент</option>
        <option>Интегратор</option>
      </SelectField>
      <Field defaultValue={title === "Новая компания" ? "" : "severprom.ru"} label="Рабочий домен" required />
      <SelectField defaultValue="Активна" label="Статус">
        <option>Активна</option>
        <option>Приостановлена</option>
      </SelectField>
      <Field label="Договор / основание" placeholder="№ и дата договора" />
      <Field label="Проект" placeholder="Название проекта" />
      <Field className="sm:col-span-2" label="Ссылка на Битрикс24" placeholder="https://..." type="url" />
    </div>
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button onClick={onCancel} tone="ghost">
        Отмена
      </Button>
      <Button type="submit">Сохранить компанию</Button>
    </div>
  </form>
);

export const CompaniesPage = ({ onNavigate, onNotice }: OrganizationProps) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const visible = useMemo(
    () =>
      companies.filter(
        (company) =>
          (status === "all" || company.status === status) &&
          `${company.name} ${company.inn} ${company.domain}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, status],
  );
  return (
    <>
      <PageHeading
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setFormOpen(true)}>
            Добавить компанию
          </Button>
        }
        eyebrow="Клиенты"
        subtitle="Организации, их типы доступа, домены и пользователи портала."
        title="Компании"
      />
      <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--ms-border)] bg-white p-3 shadow-[var(--ms-card-shadow)] sm:flex-row">
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
        <select
          aria-label="Статус компании"
          className="h-11 rounded-xl border border-[var(--ms-border-strong)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--ms-primary)] sm:w-52"
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="all">Все статусы</option>
          <option value="Активна">Активные</option>
          <option value="Приостановлена">Приостановленные</option>
        </select>
      </div>
      <div className="hidden overflow-visible rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)] md:block">
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
                    className="font-bold hover:text-[var(--ms-primary)]"
                    onClick={() => onNavigate("company")}
                    type="button"
                  >
                    {company.name}
                  </button>
                  <p className="mt-1 text-xs text-[var(--ms-muted)]">
                    ИНН {company.inn} · {company.domain}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <Badge>{company.type}</Badge>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={company.status === "Активна" ? "green" : "amber"}>{company.status}</Badge>
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
                        onNavigate("company");
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
            className="min-w-0 rounded-2xl border border-[var(--ms-border)] bg-white p-4 text-left shadow-[var(--ms-card-shadow)] transition hover:border-[var(--ms-primary)]"
            key={company.id}
            onClick={() => onNavigate("company")}
            type="button"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-snug">{company.name}</span>
                <span className="mt-1 block break-all text-xs text-[var(--ms-muted)]">
                  {company.domain} · ИНН {company.inn}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-[var(--ms-primary)]" aria-hidden="true" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{company.type}</Badge>
              <Badge tone={company.status === "Активна" ? "green" : "amber"}>{company.status}</Badge>
              <Badge tone="slate">{company.users} пользователей</Badge>
            </div>
          </button>
        ))}
      </div>
      <ResponsiveOverlay desktop="modal" label="Компания" onClose={() => setFormOpen(false)} open={formOpen}>
        <CompanyForm
          onCancel={() => setFormOpen(false)}
          onSave={() => {
            setFormOpen(false);
            onNotice("Компания сохранена.");
          }}
        />
      </ResponsiveOverlay>
    </>
  );
};

export const CompanyPage = ({ onNavigate, onNotice, role }: OrganizationProps) => {
  const [tab, setTab] = useState<"general" | "users">("general");
  const [editOpen, setEditOpen] = useState(false);
  const companyUsers = users.filter((user) => user.company.includes("СеверПром"));
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Компании", onClick: () => onNavigate("companies") },
          { label: "ООО «СеверПромБИМ»" },
        ]}
      />
      <PageHeading
        actions={
          <Button icon={<Pencil className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditOpen(true)}>
            Редактировать
          </Button>
        }
        subtitle="ИНН 2463128457 · severprom.ru"
        title="ООО «СеверПромБИМ»"
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
      </div>
      {tab === "general" ? (
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] sm:p-6">
            <h2 className="font-heading text-xl font-bold">Данные компании</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              {[
                [
                  "Тип компании",
                  role === "manager" || role === "portal-admin"
                    ? "Клиент"
                    : "Доступ определяется администратором",
                ],
                ["Статус", "Активна до 31.12.2026"],
                ["Договор", "№ MS-2026/184 от 12.01.2026"],
                ["Проект", "Пилотник НАВИСА-2026"],
                ["Контакт", "+7 (391) 212-45-80"],
                ["Рабочие домены", "severprom.ru"],
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
              <p className="mt-2 text-sm text-white/70">Ещё 120 дней. Доступ пользователей активен.</p>
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
                </div>
                <Badge tone={user.status === "Активен" ? "green" : "amber"}>{user.status}</Badge>
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
          onCancel={() => setEditOpen(false)}
          onSave={() => {
            setEditOpen(false);
            onNotice("Изменения компании сохранены.");
          }}
          title="Редактирование"
        />
      </ResponsiveOverlay>
    </>
  );
};

export const CompanyTypesPage = ({ onNotice }: OrganizationProps) => {
  const [types, setTypes] = useState([
    { name: "Базовый", companies: 4, articles: 57 },
    { name: "Клиент", companies: 18, articles: 57 },
    { name: "Интегратор", companies: 6, articles: 42 },
  ]);
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<(typeof types)[number] | null>(null);
  const [name, setName] = useState("");
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (selected)
      setTypes((current) =>
        current.map((type) => (type.name === selected.name ? { ...type, name: name.trim() } : type)),
      );
    else setTypes((current) => [...current, { name: name.trim(), companies: 0, articles: 0 }]);
    setDialog(null);
    onNotice("Тип компании сохранён.");
  };
  return (
    <>
      <PageHeading
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setSelected(null);
              setName("");
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
        {types.map((type) => (
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
                <p className="mt-1 text-xs text-[var(--ms-muted)]">
                  {type.companies} компаний · {type.articles} статей
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                onClick={() => {
                  setSelected(type);
                  setName(type.name);
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
        ))}
      </div>
      <ResponsiveOverlay
        desktop="modal"
        label={dialog === "delete" ? "Удалить тип компании" : selected ? "Изменить тип" : "Новый тип"}
        onClose={() => setDialog(null)}
        open={dialog !== null}
      >
        {dialog === "delete" ? (
          <div>
            <p className="text-sm leading-6 text-[var(--ms-muted)]">
              Тип «{selected?.name}» используется компаниями и в правах статей. Сначала переназначьте
              связанные сущности.
            </p>
            <Button className="mt-6 w-full" onClick={() => setDialog(null)} tone="secondary">
              Понятно
            </Button>
          </div>
        ) : (
          <form onSubmit={save}>
            <Field
              autoFocus
              label="Название типа"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
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
