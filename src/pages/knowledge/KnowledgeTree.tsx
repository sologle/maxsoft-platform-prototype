import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useState } from "react";
import {
  getKnowledgeTree,
  sectionArticleIds,
  type TreeNode,
} from "../../data/knowledge-tree";
export const KnowledgeTree = ({
  onSelect,
  selected,
  articleIds,
  persistExpansion = false,
  currentArticleId,
}: {
  onSelect: (id: string) => void;
  selected: string;
  articleIds?: string[];
  persistExpansion?: boolean;
  currentArticleId?: string;
}) => {
  const tree = getKnowledgeTree();
  const [expanded, setExpanded] = useState(() => {
    const saved = persistExpansion
      ? sessionStorage.getItem("maxsoft-prototype-reading-tree")
      : null;
    const initial = new Set<string>(
      saved ? JSON.parse(saved) : ["products", "navisa"],
    );
    const includeParents = (nodes: TreeNode[]) =>
      nodes.forEach((node) => {
        if (
          currentArticleId &&
          node.children?.length &&
          sectionArticleIds(tree, node.id).includes(currentArticleId)
        )
          initial.add(node.id);
        if (node.children) includeParents(node.children);
      });
    includeParents(tree);
    return initial;
  });
  const render = (nodes: TreeNode[]) =>
    nodes
      .filter(
        (node) =>
          !articleIds ||
          sectionArticleIds(tree, node.id).some((id) =>
            articleIds.includes(id),
          ),
      )
      .map((node) => (
        <div key={node.id}>
          <div className="flex items-center min-w-0">
            {node.children?.length ? (
              <button
                className="icon-button shrink-0"
                aria-label={`${expanded.has(node.id) ? "Свернуть" : "Развернуть"} раздел ${node.name}`}
                aria-expanded={expanded.has(node.id)}
                onClick={() =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    next.has(node.id)
                      ? next.delete(node.id)
                      : next.add(node.id);
                    if (persistExpansion)
                      sessionStorage.setItem(
                        "maxsoft-prototype-reading-tree",
                        JSON.stringify([...next]),
                      );
                    return next;
                  })
                }
              >
                {expanded.has(node.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : null}
            <button
              aria-label={node.name}
              className={`tree-item min-w-0 flex-1 ${selected === node.id ? "tree-item-active" : ""}`}
              onClick={() => onSelect(node.id)}
            >
              <Folder className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left break-words">{node.name}</span>
              <span className="text-xs text-slate-400">
                {
                  sectionArticleIds(tree, node.id).filter(
                    (id) => !articleIds || articleIds.includes(id),
                  ).length
                }
              </span>
            </button>
          </div>
          {node.children && expanded.has(node.id) ? (
            <div className="pl-3 border-l border-[var(--ms-border)]">
              {render(node.children)}
            </div>
          ) : null}
        </div>
      ));
  return (
    <nav aria-label="Дерево разделов">
      <button
        className={`tree-item ${selected === "all" ? "tree-item-active" : ""}`}
        onClick={() => onSelect("all")}
      >
        Вся база знаний
      </button>
      {render(tree)}
    </nav>
  );
};
