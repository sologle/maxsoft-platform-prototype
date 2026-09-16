import { useEffect, useRef } from "react";
import type { Navigate } from "../../app/types";
import type { ArticleSummary } from "../../data/platform-data";
import { getKnowledgeTree } from "../../data/knowledge-tree";
import { articleTrail } from "./reading-navigation";

export const ReadingBreadcrumbs = ({
  article,
  onNavigate,
}: {
  article: ArticleSummary;
  onNavigate: Navigate;
}) => {
  const path = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      if (path.current) path.current.open = query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const trail = articleTrail(getKnowledgeTree(), article);
  return (
    <nav className="reading-breadcrumbs" aria-label="Хлебные крошки">
      <button type="button" onClick={() => onNavigate("knowledge")}>
        База знаний
      </button>
      {trail.length > 0 && (
        <details
          ref={path}
          className="reading-path"
          open={window.matchMedia("(min-width: 1024px)").matches}
        >
          <summary>Путь к разделу</summary>
          <div>
            {trail.map((node) => (
              <span key={node.id}>
                <span aria-hidden="true"> / </span>
                <button
                  type="button"
                  onClick={() => onNavigate("knowledge", node.id)}
                >
                  {node.name}
                </button>
              </span>
            ))}
          </div>
        </details>
      )}
    </nav>
  );
};
