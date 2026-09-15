import { SupportReminder } from "./SupportReminder";
import { clientRoleLabel } from "../app/client-role-label";
import type { Navigate, UserRole } from "../app/types";
import { roleProfile } from "../app/routes";
import { PageHeading } from "../components/ui";
import {
  articles,
  canRoleAccessArticle,
  isArticlePublished,
  type ArticleSummary,
} from "../data/platform-data";
import { getArticleSections } from "../data/prototype-entities";
import { getKnowledgeTree, sectionArticleIds } from "../data/knowledge-tree";
import { personalKey, readPersonalArticles } from "../data/personal-articles";
import { licensingArticleId } from "../data/licensing/catalog";
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
  const block = (
    title: string,
    items: ArticleSummary[],
    empty: string,
    note?: string,
  ) => (
    <section
      aria-label={title}
      className="min-w-0 rounded-2xl border border-[var(--ms-border)] bg-white p-5"
    >
      <h2 className="font-heading text-xl font-bold">
        {title}{" "}
        <span className="text-sm text-[var(--ms-muted)]">· {items.length}</span>
      </h2>
      {note ? (
        <p className="mt-2 text-xs text-[var(--ms-muted)]">{note}</p>
      ) : null}
      {!items.length ? (
        <p className="mt-4 text-sm text-[var(--ms-muted)]">{empty}</p>
      ) : (
        <ul className="mt-3 max-h-96 divide-y divide-[var(--ms-border)] overflow-auto">
          {items.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="w-full py-3 text-left hover:text-[var(--ms-primary)]"
                onClick={() =>
                  onNavigate(a.kind === "video" ? "video" : "article", a.id)
                }
              >
                <span className="block font-semibold">{a.title}</span>
                <span className="mt-1 block text-xs text-[var(--ms-muted)]">
                  {getArticleSections(a).join(" · ")} · {a.updated}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
  return (
    <>
      <PageHeading
        eyebrow="Личный кабинет"
        title="Рабочее пространство"
        subtitle={`Вы вошли как ${clientRoleLabel(profile.label).toLowerCase()}. Доступно опубликованных материалов: ${visible.length}.`}
      />
      <SupportReminder role={role} onNavigate={onNavigate} />
      <section aria-label="Разделы по продуктам" className="mb-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-xl font-bold">
            Разделы по продуктам
          </h2>
          <button
            type="button"
            className="text-sm font-semibold text-[var(--ms-primary)]"
            onClick={() => onNavigate("knowledge")}
          >
            Все статьи
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              className="min-w-0 rounded-xl border border-[var(--ms-border)] bg-white p-4 text-left font-bold hover:border-[var(--ms-primary)]"
              onClick={() => onNavigate("knowledge", p.id)}
            >
              {p.name}
              <span className="mt-2 block text-sm font-normal text-[var(--ms-muted)]">
                Материалов: {p.count}
              </span>
            </button>
          ))}
        </div>
      </section>
      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        {block(
          "Новое и обновлённое",
          [...visible]
            .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
            .slice(0, 5),
          "Пока нет доступных материалов.",
          "Даты отражают демонстрационный каталог; даты источников указаны в статьях.",
        )}
        {block(
          "Популярное",
          [licensingArticleId, "licensing-kinds", "network-license"].flatMap(
            (id) => visible.filter((a) => a.id === id),
          ),
          "Пока нет доступных материалов.",
          "Демонстрационная подборка для знакомства с материалами, без статистики просмотров.",
        )}
        {block(
          "Сохранённое",
          lists.saved,
          "Нажмите «Сохранить» в статье — она появится здесь.",
        )}
        {block(
          "Недавно прочитанное",
          lists.recent,
          "Откройте материал — он появится здесь.",
        )}
      </div>
    </>
  );
};
