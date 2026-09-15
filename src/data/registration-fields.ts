import { companyFields } from "./platform-data";
import { prototypeStorageKeys, readPrototypeValue } from "./prototype-store";
export const excludedRegistrationFields = ["shortName", "domains", "primaryEmail", "phone", "type"];
export const getCompanyFields = () =>
  readPrototypeValue(prototypeStorageKeys.companyFields, companyFields).map((field) =>
    excludedRegistrationFields.includes(field.id) ? { ...field, registration: false } : field,
  );
