import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  FileClock,
  FolderTree,
  Link2,
  LoaderCircle,
  Mail,
  Search,
  Settings2,
  Tags,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AppPage } from "../../app/types";
import { Badge, Button, Field, PageHeading, SelectField, Switch } from "../../components/ui";
import { auditEvents, companyFields as initialFields } from "../../data/platform-data";

interface PlatformProps {
  onNavigate: (page: AppPage) => void;
  onNotice: (message: string) => void;
}

export const AdministrationPage = ({ onNavigate }: PlatformProps) => {
  const sections = [
    {
      description: "Создание, перемещение и удаление разделов",
      icon: FolderTree,
      label: "Структура базы знаний",
      page: "structure" as AppPage,
    },
    {
      description: "Группы тегов и их использование",
      icon: Tags,
      label: "Теги и группы",
      page: "tags" as AppPage,
    },
    {
      description: "Все документы и связанные статьи",
      icon: Database,
      label: "Реестр файлов",
      page: "files" as AppPage,
    },
    {
      description: "Почта и связь с Битрикс24",
      icon: Link2,
      label: "Интеграции",
      page: "integrations" as AppPage,
    },
    {
      description: "Обязательность и доступность данных",
      icon: Settings2,
      label: "Поля компании",
      page: "fields" as AppPage,
    },
    {
      description: "События и изменения в системе",
      icon: FileClock,
      label: "Журнал действий",
      page: "audit" as AppPage,
    },
    {
      description: "Типы доступа клиентских организаций",
      icon: Building2,
      label: "Типы компаний",
      page: "company-types" as AppPage,
    },
    {
      description: "Роли и аккаунты портала",
      icon: UsersRound,
      label: "Пользователи",
      page: "users" as AppPage,
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="Управление платформой"
        subtitle="Контент, доступ, интеграции и системный журнал в одном рабочем пространстве."
        title="Администрирование"
      />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ description, icon: Icon, label, page }) => (
          <button
            className="group flex min-h-44 min-w-0 flex-col items-start rounded-2xl border border-[var(--ms-border)] bg-white p-5 text-left shadow-[var(--ms-card-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--ms-primary)] hover:shadow-[var(--ms-card-shadow-hover)]"
            key={page}
            onClick={() => onNavigate(page)}
            type="button"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)] transition group-hover:bg-[var(--ms-primary)] group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="mt-5 flex w-full min-w-0 items-center gap-2">
              <span className="min-w-0 flex-1 font-heading text-lg font-bold">{label}</span>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-[var(--ms-primary)] transition group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
            <span className="mt-2 text-sm leading-6 text-[var(--ms-muted)]">{description}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export const IntegrationsPage = ({ onNotice }: PlatformProps) => {
  const [mailEnabled, setMailEnabled] = useState(true);
  const [bitrixEnabled, setBitrixEnabled] = useState(true);
  const [checking, setChecking] = useState<"mail" | "bitrix" | null>(null);
  const [result, setResult] = useState<"mail" | "bitrix" | null>(null);
  useEffect(() => {
    if (!checking) return;
    const timeout = window.setTimeout(() => {
      setResult(checking);
      setChecking(null);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [checking]);
  const status = (kind: "mail" | "bitrix") =>
    checking === kind ? (
      <span className="flex items-center gap-2 text-xs font-semibold text-[var(--ms-primary)]">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Проверяем…
      </span>
    ) : result === kind ? (
      <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Подключение работает
      </span>
    ) : null;
  return (
    <>
      <PageHeading
        eyebrow="Администрирование"
        subtitle="Подключения инфраструктуры для уведомлений и карточек клиентов."
        title="Интеграции"
      />
      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-xl font-bold">Почтовые уведомления</h2>
              <p className="mt-1 text-sm text-[var(--ms-muted)]">Исходящие письма со ссылками на портал.</p>
            </div>
            <Switch
              checked={mailEnabled}
              label="Почтовая интеграция"
              onChange={() => setMailEnabled((current) => !current)}
            />
          </div>
          <div
            className={`mt-6 grid gap-4 transition ${mailEnabled ? "opacity-100" : "pointer-events-none opacity-45"}`}
          >
            <Field defaultValue="smtp.maxsoft.ru" label="SMTP-сервер" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field defaultValue="587" label="Порт" inputMode="numeric" />
              <SelectField defaultValue="STARTTLS" label="Шифрование">
                <option>STARTTLS</option>
                <option>SSL/TLS</option>
              </SelectField>
            </div>
            <Field defaultValue="portal@maxsoft.ru" label="Адрес отправителя" type="email" />
            <div className="flex min-h-6 items-center justify-between gap-3">
              {status("mail")}
              <Button
                className="ml-auto"
                disabled={checking === "mail"}
                onClick={() => setChecking("mail")}
                tone="secondary"
              >
                Проверить подключение
              </Button>
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Link2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-xl font-bold">Битрикс24</h2>
              <p className="mt-1 text-sm text-[var(--ms-muted)]">Ссылки на внешние карточки компаний.</p>
            </div>
            <Switch
              checked={bitrixEnabled}
              label="Интеграция Битрикс24"
              onChange={() => setBitrixEnabled((current) => !current)}
            />
          </div>
          <div
            className={`mt-6 grid gap-4 transition ${bitrixEnabled ? "opacity-100" : "pointer-events-none opacity-45"}`}
          >
            <Field defaultValue="https://maxsoft.bitrix24.ru" label="Адрес портала" type="url" />
            <Field defaultValue="••••••••••••••••" label="Вебхук" type="password" />
            <div className="flex min-h-6 items-center justify-between gap-3">
              {status("bitrix")}
              <Button
                className="ml-auto"
                disabled={checking === "bitrix"}
                onClick={() => setChecking("bitrix")}
                tone="secondary"
              >
                Проверить подключение
              </Button>
            </div>
          </div>
        </section>
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => onNotice("Настройки интеграций сохранены.")}>Сохранить настройки</Button>
      </div>
    </>
  );
};

export const AuditPage = (_props: PlatformProps) => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const visible = useMemo(
    () =>
      auditEvents.filter(
        (event) =>
          (type === "all" || event.action.toLowerCase().includes(type)) &&
          `${event.user} ${event.action} ${event.object}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, type],
  );
  return (
    <>
      <PageHeading
        eyebrow="Администрирование"
        subtitle="Изменения статей, компаний, пользователей и прав доступа."
        title="Журнал действий"
      />
      <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--ms-border)] bg-white p-3 shadow-[var(--ms-card-shadow)] sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Поиск событий</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            className="h-11 w-full min-w-0 rounded-xl border border-[var(--ms-border-strong)] pl-10 pr-3 text-sm outline-none focus:border-[var(--ms-primary)]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пользователь или объект"
            value={query}
          />
        </label>
        <select
          aria-label="Тип события"
          className="h-11 rounded-xl border border-[var(--ms-border-strong)] bg-white px-3 text-sm sm:w-52"
          onChange={(event) => setType(event.target.value)}
          value={type}
        >
          <option value="all">Все события</option>
          <option value="изменил">Изменения</option>
          <option value="вошёл">Входы</option>
          <option value="добавила">Создание</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)]">
        <div className="divide-y divide-[var(--ms-border)]">
          {visible.map((event, index) => (
            <article
              className="flex min-w-0 gap-3 p-4 sm:items-center sm:p-5"
              key={`${event.user}-${event.date}`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-6">
                  <strong>{event.user}</strong> · {event.action}
                </p>
                <p className="mt-0.5 break-words text-sm text-[var(--ms-primary)]">{event.object}</p>
              </div>
              <time className="hidden shrink-0 text-xs text-[var(--ms-muted)] sm:block">{event.date}</time>
              <Badge tone={index === 2 ? "slate" : "blue"}>{index === 2 ? "Вход" : "Изменение"}</Badge>
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export const FieldsPage = ({ onNotice }: PlatformProps) => {
  const [fields, setFields] = useState(
    initialFields.map((field) => ({ ...field, visible: true, manager: field.id !== "bitrix" })),
  );
  const toggle = (id: string, key: "visible" | "required" | "unique" | "manager" | "registration") =>
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, [key]: !field[key] } : field)),
    );
  const columns = [
    { key: "visible" as const, label: "Показывать" },
    { key: "required" as const, label: "Обязательное" },
    { key: "unique" as const, label: "Уникальное" },
    { key: "manager" as const, label: "Менеджеру" },
    { key: "registration" as const, label: "Регистрация" },
  ];
  return (
    <>
      <PageHeading
        eyebrow="Администрирование"
        subtitle="Настройте отображение и правила заполнения данных компании для разных операций."
        title="Поля компании"
      />
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)] lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--ms-border)]">
              <th className="px-5 py-4">Поле</th>
              {columns.map((column) => (
                <th className="px-3 py-4 text-center text-xs text-[var(--ms-muted)]" key={column.key}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr className="border-b border-[var(--ms-border)] last:border-0" key={field.id}>
                <td className="px-5 py-4 font-semibold">{field.label}</td>
                {columns.map((column) => (
                  <td className="px-3 py-4 text-center" key={column.key}>
                    <span className="inline-flex">
                      <Switch
                        checked={field[column.key]}
                        label={`${column.label}: ${field.label}`}
                        onChange={() => toggle(field.id, column.key)}
                      />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 lg:hidden">
        {fields.map((field) => (
          <article
            className="rounded-2xl border border-[var(--ms-border)] bg-white p-4 shadow-[var(--ms-card-shadow)]"
            key={field.id}
          >
            <h2 className="font-bold">{field.label}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {columns.map((column) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                  key={column.key}
                >
                  <span className="text-xs font-semibold text-[var(--ms-muted)]">{column.label}</span>
                  <Switch
                    checked={field[column.key]}
                    label={`${column.label}: ${field.label}`}
                    onChange={() => toggle(field.id, column.key)}
                  />
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => onNotice("Настройки полей сохранены.")}>Сохранить настройки</Button>
      </div>
    </>
  );
};
