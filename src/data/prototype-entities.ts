import {
  articles,
  companies,
  users,
  type ArticleSummary,
  type CompanyRecord,
  type UserRecord,
} from "./platform-data";
import { prototypeStorageKeys, readPrototypeValue, writePrototypeValue } from "./prototype-store";

export type ArticleAccess = string[] | "all";

const scalarCompanyFieldReaders = {
  bitrix: (company: CompanyRecord) => company.bitrixUrl,
  contract: (company: CompanyRecord) => company.contract,
  contractDate: (company: CompanyRecord) => company.contractDate,
  inn: (company: CompanyRecord) => company.inn,
  kpp: (company: CompanyRecord) => company.kpp,
  legalAddress: (company: CompanyRecord) => company.legalAddress,
  name: (company: CompanyRecord) => company.name,
  phone: (company: CompanyRecord) => company.phone,
  primaryEmail: (company: CompanyRecord) => company.primaryEmail,
  project: (company: CompanyRecord) => company.project,
  shortName: (company: CompanyRecord) => company.shortName,
  status: (company: CompanyRecord) => company.status,
  statusUntil: (company: CompanyRecord) => company.statusUntil,
  type: (company: CompanyRecord) => company.type,
} as const;

const normalizeCompanyValue = (value: string) => value.trim().toLocaleLowerCase("ru");

export const getCompanyUniquenessConflicts = (
  candidate: CompanyRecord,
  records: CompanyRecord[],
  fieldIds: string[],
  excludeCompanyId?: string,
) =>
  fieldIds.filter((fieldId) => {
    const otherCompanies = records.filter((company) => company.id !== excludeCompanyId);
    if (fieldId === "domains") {
      const candidateDomains = candidate.domains.map(normalizeCompanyValue).filter(Boolean);
      return otherCompanies.some((company) =>
        company.domains.some((domain) => candidateDomains.includes(normalizeCompanyValue(domain))),
      );
    }
    if (!(fieldId in scalarCompanyFieldReaders))
      throw new Error(`PLAT_COMPANY_FIELD_CONFIG_UNSUPPORTED: поле ${fieldId} не поддержано`);
    const readValue = scalarCompanyFieldReaders[fieldId as keyof typeof scalarCompanyFieldReaders];
    const candidateValue = normalizeCompanyValue(readValue(candidate));
    return (
      Boolean(candidateValue) &&
      otherCompanies.some(
        (company) => normalizeCompanyValue(readValue(company)) === candidateValue,
      )
    );
  });

export const getPrototypeCompanies = () =>
  readPrototypeValue<CompanyRecord[]>(prototypeStorageKeys.companies, companies);

export const writePrototypeCompanies = (records: CompanyRecord[]) =>
  writePrototypeValue(prototypeStorageKeys.companies, records);

export const getPrototypeUsers = () =>
  readPrototypeValue<UserRecord[]>(prototypeStorageKeys.users, users);

export const writePrototypeUsers = (records: UserRecord[]) =>
  writePrototypeValue(prototypeStorageKeys.users, records);

export const renameCompanyRelationships = (previousName: string, nextName: string) => {
  if (previousName === nextName) return;
  writePrototypeUsers(
    getPrototypeUsers().map((user) =>
      user.company === previousName ? { ...user, company: nextName } : user,
    ),
  );
};

export const changeCompanyUserCount = (companyName: string, delta: number) => {
  const records = getPrototypeCompanies();
  if (!records.some((company) => company.name === companyName)) return;
  writePrototypeCompanies(
    records.map((company) =>
      company.name === companyName
        ? { ...company, users: Math.max(0, company.users + delta) }
        : company,
    ),
  );
};

export const moveCompanyUserCount = (previousName: string, nextName: string) => {
  if (previousName === nextName) return;
  changeCompanyUserCount(previousName, -1);
  changeCompanyUserCount(nextName, 1);
};

export const getArticleAccess = (article: ArticleSummary): ArticleAccess =>
  readPrototypeValue<Record<string, ArticleAccess>>(prototypeStorageKeys.articleAccess, {})[
    article.id
  ] ?? article.allowedCompanyTypes;

