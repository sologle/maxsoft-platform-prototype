import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { lazy, Suspense, useState, type FormEvent } from "react";
import type { AppPage, Authenticate, Navigate } from "../app/types";
import { ResponsiveOverlay } from "../components/ResponsiveOverlay";
import { WordmarkLanding } from "./auth/WordmarkLanding";
import { AuthStage } from "../components/AuthStage";
import { Button, Field } from "../components/ui";
import {
  companyFields as initialCompanyFields,
  companyTypes as initialCompanyTypes,
  type CompanyRecord,
  type UserRecord,
} from "../data/platform-data";
import {
  getCompanyUniquenessConflicts,
  getPrototypeCompanies,
  getPrototypeUsers,
  writePrototypeCompanies,
  writePrototypeUsers,
} from "../data/prototype-entities";
import { prototypeStorageKeys, readPrototypeValue } from "../data/prototype-store";

interface AuthPageProps {
  onAuthenticate: Authenticate;
  onNavigate: Navigate;
}

const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <AuthStage layout="form">{children}</AuthStage>
);

const ArchivedLanding = lazy(() => import("../components/auth-backgrounds/archive/Landing"));

export const LandingPage = ({ onNavigate }: AuthPageProps) => (
  <AuthStage layout="landing">
    {(variant) => variant === "wordmark" ? <WordmarkLanding onNavigate={onNavigate} /> : (
      <Suspense fallback={null}><ArchivedLanding onNavigate={onNavigate} /></Suspense>
    )}
  </AuthStage>
);

export const LoginPage = ({ onAuthenticate, onNavigate }: AuthPageProps) => {
  const [email, setEmail] = useState("o.gurov@integrator-pro.ru");
  const [password, setPassword] = useState("maxsoft-demo");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (email.trim() && password) onAuthenticate("client-employee");
  };
  return (
    <AuthLayout>
      <section className="mx-auto grid min-h-dvh max-w-[1100px] place-items-center px-4 py-16 sm:px-6">
        <div className="portal-auth-glass grid w-full overflow-hidden rounded-[28px] md:grid-cols-[.9fr_1.1fr]">
          <div className="portal-auth-glass-intro hidden p-10 md:flex md:flex-col md:justify-between">
            <div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ms-primary-soft)] font-heading text-lg font-black text-[var(--ms-primary)]">M</span>
              <h1 className="mt-6 font-heading text-3xl font-bold">С возвращением</h1>
              <p className="mt-3 leading-7 text-[var(--ms-muted)]">
                Войдите, чтобы продолжить работу с материалами вашей компании.
              </p>
            </div>
            <p className="text-xs text-[var(--ms-muted)]">Доступ защищён ролевой моделью и правами компании.</p>
          </div>
          <form className="p-5 sm:p-8 lg:p-12" onSubmit={submit}>
            <h1 className="font-heading text-3xl font-bold md:hidden">Вход</h1>
            <p className="mt-2 text-sm text-[var(--ms-muted)] md:hidden">Используйте корпоративную почту.</p>
            <Field
              className="mt-6 md:mt-0"
              error={submitted && !email.trim() ? "Введите корпоративную почту" : undefined}
              label="Электронная почта"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
            <div className="relative mt-4">
              <Field
                error={submitted && !password ? "Введите пароль" : undefined}
                label="Пароль"
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                className="absolute right-2 top-[34px] grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <button
              className="mt-3 text-sm font-semibold text-[var(--ms-primary)] hover:underline"
              onClick={() => onNavigate("recover")}
              type="button"
            >
              Не помню пароль
            </button>
            <Button className="mt-6 w-full" type="submit">
              Войти
            </Button>
            <p className="mt-6 text-center text-sm text-[var(--ms-muted)]">
              Нет аккаунта?{" "}
              <button
                className="font-semibold text-[var(--ms-primary)] hover:underline"
                onClick={() => onNavigate("register")}
                type="button"
              >
                Зарегистрироваться
              </button>
            </p>
            <button
              className="mx-auto mt-4 block text-xs text-slate-400 hover:text-[var(--ms-primary)]"
              onClick={() => onNavigate("landing")}
              type="button"
            >
              Вернуться на главную
            </button>
          </form>
        </div>
      </section>
    </AuthLayout>
  );
};

