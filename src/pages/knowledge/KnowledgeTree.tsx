import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
import "./knowledge-tree.css";
import { useState } from "react";
import {
  getKnowledgeTree,
  flattenTree,
  sectionArticleIds,
  type TreeNode,
} from "../../data/knowledge-tree";
import { articles } from "../../data/platform-data";
import { getArticleSections } from "../../data/prototype-entities";
export const KnowledgeTree = ({
  onSelect,
  selected,
  articleIds,
  persistExpansion = false,
  currentArticleId,
  onSelectArticle,
}: {
  onSelect: (id: string) => void;
  selected: string;
  articleIds?: string[];
  persistExpansion?: boolean;
  currentArticleId?: string;
  onSelectArticle?: (id: string) => void;
}) => {
  const tree = getKnowledgeTree();
  const paths = new Map(flattenTree(tree).map((node) => [node.id, node.path]));
  const visibleArticles = articles.filter(
    (article) => !articleIds || articleIds.includes(article.id),
  );
  const [expanded, setExpanded] = useState(() => {
    const saved = persistExpansion
      ? sessionStorage.getItem("maxsoft-prototype-reading-tree")
      : null;
    const initial = new Set<string>(
      saved
        ? JSON.parse(saved)
        : persistExpansion
          ? []
          : ["products", "navisa"],
    );
    const includeParents = (nodes: TreeNode[]) =>
      nodes.forEach((node) => {
        if (
          currentArticleId &&
          sectionArticleIds(tree, node.id).includes(currentArticleId)
        )
          initial.add(node.id);
        if (node.children) includeParents(node.children);
      });
    if (saved === null) includeParents(tree);
    const valid = new Set(flattenTree(tree).map((node) => node.id));
    for (const id of initial) if (!valid.has(id)) initial.delete(id);
    return initial;
  });
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      if (persistExpansion)
        sessionStorage.setItem(
          "maxsoft-prototype-reading-tree",
          JSON.stringify([...next]),
        );
      return next;
    });
  const render = (nodes: TreeNode[], depth = 0) =>
    nodes
      .filter(
        (node) =>
          !articleIds ||
          sectionArticleIds(tree, node.id).some((id) =>
            articleIds.includes(id),
          ),
      )
      .map((node) => {
        const directArticles = onSelectArticle
          ? visibleArticles.filter((article) =>
              getArticleSections(article).includes(paths.get(node.id) ?? ""),
            )
          : [];
        const expandable = Boolean(node.children?.length || directArticles.length);
        return (
        <div key={node.id}>
          <div className="knowledge-tree-row">
            {expandable ? (
              <button
                className="icon-button shrink-0"
                aria-label={`${expanded.has(node.id) ? "Свернуть" : "Развернуть"} раздел ${node.name}`}
                aria-expanded={expanded.has(node.id)}
                onClick={() => toggle(node.id)}
              >
                {expanded.has(node.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="knowledge-tree-spacer" aria-hidden="true" />
            )}
            <button
              aria-label={node.name}
              className={`tree-item knowledge-tree-item min-w-0 ${selected === node.id ? "tree-item-active" : ""}`}
              onClick={() => onSelectArticle ? toggle(node.id) : onSelect(node.id)}
            >
              <Folder className="h-4 w-4 shrink-0" />
              <span className="min-w-0 text-left [overflow-wrap:anywhere]">
                {node.name}
              </span>
              <span className="knowledge-tree-count text-xs text-slate-400">
                {
                  sectionArticleIds(tree, node.id).filter(
                    (id) => !articleIds || articleIds.includes(id),
                  ).length
                }
              </span>
            </button>
          </div>
          {expandable ? (
            <div
              className="tree-children grid"
              data-open={expanded.has(node.id) ? "true" : "false"}
              inert={!expanded.has(node.id) || undefined}
              aria-hidden={!expanded.has(node.id)}
            >
              <div
                className="knowledge-tree-branch min-h-0 overflow-hidden border-l border-[var(--ms-border)]"
                style={{ paddingLeft: depth < 3 ? 8 : 0 }}
              >
                {render(node.children ?? [], depth + 1)}
                {directArticles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    className={`tree-item knowledge-tree-article ${currentArticleId === article.id ? "tree-item-active" : ""}`}
                    aria-current={currentArticleId === article.id ? "page" : undefined}
                    onClick={() => onSelectArticle?.(article.id)}
                  >
                    <FileText size={15} aria-hidden="true" />
                    <span>{article.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      );
      });
  return (
    <nav aria-label="Дерево разделов">
      {!onSelectArticle && <button
        className={`tree-item ${selected === "all" ? "tree-item-active" : ""}`}
        onClick={() => onSelect("all")}
      >
        Вся база знаний
      </button>}
      {render(tree)}
    </nav>
  );
};
