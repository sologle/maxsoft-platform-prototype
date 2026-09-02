import { ChevronDown, ChevronRight, Pencil, Plus, Tag, Tags, Trash2 } from "lucide-react";
import { useState } from "react";
import { ActionMenu } from "../../components/ActionMenu";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Button, Field, PageHeading, SelectField } from "../../components/ui";
import { tagGroups as initialGroups } from "../../data/platform-data";

interface TagGroup {
  id: string;
  name: string;
  tags: string[];
}

export const TagsPage = ({ onNotice }: { onNotice: (message: string) => void }) => {
  const [groups, setGroups] = useState<TagGroup[]>(initialGroups);
  const [expanded, setExpanded] = useState(() => new Set(initialGroups.map(({ id }) => id)));
  const [menu, setMenu] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"tag" | "group" | "rename" | "delete" | null>(null);
  const [selected, setSelected] = useState<{ groupId: string; tag?: string } | null>(null);
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState(initialGroups[0].id);

  const openTag = (group: TagGroup, tag?: string) => {
    setSelected({ groupId: group.id, tag });
    setGroupId(group.id);
    setName(tag ?? "");
    setDialog(tag ? "rename" : "tag");
    setMenu(null);
  };

  const save = () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    if (dialog === "group") {
      setGroups((current) => [...current, { id: `group-${Date.now()}`, name: cleanName, tags: [] }]);
      onNotice("Группа тегов создана.");
    }
    if (dialog === "tag") {
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId ? { ...group, tags: [...group.tags, cleanName] } : group,
        ),
      );
      setExpanded((current) => new Set([...current, groupId]));
      onNotice("Тег создан.");
    }
    if (dialog === "rename" && selected?.tag) {
      setGroups((current) =>
        current.map((group) =>
          group.id === selected.groupId
            ? { ...group, tags: group.tags.map((tag) => (tag === selected.tag ? cleanName : tag)) }
            : group,
        ),
      );
      onNotice("Тег переименован.");
    }
    setDialog(null);
  };

  const remove = () => {
    if (!selected?.tag) return;
    setGroups((current) =>
      current.map((group) =>
        group.id === selected.groupId
          ? { ...group, tags: group.tags.filter((tag) => tag !== selected.tag) }
          : group,
      ),
    );
    setDialog(null);
    onNotice("Тег удалён. Статьи больше не используют его в фильтрах.");
  };

  return (
    <>
      <PageHeading
        actions={
          <>
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => {
                setName("");
                setDialog("group");
              }}
              tone="secondary"
            >
              Новая группа
            </Button>
            <Button
              icon={<Tag className="h-4 w-4" aria-hidden="true" />}
              onClick={() => {
                setName("");
                setDialog("tag");
              }}
            >
              Новый тег
            </Button>
          </>
        }
        eyebrow="Администрирование БЗ"
        subtitle="Объединяйте теги в группы и используйте их для навигации, поиска и прав доступа."
        title="Теги и группы"
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        {groups.map((group) => {
          const open = expanded.has(group.id);
          return (
            <section
              className="min-w-0 self-start overflow-visible rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)]"
              key={group.id}
            >
              <button
                aria-expanded={open}
                aria-label={`${open ? "Свернуть" : "Развернуть"} группу ${group.name}`}
                className="flex w-full min-w-0 items-center gap-3 p-4 text-left sm:p-5"
                onClick={() =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    open ? next.delete(group.id) : next.add(group.id);
                    return next;
                  })
                }
                type="button"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                  <Tags className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-heading text-lg font-bold">{group.name}</span>
                  <span className="mt-0.5 block text-xs text-[var(--ms-muted)]">
                    {group.tags.length} тегов
                  </span>
                </span>
                {open ? (
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                )}
              </button>
              <div
                aria-hidden={!open}
                className="tree-children grid"
                data-open={open ? "true" : "false"}
                inert={!open || undefined}
              >
                <div className="min-h-0 overflow-visible">
                  <div className="border-t border-[var(--ms-border)] p-3 sm:p-4">
                    {group.tags.length ? (
                      <div className="space-y-2">
                        {group.tags.map((tag) => (
                          <div
                            className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                            key={tag}
                          >
                            <Tag className="h-4 w-4 shrink-0 text-[var(--ms-primary)]" aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{tag}</span>
                            <span className="hidden text-xs text-[var(--ms-muted)] sm:inline">
                              {Math.max(2, tag.length - 2)} статей
                            </span>
                            <ActionMenu
                              label={`Действия: ${tag}`}
                              onOpenChange={(open) => setMenu(open ? `${group.id}:${tag}` : null)}
                              open={menu === `${group.id}:${tag}`}
                              panelClassName="w-48"
                            >
                              <button
                                className="menu-action"
                                onClick={() => openTag(group, tag)}
                                role="menuitem"
                                type="button"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                                Переименовать
                              </button>
                              <button
                                className="menu-action text-red-600"
                                onClick={() => {
                                  setSelected({ groupId: group.id, tag });
                                  setDialog("delete");
                                  setMenu(null);
                                }}
                                role="menuitem"
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                Удалить
                              </button>
                            </ActionMenu>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-2 py-4 text-center text-sm text-[var(--ms-muted)]">
                        В группе пока нет тегов.
                      </p>
                    )}
                    <button
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--ms-primary)] transition hover:bg-[var(--ms-primary-soft)]"
                      onClick={() => openTag(group)}
                      type="button"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Добавить тег
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <ResponsiveOverlay
        desktop="modal"
        label={
          dialog === "group"
            ? "Новая группа"
            : dialog === "rename"
              ? "Переименовать тег"
              : dialog === "delete"
                ? "Удалить тег"
                : "Новый тег"
        }
        onClose={() => setDialog(null)}
        open={dialog !== null}
      >
        {dialog === "delete" ? (
          <div>
            <p className="text-sm leading-6 text-[var(--ms-muted)]">
              Тег «{selected?.tag}» используется в нескольких статьях. После удаления он исчезнет из фильтров,
              сами статьи сохранятся.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setDialog(null)} tone="ghost">
                Отмена
              </Button>
              <Button onClick={remove} tone="danger">
                Удалить тег
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <Field
              autoFocus
              label={dialog === "group" ? "Название группы" : "Название тега"}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
            {dialog === "tag" ? (
              <SelectField
                className="mt-4"
                label="Группа"
                onChange={(event) => setGroupId(event.target.value)}
                value={groupId}
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </SelectField>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setDialog(null)} tone="ghost">
                Отмена
              </Button>
              <Button disabled={!name.trim()} type="submit">
                Сохранить
              </Button>
            </div>
          </form>
        )}
      </ResponsiveOverlay>
    </>
  );
};
