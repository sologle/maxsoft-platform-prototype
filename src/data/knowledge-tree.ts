import { articles } from "./platform-data";
import { getArticleSections } from "./prototype-entities";
import { writePrototypeBatch, prototypeStorageKeys } from "./prototype-store";
import { getKnowledgeTree, flattenTree, type TreeNode } from "./knowledge-structure";
export { getKnowledgeTree, flattenTree, type TreeNode } from "./knowledge-structure";
export const subtreeIds = (node: TreeNode): string[] => [
  node.id,
  ...(node.children ?? []).flatMap(subtreeIds),
];
export const sectionArticleIds = (tree: TreeNode[], id: string) => {
  const node = flattenTree(tree).find((item) => item.id === id);
  if (!node) throw new Error("KB_SECTION_MISSING: Раздел не найден. Обновите страницу.");
  const ids = new Set(subtreeIds(node));
  const paths = new Set(
    flattenTree(tree)
      .filter((item) => ids.has(item.id))
      .map((item) => item.path),
  );
  return articles
    .filter((article) => getArticleSections(article).some((path) => paths.has(path)))
    .map((article) => article.id);
};
export const saveKnowledgeTree = (next: TreeNode[]) => {
  const before = flattenTree(getKnowledgeTree());
  const after = flattenTree(next);
  const paths = after.map((node) => node.path.trim().toLocaleLowerCase("ru"));
  if (new Set(paths).size !== paths.length)
    throw new Error(
      "KB_SECTION_PATH_CONFLICT: Раздел с таким расположением уже существует. Измените название или родителя.",
    );
  const sections = Object.fromEntries(
    articles.map((article) => [
      article.id,
      getArticleSections(article).map((path) => {
        const old = before.find((node) => node.path === path);
        const updated = old && after.find((node) => node.id === old.id);
        return updated ? updated.path : path;
      }),
    ]),
  );
  writePrototypeBatch({
    [prototypeStorageKeys.articleSections]: sections,
    "maxsoft-prototype-knowledge-tree": next,
  });
};
