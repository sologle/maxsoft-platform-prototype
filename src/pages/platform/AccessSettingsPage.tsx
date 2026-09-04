import { ArrowRight, Building2, FileText, ShieldCheck, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { Navigate } from "../../app/types";
import { Badge, Button, PageHeading, SelectField, Switch } from "../../components/ui";
import { articles, companyTypes as initialCompanyTypes, type AuditEvent } from "../../data/platform-data";
import {
  getArticleAccess,
  getPrototypeCompanies,
  writeArticleAccess,
  type ArticleAccess,
} from "../../data/prototype-entities";
import {
  appendPrototypeValue,
  prototypeStorageKeys,
  readPrototypeValue,
} from "../../data/prototype-store";

interface AccessSettingsPageProps {
  onNavigate: Navigate;
  onNotice: (message: string) => void;
}

export const AccessSettingsPage = ({ onNavigate, onNotice }: AccessSettingsPageProps) => {
  const companies = getPrototypeCompanies();
  if (!companies.length)
    throw new Error("ACC_COMPANIES_MISSING: для настройки доступа не найдены компании");
  const companyTypes = readPrototypeValue(prototypeStorageKeys.companyTypes, initialCompanyTypes);
  const [companyId, setCompanyId] = useState(companies[0].id);
  const [accessByArticle, setAccessByArticle] = useState<Record<string, ArticleAccess>>(() =>
    Object.fromEntries(articles.map((article) => [article.id, getArticleAccess(article)])),
  );
  const [dirty, setDirty] = useState(false);
  const company = companies.find((candidate) => candidate.id === companyId);
  if (!company)
    throw new Error(`ACC_COMPANY_MISSING: компания ${companyId} не найдена`);
  const availableTypeNames = companyTypes.map((type) => type.name);
  const visibleCount = useMemo(
    () => articles.filter((article) => {
      const access = accessByArticle[article.id];
      return access === "all" || access.includes(company.type);
    }).length,
    [accessByArticle, company.type],
  );

  const toggleArticle = (articleId: string) => {
    setAccessByArticle((current) => {
      const access = current[articleId];
      if (!access)
        throw new Error(`ACC_ARTICLE_ACCESS_MISSING: права статьи ${articleId} не найдены`);
      const explicitAccess = access === "all" ? [...availableTypeNames] : [...access];
      const nextAccess = explicitAccess.includes(company.type)
        ? explicitAccess.filter((type) => type !== company.type)
        : [...explicitAccess, company.type];
      return {
        ...current,
        [articleId]: nextAccess.length === availableTypeNames.length ? "all" : nextAccess,
      };
    });
    setDirty(true);
  };

  const save = () => {
    articles.forEach((article) => writeArticleAccess(article, accessByArticle[article.id]));
    appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
      action: "Изменил доступ к материалам",
      category: "access",
      date: "Только что",
      object: company.type,
      page: "access-settings",
      result: "Успешно",
      user: "Администратор портала",
    });
    setDirty(false);
    onNotice(`Доступ для типа «${company.type}» сохранён.`);
  };

  return (
    <>
      <PageHeading
        actions={<Button disabled={!dirty} onClick={save}>Сохранить изменения</Button>}
        backLabel="Вернуться в администрирование"
        eyebrow="Администрирование"
        onBack={() => onNavigate("administration")}
        subtitle="Пользователь получает доступ своей компании, а компания — по назначенному ей типу."
        title="Доступ к материалам"
      />
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {[
          [Building2, "1. Компания", "Выберите организацию для проверки"],
          [UsersRound, "2. Тип компании", "Одинаковые права для компаний одного типа"],
          [ShieldCheck, "3. Материалы", "Включите доступ к нужным статьям и файлам"],
        ].map(([Icon, title, text]) => {
          const StepIcon = Icon as typeof Building2;
          return <div className="rounded-xl border border-[var(--ms-border)] bg-white p-4" key={String(title)}><StepIcon className="h-5 w-5 text-[var(--ms-primary)]" aria-hidden="true" /><h2 className="mt-3 text-sm font-bold">{String(title)}</h2><p className="mt-1 text-xs leading-5 text-[var(--ms-muted)]">{String(text)}</p></div>;
        })}
      </div>
      <section className="mb-5 rounded-2xl border border-[var(--ms-border)] bg-white p-4 sm:p-5">
        <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,.55fr)_auto]">
          <SelectField label="Компания для проверки" onChange={(event) => setCompanyId(event.target.value)} value={companyId}>
            {companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </SelectField>
          <div><p className="mb-1.5 text-sm font-semibold">Тип компании</p><div className="flex h-12 items-center rounded-xl border border-[var(--ms-border)] bg-slate-50 px-3.5"><Badge>{company.type}</Badge></div></div>
          <Button icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />} onClick={() => onNavigate("company", company.id)} tone="secondary">Карточка компании</Button>
        </div>
        <p className="mt-4 text-sm text-[var(--ms-muted)]">Разрешено статей: <strong className="text-[var(--ms-text)]">{visibleCount} из {articles.length}</strong>. Изменения затронут все компании типа «{company.type}» и их пользователей. Неопубликованные статьи скрыты от клиентов; файлы наследуют права связанных статей.</p>
      </section>
      <div className="overflow-hidden rounded-2xl border border-[var(--ms-border)] bg-white">
        {articles.map((article) => {
          const access = accessByArticle[article.id];
          const enabled = access === "all" || access.includes(company.type);
          return <article className="flex min-w-0 items-center gap-3 border-b border-[var(--ms-border)] p-4 last:border-b-0" key={article.id}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><FileText className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold">{article.title}</h2><p className="mt-1 truncate text-xs text-[var(--ms-muted)]">{article.section} · {article.status}</p></div>
            <Switch checked={enabled} label={`Доступ: ${article.title}`} onChange={() => toggleArticle(article.id)} />
          </article>;
        })}
      </div>
    </>
  );
};
