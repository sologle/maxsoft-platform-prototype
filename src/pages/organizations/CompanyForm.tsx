import { DomainFields } from "./DomainFields";
import { InfoHint } from "../../components/InfoHint";
import { useState, type FormEvent } from "react";
import type { UserRole } from "../../app/types";
import { Button, Field, SelectField } from "../../components/ui";
import {
  companyTypes as initialCompanyTypes,
  type CompanyRecord,
} from "../../data/platform-data";
import {
  prototypeStorageKeys,
  readPrototypeValue,
} from "../../data/prototype-store";
import { getCompanyFields } from "../../data/registration-fields";
import {
  companyFieldVisible,
  canEditCompanyField,
  newCompanyStatus,
} from "../../data/company-field-policy";
import { CompanySaveError, saveCompanyFromForm } from "../../data/company-save";

interface CompanyFormProps {
  company?: CompanyRecord;
  onCancel: () => void;
  onSave: (record: CompanyRecord) => void;
  role: UserRole;
}

export const CompanyForm = ({
  company,
  onCancel,
  onSave,
  role,
}: CompanyFormProps) => {
  const editing = Boolean(company);
  const [inn, setInn] = useState(company?.inn ?? "");
  const [domains, setDomains] = useState<string[]>(
    company?.domains.length ? [...company.domains] : [""],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const availableCompanyTypes = readPrototypeValue(
    prototypeStorageKeys.companyTypes,
    initialCompanyTypes,
  );
  const fieldConfiguration = getCompanyFields();
  const operation = editing ? "editing" : "creation";
  const defaultCompanyType = availableCompanyTypes.find(
    (type) => type.isDefault,
  );
  if (!defaultCompanyType)
    throw new Error(
      "ACC_DEFAULT_COMPANY_TYPE_MISSING: базовый тип компании не настроен",
    );

  const fieldSetting = (id: string) => {
    const setting = fieldConfiguration.find((field) => field.id === id);
    if (!setting)
      throw new Error(
        `PLAT_COMPANY_FIELD_CONFIG_MISSING: настройка поля ${id} отсутствует`,
      );
    return setting;
  };
  const showField = (id: string) =>
    companyFieldVisible(fieldSetting(id), role, operation);
  const editable = (id: string) =>
    canEditCompanyField(fieldSetting(id), role, operation);
  const isRequired = (id: string) =>
    editable(id) && (id === "name" || fieldSetting(id).required);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const record = saveCompanyFromForm({
        companyId: company?.id,
        form: new FormData(event.currentTarget),
        domains,
        role,
      });
      setErrors({});
      onSave(record);
    } catch (error) {
      if (error instanceof CompanySaveError) setErrors(error.fields);
      else {
        console.error("ACC_COMPANY_SAVE_FAILED", {
          companyId: company?.id,
          role,
          error,
        });
        setErrors({
          form: "Не удалось сохранить компанию. Обновите страницу и повторите. Код: ACC_COMPANY_SAVE_FAILED.",
        });
      }
    }
  };

  return (
    <form
      onSubmit={submit}
      className="[&_input:disabled]:bg-slate-50 [&_input:disabled]:text-[var(--ms-muted)]"
    >
      {errors.form || errors.domains ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {errors.form || errors.domains}
        </p>
      ) : null}
      {role === "manager" ? (
        <p className="mb-4 text-sm leading-6 text-[var(--ms-muted)]">
          Проект и тип компании доступны только для чтения. Остальные поля — в
          пределах настроек администратора.
        </p>
      ) : null}
      {!editing ? (
        <p className="mb-4 text-sm leading-6 text-[var(--ms-muted)]">
          При создании наименование компании обязательно. Оно используется для
          привязки пользователей; ограничения изменения имени действуют после
          создания.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {showField("name") ? (
          <Field
            className="sm:col-span-2"
            defaultValue={company?.name ?? ""}
            error={errors.name}
            label="Полное наименование"
            name="name"
            disabled={!editable("name")}
            required={isRequired("name")}
          />
        ) : null}
        {showField("shortName") ? (
          <Field
            defaultValue={company?.shortName ?? ""}
            error={errors.shortName}
            label="Сокращённое наименование"
            name="shortName"
            disabled={!editable("shortName")}
            required={isRequired("shortName")}
          />
        ) : null}
        {showField("inn") ? (
          <Field
            error={errors.inn}
            inputMode="numeric"
            label="ИНН"
            name="inn"
            disabled={!editable("inn")}
            onChange={(event) => setInn(event.target.value)}
            required={isRequired("inn")}
            value={inn}
          />
        ) : null}
        {showField("kpp") ? (
          <Field
            defaultValue={company?.kpp ?? ""}
            error={errors.kpp}
            inputMode="numeric"
            label="КПП"
            name="kpp"
            disabled={!editable("kpp")}
            required={isRequired("kpp")}
          />
        ) : null}
        {showField("legalAddress") ? (
          <Field
            className="sm:col-span-2"
            defaultValue={company?.legalAddress ?? ""}
            error={errors.legalAddress}
            label="Юридический адрес"
            name="legalAddress"
            disabled={!editable("legalAddress")}
            required={isRequired("legalAddress")}
          />
        ) : null}
        {showField("primaryEmail") ? (
          <Field
            defaultValue={company?.primaryEmail ?? ""}
            error={errors.primaryEmail}
            label="Основной email"
            name="primaryEmail"
            disabled={!editable("primaryEmail")}
            required={isRequired("primaryEmail")}
            type="email"
          />
        ) : null}
        {showField("phone") ? (
          <Field
            defaultValue={company?.phone ?? ""}
            error={errors.phone}
            label="Телефон"
            name="phone"
            disabled={!editable("phone")}
            required={isRequired("phone")}
            type="tel"
          />
        ) : null}
        {showField("type") ? (
          <SelectField
            defaultValue={company?.type ?? defaultCompanyType.name}
            error={errors.type}
            label="Тип компании"
            name="type"
            disabled={!editable("type")}
            required={isRequired("type")}
          >
            {availableCompanyTypes.map((type) => (
              <option key={type.name}>{type.name}</option>
            ))}
          </SelectField>
        ) : null}
        {showField("status") ? (
          <SelectField
            defaultValue={company?.status ?? newCompanyStatus}
            error={errors.status}
            label="Статус"
            name="status"
            disabled={!editable("status")}
            required={isRequired("status")}
          >
            <option>Активна</option>
            <option>Приостановлена</option>
          </SelectField>
        ) : null}
        {showField("statusUntil") ? (
          <Field
            defaultValue={company?.statusUntil ?? ""}
            error={errors.statusUntil}
            label="Срок действия статуса"
            name="statusUntil"
            disabled={!editable("statusUntil")}
            required={isRequired("statusUntil")}
            type="date"
          />
        ) : null}
        {showField("contract") ? (
          <Field
            defaultValue={company?.contract ?? ""}
            error={errors.contract}
            label="Договор / основание"
            name="contract"
            disabled={!editable("contract")}
            required={isRequired("contract")}
          />
        ) : null}
        {showField("contractDate") ? (
          <Field
            defaultValue={company?.contractDate ?? ""}
            error={errors.contractDate}
            label="Дата договора"
            name="contractDate"
            disabled={!editable("contractDate")}
            required={isRequired("contractDate")}
            type="date"
          />
        ) : null}
        {showField("project") ? (
          <Field
            defaultValue={company?.project ?? ""}
            error={errors.project}
            label="Проект"
            name="project"
            disabled={!editable("project")}
            placeholder="Необязательное поле"
            required={isRequired("project")}
          />
        ) : null}
        {showField("bitrix") ? (
          <Field
            className="sm:col-span-2"
            defaultValue={company?.bitrixUrl ?? ""}
            error={errors.bitrix}
            label="Ссылка на Битрикс24"
            name="bitrix"
            disabled={!editable("bitrix")}
            placeholder="https://..."
            required={isRequired("bitrix")}
            type="url"
          />
        ) : null}
        {showField("domains") && !editable("domains") ? (
          <Field
            className="sm:col-span-2"
            label="Рабочие домены"
            value={domains.join(", ")}
            disabled
          />
        ) : showField("domains") ? (
          <DomainFields
            values={domains}
            errors={errors}
            required={isRequired("domains")}
            onChange={setDomains}
          />
        ) : null}
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--ms-muted)]">
        Каждый домен должен быть уникален для портала. Пустые дополнительные
        строки не сохраняются.
      </p>
      <div className="mt-3 flex items-center text-sm text-[var(--ms-muted)]">
        Срок статуса
        <InfoHint
          label="Срок статуса"
          text="Дата хранится в карточке. Правило автоматического изменения доступа после этой даты обсуждается с MaxSoft."
        />
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} tone="ghost">
          Отмена
        </Button>
        <Button type="submit">Сохранить компанию</Button>
      </div>
    </form>
  );
};
