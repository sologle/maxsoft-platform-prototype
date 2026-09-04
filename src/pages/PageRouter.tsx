import { CloudOff, LockKeyhole, RotateCcw } from "lucide-react";
import type { AppLocation, AppPage, Authenticate, Navigate } from "../app/types";
import { Button } from "../components/ui";
import { LandingPage, LoginPage, RecoverPage, RegisterPage } from "./AuthPages";
import { HomePage } from "./HomePage";
import { ArticlePage, VideoArticlePage } from "./knowledge/ArticlePages";
import { EditorPage } from "./knowledge/EditorPage";
import { FilePreviewPage, FilesPage } from "./knowledge/FilesPage";
import { KnowledgeLibrary } from "./knowledge/KnowledgeLibrary";
import { SearchPage } from "./knowledge/SearchPage";
import { StructurePage } from "./knowledge/StructurePage";
import { TagsPage } from "./knowledge/TagsPage";
import { CompaniesPage, CompanyPage, CompanyTypesPage } from "./organizations/CompaniesPages";
import { ClientUsersPage, UsersPage } from "./organizations/UsersPages";
import { AdministrationPage, AuditPage, FieldsPage, IntegrationsPage } from "./platform/PlatformPages";

interface PageRouterProps {
  location: AppLocation;
  onAuthenticate: Authenticate;
  onDownload: () => void;
  onNavigate: Navigate;
  onNotice: (message: string) => void;
}

const administrativeCollections = new Set<AppPage>([
  "tags",
  "companies",
  "company-types",
  "users",
  "client-users",
  "audit",
]);

export const PageRouter = ({
  location,
  onAuthenticate,
  onDownload,
  onNavigate,
  onNotice,
}: PageRouterProps) => {
  const common = { onNavigate, onNotice, role: location.role };
  if (location.resource === "load-error" && administrativeCollections.has(location.page)) {
    return (
      <section
        className="mx-auto flex min-h-[65dvh] max-w-2xl flex-col items-center justify-center text-center"
        role="alert"
      >
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600">
          <CloudOff className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-heading text-3xl font-bold">Не удалось загрузить данные</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--ms-muted)]">
          Раздел временно недоступен. Проверьте подключение и повторите загрузку. Код:
          APP_ADMIN_LIST_LOAD_FAILED.
        </p>
        <Button
          className="mt-6"
          icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onNavigate(location.page)}
        >
          Повторить загрузку
        </Button>
      </section>
    );
  }
  switch (location.page) {
    case "landing":
      return <LandingPage onAuthenticate={onAuthenticate} onNavigate={onNavigate} />;
    case "login":
      return <LoginPage onAuthenticate={onAuthenticate} onNavigate={onNavigate} />;
    case "register":
      return <RegisterPage onAuthenticate={onAuthenticate} onNavigate={onNavigate} />;
    case "recover":
      return <RecoverPage onAuthenticate={onAuthenticate} onNavigate={onNavigate} />;
    case "home":
      return (
        <HomePage
          companyType={location.companyType}
          onNavigate={onNavigate}
          role={location.role}
        />
      );
    case "knowledge":
      return (
        <KnowledgeLibrary
          companyType={location.companyType}
          onNavigate={onNavigate}
          role={location.role}
        />
      );
    case "article":
      return <ArticlePage onDownload={onDownload} resource={location.resource} {...common} />;
    case "video":
      return <VideoArticlePage onDownload={onDownload} resource={location.resource} {...common} />;
    case "editor":
      return <EditorPage onNavigate={onNavigate} onNotice={onNotice} resource={location.resource} />;
    case "structure":
      return <StructurePage onNotice={onNotice} />;
    case "tags":
      return <TagsPage onNotice={onNotice} />;
    case "files":
      return (
        <FilesPage
          companyType={location.companyType}
          onDownload={onDownload}
          onNavigate={onNavigate}
          onNotice={onNotice}
          role={location.role}
        />
      );
    case "file-preview":
      return (
        <FilePreviewPage
          companyType={location.companyType}
          onDownload={onDownload}
          onNavigate={onNavigate}
          onNotice={onNotice}
          resource={location.resource}
          role={location.role}
        />
      );
    case "search":
      return (
        <SearchPage
          companyType={location.companyType}
          onNavigate={onNavigate}
          role={location.role}
        />
      );
    case "companies":
      return <CompaniesPage {...common} />;
    case "company":
      return <CompanyPage resource={location.resource} {...common} />;
    case "company-types":
      return <CompanyTypesPage {...common} />;
    case "users":
      return <UsersPage onNavigate={onNavigate} onNotice={onNotice} role={location.role} />;
    case "client-users":
      return (
        <ClientUsersPage
          companyId={location.companyId}
          onNotice={onNotice}
          role={location.role}
        />
      );
    case "administration":
      return <AdministrationPage onNavigate={onNavigate} onNotice={onNotice} />;
    case "integrations":
      return <IntegrationsPage onNavigate={onNavigate} onNotice={onNotice} />;
    case "audit":
      return <AuditPage onNavigate={onNavigate} onNotice={onNotice} />;
    case "fields":
      return <FieldsPage onNavigate={onNavigate} onNotice={onNotice} />;
    case "access-denied":
      return (
        <section className="mx-auto flex min-h-[65dvh] max-w-2xl flex-col items-center justify-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600">
            <LockKeyhole className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-heading text-3xl font-bold">Нет доступа к разделу</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--ms-muted)]">
            Выбранная роль не может открыть этот раздел. Прямая ссылка проверена, данные не показаны.
          </p>
          <Button className="mt-6" onClick={() => onNavigate("home")}>
            Вернуться на главную
          </Button>
        </section>
      );
  }
};
