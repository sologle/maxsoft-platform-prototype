import type { ArticleAccess } from "./prototype-entities";
export type AccessMap = Record<string, ArticleAccess>;
const audienceError = () =>
  new Error(
    "KB_AUDIENCE_REQUIRED: Выберите другую аудиторию для статей, теряющих последний разрешённый тип.",
  );
export const planTypeRemoval = (
  current: AccessMap,
  removed: string,
  replacement?: string,
): AccessMap =>
  Object.fromEntries(
    Object.entries(current).map(([id, access]) => {
      if (access === "all" || !access.includes(removed)) return [id, access];
      const next = access.filter((type) => type !== removed);
      if (next.length) return [id, next];
      if (!replacement || replacement === removed) throw audienceError();
      return [id, [replacement]];
    }),
  );
export const planAccessChange = (
  current: AccessMap,
  ids: string[],
  type: string,
  enabled: boolean,
  types: string[],
  replacement?: string,
): AccessMap => {
  if (
    !types.includes(type) ||
    (replacement && (!types.includes(replacement) || replacement === type))
  )
    throw new Error("KB_AUDIENCE_INVALID: Выберите существующий тип компании.");
  const next = { ...current };
  for (const id of new Set(ids)) {
    const access = current[id];
    if (!access) throw new Error("KB_ACCESS_MISSING: Не найдены права статьи. Обновите страницу.");
    if (enabled && access === "all") continue;
    const explicit = access === "all" ? types : access;
    if (enabled) next[id] = [...new Set([...explicit, type])];
    else if (explicit.includes(type)) {
      const remaining = explicit.filter((item) => item !== type);
      if (!remaining.length && !replacement) throw audienceError();
      next[id] = remaining.length ? remaining : [replacement!];
    }
  }
  return next;
};