export const RegisterPage = ({ onAuthenticate, onNavigate }: AuthPageProps) => {
  const [email, setEmail] = useState("admin@severprom.ru");
  const [result, setResult] = useState<"existing" | "new" | "review" | null>(null);
  const [registeredCompanyId, setRegisteredCompanyId] = useState<string | null>(null);
  const registrationFields = readPrototypeValue(
    prototypeStorageKeys.companyFields,
    initialCompanyFields,
  ).filter((field) => field.visible && field.registration && field.id !== "type");
  const registrationDemoValues: Record<string, string> = {
    bitrix: "",
    contract: "",
    contractDate: "",
    domains: "severprom.ru",
    inn: "2463128457",
    kpp: "246301001",
    legalAddress: "г. Красноярск, ул. Проектная, 12",
    name: "ООО «СеверПромБИМ»",
    phone: "+7 (391) 212-45-80",
    primaryEmail: "info@severprom.ru",
    project: "Пилотник НАВИСА-2026",
    shortName: "СеверПромБИМ",
    status: "Активна",
    statusUntil: "2026-12-31",
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const emailDomain = email.trim().toLocaleLowerCase("ru").split("@")[1];
    if (!emailDomain)
      throw new Error("ACC_REGISTRATION_EMAIL_DOMAIN_MISSING: домен почты отсутствует");
    const formValue = (id: string) => {
      const value = form.get(`company-${id}`);
      return typeof value === "string" ? value.trim() : "";
    };
    const companies = getPrototypeCompanies();
    const inn = formValue("inn");
    const configuredDomains = formValue("domains")
      .split(",")
      .map((domain) => domain.trim().toLocaleLowerCase("ru"))
      .filter(Boolean);
    const registrationDomains = configuredDomains.length ? configuredDomains : [emailDomain];
    const domainCompany = companies.find((company) => company.domains.includes(emailDomain));
    const innCompany = inn ? companies.find((company) => company.inn === inn) : undefined;
    const workingDomainCompany = companies.find((company) =>
      company.domains.some((domain) => registrationDomains.includes(domain.toLocaleLowerCase("ru"))),
    );
    const companyTypes = readPrototypeValue(prototypeStorageKeys.companyTypes, initialCompanyTypes);
    const defaultCompanyType = companyTypes.find((type) => type.isDefault);
    if (!defaultCompanyType)
      throw new Error("ACC_DEFAULT_COMPANY_TYPE_MISSING: базовый тип компании не настроен");
    const companyId = `company-${Date.now()}`;
    const company: CompanyRecord = {
      id: companyId,
      name: formValue("name") || emailDomain,
      shortName: formValue("shortName") || emailDomain,
      inn,
      kpp: formValue("kpp"),
      legalAddress: formValue("legalAddress"),
      primaryEmail: formValue("primaryEmail") || email,
      phone: formValue("phone"),
      type: defaultCompanyType.name,
      status: "Активна",
      statusUntil: formValue("statusUntil"),
      contract: formValue("contract"),
      contractDate: formValue("contractDate"),
      project: formValue("project"),
      bitrixUrl: formValue("bitrix"),
      users: 1,
      domains: registrationDomains,
    };
    const uniqueRegistrationFields = registrationFields
      .filter((field) => field.unique)
      .map((field) => field.id);
    const uniquenessConflicts = getCompanyUniquenessConflicts(
      company,
      companies,
      uniqueRegistrationFields,
      domainCompany?.id,
    );
    const domainInnConflict = Boolean(domainCompany && inn && domainCompany.inn !== inn);
    if (
      email.includes("conflict") ||
      domainInnConflict ||
      (domainCompany && innCompany && domainCompany.id !== innCompany.id) ||
      (!domainCompany && (innCompany || workingDomainCompany)) ||
      uniquenessConflicts.length > 0
    ) {
      setRegisteredCompanyId(null);
      setResult("review");
      return;
    }
    if (domainCompany) {
      setRegisteredCompanyId(domainCompany.id);
      setResult("existing");
      return;
    }
    const firstName = form.get("firstName");
    const lastName = form.get("lastName");
    if (typeof firstName !== "string" || typeof lastName !== "string")
      throw new Error("ACC_REGISTRATION_USER_NAME_MISSING: имя пользователя отсутствует");
    const user: UserRecord = {
      id: `user-${Date.now()}`,
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      company: company.name,
      role: "Администратор клиента",
      position: "Не указана",
      status: "Активен",
      lastLogin: "Только что",
    };
    writePrototypeCompanies([...companies, company]);
    writePrototypeUsers([...getPrototypeUsers(), user]);
    setRegisteredCompanyId(companyId);
    setResult("new");
  };
  return (
    <AuthLayout>
      <section className="mx-auto max-w-[920px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="portal-auth-glass rounded-[28px] p-5 sm:p-8 lg:p-10">
          <div className="max-w-2xl">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-heading text-3xl font-bold sm:text-4xl">Регистрация в портале</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--ms-muted)] sm:text-base">
              Компания определится по корпоративному домену и ИНН. При конфликте заявка уйдёт на проверку.
            </p>
          </div>
          <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <Field label="Имя" defaultValue="Анна" name="firstName" required />
            <Field label="Фамилия" defaultValue="Смирнова" name="lastName" required />
            <Field
              className="sm:col-span-2"
              label="Корпоративная почта"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
            {registrationFields.map((field) => {
              const demoValue = registrationDemoValues[field.id];
              if (demoValue === undefined)
                throw new Error(
                  `PLAT_REGISTRATION_FIELD_UNSUPPORTED: поле ${field.id} не поддержано формой регистрации`,
                );
              return (
                <Field
                  className={
                    field.id === "legalAddress" || field.id === "domains"
                      ? "sm:col-span-2"
                      : undefined
                  }
                  defaultValue={demoValue}
                  inputMode={field.id === "inn" || field.id === "kpp" ? "numeric" : undefined}
                  key={field.id}
                  label={field.label}
                  name={`company-${field.id}`}
                  required={field.required}
                  type={
                    field.id === "primaryEmail"
                      ? "email"
                      : field.id === "phone"
                        ? "tel"
                        : field.id.includes("Date") || field.id === "statusUntil"
                          ? "date"
                          : "text"
                  }
                />
              );
            })}
            <Field label="Пароль" defaultValue="maxsoft-demo" required type="password" />
            <Field label="Повторите пароль" defaultValue="maxsoft-demo" required type="password" />
            <label className="option-row sm:col-span-2">
              <input defaultChecked required type="checkbox" />
              <span>Я согласен с правилами обработки данных</span>
            </label>
            <div className="mt-2 flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-between">
              <Button onClick={() => onNavigate("login")} tone="ghost">
                Уже есть аккаунт
              </Button>
              <Button type="submit">Создать аккаунт</Button>
            </div>
          </form>
        </div>
      </section>
      <ResponsiveOverlay
        desktop="modal"
        label={result === "review" ? "Заявка отправлена на проверку" : "Регистрация завершена"}
        onClose={() => setResult(null)}
        open={Boolean(result)}
      >
        <div className="text-center">
          <span
            className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${result === "review" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}
          >
            {result === "review" ? (
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            )}
          </span>
          <h3 className="mt-4 font-heading text-xl font-bold">
            {result === "existing"
              ? "Компания найдена"
              : result === "new"
                ? "Компания создана"
                : "Нужна ручная проверка"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ms-muted)]">
            {result === "existing"
              ? "Аккаунт привязан к ООО «СеверПромБИМ»."
              : result === "new"
                ? "Создана компания с базовым доступом к порталу."
                : "Мы сверим домен и ИНН. После подтверждения на почту придёт ссылка для входа."}
          </p>
          {result === "review" ? (
            <Button className="mt-6 w-full" onClick={() => onNavigate("login")} tone="secondary">
              Вернуться ко входу
            </Button>
          ) : (
            <Button
              className="mt-6 w-full"
              onClick={() => {
                if (!registeredCompanyId)
                  throw new Error("ACC_REGISTERED_COMPANY_MISSING: компания регистрации не задана");
                onAuthenticate("client-admin", registeredCompanyId);
              }}
            >
              Перейти в портал
            </Button>
          )}
        </div>
      </ResponsiveOverlay>
    </AuthLayout>
  );
};

