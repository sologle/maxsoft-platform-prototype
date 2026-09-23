import { MotionMessage } from "../../components/MotionMessage";
import { useState } from "react";
import type { Navigate } from "../../app/types";
import { goBack } from "../../components/BackButton";
import { Badge, Button, PageHeading, Switch } from "../../components/ui";
import { InfoHint } from "../../components/InfoHint";
import { getCompanyFields } from "../../data/registration-fields";
import {
  excludedRegistrationFields,
  managerProtectedFields,
  normalizeCompanyFields,
  validateCompanyFieldUniqueness,
  type CompanyField,
} from "../../data/company-field-policy";
import { getPrototypeCompanies } from "../../data/prototype-entities";
import {
  prototypeStorageKeys,
  readPrototypeValue,
  writePrototypeBatch,
} from "../../data/prototype-store";
import type { AuditEvent } from "../../data/platform-data";

type Setting = Exclude<keyof CompanyField, "id" | "label">;
const settingGroups: { title: string; description: string; columns: { key: Setting; label: string; hint: string }[] }[] = [
  { title: "Показ", description: "Где сотрудники и клиенты увидят поле", columns: [
  {
    key: "visible",
    label: "Показывать поле",
    hint: "Показывает значение в карточке и формах. Отключение снимает зависимые флаги, сохранённые значения остаются.",
  },
  {
    key: "registration",
    label: "При регистрации",
    hint: "Показывает поле компании при самостоятельной регистрации. Отчество пользователя необязательно, остальные показанные поля регистрации обязательны.",
  },
  {
    key: "creation",
    label: "При создании",
    hint: "Показывает поле в форме новой компании сотрудникам MaxSoft.",
  },
  {
    key: "editing",
    label: "При редактировании",
    hint: "Показывает поле в форме изменения компании.",
  },
  ] },
  { title: "Обязательность и проверка", description: "Что требуется заполнить и проверить перед сохранением", columns: [
  {
    key: "required",
    label: "Требовать заполнения",
    hint: "Требует значение в показанных редактируемых полях компании. Скрытые поля и поля только для чтения не блокируют форму.",
  },
  {
    key: "unique",
    label: "Проверять уникальность",
    hint: "Проверяет совпадения с другими компаниями. Пустое необязательное значение не считается совпадением.",
  },
  ] },
  { title: "Доступ менеджера", description: "Что менеджер может читать и изменять", columns: [
  {
    key: "manager",
    label: "Менеджер видит",
    hint: "Разрешает менеджеру видеть значение. Сам по себе этот флаг не разрешает изменение.",
  },
  {
    key: "managerEditable",
    label: "Менеджер изменяет",
    hint: "Разрешает заполнение и изменение показанного поля. Проект и тип компании защищены независимо от настроек.",
  },
  ] },
];
const columns = settingGroups.flatMap((group) => group.columns);
const disabledSetting = (field: CompanyField, key: Setting) =>
  (["creation", "required"].includes(key) && field.id === "name") ||
  (key === "registration" && excludedRegistrationFields.includes(field.id)) ||
  (key === "managerEditable" && managerProtectedFields.includes(field.id));

