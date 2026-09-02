import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { ActionMenu } from "../../components/ActionMenu";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Button, Field, PageHeading, SelectField } from "../../components/ui";

interface TreeNode {
  children?: TreeNode[];
  id: string;
  name: string;
  articles: number;
}

const initialTree: TreeNode[] = [
  {
    id: "products",
    name: "Продукты",
    articles: 43,
    children: [
      {
        id: "navisa",
        name: "НАВИСА",
        articles: 36,
        children: [
          { id: "installation", name: "Установка", articles: 12 },
          { id: "settings", name: "Настройка", articles: 18 },
          { id: "updates", name: "Обновление", articles: 6 },
        ],
      },
      { id: "model-studio", name: "Model Studio CS", articles: 7 },
    ],
  },
  {
    id: "administration",
    name: "Администрирование",
    articles: 11,
    children: [{ id: "licenses", name: "Лицензирование", articles: 11 }],
  },
];

const replaceNode = (nodes: TreeNode[], id: string, update: (node: TreeNode) => TreeNode): TreeNode[] =>
  nodes.map((node) =>
    node.id === id
      ? update(node)
      : node.children
        ? { ...node, children: replaceNode(node.children, id, update) }
        : node,
  );

const removeNode = (nodes: TreeNode[], id: string): TreeNode[] =>
  nodes
    .filter((node) => node.id !== id)
    .map((node) => (node.children ? { ...node, children: removeNode(node.children, id) } : node));

const reorderSiblings = (nodes: TreeNode[], draggedId: string, targetId: string): TreeNode[] => {
  const draggedIndex = nodes.findIndex(({ id }) => id === draggedId);
  const targetIndex = nodes.findIndex(({ id }) => id === targetId);
  if (draggedIndex >= 0 && targetIndex >= 0) {
    const next = [...nodes];
    const [dragged] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, dragged);
    return next;
  }
  return nodes.map((node) =>
    node.children ? { ...node, children: reorderSiblings(node.children, draggedId, targetId) } : node,
  );
};

