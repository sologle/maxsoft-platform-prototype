import { companyFields } from "./platform-data";
import { normalizeCompanyFields } from "./company-field-policy";
import { prototypeStorageKeys, readPrototypeValue } from "./prototype-store";
export { excludedRegistrationFields } from "./company-field-policy";
export const getCompanyFields = () =>
  normalizeCompanyFields(
    readPrototypeValue(prototypeStorageKeys.companyFields, companyFields),
  );