export const FieldsPage = ({
  onNavigate,
  onNotice,
}: {
  onNavigate: Navigate;
  onNotice: (message: string) => void;
}) => {
  const [fields, setFields] = useState(getCompanyFields);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const toggle = (id: string, key: Setting) => {
    setDirty(true);
    setError("");
    setFields((current) =>
      normalizeCompanyFields(
        current.map((field) => {
          if (field.id !== id || disabledSetting(field, key)) return field;
          const next = { ...field, [key]: !field[key] };
          if (key === "visible" && !next.visible)
            return {
              ...next,
              required: false,
              manager: false,
              managerEditable: false,
              registration: false,
              creation: false,
              editing: false,
            };
          if (
            next[key] &&
            [
              "required",
              "registration",
              "creation",
              "editing",
              "manager",
              "managerEditable",
            ].includes(key)
          )
            next.visible = true;
          if (key === "required" && next.required) {
            next.creation = true;
            next.editing = true;
          }
          if (key === "managerEditable" && next.managerEditable)
            next.manager = true;
          if (key === "manager" && !next.manager) next.managerEditable = false;
          if (!next.registration && !next.creation && !next.editing)
            next.required = false;
          return next;
        }),
      ),
    );
  };
  const save = () => {
    const conflicts = validateCompanyFieldUniqueness(
      fields,
      getPrototypeCompanies(),
    );
    if (conflicts.length) {
      setError(
        `Есть совпадающие значения полей: ${fields
          .filter((f) => conflicts.includes(f.id))
          .map((f) => f.label)
          .join(
            ", ",
          )}. Исправьте их или отключите проверку уникальности. Код: PLAT_FIELD_UNIQUENESS_CONFLICT.`,
      );
      return;
    }
    try {
      writePrototypeBatch({
        [prototypeStorageKeys.companyFields]: fields,
        [prototypeStorageKeys.audit]: [
          {
            action: "Обновил схему полей компании",
            category: "company",
            date: "Только что",
            object: "Поля компании",
            page: "fields",
            result: "Успешно",
            user: "Администратор портала",
          },
          ...readPrototypeValue<AuditEvent[]>(prototypeStorageKeys.audit, []),
        ],
      });
      setDirty(false);
      setError("");
      onNotice("Настройки полей сохранены после проверки локальных данных.");
    } catch (cause) {
      console.error("PLAT_FIELDS_SAVE_FAILED", { cause });
      setError(
        "Не удалось сохранить настройки. Освободите место в браузере и повторите. Код: PLAT_FIELDS_SAVE_FAILED.",
      );
    }
  };
  const control = (field: CompanyField, column: (typeof columns)[number]) => (
    <Switch
      checked={field[column.key]}
      disabled={disabledSetting(field, column.key)}
      label={`${column.label}: ${field.label}`}
      onChange={() => toggle(field.id, column.key)}
    />
  );
  return (
    <>
      <PageHeading
        eyebrow="Администрирование"
        title="Поля компании"
        subtitle="Показ полей, заполнение и доступ менеджера."
        onBack={() => goBack(onNavigate, "administration")}
      />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--ms-muted)]">Настройте показ, проверку и доступ для каждого поля.</p>
        <Badge tone={dirty ? "amber" : "green"}>
          {dirty ? "Есть несохранённые изменения" : "Настройки сохранены"}
        </Badge>
      </div>
      <details className="mb-4 rounded-xl border border-[var(--ms-border)] bg-white px-4 py-3 text-sm leading-6">
        <summary className="cursor-pointer font-semibold">Как работают настройки</summary>
        <div className="mt-3 space-y-2 text-[var(--ms-muted)]">
          <p>Закрашенный переключатель — включено, пустой — выключено, недоступный — правило нельзя изменить для этого поля.</p>
          <p>Менеджер может читать поле, если включено «Менеджер видит», и менять его только при включённом «Менеджер изменяет». Проект и тип компании менеджер не меняет.</p>
          <p>Скрытые поля и поля только для чтения не требуют ввода; сохранённые значения остаются. Наименование всегда обязательно при создании компании сотрудником MaxSoft.</p>
          <p>Тип, сокращённое имя, домены, общий email и телефон компании не входят в регистрацию. Контактный телефон при регистрации относится к человеку. Уникальность проверяется среди компаний в этом браузере.</p>
        </div>
      </details>
      <MotionMessage message={error}
          className="block mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
          role="alert"
         />
      <div className="hidden overflow-x-auto rounded-2xl border border-[var(--ms-border)] bg-white xl:block ms-table-scroll">
        <table className="w-full min-w-[1080px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--ms-border)] bg-slate-50">
              <th className="w-48 p-4" rowSpan={2} scope="col">Поле</th>
              {settingGroups.map((group) => (
                <th className="border-l border-[var(--ms-border)] px-3 py-2 text-center text-xs font-bold text-[var(--ms-primary)]" colSpan={group.columns.length} key={group.title} scope="colgroup" title={group.description}>{group.title}</th>
              ))}
            </tr>
            <tr className="border-b border-[var(--ms-border)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="p-3 text-center text-xs text-[var(--ms-muted)]"
                >
                  {column.label}
                  <InfoHint label={column.label} text={column.hint} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr
                key={field.id}
                className="border-b border-[var(--ms-border)] last:border-0"
              >
                <th
                  className="break-words p-4 font-semibold [overflow-wrap:anywhere]"
                  scope="row"
                >
                  {field.label}
                </th>
                {columns.map((column) => (
                  <td key={column.key} className="p-3 text-center">
                    <span className="inline-flex">
                      {control(field, column)}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid min-w-0 gap-4 xl:hidden">
        {fields.map((field) => (
          <article
            key={field.id}
            className="min-w-0 rounded-2xl border border-[var(--ms-border)] bg-white p-4"
          >
            <h2 className="break-words font-bold [overflow-wrap:anywhere]">
              {field.label}
            </h2>
            <div className="mt-4 space-y-4">
              {settingGroups.map((group) => <section key={group.title}>
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--ms-primary)]">{group.title}</h3>
                <p className="mb-2 text-xs text-[var(--ms-muted)]">{group.description}</p>
                <div className="grid gap-2 sm:grid-cols-2">{group.columns.map((column) => (
                <div
                  key={column.key}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                >
                  <span className="min-w-0 text-xs font-semibold text-[var(--ms-muted)]">
                    {column.label}
                    <InfoHint label={column.label} text={column.hint} />
                  </span>
                  {control(field, column)}
                </div>
              ))}</div>
              </section>)}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <Button className="scroll-my-24" disabled={!dirty} onClick={save}>
          Сохранить настройки
        </Button>
      </div>
    </>
  );
};
