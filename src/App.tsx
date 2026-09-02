import { useCallback, useEffect, useMemo, useState } from "react";
import { DesignFrame } from "./components/DesignFrame";
import { FileUsageDialog } from "./components/FileUsageDialog";
import { Launcher } from "./components/Launcher";
import { PrototypeToolbar } from "./components/PrototypeToolbar";
import { RegistrationOutcomeDialog } from "./components/RegistrationOutcomeDialog";
import { Toast } from "./components/Toast";
import { demoProfiles, mockDownload } from "./data/mock-data";
import { screens, type ScreenDefinition, type ScreenFormat } from "./generated/screens";
import {
  createInitialState,
  canRoleViewScreen,
  accessDeniedStateForScreen,
  registrationOutcomeState,
  resolveAction,
  startForRole,
  type PrototypeState,
  type UserRole,
} from "./prototype/navigation";

interface AppViewState {
  base: PrototypeState;
  overlay?: PrototypeState;
}

interface NoticeState {
  id: number;
  message: string;
}

const screenById = new Map(screens.map((screen) => [screen.id, screen]));
const userRoles: readonly UserRole[] = [
  "guest",
  "portal-admin",
  "support-engineer",
  "manager",
  "client-admin",
  "client-employee",
];
const screenFormats: readonly ScreenFormat[] = ["desktop", "mobile"];

const requireScreen = (id: string): ScreenDefinition => {
  const screen = screenById.get(id);
  if (!screen) throw new Error(`PROTOTYPE_SCREEN_MISSING: экран ${id} отсутствует`);
  return screen;
};

const requireRoleLabel = (role: UserRole): string => {
  const profile = demoProfiles.find((candidate) => candidate.role === role);
  if (!profile) throw new Error(`PROTOTYPE_ROLE_MISSING: профиль роли ${role} не найден`);
  return profile.label;
};

const readUrlState = (): AppViewState => {
  const params = new URLSearchParams(window.location.search);
  const screenId = params.get("screen");
  const roleParam = params.get("role");
  const formatParam = params.get("format");
  if (
    !screenId ||
    !roleParam ||
    !formatParam ||
    !userRoles.includes(roleParam as UserRole) ||
    !screenFormats.includes(formatParam as ScreenFormat)
  ) {
    return { base: createInitialState() };
  }
  const role = roleParam as UserRole;
  const format = formatParam as ScreenFormat;
  const screen = screenById.get(screenId);
  if (!screen || screen.format !== format) {
    return { base: createInitialState() };
  }
  if (!canRoleViewScreen(screen, role)) {
    const deniedState = accessDeniedStateForScreen(screen, role, format, screens);
    return deniedState ? { base: deniedState } : { base: createInitialState() };
  }
  return { base: { screenId, role, format } };
};

const writeUrlState = (state: PrototypeState, replace = false) => {
  const url = new URL(window.location.href);
  url.searchParams.set("screen", state.screenId);
  url.searchParams.set("role", state.role);
  url.searchParams.set("format", state.format);
  window.history[replace ? "replaceState" : "pushState"]({}, "", url);
};

