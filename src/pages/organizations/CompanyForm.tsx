import { useState, type FormEvent } from "react";
import type { UserRole } from "../../app/types";
import { Button, Field, SelectField } from "../../components/ui";
import {
  companyFields as initialCompanyFields,
  companyTypes as initialCompanyTypes,
  type AuditEvent,
  type CompanyRecord,
} from "../../data/platform-data";
import {
  getCompanyUniquenessConflicts,
  getPrototypeCompanies,
} from "../../data/prototype-entities";
import {
  appendPrototypeValue,
  prototypeStorageKeys,
  readPrototypeValue,
} from "../../data/prototype-store";

interface CompanyFormProps {
  company?: CompanyRecord;
  onCancel: () => void;
  onSave: (record: CompanyRecord) => void;
  role: UserRole;
}

const COMPANY_DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export const CompanyForm = ({ company, onCancel, onSave, role }: CompanyFormProps) => {
  const editing = Boolean(company);
  const [inn, setInn] = useState(company?.inn ?? "");
  const [domains, setDomains] = useState(company?.domains.join(", ") ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const availableCompanyTypes = readPrototypeValue(
    prototypeStorageKeys.companyTypes,
    initialCompanyTypes,
  );
  const fieldConfiguration = readPrototypeValue(
    prototypeStorageKeys.companyFields,
    initialCompanyFields,
  );
  const operation = editing ? "editing" : "creation";
  const defaultCompanyType = availableCompanyTypes.find((type) => type.isDefault);
  if (!defaultCompanyType)
    throw new Error("ACC_DEFAULT_COMPANY_TYPE_MISSING: базовый тип компании не настроен");

  const fieldSetting = (id: string) => {
    const setting = fieldConfiguration.find((field) => field.id === id);
    if (!setting)
      throw new Error(`PLAT_COMPANY_FIELD_CONFIG_MISSING: настройка поля ${id} отсутствует`);
    return setting;
  };
  const showField = (id: string) => {
    const setting = fieldSetting(id);
    return setting.visible && setting[operation] && (role !== "manager" || setting.manager);
  };
  const isRequired = (id: string) => fieldSetting(id).required;
  const isUnique = (id: string) => fieldSetting(id).unique;
  const getFormValue = (form: FormData, id: string, existingValue = "") => {
    if (!showField(id)) return existingValue;
    const value = form.get(id);
    if (typeof value !== "string")
      throw new Error(`ACC_COMPANY_FIELD_MISSING: поле ${id} отсутствует в форме`);
    return value.trim();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextErrors: Record<string, string> = {};
    const records = getPrototypeCompanies();
    const normalizedDomains = domains
      .split(",")
      .map((domain) => domain.trim().toLocaleLowerCase("ru"))
      .filter(Boolean);
    if (normalizedDomains.some((domain) => !COMPANY_DOMAIN_PATTERN.test(domain)))
      nextErrors.domains =
        "Введите домен без протокола и пути, например company.ru. Код: ACC_DOMAIN_INVALID.";
    const record: CompanyRecord = {
      id: company?.id ?? `company-${Date.now()}`,
      name: getFormValue(form, "name", company?.name),
      shortName: getFormValue(form, "shortName", company?.shortName),
      inn,
      kpp: getFormValue(form, "kpp", company?.kpp),
      legalAddress: getFormValue(form, "legalAddress", company?.legalAddress),
      primaryEmail: getFormValue(form, "primaryEmail", company?.primaryEmail),
      phone: getFormValue(form, "phone", company?.phone),
      type:
        role === "manager"
          ? company?.type ?? defaultCompanyType.name
          : getFormValue(form, "type", company?.type),
      status: getFormValue(form, "status", company?.status) as CompanyRecord["status"],
      statusUntil: getFormValue(form, "statusUntil", company?.statusUntil),
      contract: getFormValue(form, "contract", company?.contract),
      contractDate: getFormValue(form, "contractDate", company?.contractDate),
      project: getFormValue(form, "project", company?.project),
      bitrixUrl: getFormValue(form, "bitrix", company?.bitrixUrl),
      domains: normalizedDomains,
      users: company?.users ?? 0,
    };
    const uniqueFieldIds = fieldConfiguration
      .filter((field) => field.unique && showField(field.id))
      .map((field) => field.id);
    for (const id of getCompanyUniquenessConflicts(record, records, uniqueFieldIds, company?.id)) {
      nextErrors[id] =
        id === "domains"
          ? "Домен уже связан с другой компанией. Код: ACC_DOMAIN_CONFLICT."
          : id === "inn"
            ? "Компания с таким ИНН уже существует. Код: ACC_INN_CONFLICT."
            : `${fieldSetting(id).label} уже используется другой компанией. Код: ACC_COMPANY_FIELD_CONFLICT.`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
      action: editing ? "Изменил карточку компании" : "Создал компанию",
      category: "company",
      date: "Только что",
      object: record.name,
      page: editing ? "company" : "companies",
      resource: record.id,
      result: "Успешно",
      user: "Сотрудник MaxSoft",
    });
    onSave(record);
  };

  return (
    <form onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        {showField("name") ? (
          <Field
            className="sm:col-span-2"
            defaultValue={company?.name ?? ""}
            error={errors.name}
            label="Полное наименование"
            name="name"
            required={isRequired("name")}
          />
        ) : null}
        {showField("shortName") ? (
          <Field
            defaultValue={company?.shortName ?? ""}
            error={errors.shortName}
            label="Сокращённое наименование"
            name="shortName"
            required={isRequired("shortName")}
          />
        ) : null}
        {showField("inn") ? (
          <Field
            error={errors.inn}
            inputMode="numeric"
            label="ИНН"
            name="inn"
            onChange={(event) => setInn(event.target.value)}
            required={isRequired("inn")}
            value={inn}
          />
        ) : null}
        {showField("kpp") ? (
          <Field defaultValue={company?.kpp ?? ""} error={errors.kpp} inputMode="numeric" label="КПП" name="kpp" required={isRequired("kpp")} />
        ) : null}
        {showField("legalAddress") ? (
          <Field className="sm:col-span-2" defaultValue={company?.legalAddress ?? ""} error={errors.legalAddress} label="Юридический адрес" name="legalAddress" required={isRequired("legalAddress")} />
        ) : null}
        {showField("primaryEmail") ? (
          <Field defaultValue={company?.primaryEmail ?? ""} error={errors.primaryEmail} label="Основной email" name="primaryEmail" required={isRequired("primaryEmail")} type="email" />
        ) : null}
        {showField("phone") ? (
          <Field defaultValue={company?.phone ?? ""} error={errors.phone} label="Телефон" name="phone" required={isRequired("phone")} type="tel" />
        ) : null}
        {role === "manager" ? (
          <div className="rounded-xl border border-[var(--ms-border)] bg-slate-50 p-3 text-sm leading-6 text-[var(--ms-muted)] sm:col-span-2">
            <strong className="block text-[var(--ms-text)]">
              Тип компании: {editing ? company?.type : defaultCompanyType.name}
            </strong>
            Менеджер не может менять это поле. Новой компании назначается базовый тип.
          </div>
        ) : showField("type") ? (
          <SelectField defaultValue={company?.type ?? defaultCompanyType.name} error={errors.type} label="Тип компании" name="type" required={isRequired("type")}>
            {availableCompanyTypes.map((type) => <option key={type.name}>{type.name}</option>)}
          </SelectField>
        ) : null}
        {showField("status") ? (
          <SelectField defaultValue={company?.status ?? "Активна"} error={errors.status} label="Статус" name="status" required={isRequired("status")}>
            <option>Активна</option>
            <option>Приостановлена</option>
          </SelectField>
        ) : null}
        {showField("statusUntil") ? <Field defaultValue={company?.statusUntil ?? ""} error={errors.statusUntil} label="Срок действия статуса" name="statusUntil" required={isRequired("statusUntil")} type="date" /> : null}
        {showField("contract") ? <Field defaultValue={company?.contract ?? ""} error={errors.contract} label="Договор / основание" name="contract" required={isRequired("contract")} /> : null}
        {showField("contractDate") ? <Field defaultValue={company?.contractDate ?? ""} error={errors.contractDate} label="Дата договора" name="contractDate" required={isRequired("contractDate")} type="date" /> : null}
        {showField("project") ? <Field defaultValue={company?.project ?? ""} error={errors.project} label="Проект" name="project" placeholder="Необязательное поле" required={isRequired("project")} /> : null}
        {showField("bitrix") ? <Field className="sm:col-span-2" defaultValue={company?.bitrixUrl ?? ""} error={errors.bitrix} label="Ссылка на Битрикс24" name="bitrix" placeholder="https://..." required={isRequired("bitrix")} type="url" /> : null}
        {showField("domains") ? (
          <Field
            aria-label="Рабочий домен"
            className="sm:col-span-2"
            error={errors.domains}
            label="Рабочие домены"
            name="domains"
            onChange={(event) => setDomains(event.target.value)}
            placeholder="company.ru, knowledge.company.ru"
            required={isRequired("domains")}
            value={domains}
          />
        ) : null}
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--ms-muted)]">
        Укажите несколько доменов через запятую. Каждый домен должен быть уникален для портала.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} tone="ghost">Отмена</Button>
        <Button type="submit">Сохранить компанию</Button>
      </div>
    </form>
  );
};
