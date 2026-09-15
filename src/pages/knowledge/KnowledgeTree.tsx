import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useState } from "react";
import { getKnowledgeTree, sectionArticleIds, type TreeNode } from "../../data/knowledge-tree";
export const KnowledgeTree = ({
  onSelect,
  selected,
}: {
  onSelect: (id: string) => void;
  selected: string;
}) => {
  const tree = getKnowledgeTree();
  const [expanded, setExpanded] = useState(new Set(["products", "navisa"]));
  const render = (nodes: TreeNode[]) =>
    nodes.map((node) => (
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
                  next.has(node.id) ? next.delete(node.id) : next.add(node.id);
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
              {sectionArticleIds(tree, node.id).length}
            </span>
          </button>
        </div>
        {node.children && expanded.has(node.id) ? (
          <div className="pl-3 border-l border-[var(--ms-border)]">{render(node.children)}</div>
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
