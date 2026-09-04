export const prototypeStorageKeys = {
  audit: "maxsoft-prototype-audit",
  articleAccess: "maxsoft-prototype-article-access",
  articlePublication: "maxsoft-prototype-article-publication",
  articleSections: "maxsoft-prototype-article-sections",
  articleTags: "maxsoft-prototype-article-tags",
  companyFields: "maxsoft-prototype-company-fields",
  companies: "maxsoft-prototype-companies",
  companyTypes: "maxsoft-prototype-company-types",
  tags: "maxsoft-prototype-tags",
  users: "maxsoft-prototype-users",
} as const;

export const readPrototypeValue = <T,>(key: string, initialValue: T): T => {
  const stored = window.localStorage.getItem(key);
  return stored === null ? initialValue : (JSON.parse(stored) as T);
};

export const writePrototypeValue = <T,>(key: string, value: T) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const appendPrototypeValue = <T,>(key: string, value: T) => {
  const current = readPrototypeValue<T[]>(key, []);
  writePrototypeValue(key, [value, ...current]);
};