export const RecoverPage = ({ onNavigate }: AuthPageProps) => {
  const [step, setStep] = useState<"email" | "password" | "done">("email");
  return (
    <AuthLayout>
      <section className="mx-auto grid min-h-[calc(100dvh-64px)] max-w-xl place-items-center px-4 py-10 sm:px-6">
        <div className="portal-auth-glass w-full rounded-[28px] p-5 text-center sm:p-8">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
            {step === "done" ? (
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            ) : step === "password" ? (
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Mail className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold">
            {step === "email"
              ? "Восстановление доступа"
              : step === "password"
                ? "Новый пароль"
                : "Пароль изменён"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--ms-muted)]">
            {step === "email"
              ? "Отправим ссылку на корпоративную почту."
              : step === "password"
                ? "Придумайте новый надёжный пароль."
                : "Теперь можно войти в портал с новым паролем."}
          </p>
          {step === "email" ? (
            <form
              className="mt-6 text-left"
              onSubmit={(event) => {
                event.preventDefault();
                setStep("password");
              }}
            >
              <Field defaultValue="employee@severprom.ru" label="Электронная почта" required type="email" />
              <Button className="mt-5 w-full" type="submit">
                Получить ссылку
              </Button>
            </form>
          ) : null}
          {step === "password" ? (
            <form
              className="mt-6 space-y-4 text-left"
              onSubmit={(event) => {
                event.preventDefault();
                setStep("done");
              }}
            >
              <Field defaultValue="new-maxsoft-demo" label="Новый пароль" required type="password" />
              <Field defaultValue="new-maxsoft-demo" label="Повторите пароль" required type="password" />
              <Button className="w-full" type="submit">
                Сохранить пароль
              </Button>
            </form>
          ) : null}
          {step === "done" ? (
            <Button className="mt-6 w-full" onClick={() => onNavigate("login")}>
              Перейти ко входу
            </Button>
          ) : null}
          {step !== "done" ? (
            <button
              className="mt-5 text-sm font-semibold text-[var(--ms-primary)] hover:underline"
              onClick={() => onNavigate("login")}
              type="button"
            >
              Вернуться ко входу
            </button>
          ) : null}
        </div>
      </section>
    </AuthLayout>
  );
};
