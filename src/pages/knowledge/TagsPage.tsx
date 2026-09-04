import { ChevronDown, ChevronRight, Pencil, Plus, Tag, Tags, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionMenu } from "../../components/ActionMenu";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Button, Field, PageHeading, SelectField } from "../../components/ui";
import { tagGroups as initialGroups, type AuditEvent } from "../../data/platform-data";
import {
  countTagReferences,
  removeTagAcrossArticles,
  renameTagAcrossArticles,
} from "../../data/prototype-entities";
import { appendPrototypeValue, prototypeStorageKeys, readPrototypeValue, writePrototypeValue } from "../../data/prototype-store";

interface TagGroup {
  id: string;
  name: string;
  tags: Array<{ description: string; name: string; uses: number }>;
}

const initialUsage: Record<string, number> = {
  "НАВИСА": 42,
  "Model Studio CS": 18,
  CADLib: 9,
  Лицензирование: 14,
  Интеграция: 11,
  Обновление: 8,
  Проекты: 12,
  Администратор: 16,
  Проектировщик: 23,
};

const initialTagGroups: TagGroup[] = initialGroups.map((group) => ({
  ...group,
  tags: group.tags.map((name) => ({
    description: "Используется авторами для классификации материалов.",
    name,
    uses: initialUsage[name] ?? 0,
  })),
}));

const usageLabel = (count: number) => {
  const word = count % 10 === 1 && count % 100 !== 11 ? "статья" : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? "статьи" : "статей";
  return `${count} ${word}`;
};