const clearUrlState = () => {
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

export const App = () => {
  const [view, setView] = useState<AppViewState>(readUrlState);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [choosingRegistrationOutcome, setChoosingRegistrationOutcome] = useState(false);
  const [showingFileUsage, setShowingFileUsage] = useState(false);

  useEffect(() => {
    const onPopState = () => setView(readUrlState());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const showNotice = useCallback((message: string) => {
    setNotice((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }, []);

  const openState = useCallback((nextState: PrototypeState, presentation: "screen" | "overlay" = "screen") => {
    if (presentation === "overlay") {
      setView((current) => ({ ...current, overlay: nextState }));
      return;
    }
    setView({ base: nextState });
    writeUrlState(nextState);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const importingOverlay = view.overlay?.screenId === "oCUJK";
    const importingMobile = view.base.screenId === "x9dqAM";
    if (!importingOverlay && !importingMobile) return;
    const timeout = window.setTimeout(() => {
      if (importingOverlay && view.overlay) {
        setView((current) => ({
          ...current,
          overlay: { ...view.overlay!, screenId: "NHrU4" },
        }));
      } else if (importingMobile) {
        const nextState = { ...view.base, screenId: "P0rQH0" };
        setView({ base: nextState });
        writeUrlState(nextState, true);
      }
      showNotice("Документ импортирован в черновик.");
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [showNotice, view.base, view.overlay]);

  const start = useCallback((role: UserRole, format: ScreenFormat) => {
    const nextState = startForRole(role, format, screens);
    setView({ base: nextState });
    writeUrlState(nextState);
    window.scrollTo({ top: 0 });
  }, []);

  const handleAction = useCallback(
    (actionName: string, fromOverlay = false) => {
      if (fromOverlay && /(ЗАКРЫТЬ|СКРЫТЬ|ОТМЕН|СОЗДАТЬ|ГОТОВО|УДАЛИТЬ|ОТПРАВИТЬ|ОТКРЫТЬ ИМПОРТИРОВАН)/i.test(actionName)) {
        setView((current) => ({ base: current.base }));
        if (!/(ЗАКРЫТЬ|СКРЫТЬ|ОТМЕН)/i.test(actionName)) {
          showNotice("Изменение применено в демонстрационном режиме.");
        }
        return;
      }
      const current = fromOverlay && view.overlay ? view.overlay : view.base;
      const result = resolveAction(actionName, current, screens);
      if (result.notice) showNotice(result.notice);
      if (result.effect === "download") downloadMockFile();
      if (result.effect === "registration-choice") setChoosingRegistrationOutcome(true);
      if (result.effect === "file-usage") setShowingFileUsage(true);
      if (result.nextState) openState(result.nextState, result.presentation);
    },
    [openState, showNotice, view],
  );

  const goHome = useCallback(() => {
    setView({ base: createInitialState() });
    clearUrlState();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const closeOverlay = useCallback(() => {
    setView((current) => ({ base: current.base }));
  }, []);

  const activeScreen = useMemo(
    () => (view.base.screenId ? requireScreen(view.base.screenId) : undefined),
    [view.base.screenId],
  );
  const overlayScreen = useMemo(
    () => (view.overlay?.screenId ? requireScreen(view.overlay.screenId) : undefined),
    [view.overlay?.screenId],
  );
  const availableScreens = useMemo(
    () =>
      screens.filter(
        (candidate) =>
          candidate.format === view.base.format && canRoleViewScreen(candidate, view.base.role),
      ),
    [view.base.format, view.base.role],
  );

  if (!activeScreen) return <Launcher onStart={start} />;

  return (
    <main className="min-h-screen bg-[var(--ms-stage)]">
      <DesignFrame
        onAction={(action) => handleAction(action)}
        roleLabel={requireRoleLabel(view.base.role)}
        screen={activeScreen}
        userRole={view.base.role}
      />

      {overlayScreen && view.overlay ? (
        <div
          aria-label="Модальное состояние прототипа"
          className="fixed inset-0 z-40 flex items-center justify-center overflow-auto bg-[#0b1726]/55 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeOverlay();
          }}
          role="presentation"
        >
          <div className="animate-[modal-in_180ms_ease-out] overflow-hidden rounded-xl shadow-[0_24px_90px_rgba(0,0,0,0.36)]">
            <DesignFrame
              onAction={(action) => handleAction(action, true)}
              overlay
              roleLabel={requireRoleLabel(view.base.role)}
              screen={overlayScreen}
              userRole={view.base.role}
            />
          </div>
        </div>
      ) : null}

      <PrototypeToolbar
        format={view.base.format}
        onBack={() => window.history.back()}
        onHome={goHome}
        onOpenScreen={(screenId) =>
          openState({ ...view.base, screenId }, "screen")
        }
        onRestart={start}
        role={view.base.role}
        screen={activeScreen}
        screens={availableScreens}
      />
      {choosingRegistrationOutcome ? (
        <RegistrationOutcomeDialog
          onCancel={() => setChoosingRegistrationOutcome(false)}
          onSelect={(outcome) => {
            const nextState = registrationOutcomeState(outcome, view.base, screens);
            setChoosingRegistrationOutcome(false);
            openState(nextState);
          }}
        />
      ) : null}
      {showingFileUsage ? (
        <FileUsageDialog
          onClose={() => setShowingFileUsage(false)}
          onDownload={() => {
            downloadMockFile();
            showNotice("Демонстрационный файл подготовлен к скачиванию.");
          }}
        />
      ) : null}
      {notice ? <Toast key={notice.id} message={notice.message} onClose={() => setNotice(null)} /> : null}
    </main>
  );
};
