import { BookOpen, ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";

interface KnowledgeTreeProps {
  onSelect: (section: string) => void;
  selected: string;
}

const branches = [
  { id: "installation", label: "Установка", count: 12 },
  { id: "settings", label: "Настройка", count: 18 },
  { id: "updates", label: "Обновление", count: 9 },
  { id: "cases", label: "Кейсы внедрения", count: 7 },
  { id: "administration", label: "Администрирование", count: 11 },
];

export const KnowledgeTree = ({ onSelect, selected }: KnowledgeTreeProps) => {
  const [navisaOpen, setNavisaOpen] = useState(true);
  const [productsOpen, setProductsOpen] = useState(true);

  return (
    <nav aria-label="Дерево базы знаний" className="min-w-0 text-sm">
      <button
        className={`tree-item ${selected === "all" ? "tree-item-active" : ""}`}
        onClick={() => onSelect("all")}
        type="button"
      >
        <BookOpen className="h-[18px] w-[18px]" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-semibold">Все материалы</span>
        <span className="text-xs text-slate-400">57</span>
      </button>

      <div className="mt-1">
        <button
          aria-expanded={productsOpen}
          aria-label={`${productsOpen ? "Свернуть" : "Развернуть"} раздел Продукты`}
          className="tree-item"
          onClick={() => setProductsOpen((current) => !current)}
          type="button"
        >
          {productsOpen ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          )}
          {productsOpen ? (
            <FolderOpen className="h-[18px] w-[18px] text-amber-500" aria-hidden="true" />
          ) : (
            <Folder className="h-[18px] w-[18px] text-amber-500" aria-hidden="true" />
          )}
          <span className="min-w-0 flex-1 truncate text-left font-semibold">Продукты</span>
          <span className="text-xs text-slate-400">43</span>
        </button>
        <div
          aria-hidden={!productsOpen}
          className="tree-children grid pl-4"
          data-open={productsOpen ? "true" : "false"}
          inert={!productsOpen || undefined}
        >
          <div className="min-h-0 overflow-hidden">
            <button
              aria-expanded={navisaOpen}
              aria-label={`${navisaOpen ? "Свернуть" : "Развернуть"} раздел НАВИСА`}
              className={`tree-item mt-1 ${selected === "navisa" ? "tree-item-active" : ""}`}
              onClick={() => {
                setNavisaOpen((current) => !current);
                onSelect("navisa");
              }}
              type="button"
            >
              {navisaOpen ? (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              )}
              {navisaOpen ? (
                <FolderOpen className="h-[18px] w-[18px] text-amber-500" aria-hidden="true" />
              ) : (
                <Folder className="h-[18px] w-[18px] text-amber-500" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 truncate text-left font-semibold">НАВИСА</span>
              <span className="text-xs text-slate-400">36</span>
            </button>
            <div
              aria-hidden={!navisaOpen}
              className="tree-children grid pl-7"
              data-open={navisaOpen ? "true" : "false"}
              inert={!navisaOpen || undefined}
            >
              <div className="min-h-0 overflow-hidden py-1">
                {branches.map((branch) => (
                  <button
                    aria-label={branch.label}
                    className={`tree-item py-2 ${selected === branch.id ? "tree-item-active" : ""}`}
                    key={branch.id}
                    onClick={() => onSelect(branch.id)}
                    type="button"
                  >
                    <span className="min-w-0 flex-1 truncate text-left">{branch.label}</span>
                    <span className="text-xs text-slate-400">{branch.count}</span>
                  </button>
                ))}
              </div>
            </div>
            <button className="tree-item" onClick={() => onSelect("model-studio")} type="button">
              <Folder className="h-[18px] w-[18px] text-amber-500" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-left font-semibold">Model Studio CS</span>
              <span className="text-xs text-slate-400">7</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
