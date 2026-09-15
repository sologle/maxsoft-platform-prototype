import type { UserRole } from "../app/types";
import { companyFields, type CompanyRecord } from "./platform-data";
import { getCompanyUniquenessConflicts } from "./prototype-entities";

export type CompanyField = (typeof companyFields)[number] & {
  managerEditable: boolean;
};
export const newCompanyStatus = "Активна";

export type CompanyOperation = "creation" | "editing";
export const managerProtectedFields = ["project", "type"];
export const excludedRegistrationFields = [
  "shortName",
  "domains",
  "primaryEmail",
  "phone",
  "type",
];

export const normalizeCompanyFields = (
  fields: ((typeof companyFields)[number] & { managerEditable?: boolean })[],
): CompanyField[] => {
  if (
    !Array.isArray(fields) ||
    companyFields.some(
      (expected) =>
        fields.filter((field) => field.id === expected.id).length !== 1,
    ) ||
    fields.length !== companyFields.length
  )
    throw new Error(
      "PLAT_COMPANY_FIELD_CONFIG_INVALID: Набор полей компании неполный. Обратитесь к администратору.",
    );
  for (const field of fields) {
    if (
      [
        "visible",
        "required",
        "unique",
        "manager",
        "registration",
        "creation",
        "editing",
      ].some((key) => typeof field[key as keyof typeof field] !== "boolean") ||
      (field.managerEditable !== undefined &&
        typeof field.managerEditable !== "boolean")
    )
      throw new Error(
        "PLAT_COMPANY_FIELD_CONFIG_INVALID: Настройки полей повреждены. Обратитесь к администратору.",
      );
  }
  return fields.map((field) => ({
    ...field,
    creation: field.id === "name" ? true : field.creation,
    required: field.id === "name" ? true : field.required,
    registration:
      !excludedRegistrationFields.includes(field.id) && field.registration,
    // Published profiles used manager for both reading and writing. Migrate only that flag.
    managerEditable:
      field.manager &&
      !managerProtectedFields.includes(field.id) &&
      (field.managerEditable === undefined
        ? field.manager
        : field.managerEditable),
  }));
};

export const companyFieldVisible = (
  field: CompanyField,
  role: UserRole,
  operation?: CompanyOperation,
) =>
  field.id === "name" && operation === "creation"
    ? ["portal-admin", "support-engineer", "manager"].includes(role)
    : field.visible &&
      (!operation || field[operation]) &&
      (role !== "manager" || field.manager);
export const canEditCompanyField = (
  field: CompanyField,
  role: UserRole,
  operation: CompanyOperation,
) =>
  ["portal-admin", "support-engineer", "manager"].includes(role) &&
  companyFieldVisible(field, role, operation) &&
  ((field.id === "name" && operation === "creation") ||
    role !== "manager" ||
    (field.managerEditable && !managerProtectedFields.includes(field.id)));

export const validateCompanyFieldUniqueness = (
  fields: CompanyField[],
  records: CompanyRecord[],
) => {
  const ids = fields.filter((field) => field.unique).map((field) => field.id);
  return [
    ...new Set(
      records.flatMap((record) =>
        getCompanyUniquenessConflicts(record, records, ids, record.id),
      ),
    ),
  ];
};
