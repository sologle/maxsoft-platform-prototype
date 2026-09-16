import { flattenTree, getKnowledgeTree } from "../../data/knowledge-tree";

export const MaterialSections = ({
  sections,
  onSelect,
}: {
  sections: string[];
  onSelect: (id: string) => void;
}) => {
  const tree = flattenTree(getKnowledgeTree());
  return (
    <ul className="material-section-links" aria-label="Разделы материала">
      {sections.map((path) => {
        const section = tree.find((node) => node.path === path);
        return (
          <li key={path}>
            {section ? (
              <button type="button" onClick={() => onSelect(section.id)}>
                {section.name}
              </button>
            ) : path}
          </li>
        );
      })}
    </ul>
  );
};
