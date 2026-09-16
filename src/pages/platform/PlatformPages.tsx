import { MotionMessage } from "../../components/MotionMessage";
import { goBack } from "../../components/BackButton";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleAlert,
  Database,
  FileClock,
  FolderTree,
  Link2,
  LoaderCircle,
  Mail,
  Search,
  Settings2,
  ShieldCheck,
  Tags,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AppPage, Navigate } from "../../app/types";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  PageHeading,
  SelectField,
  Switch,
} from "../../components/ui";
import { auditEvents, type AuditEvent } from "../../data/platform-data";
import {
  appendPrototypeValue,
  prototypeStorageKeys,
  readPrototypeValue,
  writePrototypeValue,
} from "../../data/prototype-store";

interface PlatformProps {
  onNavigate: Navigate;
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
      description: "Какие материалы доступны компаниям и их пользователям",
      icon: ShieldCheck,
      label: "Доступ к материалам",
      page: "access-settings" as AppPage,
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
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:scale-105 group-hover:bg-[var(--ms-primary-soft)] group-hover:text-[var(--ms-primary)]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="mt-5 flex w-full min-w-0 items-center gap-2">
              <span className="min-w-0 flex-1 font-heading text-lg font-bold">
                {label}
              </span>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-[var(--ms-primary)] transition group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
            <span className="mt-2 text-sm leading-6 text-[var(--ms-muted)]">
              {description}
            </span>
          </button>
        ))}
      </div>
    </>
  );
};

export const IntegrationsPage = ({ onNotice, onNavigate }: PlatformProps) => {
  const [mailEnabled, setMailEnabled] = useState(true);
  const [bitrixEnabled, setBitrixEnabled] = useState(true);
  const [mailHost, setMailHost] = useState("smtp.maxsoft.ru");
  const [bitrixUrl, setBitrixUrl] = useState("https://maxsoft.bitrix24.ru");
  const [checking, setChecking] = useState<"mail" | "bitrix" | null>(null);
  const [result, setResult] = useState<{
    kind: "mail" | "bitrix";
    status: "success" | "error";
  } | null>(null);
  useEffect(() => {
    if (!checking) return;
    const timeout = window.setTimeout(() => {
      const invalid =
        checking === "mail"
          ? mailHost.includes("invalid")
          : bitrixUrl.includes("invalid");
      setResult({ kind: checking, status: invalid ? "error" : "success" });
      setChecking(null);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [bitrixUrl, checking, mailHost]);
  const status = (kind: "mail" | "bitrix") => {
    const busy = checking === kind;
    const completed = result?.kind === kind;
    const failed = completed && result.status === "error";
    return (
      <MotionMessage
        message={
          busy
            ? "Проверяем…"
            : completed
              ? failed
                ? "Не удалось подключиться. Проверьте адрес. Код: PLAT_INTEGRATION_CONNECTION_FAILED."
                : "Подключение работает"
              : null
        }
        role={failed ? "alert" : "status"}
        className={`flex items-center gap-2 text-xs font-semibold ${busy ? "text-[var(--ms-primary)]" : failed ? "text-red-700" : "text-emerald-700"}`}
        icon={
          busy ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : failed ? (
            <CircleAlert className="h-4 w-4" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )
        }
      />
    );
  };
  return (
    <>
      <PageHeading
        eyebrow="Администрирование"
        subtitle="Подключения инфраструктуры для уведомлений и карточек клиентов."
        onBack={() => goBack(onNavigate, "administration")}
        title="Интеграции"
      />
      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-xl font-bold">
                Почтовые уведомления
              </h2>
              <p className="mt-1 text-sm text-[var(--ms-muted)]">
                Исходящие письма со ссылками на портал.
              </p>
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
            <Field
              label="SMTP-сервер"
              onChange={(event) => setMailHost(event.target.value)}
              value={mailHost}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field defaultValue="587" label="Порт" inputMode="numeric" />
              <SelectField defaultValue="STARTTLS" label="Шифрование">
                <option>STARTTLS</option>
                <option>SSL/TLS</option>
              </SelectField>
            </div>
            <Field
              defaultValue="portal@maxsoft.ru"
              label="Адрес отправителя"
              type="email"
            />
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
              <p className="mt-1 text-sm text-[var(--ms-muted)]">
                Ссылки на внешние карточки компаний.
              </p>
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
            <Field
              label="Адрес портала"
              onChange={(event) => setBitrixUrl(event.target.value)}
              type="url"
              value={bitrixUrl}
            />
            <Field
              defaultValue="••••••••••••••••"
              label="Вебхук"
              type="password"
            />
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
        <Button onClick={() => onNotice("Настройки интеграций сохранены.")}>
          Сохранить настройки
        </Button>
      </div>
    </>
  );
};

export const AuditPage = ({ onNavigate }: PlatformProps) => {
  const [events] = useState(() => [
    ...readPrototypeValue<AuditEvent[]>(prototypeStorageKeys.audit, []),
    ...auditEvents,
  ]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const visible = useMemo(
    () =>
      events.filter(
        (event) =>
          (type === "all" || event.category === type) &&
          `${event.user} ${event.action} ${event.object}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [events, query, type],
  );
  return (
    <>
      <PageHeading
        eyebrow="Администрирование"
        subtitle="Изменения статей, компаний, пользователей и прав доступа."
        onBack={() => goBack(onNavigate, "administration")}
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
        <SelectField
          className="sm:w-52"
          label="Тип события"
          labelHidden
          onChange={(event) => setType(event.target.value)}
          value={type}
        >
          <option value="all">Все события</option>
          <option value="content">Контент</option>
          <option value="access">Права доступа</option>
          <option value="company">Компании</option>
          <option value="user">Пользователи</option>
          <option value="system">Системные события</option>
        </SelectField>
      </div>
      {visible.length ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)]">
          <div className="divide-y divide-[var(--ms-border)]">
            {visible.map((event) => (
              <article
                className="flex min-w-0 gap-3 p-4 sm:items-center sm:p-5"
                key={`${event.user}-${event.date}-${event.action}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                  <Activity className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6">
                    <strong>{event.user}</strong> · {event.action}
                  </p>
                  <button
                    className="mt-0.5 break-words text-left text-sm font-semibold text-[var(--ms-primary)] hover:underline"
                    onClick={() => onNavigate(event.page, event.resource)}
                    type="button"
                  >
                    {event.object}
                  </button>
                </div>
                <time className="hidden shrink-0 text-xs text-[var(--ms-muted)] sm:block">
                  {event.date}
                </time>
                <Badge tone={event.result === "Успешно" ? "green" : "red"}>
                  {event.result}
                </Badge>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          action={
            <Button
              onClick={() => {
                setQuery("");
                setType("all");
              }}
            >
              Сбросить фильтры
            </Button>
          }
          text="Измените пользователя, объект или категорию события."
          title="События не найдены"
        />
      )}
    </>
  );
};

export { FieldsPage } from "./FieldsPage";
