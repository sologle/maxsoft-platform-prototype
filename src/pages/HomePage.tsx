import { SupportReminder } from "./SupportReminder";
import { clientRoleLabel } from "../app/client-role-label";
import type { Navigate, UserRole } from "../app/types";
import { roleProfile } from "../app/routes";
import { PageHeading } from "../components/ui";
import {
  articles,
  canRoleAccessArticle,
  isArticlePublished,
} from "../data/platform-data";
import { getArticleSections } from "../data/prototype-entities";
import { getKnowledgeTree, sectionArticleIds } from "../data/knowledge-tree";
import { personalKey, readPersonalArticles } from "../data/personal-articles";
import { licensingArticleId } from "../data/licensing/catalog";
import { queryMaterials } from "../data/material-query";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Clock,
  FolderOpen,
  Sparkles,
  Star,
} from "lucide-react";
import { ClientSupport } from "./home/ClientSupport";
import { HomeCollection } from "./home/HomeCollection";
import "./home/home.css";
interface HomePageProps {
  companyId?: string;
  companyType?: string;
  onNavigate: Navigate;
  role: UserRole;
}
export const HomePage = ({
  companyId,
  companyType,
  onNavigate,
  role,
}: HomePageProps) => {
  const profile = roleProfile(role);
  const visible = articles.filter(
    (a) => isArticlePublished(a) && canRoleAccessArticle(a, role, companyType),
  );
  const lists = readPersonalArticles(personalKey(role, companyId), {
    role,
    companyType,
  });
  const tree = getKnowledgeTree();
  const products = tree
    .flatMap((n) => (n.id === "products" ? (n.children ?? []) : [n]))
    .map((n) => ({
      ...n,
      count: visible.filter((a) => sectionArticleIds(tree, n.id).includes(a.id))
        .length,
    }))
    .filter((n) => n.count);
  const materialCount = queryMaterials({ role, companyType }).length;
  const articleBlocks = [
    {
      title: "Новое и обновлённое",
      icon: Sparkles,
      accent: "bg-emerald-50 text-emerald-700",
      items: [...visible]
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .slice(0, 5),
      empty: "Пока нет доступных материалов.",
      note: "Даты отражают демонстрационный каталог; даты источников указаны в статьях.",
    },
    {
      title: "Популярное",
      icon: Star,
      accent: "bg-amber-50 text-amber-700",
      items: [licensingArticleId, "licensing-kinds", "network-license"].flatMap(
        (id) => visible.filter((a) => a.id === id),
      ),
      empty: "Пока нет доступных материалов.",
      note: "Демонстрационная подборка для знакомства с материалами, без статистики просмотров.",
    },
    {
      title: "Сохранённое",
      icon: Bookmark,
      accent: "bg-violet-50 text-violet-700",
      items: lists.saved,
      empty: "Нажмите «Сохранить» в статье — она появится здесь.",
    },
    {
      title: "Недавно прочитанное",
      icon: Clock,
      accent: "bg-rose-50 text-rose-700",
      items: lists.recent,
      empty: "Откройте материал — он появится здесь.",
    },
  ];
  return (
    <div className="home-page">
      <PageHeading
        eyebrow="Личный кабинет"
        title="Рабочее пространство"
        subtitle={`Вы вошли как ${clientRoleLabel(profile.label).toLowerCase()}.`}
      />
      <div className="home-summary">
        <button
          type="button"
          className="home-knowledge-summary"
          onClick={() => onNavigate("knowledge")}
        >
          <BookOpen size={24} aria-hidden="true" />
          <span>
            <span className="home-total">{materialCount}</span>
            <span className="home-total-label">Материалов в базе знаний</span>
          </span>
          <ArrowRight size={22} aria-hidden="true" />
        </button>
        <ClientSupport role={role} companyId={companyId} />
      </div>
      <SupportReminder role={role} onNavigate={onNavigate} />
      <HomeCollection
        title="Разделы по продуктам"
        icon={FolderOpen}
        accent="bg-sky-50 text-sky-700"
        items={products}
        itemKey={(p) => p.id}
        grid
        empty="Пока нет доступных разделов."
        action={
          <button
            type="button"
            className="home-all"
            onClick={() => onNavigate("knowledge")}
          >
            Все материалы <ArrowRight size={16} aria-hidden="true" />
          </button>
        }
        renderItem={(p) => (
          <button
            type="button"
            className="home-product"
            onClick={() => onNavigate("knowledge", p.id)}
          >
            {p.name}
            <span>Статей и видео: {p.count}</span>
          </button>
        )}
      />
      <div className="home-collections">
        {articleBlocks.map((block) => (
          <HomeCollection
            key={`${role}:${companyId}:${block.title}`}
            {...block}
            itemKey={(a) => a.id}
            renderItem={(a) => (
              <button
                type="button"
                className="home-article"
                onClick={() =>
                  onNavigate(a.kind === "video" ? "video" : "article", a.id)
                }
              >
                <span>{a.title}</span>
                <span className="home-article-meta">
                  {getArticleSections(a).join(" · ")} · {a.updated}
                </span>
              </button>
            )}
          />
        ))}
      </div>
    </div>
  );
};
