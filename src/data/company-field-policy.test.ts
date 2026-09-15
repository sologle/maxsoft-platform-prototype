import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { companies, companyFields } from "./platform-data";
import { getCompanyFields } from "./registration-fields";
import { prototypeStorageKeys } from "./prototype-store";
import {
  canEditCompanyField,
  companyFieldVisible,
  validateCompanyFieldUniqueness,
} from "./company-field-policy";
import { saveCompanyFromForm } from "./company-save";

afterEach(() => vi.restoreAllMocks());

describe("поля компании и сохранение по роли", () => {
  beforeEach(() => localStorage.clear());
  it("мигрирует прежнее manager без сброса значений, проект и тип только для чтения", () => {
    localStorage.setItem(
      prototypeStorageKeys.companyFields,
      JSON.stringify(companyFields.map((f) => ({ ...f, manager: true }))),
    );
    const fields = getCompanyFields();
    for (const id of ["project", "type"]) {
      const field = fields.find((f) => f.id === id)!;
      expect(companyFieldVisible(field, "manager", "editing")).toBe(true);
      expect(canEditCompanyField(field, "manager", "editing")).toBe(false);
    }
    expect(
      canEditCompanyField(
        fields.find((f) => f.id === "phone")!,
        "manager",
        "editing",
      ),
    ).toBe(true);
  });
  it("игнорирует подмену проекта, типа и поля только для чтения при сохранении менеджером", () => {
    localStorage.setItem(
      prototypeStorageKeys.companyFields,
      JSON.stringify(
        companyFields.map((f) => ({
          ...f,
          manager: true,
          managerEditable: f.id !== "phone",
        })),
      ),
    );
    const form = new FormData();
    for (const f of companyFields)
      form.set(
        f.id,
        String(
          companies[0][
            f.id === "bitrix"
              ? "bitrixUrl"
              : (f.id as keyof (typeof companies)[0])
          ],
        ),
      );
    form.set("project", "Подмена");
    form.set("type", "Подмена");
    form.set("phone", "Подмена");
    form.set("contract", "Новый договор");
    const saved = saveCompanyFromForm({
      companyId: companies[0].id,
      form,
      domains: companies[0].domains,
      role: "manager",
    });
    expect(saved).toMatchObject({
      project: companies[0].project,
      type: companies[0].type,
      phone: companies[0].phone,
      contract: "Новый договор",
    });
    expect(
      JSON.parse(localStorage.getItem(prototypeStorageKeys.companies)!)[0],
    ).toEqual(saved);
  });
  it("защищает создание проекта менеджером и сохраняет создание компании с базовым типом", () => {
    const form = new FormData();
    for (const f of companyFields) form.set(f.id, "");
    form.set("name", "Новая компания");
    form.set("shortName", "Новая");
    form.set("inn", "1234567890");
    form.set("status", "Активна");
    form.set("project", "Подмена");
    form.set("type", "ВИП-клиент");
    const saved = saveCompanyFromForm({
      form,
      domains: ["new.example.ru"],
      role: "manager",
    });
    expect(saved.project).toBe("");
    expect(saved.type).toBe("Базовый");
  });
  it("инженер сохраняет проект и назначает тип компании", () => {
    const form = new FormData();
    for (const f of companyFields)
      form.set(
        f.id,
        String(
          companies[0][
            f.id === "bitrix"
              ? "bitrixUrl"
              : (f.id as keyof (typeof companies)[0])
          ],
        ),
      );
    form.set("project", "Проект инженера");
    form.set("type", "ВИП-клиент");
    expect(
      saveCompanyFromForm({
        companyId: companies[0].id,
        form,
        domains: companies[0].domains,
        role: "support-engineer",
      }),
    ).toMatchObject({ project: "Проект инженера", type: "ВИП-клиент" });
  });
  it("клиент не сохраняет компанию прямым вызовом", () => {
    expect(() =>
      saveCompanyFromForm({
        form: new FormData(),
        domains: [],
        role: "client-admin",
      }),
    ).toThrow("ACC_COMPANY_FORBIDDEN");
    expect(localStorage.getItem(prototypeStorageKeys.companies)).toBeNull();
  });
  it("проверяет реальные дубли любого уникального поля, не выдумывает конфликт телефона", () => {
    const fields = getCompanyFields().map((f) => ({
      ...f,
      unique: f.id === "phone",
    }));
    expect(validateCompanyFieldUniqueness(fields, companies)).toEqual([]);
    expect(
      validateCompanyFieldUniqueness(fields, [
        companies[0],
        { ...companies[1], phone: companies[0].phone },
      ]),
    ).toEqual(["phone"]);
  });
  it("невидимое и недоступное для операции поле не редактируется", () => {
    const field = getCompanyFields().find((f) => f.id === "contract")!;
    expect(
      canEditCompanyField(
        { ...field, manager: false, managerEditable: true },
        "manager",
        "creation",
      ),
    ).toBe(false);
    expect(
      canEditCompanyField(
        { ...field, editing: false },
        "portal-admin",
        "editing",
      ),
    ).toBe(false);
  });
});

