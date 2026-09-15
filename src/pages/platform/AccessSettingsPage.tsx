import { useState } from "react";
import type { Navigate } from "../../app/types";
import { Badge, Button, PageHeading, SelectField, Switch } from "../../components/ui";
import { InfoHint } from "../../components/InfoHint";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import {
  articles,
  companyTypes as initialTypes,
  isArticlePublished,
} from "../../data/platform-data";
import {
  getArticleAccess,
  getArticleSections,
  getPrototypeCompanies,
} from "../../data/prototype-entities";
import {
  prototypeStorageKeys,
  readPrototypeValue,
  writePrototypeValue,
} from "../../data/prototype-store";
import { planAccessChange, type AccessMap } from "../../data/access-policy";
import {
  flattenTree,
  getKnowledgeTree,
  sectionArticleIds,
  type TreeNode,
} from "../../data/knowledge-tree";
export const AccessSettingsPage = ({
  onNavigate,
  onNotice,
}: {
  onNavigate: Navigate;
  onNotice: (message: string) => void;
}) => {
  const companies = getPrototypeCompanies();
  const types = readPrototypeValue(prototypeStorageKeys.companyTypes, initialTypes);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const company = companies.find((item) => item.id === companyId);
  const [selectedType, setSelectedType] = useState(company?.type ?? "");
  const [access, setAccess] = useState<AccessMap>(() =>
    Object.fromEntries(articles.map((article) => [article.id, getArticleAccess(article)])),
  );
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<{
    ids: string[];
    enabled: boolean;
    label: string;
  } | null>(null);
  const [replacement, setReplacement] = useState("");
  const tree = getKnowledgeTree();
  const nodes = flattenTree(tree);
  const names = types.map((type) => type.name);
  const enabled = (id: string) => access[id] === "all" || access[id].includes(selectedType);
  const affected = pending ? [...new Set(pending.ids)] : [];
  const conflicts =
    pending && !pending.enabled
      ? affected.filter((id) => {
          const value = access[id];
          const explicit = value === "all" ? names : value;
          return explicit.length === 1 && explicit.includes(selectedType);
        })
      : [];
  const request = (ids: string[], value: boolean, label: string) => {
    setReplacement("");
    setPending({ ids: [...new Set(ids)], enabled: value, label });
  };
  const apply = () => {
    if (!pending) return;
    setAccess(
      planAccessChange(
        access,
        pending.ids,
        selectedType,
        pending.enabled,
        names,
        replacement || undefined,
      ),
    );
    setDirty(true);
    setPending(null);
  };
  const render = (items: TreeNode[]) =>
    items.map((node) => {
      const ids = sectionArticleIds(tree, node.id);
      const count = ids.filter(enabled).length;
      const path = nodes.find((item) => item.id === node.id)!.path;
      const direct = articles.filter((article) => getArticleSections(article).includes(path));
      return (
        <details
          key={node.id}
          open
          className="access-node rounded-xl border border-[var(--ms-border)] bg-white p-3"
        >
          <summary className="cursor-pointer text-sm font-bold break-words">
            {node.name}{" "}
            <span className="font-normal text-[var(--ms-muted)]">
              ·{" "}
              {ids.length
                ? count === 0
                  ? "Всё запрещено"
                  : count === ids.length
                    ? "Всё разрешено"
                    : "Разрешена часть"
                : "Нет статей"}
            </span>
          </summary>
          <div className="my-3 flex flex-wrap gap-2">
            <Button
              disabled={!ids.length || !selectedType}
              tone="secondary"
              onClick={() => request(ids, true, node.name)}
            >
              Открыть раздел
            </Button>
            <Button
              disabled={!ids.length || !selectedType}
              tone="ghost"
              onClick={() => request(ids, false, node.name)}
            >
              Закрыть раздел
            </Button>
          </div>
          <div className="space-y-2">
            {direct.map((article) => (
              <div
                className="flex min-w-0 items-center gap-3 rounded-lg bg-slate-50 p-3"
                key={article.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold break-words">{article.title}</p>
                  <p className="text-xs text-[var(--ms-muted)]">
                    {isArticlePublished(article) ? "Опубликована" : "Черновик — закрыт клиентам"}
                  </p>
                </div>
                <Switch
                  checked={enabled(article.id)}
                  label={`Доступ: ${article.title}`}
                  disabled={!selectedType}
                  onChange={() => request([article.id], !enabled(article.id), article.title)}
                />
              </div>
            ))}
            {node.children ? render(node.children) : null}
          </div>
        </details>
      );
    });
  return (
    <>
      <PageHeading
        title="Доступ к материалам"
        eyebrow="Администрирование"
        subtitle="Права существующих статей по типу компании. Новые статьи по умолчанию доступны всем типам."
        onBack={() => onNavigate("administration")}
        actions={
          <Button
            disabled={!dirty}
            onClick={() => {
              writePrototypeValue(prototypeStorageKeys.articleAccess, access);
              setDirty(false);
              onNotice(`Доступ для типа «${selectedType}» сохранён.`);
            }}
          >
            Сохранить изменения
          </Button>
        }
      />
      <section className="mb-5 rounded-xl border border-[var(--ms-border)] bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Компания для проверки"
            value={companyId}
            disabled={dirty}
            onChange={(event) => {
              const value = companies.find((item) => item.id === event.target.value)!;
              setCompanyId(value.id);
              setSelectedType(value.type);
            }}
          >
            {companies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Тип компании"
            value={selectedType}
            disabled={dirty}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            <option value="" disabled>
              Выберите тип
            </option>
            {types.map((type) => (
              <option key={type.name}>{type.name}</option>
            ))}
          </SelectField>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Badge>{selectedType}</Badge>
          <InfoHint
            label="Права по типу"
            text="Изменения затронут все компании выбранного типа. Одна статья может находиться в нескольких разделах; её права общие для всех мест."
          />
          <InfoHint
            label="Смешанное состояние раздела"
            text="Разрешена часть: права статей внутри раздела различаются. Кнопки раздела массово меняют только существующие статьи, без наследования будущих материалов."
          />
        </div>
        <p className="mt-3 text-sm text-[var(--ms-muted)]">
          Черновики закрыты клиентам. Общий файл доступен через любую разрешённую опубликованную
          статью. {dirty ? "Сохраните изменения или отмените перед сменой типа." : ""}
        </p>
        {dirty ? (
          <Button
            tone="ghost"
            onClick={() => {
              setAccess(
                Object.fromEntries(
                  articles.map((article) => [article.id, getArticleAccess(article)]),
                ),
              );
              setDirty(false);
            }}
          >
            Отменить изменения
          </Button>
        ) : null}
      </section>
      <div className="space-y-3">{render(tree)}</div>
      <ResponsiveOverlay
        desktop="modal"
        label="Изменить доступ"
        open={Boolean(pending)}
        onClose={() => setPending(null)}
      >
        <p className="text-sm leading-6">
          {pending?.label}: {pending?.enabled ? "разрешить" : "запретить"} доступ. Уникальных
          статей: {affected.length}. Изменятся права всех компаний типа «{selectedType}», во всех
          разделах, где размещены эти статьи. Новые статьи не затрагиваются.
        </p>
        {conflicts.length ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold">Эти статьи потеряют последнюю аудиторию:</p>
            <ul className="my-3 list-disc pl-5 text-sm">
              {conflicts.map((id) => (
                <li key={id}>{articles.find((article) => article.id === id)!.title}</li>
              ))}
            </ul>
            <SelectField
              label="Другая аудитория"
              value={replacement}
              onChange={(event) => setReplacement(event.target.value)}
            >
              <option value="" disabled>
                Выберите тип
              </option>
              {types
                .filter((type) => type.name !== selectedType)
                .map((type) => (
                  <option key={type.name}>{type.name}</option>
                ))}
            </SelectField>
            <p className="mt-3 text-sm">
              Без выбора операция целиком не применяется. Публикация сохраняется.
            </p>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button tone="ghost" onClick={() => setPending(null)}>
            Отмена
          </Button>
          <Button disabled={conflicts.length > 0 && !replacement} onClick={apply}>
            Применить
          </Button>
        </div>
      </ResponsiveOverlay>
    </>
  );
};
