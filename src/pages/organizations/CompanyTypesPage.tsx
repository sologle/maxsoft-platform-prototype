import { goBack } from "../../components/BackButton";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { Navigate, UserRole } from "../../app/types";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Button, Field, PageHeading } from "../../components/ui";
import {
  articles,
  companyTypes as initialCompanyTypes,
  type AuditEvent,
} from "../../data/platform-data";
import {
  countCompanyTypeReferences,
  getPrototypeCompanies,
  renameCompanyTypeRelationships,
  getArticleAccess,
} from "../../data/prototype-entities";
import {
  writePrototypeBatch,
  appendPrototypeValue,
  prototypeStorageKeys,
  readPrototypeValue,
  writePrototypeValue,
} from "../../data/prototype-store";
import { TypeRemoval } from "./TypeRemoval";
import { planTypeRemoval } from "../../data/access-policy";
interface OrganizationProps {
  onNavigate: Navigate;
  onNotice: (message: string) => void;
  role: UserRole;
  resource?: string;
}
const instrumentalCount = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;
export const CompanyTypesPage = ({ onNavigate, onNotice }: OrganizationProps) => {
  const [types, setTypes] = useState(() =>
    readPrototypeValue(prototypeStorageKeys.companyTypes, initialCompanyTypes),
  );
  const [dialog, setDialog] = useState<"confirm-default" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<(typeof types)[number] | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState("");
  const [companyReplacement, setCompanyReplacement] = useState("");
  const [audienceReplacement, setAudienceReplacement] = useState("");
  useEffect(() => {
    writePrototypeValue(prototypeStorageKeys.companyTypes, types);
  }, [types]);
  const recordAudit = (action: string, object: string) =>
    appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
      action,
      category: "company",
      date: "Только что",
      object,
      page: "company-types",
      result: "Успешно",
      user: "Администратор портала",
    });
  const persistType = () => {
    if (!name.trim()) return;
    if (selected) {
      if (selected.name !== name.trim()) renameCompanyTypeRelationships(selected.name, name.trim());
      setTypes((current) =>
        current.map((type) => {
          if (type.name === selected.name)
            return {
              ...type,
              name: name.trim(),
              description: description.trim(),
              isDefault,
            };
          return isDefault ? { ...type, isDefault: false } : type;
        }),
      );
    } else {
      setTypes((current) => [
        ...current.map((type) => (isDefault ? { ...type, isDefault: false } : type)),
        {
          name: name.trim(),
          description: description.trim(),
          companies: 0,
          articles: 0,
          isDefault,
        },
      ]);
    }
    setDialog(null);
    recordAudit(selected ? "Изменил тип компании" : "Создал тип компании", name.trim());
    onNotice(
      isDefault
        ? "Тип компании сохранён и назначен базовым. Существующие компании не изменены."
        : "Тип компании сохранён.",
    );
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    const normalizedName = name.trim().toLocaleLowerCase("ru");
    const duplicate = types.some(
      (type) =>
        type.name !== selected?.name && type.name.toLocaleLowerCase("ru") === normalizedName,
    );
    if (duplicate) {
      setFormError(
        "Тип компании с таким названием уже существует. Код: ACC_COMPANY_TYPE_DUPLICATE.",
      );
      return;
    }
    setFormError("");
    if (isDefault && !selected?.isDefault) {
      setDialog("confirm-default");
      return;
    }
    persistType();
  };
  const removeType = () => {
    if (!selected) return;
    const references = countCompanyTypeReferences(selected.name);
    if (selected.isDefault || (references.companies > 0 && !companyReplacement)) return;
    const nextAccess = planTypeRemoval(
      Object.fromEntries(articles.map((article) => [article.id, getArticleAccess(article)])),
      selected.name,
      audienceReplacement || undefined,
    );
    const nextTypes = types.filter((type) => type.name !== selected.name);
    writePrototypeBatch({
      [prototypeStorageKeys.articleAccess]: nextAccess,
      [prototypeStorageKeys.companies]: getPrototypeCompanies().map((company) =>
        company.type === selected.name ? { ...company, type: companyReplacement } : company,
      ),
      [prototypeStorageKeys.companyTypes]: nextTypes,
    });
    setTypes(nextTypes);
    recordAudit("Удалил тип компании", selected.name);
    setDialog(null);
    onNotice("Тип удалён. Компании и аудитория статей обновлены.");
  };
  const selectedReferences = selected
    ? countCompanyTypeReferences(selected.name)
    : { articles: 0, companies: 0 };
  return (
    <>
      <PageHeading
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setSelected(null);
              setName("");
              setDescription("");
              setIsDefault(false);
              setFormError("");
              setDialog("edit");
            }}
          >
            Новый тип
          </Button>
        }
        onBack={() => goBack(onNavigate, "companies")}
        eyebrow="Компании"
        subtitle="Тип определяет доступ компании к статьям и функциям портала."
        title="Типы компаний"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {types.map((type) => {
          const references = countCompanyTypeReferences(type.name);
          return (
            <article
              className="rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)]"
              key={type.name}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-lg font-bold">{type.name}</h2>
                  {type.isDefault ? <Badge tone="green">Базовый тип</Badge> : null}
                  <p className="mt-1 text-xs text-[var(--ms-muted)]">
                    {references.companies} компаний · {references.articles} статей
                  </p>
                </div>
              </div>
              <p className="mt-4 min-h-12 text-sm leading-6 text-[var(--ms-muted)]">
                {type.description}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button
                  icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => {
                    setSelected(type);
                    setName(type.name);
                    setDescription(type.description);
                    setIsDefault(type.isDefault);
                    setFormError("");
                    setDialog("edit");
                  }}
                  tone="secondary"
                >
                  Изменить
                </Button>
                <Button
                  icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => {
                    setSelected(type);
                    setCompanyReplacement("");
                    setAudienceReplacement("");
                    setDialog("delete");
                  }}
                  tone="ghost"
                >
                  Удалить
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      <ResponsiveOverlay
        desktop="modal"
        label={
          dialog === "delete"
            ? "Удалить тип компании"
            : dialog === "confirm-default"
              ? "Назначить базовый тип"
              : selected
                ? "Изменить тип"
                : "Новый тип"
        }
        onClose={() => {
          setDialog(null);
          setFormError("");
        }}
        open={dialog !== null}
      >
        {dialog === "confirm-default" ? (
          <div>
            <p className="text-sm leading-6 text-[var(--ms-muted)]">
              Тип «{name.trim()}» станет базовым для всех новых компаний. Текущие компании и их
              права не изменятся.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setDialog("edit")} tone="ghost">
                Вернуться
              </Button>
              <Button onClick={persistType}>Назначить базовым</Button>
            </div>
          </div>
        ) : dialog === "delete" ? (
          selected ? (
            <TypeRemoval
              name={selected.name}
              isDefault={selected.isDefault}
              types={types.filter((type) => type.name !== selected.name).map((type) => type.name)}
              companies={selectedReferences.companies}
              lastAudience={articles
                .filter((article) => {
                  const access = getArticleAccess(article);
                  return access !== "all" && access.length === 1 && access.includes(selected.name);
                })
                .map((article) => article.title)}
              shared={
                articles.filter((article) => {
                  const access = getArticleAccess(article);
                  return access !== "all" && access.length > 1 && access.includes(selected.name);
                }).length
              }
              companyReplacement={companyReplacement}
              audienceReplacement={audienceReplacement}
              setCompanyReplacement={setCompanyReplacement}
              setAudienceReplacement={setAudienceReplacement}
              onCancel={() => setDialog(null)}
              onRemove={removeType}
            />
          ) : null
        ) : (
          <form onSubmit={save}>
            {selected ? (
              <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm leading-6 text-sky-900">
                Тип связан с{" "}
                {instrumentalCount(selectedReferences.companies, "компанией", "компаниями")} и{" "}
                {instrumentalCount(selectedReferences.articles, "статьёй", "статьями")}. Изменение
                названия увидят сотрудники MaxSoft; все связи и права сохранятся.
              </div>
            ) : null}
            <Field
              autoFocus
              error={formError}
              label="Название типа"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
            <Field
              className="mt-4"
              label="Описание"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Для каких компаний используется тип"
              value={description}
            />
            <label className="option-row mt-4">
              <input
                aria-label="Сделать базовым типом"
                checked={isDefault}
                disabled={selected?.isDefault}
                onChange={(event) => setIsDefault(event.target.checked)}
                type="checkbox"
              />
              <span>
                Сделать базовым типом
                <small className="mt-1 block font-normal text-[var(--ms-muted)]">
                  Он будет назначаться новым компаниям; существующие компании не изменятся.
                </small>
              </span>
            </label>
            <div className="mt-6 flex justify-end gap-2">
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