it("отсутствующее обязательное описание поля не маскируется пустым значением", () => {
  localStorage.setItem(
    prototypeStorageKeys.companyFields,
    JSON.stringify(companyFields.filter((f) => f.id !== "project")),
  );
  expect(() => getCompanyFields()).toThrow("PLAT_COMPANY_FIELD_CONFIG_INVALID");
  localStorage.clear();
});

it("ошибка записи не оставляет изменённую компанию и потерянные связи пользователей", () => {
  localStorage.clear();
  const form = new FormData();
  for (const f of companyFields)
    form.set(
      f.id,
      String(
        companies[0][
          f.id === "bitrix"
            ? "bitrixUrl"
            : (f.id as keyof (typeof companies)[0])
        ],
      ),
    );
  form.set("name", "Новое имя компании");
  const originalSet = Storage.prototype.setItem;
  let fail = true;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
    this: Storage,
    key,
    value,
  ) {
    if (key === prototypeStorageKeys.users && fail) {
      fail = false;
      throw new Error("storage full");
    }
    originalSet.call(this, key, value);
  });
  expect(() =>
    saveCompanyFromForm({
      companyId: companies[0].id,
      form,
      domains: companies[0].domains,
      role: "portal-admin",
    }),
  ).toThrow("APP_SAVE_FAILED");
  for (const key of [
    prototypeStorageKeys.companies,
    prototypeStorageKeys.users,
    prototypeStorageKeys.audit,
  ])
    expect(localStorage.getItem(key)).toBeNull();
});

it("новая компания получает показанный активный статус, когда менеджер не может его менять", () => {
  localStorage.clear();
  localStorage.setItem(
    prototypeStorageKeys.companyFields,
    JSON.stringify(
      companyFields.map((f) => ({ ...f, managerEditable: f.id !== "status" })),
    ),
  );
  const form = new FormData();
  for (const field of companyFields) form.set(field.id, "");
  form.set("name", "Проверка статуса");
  form.set("shortName", "Статус");
  form.set("inn", "1234567890");
  expect(
    saveCompanyFromForm({
      form,
      domains: ["status.example.ru"],
      role: "manager",
    }).status,
  ).toBe("Активна");
});

it("создание требует имя для связи пользователей, запрет изменения действует после создания", () => {
  localStorage.clear();
  localStorage.setItem(
    prototypeStorageKeys.companyFields,
    JSON.stringify(
      companyFields.map((f) => ({ ...f, managerEditable: f.id !== "name" })),
    ),
  );
  const form = new FormData();
  for (const field of companyFields) form.set(field.id, "");
  form.set("name", "Компания с защищённым именем");
  form.set("shortName", "Имя");
  form.set("inn", "1234567890");
  form.set("status", "Активна");
  const record = saveCompanyFromForm({
    form,
    domains: ["name.example.ru"],
    role: "manager",
  });
  expect(record.name).toBe("Компания с защищённым именем");
  form.set("name", "Подмена");
  expect(
    saveCompanyFromForm({
      companyId: record.id,
      form,
      domains: record.domains,
      role: "manager",
    }).name,
  ).toBe(record.name);
});

it("ошибка домена остаётся у его исходной строки после пустой дополнительной строки", () => {
  localStorage.clear();
  const form = new FormData();
  for (const f of companyFields)
    form.set(
      f.id,
      String(
        companies[0][
          f.id === "bitrix"
            ? "bitrixUrl"
            : (f.id as keyof (typeof companies)[0])
        ],
      ),
    );
  try {
    saveCompanyFromForm({
      companyId: companies[0].id,
      form,
      domains: ["valid.example.ru", "", "bad_domain"],
      role: "portal-admin",
    });
    expect.fail("Ошибка домена обязательна");
  } catch (error) {
    expect(error).toHaveProperty("fields.domain-2");
    expect(error).not.toHaveProperty("fields.domain-1");
  }
});
