import type { UserRole } from "../app/types";
import {
  articles,
  canRoleAccessArticle,
  isArticlePublished,
} from "./platform-data";
import { readPrototypeValue, writePrototypeValue } from "./prototype-store";
import type { Audience } from "./material-query";
export const personalStorageKey = "maxsoft-prototype-personal-articles-v1";
interface Lists {
  saved: string[];
  recent: string[];
}
export const personalKey = (role: UserRole, companyId?: string) => {
  if (
    role === "guest" ||
    ((role === "client-admin" || role === "client-employee") && !companyId)
  )
    throw new Error(
      "KB_PERSON_REQUIRED: Не удалось определить профиль. Войдите заново.",
    );
  return JSON.stringify([role, companyId ?? null]);
};
const readLists = () =>
  readPrototypeValue<Record<string, Lists>>(personalStorageKey, {});
const emptyLists = (): Lists => ({ saved: [], recent: [] });
export const readPersonalArticles = (key: string, audience: Audience) => {
  const lists = readLists()[key] ?? emptyLists();
  const resolve = (ids: string[]) =>
    ids.flatMap((id) => {
      const article = articles.find((a) => a.id === id);
      return article &&
        isArticlePublished(article) &&
        canRoleAccessArticle(article, audience.role, audience.companyType)
        ? [article]
        : [];
    });
  return { saved: resolve(lists.saved), recent: resolve(lists.recent) };
};
const update = (key: string, articleId: string, action: "saved" | "recent") => {
  if (!articles.some((a) => a.id === articleId))
    throw new Error(
      "KB_ARTICLE_MISSING: Материал не найден. Обновите страницу.",
    );
  const all = readLists();
  const lists = all[key] ?? emptyLists();
  const without = lists[action].filter((id) => id !== articleId);
  const next =
    action === "saved" && lists.saved.includes(articleId)
      ? without
      : [articleId, ...without];
  writePrototypeValue(personalStorageKey, {
    ...all,
    [key]: { ...lists, [action]: next },
  });
};
export const toggleSaved = (key: string, articleId: string) =>
  update(key, articleId, "saved");
export const recordRead = (key: string, articleId: string) =>
  update(key, articleId, "recent");
