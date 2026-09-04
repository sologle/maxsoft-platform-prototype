import {
  ArrowRight,
  BookOpen,
  Building2,
  FilePlus2,
  FolderTree,
  Search,
  Settings,
  Tags,
  UsersRound,
} from "lucide-react";
import type { AppPage, Navigate, UserRole } from "../app/types";
import { roleProfile } from "../app/routes";
import { Badge, PageHeading } from "../components/ui";
import { articles, canRoleAccessArticle, isArticlePublished } from "../data/platform-data";
import { getArticleSections } from "../data/prototype-entities";

interface HomePageProps {
  companyType?: string;
  onNavigate: Navigate;
  role: UserRole;
}

const cardsForRole = (role: UserRole) => {
  const cards = [
    {
      description: "Инструкции, документы и видео",
      icon: BookOpen,
      label: "База знаний",
      page: "knowledge" as AppPage,
    },
    { description: "Поиск по статьям и файлам", icon: Search, label: "Поиск", page: "search" as AppPage },
  ];
  if (role === "portal-admin" || role === "support-engineer")
    cards.unshift({
      description: "Подготовить новый материал",
      icon: FilePlus2,
      label: "Создать статью",
      page: "editor" as AppPage,
    });
  if (["portal-admin", "support-engineer", "manager"].includes(role))
    cards.push(
      {
        description: "Карточки и доступ клиентов",
        icon: Building2,
        label: "Компании",
        page: "companies" as AppPage,
      },
      {
        description: "Аккаунты и приглашения",
        icon: UsersRound,
        label: "Пользователи",
        page: "users" as AppPage,
      },
    );
  if (role === "client-admin")
    cards.push({
      description: "Команда вашей компании",
      icon: UsersRound,
      label: "Сотрудники",
      page: "client-users" as AppPage,
    });
  if (role === "portal-admin")
    cards.push({
      description: "Структура, теги и интеграции",
      icon: Settings,
      label: "Администрирование",
      page: "administration" as AppPage,
    });
  return cards;
};

export const HomePage = ({ companyType, onNavigate, role }: HomePageProps) => {
  const profile = roleProfile(role);
  const visibleArticles = articles.filter(
    (article) => isArticlePublished(article) && canRoleAccessArticle(article, role, companyType),
  );
  return (
    <>
      <PageHeading
        eyebrow="Личный кабинет"
        subtitle={`Вы вошли как ${profile.label.toLowerCase()}. Здесь собраны доступные разделы и последние материалы.`}
        title="Рабочее пространство"
      />
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Доступные разделы">
        {cardsForRole(role).map(({ description, icon: Icon, label, page }) => (
          <button
            className="group flex min-h-40 min-w-0 flex-col items-start rounded-2xl border border-[var(--ms-border)] bg-white p-5 text-left shadow-[var(--ms-card-shadow)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--ms-primary)] hover:shadow-[var(--ms-card-shadow-hover)] sm:p-6"
            key={`${page}-${label}`}
            onClick={() => onNavigate(page)}
            type="button"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)] transition group-hover:bg-[var(--ms-primary)] group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="mt-5 flex w-full min-w-0 items-center gap-3">
              <span className="min-w-0 flex-1 font-heading text-lg font-bold">{label}</span>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-[var(--ms-primary)] transition group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
            <span className="mt-1.5 text-sm leading-6 text-[var(--ms-muted)]">{description}</span>
          </button>
        ))}
      </section>

      <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <section className="min-w-0 rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--ms-primary)]">
                Обновления
              </p>
              <h2 className="mt-1 font-heading text-xl font-bold">Свежие материалы</h2>
            </div>
            <button
              className="text-sm font-semibold text-[var(--ms-primary)] hover:underline"
              onClick={() => onNavigate("knowledge")}
              type="button"
            >
              Все статьи
            </button>
          </div>
          <div className="divide-y divide-[var(--ms-border)]">
            {visibleArticles.slice(0, 3).map((article) => (
              <button
                className="group flex w-full min-w-0 items-start gap-3 py-4 text-left first:pt-2 last:pb-0"
                key={article.id}
                onClick={() =>
                  onNavigate(article.kind === "video" ? "video" : "article", article.id)
                }
                type="button"
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--ms-primary)]" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug transition group-hover:text-[var(--ms-primary)]">
                    {article.title}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--ms-muted)]">
                    {getArticleSections(article).join(" · ")} · {article.updated}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-gradient-to-br from-[#123b5a] to-[#1478bd] p-5 text-white shadow-[0_18px_48px_rgba(20,120,189,.2)] sm:p-6">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
            <FolderTree className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-heading text-xl font-bold">База знаний растёт</h2>
          <p className="mt-2 text-sm leading-6 text-white/72">
            {visibleArticles.length} опубликованных материалов доступны вашей роли. Последнее
            обновление — сегодня.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone="blue">НАВИСА · 36</Badge>
            <Badge tone="slate">Документы · 18</Badge>
          </div>
          {role === "portal-admin" ? (
            <button
              className="mt-6 flex items-center gap-2 text-sm font-bold transition hover:gap-3"
              onClick={() => onNavigate("structure")}
              type="button"
            >
              <Tags className="h-4 w-4" aria-hidden="true" />
              Управлять структурой
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </section>
      </div>
    </>
  );
};
