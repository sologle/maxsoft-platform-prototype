import { useCallback, useEffect, useState } from "react";
import {
  canOpenLocation,
  companyContextForRole,
  readLocation,
  setActiveClientCompany,
  startPageForRole,
  writeLocation,
} from "./app/routes";
import type { AppLocation, AppPage, Authenticate, UserRole } from "./app/types";
import { AppShell } from "./components/AppShell";
import { ScenarioPanel } from "./components/ScenarioPanel";
import { ThemeProvider } from "./components/Theme";
import { Toast } from "./components/Toast";
import { mockDownload } from "./data/download";
import { PageRouter } from "./pages/PageRouter";

interface NoticeState {
  id: number;
  message: string;
}

const clearLocation = () => {
  const url = new URL(window.location.href);
  url.search = "";
  window.history.pushState({}, "", url);
};

const downloadMockFile = () => {
  const url = URL.createObjectURL(new Blob([mockDownload.content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = mockDownload.filename;
  link.click();
  URL.revokeObjectURL(url);
};

const PlatformApp = () => {
  const [location, setLocation] = useState<AppLocation>(() => readLocation());
  const [notice, setNotice] = useState<NoticeState | null>(null);

  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const showNotice = useCallback((message: string) => {
    setNotice((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }, []);

  const navigate = useCallback(
    (page: AppPage, resource?: string) => {
      setLocation((current) => {
        const next: AppLocation = {
          companyId: current.companyId,
          companyType: current.companyType,
          page: canOpenLocation(page, current.role, resource, current.companyType)
            ? page
            : current.role === "guest"
              ? "landing"
              : "access-denied",
          resource,
          role: current.role,
        };
        writeLocation(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (next.page === "access-denied") showNotice("Этот раздел недоступен выбранной роли.");
        return next;
      });
    },
    [showNotice],
  );

  const changeRole: Authenticate = useCallback(
    (role: UserRole, companyId?: string) => {
      setLocation((current) => {
        setActiveClientCompany(role, companyId);
        const companyContext = companyContextForRole(role, companyId);
        const canReturn = Boolean(
          current?.returnPage &&
            canOpenLocation(
              current.returnPage,
              role,
              current.returnResource,
              companyContext.companyType,
            ),
        );
        const next: AppLocation = current?.returnPage
          ? canReturn
            ? { ...companyContext, page: current.returnPage, resource: current.returnResource, role }
            : { ...companyContext, page: "access-denied", role }
          : { ...companyContext, page: startPageForRole(role), role };
        writeLocation(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return next;
      });
    },
    [],
  );

  const exit = useCallback(() => {
    setLocation({ page: "landing", role: "guest" });
    clearLocation();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const page = (
    <PageRouter
      location={location}
      onAuthenticate={changeRole}
      onDownload={downloadMockFile}
      onNavigate={navigate}
      onNotice={showNotice}
    />
  );

  return (
    <>
      {location.role === "guest" ? (
        page
      ) : (
        <AppShell location={location} onExit={exit} onNavigate={navigate}>
          {page}
        </AppShell>
      )}
      <ScenarioPanel
        location={location}
        onBack={() => window.history.back()}
        onExit={exit}
        onNavigate={navigate}
        onRoleChange={changeRole}
      />
      {notice ? <Toast key={notice.id} message={notice.message} onClose={() => setNotice(null)} /> : null}
    </>
  );
};

export const App = () => (
  <ThemeProvider>
    <PlatformApp />
  </ThemeProvider>
);
