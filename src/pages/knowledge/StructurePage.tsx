import { MotionMessage } from "../../components/MotionMessage";
import type { Navigate } from "../../app/types";
import { goBack } from "../../components/BackButton";
import {
  flattenTree,
  getKnowledgeTree,
  saveKnowledgeTree,
  sectionArticleIds,
  subtreeIds,
  type TreeNode,
} from "../../data/knowledge-tree";
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
import { moveSection, type DropPosition } from "./move-section";

const replaceNode = (
  nodes: TreeNode[],
  id: string,
  update: (node: TreeNode) => TreeNode,
): TreeNode[] =>
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

export const StructurePage = ({
  onNotice,
  onNavigate,
}: {
  onNotice: (message: string) => void;
  onNavigate: Navigate;
}) => {
  const [tree, updateTree] = useState(getKnowledgeTree);
  const setTree = (update: (current: TreeNode[]) => TreeNode[]) => {
    const next = update(tree);
    saveKnowledgeTree(next);
    updateTree(next);
  };
  const [formError, setFormError] = useState("");
  const [expanded, setExpanded] = useState(
    () => new Set(flattenTree(getKnowledgeTree()).map((node) => node.id)),
  );
  const [menu, setMenu] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"add" | "rename" | "move" | null>(null);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("products");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editingHierarchy, setEditingHierarchy] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: DropPosition } | null>(null);

  const drop = (targetId: string | "root", position: DropPosition = "inside", sourceId = draggedId) => {
    if (!sourceId) return;
    const next = moveSection(tree, sourceId, targetId, position);
    setDraggedId(null);
    setDropTarget(null);
    if (next === tree) return;
    try {
      saveKnowledgeTree(next);
      updateTree(next);
      if (position === "inside" && targetId !== "root")
        setExpanded((current) => new Set([...current, targetId]));
      onNotice("Структура разделов изменена.");
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("KB_SECTION_PATH_CONFLICT")) {
        onNotice("Раздел с таким названием уже есть в выбранном месте. Выберите другое место или переименуйте раздел. Код: KB_SECTION_PATH_CONFLICT.");
      } else {
        console.error("KB_STRUCTURE_SAVE_FAILED", { cause: error });
        onNotice("Не удалось сохранить структуру. Повторите действие. Код: KB_STRUCTURE_SAVE_FAILED.");
      }
    }
  };

  const openDialog = (mode: "add" | "rename" | "move", node?: TreeNode) => {
    setSelected(node ?? null);
    setParent(mode === "add" ? (node?.id ?? "root") : "root");
    setFormError("");
    setName(mode === "rename" && node ? node.name : "");
    setDialog(mode);
    setMenu(null);
  };

  const save = () => {
    const siblings =
      parent === "root"
        ? tree
        : (flattenTree(tree).find((node) => node.id === parent)?.children ?? []);
    const targetName = dialog === "move" ? selected?.name : name.trim();
    const peers = dialog === "rename" ? flattenTree(tree) : siblings;
    if (
      peers.some(
        (node) => node.id !== selected?.id && node.name.toLowerCase() === targetName?.toLowerCase(),
      )
    ) {
      setFormError("Раздел с таким названием уже существует. Код: KB_SECTION_DUPLICATE.");
      return;
    }
    if (dialog === "add") {
      const nextNode: TreeNode = { id: `section-${Date.now()}`, name: name.trim() };
      setTree((current) =>
        parent === "root"
          ? [...current, nextNode]
          : replaceNode(current, parent, (node) => ({
              ...node,
              children: [...(node.children ?? []), nextNode],
            })),
      );
      setExpanded((current) => new Set([...current, parent]));
      onNotice("Новый раздел добавлен в структуру.");
    }
    if (dialog === "rename" && selected) {
      setTree((current) =>
        replaceNode(current, selected.id, (node) => ({ ...node, name: name.trim() })),
      );
      onNotice("Название раздела изменено.");
    }
    if (dialog === "move" && selected) {
      if (subtreeIds(selected).includes(parent)) {
        setFormError("Нельзя переместить раздел внутрь самого себя. Код: KB_SECTION_CYCLE.");
        return;
      }
      setTree((current) => {
        const remaining = removeNode(current, selected.id);
        return parent === "root"
          ? [...remaining, selected]
          : replaceNode(remaining, parent, (node) => ({
              ...node,
              children: [...(node.children ?? []), selected],
            }));
      });
      setExpanded((current) => new Set([...current, parent]));
      onNotice(`Раздел «${selected.name}» перемещён.`);
    }
    setDialog(null);
  };

  const remove = (node: TreeNode) => {
    setMenu(null);
    if (sectionArticleIds(tree, node.id).length > 0 || node.children?.length) {
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
            key={node.id}
          >
            <div
              className={`group flex min-w-0 items-center gap-2 rounded-xl border bg-white px-2 py-2 transition hover:shadow-sm sm:px-3 ${dropTarget?.id === node.id ? "border-[var(--ms-primary)] bg-[var(--ms-primary-soft)]" : "border-transparent hover:border-[var(--ms-border)]"}`}
              onDragOver={editingHierarchy ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                const ratio = (event.clientY - event.currentTarget.getBoundingClientRect().top) / event.currentTarget.getBoundingClientRect().height;
                const position = ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "inside";
                setDropTarget({ id: node.id, position });
              } : undefined}
              onDrop={editingHierarchy ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                const ratio = (event.clientY - event.currentTarget.getBoundingClientRect().top) / event.currentTarget.getBoundingClientRect().height;
                drop(node.id, ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "inside", event.dataTransfer.getData("text/plain") || draggedId);
              } : undefined}
            >
              {editingHierarchy ? (
                <button
                  aria-label={`Перетащить раздел ${node.name}`}
                  className="grid h-8 w-6 shrink-0 cursor-grab place-items-center rounded text-slate-500 hover:bg-slate-100"
                  draggable
                  onDragEnd={() => { setDraggedId(null); setDropTarget(null); }}
                  onDragStart={(event) => {
                    event.stopPropagation();
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", node.id);
                    setDraggedId(node.id);
                  }}
                  type="button"
                >
                  <GripVertical className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : null}
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
              <span className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
                {node.name}
              </span>
              {editingHierarchy && dropTarget?.id === node.id ? (
                <span className="shrink-0 text-xs font-semibold text-[var(--ms-primary)]">
                  {dropTarget.position === "before" ? "Перед разделом" : dropTarget.position === "after" ? "После раздела" : "Внутрь раздела"}
                </span>
              ) : null}
              <span className="hidden text-xs text-[var(--ms-muted)] sm:block">
                {sectionArticleIds(tree, node.id).length} статей
              </span>
              <button
                className="icon-button shrink-0"
                type="button"
                aria-label={`Добавить подраздел: ${node.name}`}
                onClick={() => openDialog("add", node)}
              >
                <Plus className="h-4 w-4" />
              </button>
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
                <div className="min-h-0 overflow-hidden pl-2 pt-2 sm:pl-6">
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
        onBack={() => goBack(onNavigate, "administration")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button tone="secondary" onClick={() => {
              setEditingHierarchy((current) => !current);
              setDraggedId(null);
              setDropTarget(null);
            }}>
              {editingHierarchy ? "Завершить редактирование" : "Редактировать иерархию"}
            </Button>
            <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => openDialog("add")}>Добавить раздел</Button>
          </div>
        }
        eyebrow="Администрирование БЗ"
        subtitle="Раскрывайте ветки, меняйте названия и управляйте вложенностью разделов."
        title="Структура базы знаний"
      />
      <div className="rounded-2xl border border-[var(--ms-border)] bg-slate-50 p-3 shadow-[var(--ms-card-shadow)] sm:p-5 lg:p-6">
        <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
          {editingHierarchy
            ? "Перетащите раздел за маркер: к верхнему или нижнему краю строки для порядка, в центр для вложенности. В конец корня — в область под деревом. Для клавиатуры и сенсорного экрана используйте меню раздела."
            : "Чтобы изменить порядок и вложенность перетаскиванием, включите «Редактировать иерархию». Для клавиатуры и сенсорного экрана используйте меню раздела."}
        </div>
        {renderNodes(tree)}
        {editingHierarchy ? (
          <div
            className="mt-3 rounded-xl border border-dashed border-[var(--ms-border-strong)] p-3 text-center text-sm text-[var(--ms-muted)]"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); drop("root", "inside", event.dataTransfer.getData("text/plain") || draggedId); }}
          >
            Перетащите сюда, чтобы поместить в конец корня
          </div>
        ) : null}
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
            if ((dialog === "move" || name.trim()) && dialog) {
              try {
                save();
              } catch (error) {
                setFormError(
                  error instanceof Error
                    ? error.message
                    : "KB_STRUCTURE_SAVE_FAILED: Не удалось сохранить структуру. Повторите действие.",
                );
              }
            }
          }}
        >
          {dialog !== "move" ? (
            <Field
              data-autofocus
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
              <option value="root">Корень базы знаний</option>
              {flattenTree(tree)
                .filter(
                  (node) =>
                    dialog !== "move" || !selected || !subtreeIds(selected).includes(node.id),
                )
                .map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.path}
                  </option>
                ))}
            </SelectField>
          ) : null}
          <MotionMessage message={formError} className="block mt-4 text-sm text-red-600" role="alert" />
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