export const StructurePage = ({ onNotice }: { onNotice: (message: string) => void }) => {
  const [tree, setTree] = useState(initialTree);
  const [expanded, setExpanded] = useState(() => new Set(["products", "navisa", "administration"]));
  const [menu, setMenu] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"add" | "rename" | "move" | null>(null);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("products");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const openDialog = (mode: "add" | "rename" | "move", node?: TreeNode) => {
    setSelected(node ?? null);
    setName(mode === "rename" && node ? node.name : "");
    setDialog(mode);
    setMenu(null);
  };

  const save = () => {
    if (dialog === "add") {
      const nextNode: TreeNode = { id: `section-${Date.now()}`, name: name.trim(), articles: 0 };
      setTree((current) =>
        replaceNode(current, parent, (node) => ({ ...node, children: [...(node.children ?? []), nextNode] })),
      );
      setExpanded((current) => new Set([...current, parent]));
      onNotice("Новый раздел добавлен в структуру.");
    }
    if (dialog === "rename" && selected) {
      setTree((current) => replaceNode(current, selected.id, (node) => ({ ...node, name: name.trim() })));
      onNotice("Название раздела изменено.");
    }
    if (dialog === "move" && selected) {
      onNotice(`Раздел «${selected.name}» перемещён в «${parent === "products" ? "Продукты" : "НАВИСА"}».`);
    }
    setDialog(null);
  };

  const remove = (node: TreeNode) => {
    setMenu(null);
    if (node.articles > 0 || node.children?.length) {
      onNotice("Нельзя удалить непустой раздел. Сначала переместите статьи и вложенные разделы.");
      return;
    }
    setTree((current) => removeNode(current, node.id));
    onNotice("Пустой раздел удалён.");
  };

  const renderNodes = (nodes: TreeNode[], level = 0) => (
    <div className={level ? "tree-branch" : "space-y-2"}>
      {nodes.map((node) => {
        const hasChildren = Boolean(node.children?.length);
        const open = expanded.has(node.id);
        return (
          <div
            className={`structure-node transition duration-200 ${draggedId === node.id ? "scale-[.99] opacity-45" : ""}`}
            draggable
            key={node.id}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={() => setDraggedId(node.id)}
            onDrop={() => {
              if (!draggedId || draggedId === node.id) return;
              setTree((current) => reorderSiblings(current, draggedId, node.id));
              setDraggedId(null);
              onNotice("Порядок разделов изменён.");
            }}
          >
            <div className="group flex min-w-0 items-center gap-2 rounded-xl border border-transparent bg-white px-2 py-2 transition hover:border-[var(--ms-border)] hover:shadow-sm sm:px-3">
              <GripVertical
                className="h-5 w-5 shrink-0 cursor-grab text-slate-300 transition group-hover:text-slate-500"
                aria-hidden="true"
              />
              {hasChildren ? (
                <button
                  aria-expanded={open}
                  aria-label={`${open ? "Свернуть" : "Развернуть"} раздел ${node.name}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                  onClick={() =>
                    setExpanded((current) => {
                      const next = new Set(current);
                      open ? next.delete(node.id) : next.add(node.id);
                      return next;
                    })
                  }
                  type="button"
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              ) : (
                <span className="h-8 w-8 shrink-0" />
              )}
              {open && hasChildren ? (
                <FolderOpen className="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
              ) : (
                <Folder className="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">{node.name}</span>
              <span className="hidden text-xs text-[var(--ms-muted)] sm:block">{node.articles} статей</span>
              <ActionMenu
                label={`Действия: ${node.name}`}
                onOpenChange={(open) => setMenu(open ? node.id : null)}
                open={menu === node.id}
              >
                <button
                  className="menu-action"
                  onClick={() => openDialog("rename", node)}
                  role="menuitem"
                  type="button"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Переименовать
                </button>
                <button
                  className="menu-action"
                  onClick={() => openDialog("move", node)}
                  role="menuitem"
                  type="button"
                >
                  <GripVertical className="h-4 w-4" aria-hidden="true" />
                  Переместить
                </button>
                <button
                  className="menu-action text-red-600"
                  onClick={() => remove(node)}
                  role="menuitem"
                  type="button"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Удалить
                </button>
              </ActionMenu>
            </div>
            {hasChildren ? (
              <div
                aria-hidden={!open}
                className="tree-children grid"
                data-open={open ? "true" : "false"}
                inert={!open || undefined}
              >
                <div className="min-h-0 overflow-hidden pl-5 pt-2 sm:pl-10">
                  {renderNodes(node.children!, level + 1)}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <PageHeading
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => openDialog("add")}>
            Добавить раздел
          </Button>
        }
        eyebrow="Администрирование БЗ"
        subtitle="Раскрывайте ветки, меняйте названия и управляйте вложенностью разделов."
        title="Структура базы знаний"
      />
      <div className="rounded-2xl border border-[var(--ms-border)] bg-slate-50 p-3 shadow-[var(--ms-card-shadow)] sm:p-5 lg:p-6">
        <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
          Перетащите строку за маркер, чтобы изменить порядок. На сенсорном экране используйте меню раздела.
        </div>
        {renderNodes(tree)}
      </div>

      <ResponsiveOverlay
        desktop="modal"
        label={
          dialog === "add"
            ? "Новый раздел"
            : dialog === "rename"
              ? "Переименовать раздел"
              : "Переместить раздел"
        }
        onClose={() => setDialog(null)}
        open={dialog !== null}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if ((dialog === "move" || name.trim()) && dialog) save();
          }}
        >
          {dialog !== "move" ? (
            <Field
              autoFocus
              label="Название раздела"
              onChange={(event) => setName(event.target.value)}
              placeholder="Например, Первые шаги"
              required
              value={name}
            />
          ) : (
            <p className="mb-4 text-sm leading-6 text-[var(--ms-muted)]">
              Выберите новый родительский раздел для «{selected?.name}».
            </p>
          )}
          {dialog === "add" || dialog === "move" ? (
            <SelectField
              className="mt-4"
              label="Родительский раздел"
              onChange={(event) => setParent(event.target.value)}
              value={parent}
            >
              <option value="products">Продукты</option>
              <option value="navisa">Продукты / НАВИСА</option>
            </SelectField>
          ) : null}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setDialog(null)} tone="ghost">
              Отмена
            </Button>
            <Button disabled={dialog !== "move" && !name.trim()} type="submit">
              {dialog === "add" ? "Создать" : "Сохранить"}
            </Button>
          </div>
        </form>
      </ResponsiveOverlay>
    </>
  );
};
