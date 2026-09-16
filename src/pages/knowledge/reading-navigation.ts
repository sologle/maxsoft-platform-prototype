import { flattenTree, type TreeNode } from "../../data/knowledge-tree";
import { getArticleSections } from "../../data/prototype-entities";
import type { ArticleSummary } from "../../data/platform-data";

// Resolve the persisted full path once, then use IDs for every navigation action.
export const articleTrail = (
  tree: TreeNode[],
  article: ArticleSummary,
): TreeNode[] => {
  const primaryPath = getArticleSections(article)[0];
  if (!primaryPath)
    throw new Error(
      `KB_ARTICLE_SECTION_MISSING: у статьи ${article.id} не задан раздел`,
    );
  const target = flattenTree(tree).find((node) => node.path === primaryPath);
  if (!target) return []; // A removed placement is not a link to another section.
  const visit = (nodes: TreeNode[]): TreeNode[] => {
    for (const node of nodes) {
      if (node.id === target.id) return [node];
      const child = visit(node.children ?? []);
      if (child.length) return [node, ...child];
    }
    return [];
  };
  return visit(tree);
};