export const TagsPage = ({ onNotice }: { onNotice: (message: string) => void }) => {
  const [groups, setGroups] = useState<TagGroup[]>(() =>
    readPrototypeValue(prototypeStorageKeys.tags, initialTagGroups),
  );
  const [expanded, setExpanded] = useState(() => new Set(initialGroups.map(({ id }) => id)));
  const [menu, setMenu] = useState<string | null>(null);
  const [dialog, setDialog] = useState<
    "tag" | "group" | "rename" | "delete" | "rename-group" | "delete-group" | null
  >(null);
  const [selected, setSelected] = useState<{ groupId: string; tag?: string } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState(initialGroups[0].id);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    writePrototypeValue(prototypeStorageKeys.tags, groups);
  }, [groups]);

  const recordAudit = (action: string, object: string, result: AuditEvent["result"] = "Успешно") =>
    appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
      action,
      category: "content",
      date: "Только что",
      object,
      page: "tags",
      result,
      user: "Администратор портала",
    });

  const openTag = (group: TagGroup, tag?: string) => {
    const currentTag = group.tags.find((item) => item.name === tag);
    setSelected({ groupId: group.id, tag });
    setGroupId(group.id);
    setName(tag ?? "");
    setDescription(currentTag?.description ?? "");
    setFormError("");
    setDialog(tag ? "rename" : "tag");
    setMenu(null);
  };

  const save = () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const duplicate = groups.some((group) =>
      group.tags.some(
        (tag) =>
          tag.name.toLocaleLowerCase("ru") === cleanName.toLocaleLowerCase("ru") &&
          tag.name !== selected?.tag,
      ),
    );
    if ((dialog === "tag" || dialog === "rename") && duplicate) {
      setFormError("Тег с таким названием уже существует. Код: KB_TAG_DUPLICATE.");
      return;
    }
    if (dialog === "group") {
      setGroups((current) => [...current, { id: `group-${Date.now()}`, name: cleanName, tags: [] }]);
      recordAudit("Создал группу тегов", cleanName);
      onNotice("Группа тегов создана.");
    }
    if (dialog === "tag") {
      setGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? { ...group, tags: [...group.tags, { description: description.trim(), name: cleanName, uses: 0 }] }
            : group,
        ),
      );
      setExpanded((current) => new Set([...current, groupId]));
      recordAudit("Создал тег", cleanName);
      onNotice("Тег создан.");
    }
    if (dialog === "rename" && selected?.tag) {
      const selectedItem = groups
        .find((group) => group.id === selected.groupId)
        ?.tags.find((tag) => tag.name === selected.tag);
      if (!selectedItem) return;
      setGroups((current) =>
        current.map((group) => {
          if (group.id === selected.groupId && group.id !== groupId)
            return { ...group, tags: group.tags.filter((tag) => tag.name !== selected.tag) };
          if (group.id === groupId && group.id !== selected.groupId)
            return {
              ...group,
              tags: [...group.tags, { ...selectedItem, description: description.trim(), name: cleanName }],
            };
          if (group.id === selected.groupId)
            return {
              ...group,
              tags: group.tags.map((tag) =>
                tag.name === selected.tag
                  ? { ...tag, description: description.trim(), name: cleanName }
                  : tag,
              ),
            };
          return group;
        }),
      );
      renameTagAcrossArticles(selected.tag, cleanName);
      recordAudit("Изменил тег", cleanName);
      onNotice("Тег сохранён.");
    }
    if (dialog === "rename-group" && selected) {
      setGroups((current) =>
        current.map((group) => (group.id === selected.groupId ? { ...group, name: cleanName } : group)),
      );
      recordAudit("Переименовал группу тегов", cleanName);
      onNotice("Группа тегов переименована.");
    }
    setFormError("");
    setDialog(null);
  };

  const remove = () => {
    if (!selected?.tag) return;
    setGroups((current) =>
      current.map((group) =>
        group.id === selected.groupId
          ? { ...group, tags: group.tags.filter((tag) => tag.name !== selected.tag) }
          : group,
      ),
    );
    removeTagAcrossArticles(selected.tag);
    setDialog(null);
    recordAudit("Удалил тег", selected.tag);
    onNotice("Тег удалён. Статьи больше не используют его в фильтрах.");
  };

  const removeGroup = () => {
    if (!selected) return;
    const group = groups.find((candidate) => candidate.id === selected.groupId);
    if (!group) return;
    if (group.tags.length) {
      recordAudit("Попытался удалить непустую группу тегов", group.name, "Отклонено");
      onNotice("Нельзя удалить непустую группу. Сначала перенесите или удалите теги.");
      setDialog(null);
      return;
    }
    setGroups((current) => current.filter((candidate) => candidate.id !== group.id));
    recordAudit("Удалил группу тегов", group.name);
    setDialog(null);
    onNotice("Пустая группа тегов удалена.");
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
                setFormError("");
                setDialog("group");
              }}
              tone="secondary"
            >
              Новая группа
            </Button>
            <Button
              icon={<Tag className="h-4 w-4" aria-hidden="true" />}
              onClick={() => {
                const firstGroup = groups[0];
                if (!firstGroup) {
                  onNotice("Сначала создайте группу тегов. Код: KB_TAG_GROUP_REQUIRED.");
                  return;
                }
                setSelected(null);
                setName("");
                setDescription("");
                setGroupId(firstGroup.id);
                setFormError("");
                setDialog("tag");
              }}
            >
              Новый тег
            </Button>
          </>
        }
        eyebrow="Администрирование БЗ"
        subtitle="Объединяйте теги в группы и используйте их для классификации, навигации и поиска. Теги не управляют доступом."
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
              <div className="flex min-w-0 items-center gap-1 p-2 pr-3 sm:p-3 sm:pr-4">
                <button
                  aria-expanded={open}
                  aria-label={`${open ? "Свернуть" : "Развернуть"} группу ${group.name}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left"
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
                <ActionMenu
                  label={`Действия группы: ${group.name}`}
                  onOpenChange={(open) => setMenu(open ? `group:${group.id}` : null)}
                  open={menu === `group:${group.id}`}
                  panelClassName="w-52"
                >
                  <button
                    className="menu-action"
                    onClick={() => {
                      setSelected({ groupId: group.id });
                      setName(group.name);
                      setDialog("rename-group");
                      setMenu(null);
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Переименовать группу
                  </button>
                  <button
                    className="menu-action text-red-600"
                    onClick={() => {
                      setSelected({ groupId: group.id });
                      setDialog("delete-group");
                      setMenu(null);
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Удалить группу
                  </button>
                </ActionMenu>
              </div>
              <div
                aria-hidden={!open}
                className="tree-children grid min-w-0 grid-cols-1"
                data-open={open ? "true" : "false"}
                inert={!open || undefined}
              >
                <div className="min-h-0 min-w-0 overflow-visible">
                  <div className="min-w-0 border-t border-[var(--ms-border)] p-3 sm:p-4">
                    {group.tags.length ? (
                      <div className="min-w-0 space-y-2">
                        {group.tags.map((tag) => (
                          <div
                            className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                            key={tag.name}
                          >
                            <Tag className="h-4 w-4 shrink-0 text-[var(--ms-primary)]" aria-hidden="true" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{tag.name}</span>
                              {tag.description ? (
                                <span className="mt-0.5 block truncate text-xs text-[var(--ms-muted)]">
                                  {tag.description}
                                </span>
                              ) : null}
                            </span>
                            <span className="hidden text-xs text-[var(--ms-muted)] sm:inline">
                              {usageLabel(countTagReferences(tag.name))}
                            </span>
                            <ActionMenu
                              label={`Действия: ${tag.name}`}
                              onOpenChange={(open) => setMenu(open ? `${group.id}:${tag.name}` : null)}
                              open={menu === `${group.id}:${tag.name}`}
                              panelClassName="w-48"
                            >
                              <button
                                className="menu-action"
                                onClick={() => openTag(group, tag.name)}
                                role="menuitem"
                                type="button"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                                Переименовать
                              </button>
                              <button
                                className="menu-action text-red-600"
                                onClick={() => {
                                  setSelected({ groupId: group.id, tag: tag.name });
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
            : dialog === "rename-group"
              ? "Переименовать группу"
              : dialog === "delete-group"
                ? "Удалить группу"
            : dialog === "rename"
              ? "Переименовать тег"
              : dialog === "delete"
                ? "Удалить тег"
                : "Новый тег"
        }
        onClose={() => {
          setDialog(null);
          setFormError("");
        }}
        open={dialog !== null}
      >
        {dialog === "delete" ? (
          <div>
            <p className="text-sm leading-6 text-[var(--ms-muted)]">
              Тег «{selected?.tag}» используется в{" "}
              {usageLabel(
                selected?.tag ? countTagReferences(selected.tag) : 0,
              )}.
              После удаления он исчезнет из фильтров, сами статьи сохранятся.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => { setDialog(null); setFormError(""); }} tone="ghost">
                Отмена
              </Button>
              <Button onClick={remove} tone="danger">
                Удалить тег
              </Button>
            </div>
          </div>
        ) : dialog === "delete-group" ? (
          <div>
            <p className="text-sm leading-6 text-[var(--ms-muted)]">
              {groups.find((group) => group.id === selected?.groupId)?.tags.length
                ? "В группе есть теги. Удаление запрещено: сначала перенесите или удалите все теги."
                : "Пустую группу можно удалить. Это действие будет записано в журнал."}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setDialog(null)} tone="ghost">Отмена</Button>
              <Button
                disabled={Boolean(groups.find((group) => group.id === selected?.groupId)?.tags.length)}
                onClick={removeGroup}
                tone="danger"
              >
                Удалить группу
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
              label={dialog === "group" || dialog === "rename-group" ? "Название группы" : "Название тега"}
              onChange={(event) => {
                setName(event.target.value);
                setFormError("");
              }}
              required
              value={name}
            />
            {dialog === "tag" || dialog === "rename" ? (
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
            {formError ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
                {formError}
              </p>
            ) : null}
            {dialog === "tag" || dialog === "rename" ? (
              <Field
                className="mt-4"
                label="Описание"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Для каких материалов использовать тег"
                value={description}
              />
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => { setDialog(null); setFormError(""); }} tone="ghost">
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