export const writeArticleAccess = (article: ArticleSummary, articleAccess: ArticleAccess) => {
  const access = readPrototypeValue<Record<string, ArticleAccess>>(
    prototypeStorageKeys.articleAccess,
    {},
  );
  writePrototypeValue(prototypeStorageKeys.articleAccess, {
    ...access,
    [article.id]: articleAccess,
  });
};

export const getArticleTags = (article: ArticleSummary) =>
  readPrototypeValue<Record<string, string[]>>(prototypeStorageKeys.articleTags, {})[article.id] ??
  article.tags;

export const getArticleSections = (article: ArticleSummary) =>
  Array.from(
    new Set(
      (
        readPrototypeValue<Record<string, string[]>>(prototypeStorageKeys.articleSections, {})[
          article.id
        ] ?? [article.section]
      ).map((section) =>
        section.includes(" / ") ? section : `${article.section.split(" / ")[0]} / ${section}`,
      ),
    ),
  );

export const writeArticleSettings = (
  article: ArticleSummary,
  settings: {
    access: ArticleAccess;
    published: boolean;
    sections: string[];
    tags: string[];
  },
) => {
  const access = readPrototypeValue<Record<string, ArticleAccess>>(
    prototypeStorageKeys.articleAccess,
    {},
  );
  const publication = readPrototypeValue<Record<string, boolean>>(
    prototypeStorageKeys.articlePublication,
    {},
  );
  const sections = readPrototypeValue<Record<string, string[]>>(
    prototypeStorageKeys.articleSections,
    {},
  );
  const tags = readPrototypeValue<Record<string, string[]>>(prototypeStorageKeys.articleTags, {});
  writePrototypeValue(prototypeStorageKeys.articleAccess, {
    ...access,
    [article.id]: settings.access,
  });
  writePrototypeValue(prototypeStorageKeys.articlePublication, {
    ...publication,
    [article.id]: settings.published,
  });
  writePrototypeValue(prototypeStorageKeys.articleSections, {
    ...sections,
    [article.id]: settings.sections,
  });
  writePrototypeValue(prototypeStorageKeys.articleTags, {
    ...tags,
    [article.id]: settings.tags,
  });
};

export const renameTagAcrossArticles = (previousName: string, nextName: string) => {
  const tagOverrides = readPrototypeValue<Record<string, string[]>>(
    prototypeStorageKeys.articleTags,
    {},
  );
  const nextOverrides = Object.fromEntries(
    articles.map((article) => [
      article.id,
      (tagOverrides[article.id] ?? article.tags).map((tag) =>
        tag === previousName ? nextName : tag,
      ),
    ]),
  );
  writePrototypeValue(prototypeStorageKeys.articleTags, nextOverrides);
};

export const removeTagAcrossArticles = (tagName: string) => {
  const tagOverrides = readPrototypeValue<Record<string, string[]>>(
    prototypeStorageKeys.articleTags,
    {},
  );
  const nextOverrides = Object.fromEntries(
    articles.map((article) => [
      article.id,
      (tagOverrides[article.id] ?? article.tags).filter((tag) => tag !== tagName),
    ]),
  );
  writePrototypeValue(prototypeStorageKeys.articleTags, nextOverrides);
};

export const countTagReferences = (tagName: string) =>
  articles.filter((article) => getArticleTags(article).includes(tagName)).length;

export const renameCompanyTypeRelationships = (previousName: string, nextName: string) => {
  writePrototypeCompanies(
    getPrototypeCompanies().map((company) =>
      company.type === previousName ? { ...company, type: nextName } : company,
    ),
  );
  const accessOverrides = readPrototypeValue<Record<string, ArticleAccess>>(
    prototypeStorageKeys.articleAccess,
    {},
  );
  const nextAccess = Object.fromEntries(
    articles.map((article) => {
      const access = accessOverrides[article.id] ?? article.allowedCompanyTypes;
      return [
        article.id,
        access === "all"
          ? access
          : access.map((companyType) =>
              companyType === previousName ? nextName : companyType,
            ),
      ];
    }),
  );
  writePrototypeValue(prototypeStorageKeys.articleAccess, nextAccess);
};

export const countCompanyTypeReferences = (typeName: string) => ({
  articles: articles.filter((article) => {
    const access = getArticleAccess(article);
    return access !== "all" && access.includes(typeName);
  }).length,
  companies: getPrototypeCompanies().filter((company) => company.type === typeName).length,
});
