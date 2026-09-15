import type { UserRole } from "../app/types";
import {
  articles,
  canRoleAccessArticle,
  files,
  isArticlePublished,
  type ArticleSummary,
  type KnowledgeFile,
} from "./platform-data";
import { getArticleSections, getArticleTags } from "./prototype-entities";
import { getKnowledgeTree, sectionArticleIds } from "./knowledge-tree";
import { articleSearchText } from "./article-content";
import { fileContent } from "./file-content";
import { licensingArticleId, licensingFileName } from "./licensing/catalog";

export type MaterialKind = "all" | "article" | "video" | "file";
export interface Audience {
  role: UserRole;
  companyType?: string;
}
export interface MaterialResult {
  id: string;
  kind: Exclude<MaterialKind, "all">;
  title: string;
  description: string;
  updated: string;
  updatedAt: string;
  tags: string[];
  sections: string[];
  article?: ArticleSummary;
  file?: KnowledgeFile;
  related: ArticleSummary[];
  match: string;
  snippet: string;
}
export const accessibleFileArticles = (
  file: KnowledgeFile,
  audience: Audience,
) =>
  articles.filter(
    (a) =>
      file.relatedArticleIds.includes(a.id) &&
      canRoleAccessArticle(a, audience.role, audience.companyType),
  );
export const visibleArticleIds = (audience: Audience) =>
  articles
    .filter((a) => canRoleAccessArticle(a, audience.role, audience.companyType))
    .map((a) => a.id);
const wordsMatch = (text: string, words: string[]) =>
  words.every((word) => {
    const lower = text.toLocaleLowerCase("ru");
    return (
      lower.includes(word) ||
      (word.length > 5 && lower.includes(word.slice(0, -1)))
    );
  });
const snippetFor = (text: string, words: string[]) => {
  const lower = text.toLocaleLowerCase("ru");
  const index = words.length ? lower.indexOf(words[0]) : 0;
  const start = Math.max(0, index - 70);
  return `${start ? "…" : ""}${text.slice(start, start + 240)}${text.length > start + 240 ? "…" : ""}`;
};
export const fileSearchText = (file: KnowledgeFile) =>
  file.name === licensingFileName
    ? articleSearchText(licensingArticleId)
    : (fileContent[file.name] ?? [])
        .map((p) => `${p.title} ${p.text}`)
        .join(" ");
export const queryMaterials = ({
  role,
  companyType,
  query = "",
  section = "all",
  tags = [],
  kind = "all",
  sort = "updated",
  content = true,
}: Audience & {
  query?: string;
  section?: string;
  tags?: string[];
  kind?: MaterialKind;
  sort?: string;
  content?: boolean;
}): MaterialResult[] => {
  const words = query
    .trim()
    .toLocaleLowerCase("ru")
    .split(/\s+/)
    .filter(Boolean);
  const sectionIds =
    section === "all"
      ? null
      : new Set(sectionArticleIds(getKnowledgeTree(), section));
  const audience = { role, companyType };
  const eligible = (a: ArticleSummary) =>
    (!sectionIds || sectionIds.has(a.id)) &&
    tags.every((t) => getArticleTags(a).includes(t));
  const result: MaterialResult[] = [];
  if (kind !== "file")
    for (const article of articles) {
      if (kind !== "all" && article.kind !== kind) continue;
      if (
        !canRoleAccessArticle(article, role, companyType) ||
        !eligible(article)
      )
        continue;
      const articleTags = getArticleTags(article);
      const candidates = [
        ["Совпадение в заголовке статьи", article.title],
        ["Совпадение в описании статьи", article.description],
        ["Совпадение в теге", articleTags.join(" ")],
        ...(content
          ? [["Совпадение в тексте статьи", articleSearchText(article.id)]]
          : []),
      ];
      const match = candidates.find(([, text]) => wordsMatch(text, words));
      if (!match) continue;
      result.push({
        id: article.id,
        kind: article.kind,
        title: article.title,
        description: article.description,
        updated: article.updated,
        updatedAt: article.updatedAt,
        tags: articleTags,
        sections: getArticleSections(article),
        article,
        related: [],
        match: words.length
          ? match[0]
          : isArticlePublished(article)
            ? "Опубликована"
            : "Черновик",
        snippet: words.length ? snippetFor(match[1], words) : "",
      });
    }
  if (kind === "all" || kind === "file")
    for (const file of files) {
      const related = accessibleFileArticles(file, audience);
      if (!related.some(eligible)) continue;
      const text = content ? fileSearchText(file) : "";
      const nameMatch = wordsMatch(file.name, words);
      if (!nameMatch && !wordsMatch(text, words)) continue;
      result.push({
        id: file.name,
        kind: "file",
        title: file.name,
        description: `${file.type} · ${file.size}`,
        updated: file.updated,
        updatedAt: file.updatedAt,
        tags: [...new Set(related.flatMap(getArticleTags))],
        sections: [...new Set(related.flatMap(getArticleSections))],
        file,
        related,
        match: words.length
          ? nameMatch
            ? "Совпадение в названии файла"
            : `Совпадение в тексте ${file.type}`
          : `Файл ${file.type}`,
        snippet: nameMatch ? "" : snippetFor(text, words),
      });
    }
  return result.sort((a, b) =>
    sort === "title"
      ? a.title.localeCompare(b.title, "ru")
      : Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
        a.id.localeCompare(b.id),
  );
};
