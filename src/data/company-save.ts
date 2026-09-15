import type { UserRole } from "../app/types";
import {
  companyTypes,
  type CompanyRecord,
  type AuditEvent,
} from "./platform-data";
import { getCompanyFields } from "./registration-fields";
import { canEditCompanyField, newCompanyStatus } from "./company-field-policy";
import {
  getPrototypeCompanies,
  getPrototypeUsers,
  getCompanyUniquenessConflicts,
} from "./prototype-entities";
import {
  prototypeStorageKeys,
  readPrototypeValue,
  writePrototypeBatch,
} from "./prototype-store";
import { DOMAIN_PATTERN } from "./company-domain";

export class CompanySaveError extends Error {
  constructor(public readonly fields: Record<string, string>) {
    super(Object.values(fields).join(" "));
  }
}

export const saveCompanyFromForm = ({
  companyId,
  form,
  domains,
  role,
}: {
  companyId?: string;
  form: FormData;
  domains: string[];
  role: UserRole;
}): CompanyRecord => {
  if (!["portal-admin", "support-engineer", "manager"].includes(role))
    throw new Error(
      "ACC_COMPANY_FORBIDDEN: У вас нет права сохранять компании.",
    );
  const records = getPrototypeCompanies();
  const existing = companyId
    ? records.find((record) => record.id === companyId)
    : undefined;
  if (companyId && !existing)
    throw new Error(
      "ACC_COMPANY_NOT_FOUND: Компания не найдена. Обновите страницу.",
    );
  const types = readPrototypeValue(
    prototypeStorageKeys.companyTypes,
    companyTypes,
  );
  const defaultType = types.find((type) => type.isDefault);
  if (!defaultType)
    throw new Error(
      "ACC_DEFAULT_COMPANY_TYPE_MISSING: Базовый тип компании не настроен.",
    );
  const errors: Record<string, string> = {};
  const values: Record<string, string | string[]> = {};
  const settings = getCompanyFields();
  for (const field of settings) {
    const key = field.id === "bitrix" ? "bitrixUrl" : field.id;
    const previous = existing?.[key as keyof CompanyRecord];
    if (
      existing &&
      !(field.id === "domains"
        ? Array.isArray(previous)
        : typeof previous === "string")
    )
      throw new Error(
        "ACC_COMPANY_DATA_INVALID: Данные компании неполные. Обратитесь к администратору.",
      );
    if (!canEditCompanyField(field, role, existing ? "editing" : "creation")) {
      values[key] =
        typeof previous === "string" || Array.isArray(previous)
          ? previous
          : field.id === "type"
            ? defaultType.name
            : field.id === "status"
              ? newCompanyStatus
              : field.id === "domains"
                ? []
                : "";
      continue;
    }
    if (field.id === "domains") {
      const normalized = domains.map((value) => value.trim().toLowerCase());
      values[key] = normalized.filter(Boolean);
      if (field.required && !values[key].length)
        errors.domains =
          "Укажите рабочий домен. Код: ACC_COMPANY_FIELD_REQUIRED.";
      normalized.forEach((domain, index) => {
        if (!domain) return;
        if (!DOMAIN_PATTERN.test(domain))
          errors[`domain-${index}`] =
            "Введите домен без протокола и пути. Код: ACC_DOMAIN_INVALID.";
        else if (normalized.indexOf(domain) !== index)
          errors[`domain-${index}`] =
            "Этот домен уже добавлен. Код: ACC_DOMAIN_DUPLICATE.";
      });
      continue;
    }
    const raw = form.get(field.id);
    if (typeof raw !== "string")
      throw new Error(
        `ACC_COMPANY_FIELD_MISSING: Поле «${field.label}» отсутствует. Обновите форму.`,
      );
    values[key] = raw.trim();
    if ((field.required || field.id === "name") && !values[key])
      errors[field.id] =
        `Заполните поле «${field.label}». Код: ACC_COMPANY_FIELD_REQUIRED.`;
  }
  const record = {
    ...values,
    id: existing?.id ?? `company-${crypto.randomUUID()}`,
    users: existing?.users ?? 0,
  } as CompanyRecord;
  if (!types.some((type) => type.name === record.type))
    errors.type =
      "Выберите существующий тип компании. Код: ACC_COMPANY_TYPE_INVALID.";
  if (!["Активна", "Приостановлена"].includes(record.status))
    errors.status =
      "Выберите статус из списка. Код: ACC_COMPANY_STATUS_INVALID.";
  for (const id of getCompanyUniquenessConflicts(
    record,
    records,
    settings
      .filter(
        (f) =>
          f.unique &&
          canEditCompanyField(f, role, existing ? "editing" : "creation"),
      )
      .map((f) => f.id),
    existing?.id,
  )) {
    errors[id] =
      id === "domains"
        ? "Домен занят другой компанией. Код: ACC_DOMAIN_CONFLICT."
        : id === "inn"
          ? "Компания с таким ИНН уже существует. Код: ACC_INN_CONFLICT."
          : "Значение уже используется другой компанией. Код: ACC_COMPANY_FIELD_CONFLICT.";
  }
  if (Object.keys(errors).length) throw new CompanySaveError(errors);
  const audit = readPrototypeValue<AuditEvent[]>(
    prototypeStorageKeys.audit,
    [],
  );
  const updates: Record<string, unknown> = {
    [prototypeStorageKeys.companies]: existing
      ? records.map((r) => (r.id === existing.id ? record : r))
      : [...records, record],
    [prototypeStorageKeys.audit]: [
      {
        action: existing ? "Изменил карточку компании" : "Создал компанию",
        category: "company",
        date: "Только что",
        object: record.name,
        page: existing ? "company" : "companies",
        resource: record.id,
        result: "Успешно",
        user: "Сотрудник MaxSoft",
      },
      ...audit,
    ],
  };
  if (existing && existing.name !== record.name)
    updates[prototypeStorageKeys.users] = getPrototypeUsers().map((user) =>
      user.company === existing.name ? { ...user, company: record.name } : user,
    );
  writePrototypeBatch(updates);
  return record;
};
