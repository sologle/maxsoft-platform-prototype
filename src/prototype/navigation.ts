import type { ScreenDefinition, ScreenFormat } from "../generated/screens";

export type UserRole =
  | "guest"
  | "portal-admin"
  | "support-engineer"
  | "manager"
  | "client-admin"
  | "client-employee";

export interface PrototypeState {
  screenId: string;
  role: UserRole;
  format: ScreenFormat;
}

export interface NavigationResult {
  nextState?: PrototypeState;
  notice?: string;
  presentation?: "screen" | "overlay";
  effect?: "download" | "toggle" | "registration-choice" | "import-choice" | "file-usage";
}

export type RegistrationOutcome = "existing-company" | "new-company" | "manual-review";
export type ImportOutcome = "success" | "error";

type ResponsiveIds = Record<ScreenFormat, string>;

const roleHome: Record<UserRole, ResponsiveIds> = {
  guest: { desktop: "xlvEx", mobile: "kiGN4" },
  "portal-admin": { desktop: "pmHIA", mobile: "NllPS" },
  "support-engineer": { desktop: "w9mzj", mobile: "QK2cj" },
  manager: { desktop: "oge4c", mobile: "bLysq" },
  "client-admin": { desktop: "uuYrz", mobile: "RcJJN" },
  "client-employee": { desktop: "uLhhN", mobile: "KvdWU" },
};

const roleKnowledgeBase: Record<Exclude<UserRole, "guest">, ResponsiveIds> = {
  "portal-admin": { desktop: "Fy0nE", mobile: "K4fvbv" },
  "support-engineer": { desktop: "F8bP1", mobile: "d4RXY" },
  manager: { desktop: "zmzYb", mobile: "EZ9x6" },
  "client-admin": { desktop: "H62Mbt", mobile: "VwXAE" },
  "client-employee": { desktop: "Sc4io", mobile: "BQWHW" },
};

const roleCompanies: Record<"portal-admin" | "support-engineer" | "manager", ResponsiveIds> = {
  "portal-admin": { desktop: "zv0ob", mobile: "L6KLB" },
  "support-engineer": { desktop: "umm3u", mobile: "zjm5M" },
  manager: { desktop: "BTDV4", mobile: "e8MOB" },
};

const roleUsers: Record<"portal-admin" | "support-engineer" | "manager", ResponsiveIds> = {
  "portal-admin": { desktop: "cZUol", mobile: "FmZWA" },
  "support-engineer": { desktop: "zqEl6", mobile: "LtB29" },
  manager: { desktop: "du8aB", mobile: "ZQuca" },
};

const roleShellMenu: Record<Exclude<UserRole, "guest">, ResponsiveIds> = {
  "portal-admin": { desktop: "Ylweo", mobile: "BryXu" },
  "support-engineer": { desktop: "b9Obtj", mobile: "gtRSp" },
  manager: { desktop: "TnjSm", mobile: "oB7s3" },
  "client-admin": { desktop: "Jv6PU", mobile: "HucIi" },
  "client-employee": { desktop: "vIwka", mobile: "BcqPK" },
};

const roleProfileMenu: Record<Exclude<UserRole, "guest">, ResponsiveIds> = {
  "portal-admin": { desktop: "DMuJh", mobile: "pSJtI" },
  "support-engineer": { desktop: "jZ84j", mobile: "qxJth" },
  manager: { desktop: "WLQ67", mobile: "BfGmN" },
  "client-admin": { desktop: "ZFDsN", mobile: "ruCKR" },
  "client-employee": { desktop: "t0gHI", mobile: "DmOzx" },
};

const fixedScreens: Record<string, ResponsiveIds> = {
  "AUTH-01": { desktop: "xlvEx", mobile: "kiGN4" },
  "AUTH-02": { desktop: "o046g", mobile: "cAATf" },
  "AUTH-03": { desktop: "YDq1G", mobile: "atKnC" },
  "AUTH-04": { desktop: "wP6Wy", mobile: "iJAp9" },
  "KB-02": { desktop: "yretl", mobile: "FYI4I" },
  "KB-03": { desktop: "M6IoTK", mobile: "dcJkq" },
  "KB-04": { desktop: "sUjWN", mobile: "lR77f" },
  "KB-05": { desktop: "cuZKn", mobile: "U3ek80" },
  "KB-06": { desktop: "CQojg", mobile: "n50Krp" },
  "KB-07": { desktop: "shAHh", mobile: "WmKrc" },
  "KB-08": { desktop: "IG8L8", mobile: "EzOlK" },
  "SRCH-01": { desktop: "Tb3co", mobile: "kVLBy" },
  "ORG-03": { desktop: "iPAn6", mobile: "h3h0i" },
  "ORG-05": { desktop: "qRWeu", mobile: "YD7vh" },
  "PLAT-01": { desktop: "SJu0Y", mobile: "xxNsw" },
  "PLAT-02": { desktop: "o43HZq", mobile: "a7N2d" },
  "PLAT-03": { desktop: "ycjEe", mobile: "mY7Mh" },
  "PLAT-04": { desktop: "G0ePJ7", mobile: "DGyCQ" },
};

const accessDenied: Record<"KB" | "ORG" | "PLAT", ResponsiveIds> = {
  KB: { desktop: "RsiVN", mobile: "mth2c" },
  ORG: { desktop: "PXXY1", mobile: "tJX8b" },
  PLAT: { desktop: "ka4TG", mobile: "jh2Xv" },
};

const accessDeniedScreenIds = new Set(
  Object.values(accessDenied).flatMap((ids) => [ids.desktop, ids.mobile]),
);

const modalStateIds: Record<string, ResponsiveIds> = {
  "KB-04:ИМПОРТ": { desktop: "oCUJK", mobile: "x9dqAM" },
  "KB-04:ИМПОРТ ЗАВЕРШ": { desktop: "NHrU4", mobile: "P0rQH0" },
  "KB-04:ИМПОРТ ОШИБ": { desktop: "cKrvi", mobile: "bTLLo" },
  "KB-05:ЧЕРНОВИК": { desktop: "T17CYs", mobile: "Q5hjgX" },
  "KB-06:СОЗДАН": { desktop: "ACWsj", mobile: "h89rfQ" },
  "KB-06:ПЕРЕИМЕНОВ": { desktop: "DZOE5", mobile: "rXopt" },
  "KB-06:ПЕРЕМЕЩЕН": { desktop: "skXOD", mobile: "uzUQh" },
  "KB-06:УДАЛЕН": { desktop: "QTBXk", mobile: "t4bJW" },
  "KB-07:МЕНЮ": { desktop: "jNhGY", mobile: "fi33Z" },
};

const mobileOverlayScreenIds = new Set(["h89rfQ", "rXopt", "uzUQh", "t4bJW", "fi33Z"]);

const scopedScreenRoles = new Map<string, ReadonlySet<UserRole>>();

const scopeScreens = (ids: readonly string[], roles: readonly UserRole[]) => {
  const allowedRoles = new Set(roles);
  ids.forEach((id) => scopedScreenRoles.set(id, allowedRoles));
};

scopeScreens(["Ylweo", "BryXu", "pmHIA", "NllPS", "DMuJh", "pSJtI"], ["portal-admin"]);
scopeScreens(["b9Obtj", "gtRSp", "w9mzj", "QK2cj", "jZ84j", "qxJth"], ["support-engineer"]);
scopeScreens(["TnjSm", "oB7s3", "oge4c", "bLysq", "WLQ67", "BfGmN"], ["manager"]);
scopeScreens(["Jv6PU", "HucIi", "uuYrz", "RcJJN", "ZFDsN", "ruCKR"], ["client-admin"]);
scopeScreens(["vIwka", "BcqPK", "uLhhN", "KvdWU", "t0gHI", "DmOzx"], ["client-employee"]);
scopeScreens(["Fy0nE", "K4fvbv"], ["portal-admin"]);
scopeScreens(["F8bP1", "d4RXY"], ["support-engineer"]);
scopeScreens(["zmzYb", "EZ9x6"], ["manager"]);
scopeScreens(["H62Mbt", "VwXAE"], ["client-admin"]);
scopeScreens(["Sc4io", "BQWHW", "O0830", "c96qUa", "X6NhGZ"], ["client-employee"]);
scopeScreens(["zv0ob", "L6KLB"], ["portal-admin"]);
scopeScreens(["umm3u", "zjm5M"], ["support-engineer"]);
scopeScreens(["BTDV4", "e8MOB", "mEUkQ", "ZpU0A"], ["manager"]);
scopeScreens(["pgMj9", "YIoQc", "i3L0M", "QIcfA"], ["portal-admin"]);
scopeScreens(["r4zcgI", "F06z1E", "GDzi1", "Nd0qg"], ["support-engineer"]);
scopeScreens(["mkMbq", "JRC4W", "uwHgl", "vW0ju"], ["manager"]);
scopeScreens(["cZUol", "FmZWA", "iBe5p", "R7HSg", "XfxSE", "MZaGw"], ["portal-admin"]);
scopeScreens(["zqEl6", "LtB29"], ["support-engineer"]);
scopeScreens(["du8aB", "ZQuca"], ["manager"]);

const roleFromTarget = (target: string): UserRole | undefined => {
  const normalized = target.toUpperCase();
  if (normalized.includes("CLIENT-EMPLOYEE")) return "client-employee";
  if (normalized.includes("CLIENT-ADMIN")) return "client-admin";
  if (normalized.includes("AUTHOR")) return "support-engineer";
  if (normalized.includes("MANAGER")) return "manager";
  if (normalized.includes("ADMIN")) return "portal-admin";
  return undefined;
};

const requireScreen = (id: string, screens: ScreenDefinition[]): ScreenDefinition => {
  const screen = screens.find((candidate) => candidate.id === id);
  if (!screen) {
    throw new Error(`PROTOTYPE_SCREEN_MISSING: экран ${id} отсутствует в экспорте Pencil`);
  }
  return screen;
};

const transition = (
  id: string,
  current: PrototypeState,
  screens: ScreenDefinition[],
  role = current.role,
): NavigationResult => {
  const screen = requireScreen(id, screens);
  if (screen.id === current.screenId) {
    return { notice: "Вы уже на этом экране." };
  }
  const overlay =
    (current.format === "desktop" && screen.width < 1000) || mobileOverlayScreenIds.has(screen.id);
  return {
    nextState: { screenId: screen.id, role, format: current.format },
    presentation: overlay ? "overlay" : "screen",
  };
};

const targetGroup = (target: string): string | undefined =>
  target.toUpperCase().match(/\b(AUTH|SHELL|KB|SRCH|ORG|PLAT)-\d{2}\b/)?.[0];

const canOpenGroup = (group: string, role: UserRole): boolean => {
  if (group.startsWith("AUTH-")) return role === "guest";
  if (group.startsWith("SHELL-")) return role !== "guest";
  if (/^KB-0[1-3]$/.test(group) || group === "SRCH-01") return role !== "guest";
  if (/^KB-0[45]$/.test(group)) return role === "portal-admin" || role === "support-engineer";
  if (/^KB-0[678]$/.test(group) || /^PLAT-/.test(group)) return role === "portal-admin";
  if (/^ORG-0[124]$/.test(group)) {
    return role === "portal-admin" || role === "support-engineer" || role === "manager";
  }
  if (group === "ORG-03") return role === "portal-admin";
  if (group === "ORG-05") return role === "client-admin";
  return false;
};

export const canRoleViewScreen = (screen: ScreenDefinition, role: UserRole): boolean => {
  if (accessDeniedScreenIds.has(screen.id)) return role !== "guest";
  const group = targetGroup(screen.name);
  if (!group || !canOpenGroup(group, role)) return false;
  const allowedRoles = scopedScreenRoles.get(screen.id);
  return allowedRoles ? allowedRoles.has(role) : true;
};

export const accessDeniedStateForScreen = (
  screen: ScreenDefinition,
  role: UserRole,
  format: ScreenFormat,
  screens: ScreenDefinition[],
): PrototypeState | undefined => {
  if (role === "guest") return undefined;
  const group = targetGroup(screen.name);
  if (!group || group.startsWith("AUTH-") || group.startsWith("SHELL-")) return undefined;
  const area = group.startsWith("ORG-") ? "ORG" : group.startsWith("PLAT-") ? "PLAT" : "KB";
  const deniedScreen = requireScreen(accessDenied[area][format], screens);
  return { screenId: deniedScreen.id, role, format };
};

export const registrationOutcomeState = (
  outcome: RegistrationOutcome,
  current: PrototypeState,
  screens: ScreenDefinition[],
): PrototypeState => {
  if (current.role !== "guest") {
    throw new Error("PROTOTYPE_REGISTRATION_ROLE_INVALID: результат регистрации доступен только гостю");
  }
  const ids: Record<RegistrationOutcome, ResponsiveIds> = {
    "existing-company": { desktop: "Onl5J", mobile: "Ltomq" },
    "new-company": { desktop: "ljwfR", mobile: "JEpk3" },
    "manual-review": { desktop: "M7poB", mobile: "XZDAF" },
  };
  const screen = requireScreen(ids[outcome][current.format], screens);
  return { screenId: screen.id, role: "guest", format: current.format };
};

export const importProgressState = (
  current: PrototypeState,
  screens: ScreenDefinition[],
): NavigationResult => {
  if (current.role !== "portal-admin" && current.role !== "support-engineer") {
    throw new Error("PROTOTYPE_IMPORT_ROLE_INVALID: импорт доступен только автору материала");
  }
  return transition(modalStateIds["KB-04:ИМПОРТ"][current.format], current, screens);
};

export const importOutcomeState = (
  outcome: ImportOutcome,
  current: PrototypeState,
  screens: ScreenDefinition[],
): PrototypeState => {
  const progressIds = modalStateIds["KB-04:ИМПОРТ"];
  if (![progressIds.desktop, progressIds.mobile].includes(current.screenId)) {
    throw new Error("PROTOTYPE_IMPORT_STATE_INVALID: результат импорта требует состояния обработки");
  }
  const stateKey = outcome === "success" ? "KB-04:ИМПОРТ ЗАВЕРШ" : "KB-04:ИМПОРТ ОШИБ";
  const screen = requireScreen(modalStateIds[stateKey][current.format], screens);
  return { screenId: screen.id, role: current.role, format: current.format };
};

const deniedTransition = (
  group: string,
  current: PrototypeState,
  screens: ScreenDefinition[],
): NavigationResult => {
  const area = group.startsWith("ORG-") ? "ORG" : group.startsWith("PLAT-") ? "PLAT" : "KB";
  const result = transition(accessDenied[area][current.format], current, screens);
  return { ...result, notice: "Этот раздел недоступен выбранной роли." };
};

const roleScopedScreen = (
  mapping: Partial<Record<UserRole, ResponsiveIds>>,
  current: PrototypeState,
  screens: ScreenDefinition[],
): NavigationResult => {
  const ids = mapping[current.role];
  if (!ids) return deniedTransition("ORG-01", current, screens);
  return transition(ids[current.format], current, screens);
};

const companyCardTransition = (
  current: PrototypeState,
  screens: ScreenDefinition[],
  usersTab = false,
): NavigationResult => {
  const generalIds =
    current.role === "support-engineer"
      ? { desktop: "r4zcgI", mobile: "GDzi1" }
      : current.role === "manager"
        ? { desktop: "mkMbq", mobile: "uwHgl" }
        : { desktop: "pgMj9", mobile: "i3L0M" };
  const userIds =
    current.role === "support-engineer"
      ? { desktop: "F06z1E", mobile: "Nd0qg" }
      : current.role === "manager"
        ? { desktop: "JRC4W", mobile: "vW0ju" }
        : { desktop: "YIoQc", mobile: "QIcfA" };
  return transition((usersTab ? userIds : generalIds)[current.format], current, screens);
};

const resolveSpecialState = (
  group: string,
  target: string,
  current: PrototypeState,
  screens: ScreenDefinition[],
): NavigationResult | undefined => {
  const upper = target.toUpperCase();
  if (group === "AUTH-04") {
    if (upper.includes("ШАГ 2")) {
      return transition(current.format === "mobile" ? "PLiQa" : "Dl3Cm", current, screens);
    }
    if (upper.includes("УСПЕХ")) {
      return transition(current.format === "mobile" ? "tEiKh" : "O2bvy", current, screens);
    }
  }
  if (group === "KB-03") {
    if (upper.includes("07:12")) {
      return { notice: "Видео перемотано к таймкоду 07:12.", effect: "toggle" };
    }
    const timestamp = upper.match(/(?:00:00|02:15|14:40)/)?.[0];
    if (timestamp) {
      const ids: Record<string, ResponsiveIds> = {
        "00:00": { desktop: "WX6n2", mobile: "o2FG6" },
        "02:15": { desktop: "BZVU3", mobile: "RXZY7" },
        "14:40": { desktop: "AIN0h", mobile: "pOoqu" },
      };
      return transition(ids[timestamp][current.format], current, screens);
    }
  }
  if (group === "SRCH-01") {
    if (upper.includes("EMPTY") || upper.includes("ПУСТ")) {
      return transition(current.format === "mobile" ? "SooZ1" : "c4Kmz", current, screens);
    }
    if (upper.includes("ACTION INPUT") && !upper.includes("EMPTY")) {
      return transition(current.format === "mobile" ? "qMK5r" : "neKET", current, screens);
    }
    if (upper.includes("ПОДСКАЗ") || upper.includes("SUGGESTIONS")) {
      return transition("neKET", current, screens);
    }
    if (upper.includes("FILTER") || upper.includes("ФИЛЬТРЫ ОТКР")) {
      return transition(current.format === "mobile" ? "qMK5r" : "Tb3co", current, screens);
    }
  }
  if (group === "KB-07") {
    if (upper.includes("ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ")) {
      return current.format === "desktop"
        ? transition("eLOVd", current, screens)
        : { notice: "Подтверждение удаления открыто в демонстрационном режиме." };
    }
    if (upper.includes("РЕДАКТИРОВАНИЕ ГРУППЫ")) {
      return transition(current.format === "mobile" ? "l0pieT" : "o9KtI", current, screens);
    }
    if (upper.includes("РЕДАКТИРОВАНИЕ ТЕГА")) {
      return transition(current.format === "mobile" ? "wIfdF" : "lppE3", current, screens);
    }
    if (upper.includes("НОВАЯ ГРУППА")) {
      return transition(current.format === "mobile" ? "S3qFr" : "aDQSp", current, screens);
    }
    if (upper.includes("НОВЫЙ ТЕГ") && !upper.includes("МЕНЮ")) {
      return transition(current.format === "mobile" ? "zdyBM" : "iCoVo", current, screens);
    }
  }
  if (group === "KB-06") {
    if (upper.includes("DRAG HANDLE")) {
      return transition(modalStateIds["KB-06:ПЕРЕМЕЩЕН"][current.format], current, screens);
    }
    if (upper.includes("ПЕРЕИМЕНОВАТЬ")) {
      return transition(modalStateIds["KB-06:ПЕРЕИМЕНОВ"][current.format], current, screens);
    }
    if (upper.includes("УДАЛИТЬ")) {
      return transition(modalStateIds["KB-06:УДАЛЕН"][current.format], current, screens);
    }
  }
  const stateKey = Object.keys(modalStateIds).find((groupKey) => {
    const [keyGroup, keyword] = groupKey.split(":");
    return keyGroup === group && upper.includes(keyword);
  });
  if (stateKey) return transition(modalStateIds[stateKey][current.format], current, screens);
  return undefined;
};

export const createInitialState = (): PrototypeState => ({
  screenId: "",
  role: "guest",
  format: "desktop",
});

export const startForRole = (
  role: UserRole,
  format: ScreenFormat,
  screens: ScreenDefinition[],
): PrototypeState => {
  const id = roleHome[role][format];
  requireScreen(id, screens);
  return { screenId: id, role, format };
};

export const resolveAction = (
  actionName: string,
  current: PrototypeState,
  screens: ScreenDefinition[],
): NavigationResult => {
  const target = actionName.replace(/^ACTION\s*→\s*/i, "").trim();
  const upper = target.toUpperCase();

  if (!target) return { notice: "У действия не задан целевой экран." };
  if (/DISABLED|НЕДОСТУПНЫЙ ПУНКТ|НЕ ПОДКЛЮЧЕНО/.test(upper)) {
    return { notice: "Этот раздел пока не включён в демонстрацию." };
  }
  if (
    (current.role === "support-engineer" || current.role === "manager") &&
    upper.includes("ORG-04") &&
    /(СМЕНА РОЛ|УДАЛ)/.test(upper)
  ) {
    return { notice: "Менять роли и удалять пользователей может только администратор портала." };
  }
  if (["M7poB", "XZDAF"].includes(current.screenId) && upper.includes("SHELL-02")) {
    return {
      ...transition(fixedScreens["AUTH-02"][current.format], current, screens, "guest"),
      notice: "Заявка отправлена на ручную проверку. Вход станет доступен после подтверждения.",
    };
  }
  if (["ljwfR", "JEpk3"].includes(current.screenId) && upper.includes("SHELL-02")) {
    return transition(roleHome["client-admin"][current.format], current, screens, "client-admin");
  }
  if (["sj2b0", "z9avSo"].includes(current.screenId) && upper.includes("KB-02")) {
    return transition(fixedScreens["KB-02"][current.format], current, screens, "client-employee");
  }
  if (upper.includes("KB-08") && upper.includes("МЕСТА ИСПОЛЬЗОВАНИЯ")) {
    if (current.format === "mobile") return transition("xqWeH", current, screens);
    return { effect: "file-usage" };
  }
  if (upper.includes("KB-08") && upper.includes("МЕНЮ:")) {
    if (current.format === "mobile") return transition("xqWeH", current, screens);
    return { notice: "Действия с файлом открыты в демонстрационном режиме." };
  }
  if (upper.includes("BITRIX24")) {
    return {
      notice: "В демонстрационном режиме внешняя карточка Битрикс24 не открывается.",
    };
  }
  if (upper.includes("СКАЧАТЬ") || upper.includes("KB-08 ФАЙЛ ")) {
    return {
      notice: "Демонстрационный файл подготовлен к скачиванию.",
      effect: "download",
    };
  }
  if (/PLAT-04 .*\//.test(upper) || /ВСТАВИТЬ |ФИЛЬТР (?:PDF|DOCX|DWG|ZIP|XLSX|ВИДЕО)/.test(upper)) {
    return { notice: "Настройка переключена в демонстрационном режиме.", effect: "toggle" };
  }

  const group = targetGroup(target);
  if (!group) {
    return { notice: "Действие выполнено в демонстрационном режиме." };
  }

  const startRole = roleFromTarget(target);
  if (group === "SHELL-02" && startRole && current.role === "guest") {
    const format = upper.includes("MOBILE") ? "mobile" : upper.includes("DESKTOP") ? "desktop" : current.format;
    const nextState = startForRole(startRole, format, screens);
    return { nextState, presentation: "screen" };
  }
  if (group === "SHELL-02" && current.role === "guest") {
    const nextState = startForRole("client-employee", current.format, screens);
    return { nextState, presentation: "screen" };
  }
  if (
    group === "KB-04" &&
    current.role === "manager" &&
    ["zmzYb", "EZ9x6"].includes(current.screenId)
  ) {
    return {
      ...transition(fixedScreens["KB-02"][current.format], current, screens),
      notice: "Черновик открыт менеджеру в режиме просмотра.",
    };
  }
  if (!canOpenGroup(group, current.role)) return deniedTransition(group, current, screens);

  if (
    group === "KB-04" &&
    ["sUjWN", "lR77f", "cKrvi", "bTLLo"].includes(current.screenId) &&
    (upper.includes("ИМПОРТ") || upper.includes("ПОВТОР"))
  ) {
    return { effect: "import-choice" };
  }

  if (group === "AUTH-03" && upper.includes("РЕЗУЛЬТАТ")) {
    return { effect: "registration-choice" };
  }

  const kbStructureStates = ["ACWsj", "DZOE5", "skXOD", "QTBXk", "h89rfQ", "rXopt", "uzUQh", "t4bJW"];
  if (group === "KB-06" && kbStructureStates.includes(current.screenId)) {
    return {
      ...transition(fixedScreens["KB-06"][current.format], current, screens),
      notice: /СОЗДАТЬ|ГОТОВО|УДАЛИТЬ/.test(upper)
        ? "Изменение структуры сохранено в демонстрационном режиме."
        : undefined,
    };
  }

  const kbTagForms = ["iCoVo", "lppE3", "aDQSp", "o9KtI", "zdyBM", "wIfdF", "S3qFr", "l0pieT"];
  if (group === "KB-07" && kbTagForms.includes(current.screenId)) {
    if (/СОХРАНИТЬ|СОЗДАТЬ/.test(upper)) {
      return {
        ...transition(current.format === "mobile" ? "HCLrN" : "cDAZn", current, screens),
        notice: "Тег или группа сохранены в демонстрационном режиме.",
      };
    }
    if (/ОТМЕНА|ЗАКРЫТЬ/.test(upper)) {
      return transition(fixedScreens["KB-07"][current.format], current, screens);
    }
  }
  if (group === "KB-07" && ["cDAZn", "HCLrN"].includes(current.screenId)) {
    return transition(fixedScreens["KB-07"][current.format], current, screens);
  }

  const special = resolveSpecialState(group, target, current, screens);
  if (special) return special;

  if (group === "SHELL-01") {
    if (current.role === "guest") return transition(fixedScreens["AUTH-02"][current.format], current, screens);
    const mapping = upper.includes("ПРОФИЛ") ? roleProfileMenu : roleShellMenu;
    return {
      ...transition(mapping[current.role][current.format], current, screens),
      presentation: "overlay",
    };
  }
  if (group === "SHELL-02") {
    return transition(roleHome[current.role][current.format], current, screens);
  }
  if (group === "KB-01") {
    if (current.role === "guest") return transition(fixedScreens["AUTH-02"][current.format], current, screens);
    if (upper.includes("ДЕРЕВО") || upper.includes("УЗЕЛ")) {
      return { notice: "Раздел базы знаний выбран.", effect: "toggle" };
    }
    return transition(roleKnowledgeBase[current.role][current.format], current, screens);
  }
  if (group === "KB-04") {
    if (upper.includes("НАЗАД")) {
      return transition(roleKnowledgeBase[current.role as Exclude<UserRole, "guest">][current.format], current, screens);
    }
    if (upper.includes("ПРЕДПРОСМОТР")) {
      return { notice: "Предпросмотр включён в демонстрационном режиме.", effect: "toggle" };
    }
  }
  if (group === "KB-05") {
    if (upper.includes("ПУБЛИКАЦ")) {
      const published = ["cuZKn", "U3ek80"].includes(current.screenId);
      const ids = published ? fixedScreens["KB-04"] : fixedScreens["KB-02"];
      return {
        ...transition(ids[current.format], current, screens),
        notice: published
          ? "Статья снята с публикации и открыта в редакторе."
          : "Статья опубликована в демонстрационном режиме.",
      };
    }
    if (/ВЫБРАТЬ ТЕГ|ИЗМЕНИТЬ ДОСТУП|ИЗМЕНИТЬ РАЗДЕЛ/.test(upper)) {
      return { notice: "Настройка статьи изменена.", effect: "toggle" };
    }
  }
  if (group === "ORG-01") {
    const addFormIds = ["rj3oR", "OciI4", "vxEMO", "FMqL5", "RloDv", "Xezct", "mEUkQ", "ZpU0A"];
    if (upper.includes("УСПЕХ К СПИСКУ") || upper.includes("ORG01 ОТМЕНА")) {
      return roleScopedScreen(roleCompanies, current, screens);
    }
    if (addFormIds.includes(current.screenId) && upper.includes("ДОБАВИТЬ КОМПАНИЮ КНОПКА")) {
      return transition(current.format === "mobile" ? "SKIpI" : "TZvbH", current, screens);
    }
    if (upper.includes("РАБОЧИЕ ДОМЕНЫ") || upper.includes("ВЫБОР ТИПА")) {
      return { notice: "Поле изменено в демонстрационном режиме.", effect: "toggle" };
    }
    if (upper.includes("ДОБАВИТЬ КОМПАНИЮ")) {
      const addIds =
        current.role === "manager"
          ? { desktop: "mEUkQ", mobile: "ZpU0A" }
          : { desktop: "rj3oR", mobile: "OciI4" };
      return transition(addIds[current.format], current, screens);
    }
    if (upper.includes("ДЕЙСТВИЯ")) return companyCardTransition(current, screens);
    return roleScopedScreen(roleCompanies, current, screens);
  }
  if (group === "ORG-02") {
    const editIds = ["Qommb", "oRhCX", "gve6z", "xWPPk", "nrtGI", "bMIrE"];
    if (upper.includes("УСПЕХ К КАРТОЧКЕ") || upper.includes("ORG01 ОТМЕНА")) {
      return companyCardTransition(current, screens);
    }
    if (editIds.includes(current.screenId) && upper.includes("ДОБАВИТЬ КОМПАНИЮ КНОПКА")) {
      return transition(current.format === "mobile" ? "H2EaW" : "qh4an", current, screens);
    }
    if (upper.includes("ДОБАВИТЬ ДОМЕН") || upper.includes("РАБОЧИЕ ДОМЕНЫ")) {
      return transition(current.format === "mobile" ? "bMIrE" : "nrtGI", current, screens);
    }
    if (upper.includes("ПОЛЬЗОВАТЕЛ")) {
      return companyCardTransition(current, screens, true);
    }
    if (upper.includes("РЕДАКТИРОВ")) {
      return transition(current.format === "mobile" ? "oRhCX" : "Qommb", current, screens);
    }
    return companyCardTransition(current, screens);
  }

  if (group === "ORG-03") {
    if (/ЗАКРЫТЬ|ОТМЕНА|К ТИПАМ/.test(upper)) {
      return transition(fixedScreens["ORG-03"][current.format], current, screens);
    }
    if (/СОХРАНИТЬ|СОЗДАТЬ ТИП/.test(upper)) {
      return transition(current.format === "mobile" ? "F3Zpzg" : "Co1XG", current, screens);
    }
    if (upper.includes("НОВЫЙ ТИП")) {
      return transition(current.format === "mobile" ? "f8cxdc" : "gjiKL", current, screens);
    }
    if (upper.includes("РЕДАКТИР")) {
      return transition(current.format === "mobile" ? "mZd7D" : "mAxar", current, screens);
    }
    if (upper.includes("УДАЛ")) {
      return transition(current.format === "mobile" ? "vifbh" : "E0Svd3", current, screens);
    }
  }

  if (group === "ORG-04") {
    if (
      ["vRMWJ", "P3UQ6"].includes(current.screenId) &&
      /ОТПРАВИТЬ ПРИГЛАШЕНИЕ|ПРИГЛАШЕНИЕ ОТПРАВЛЕНО/.test(upper)
    ) {
      return {
        ...roleScopedScreen(roleUsers, current, screens),
        notice: "Приглашение отправлено в демонстрационном режиме.",
      };
    }
    if (
      ["iBe5p", "R7HSg", "XfxSE", "MZaGw"].includes(current.screenId) &&
      /УСПЕХ/.test(upper)
    ) {
      return {
        ...roleScopedScreen(roleUsers, current, screens),
        notice: "Изменение пользователя сохранено в демонстрационном режиме.",
      };
    }
    if (upper.includes("ПРИГЛАШЕН") || upper.includes("ПРИГЛАСИТЬ")) {
      return transition(current.format === "mobile" ? "P3UQ6" : "vRMWJ", current, screens);
    }
    if (upper.includes("УДАЛ")) {
      return transition(current.format === "mobile" ? "MZaGw" : "XfxSE", current, screens);
    }
    if (upper.includes("СМЕНА РОЛ")) {
      return transition(current.format === "mobile" ? "R7HSg" : "iBe5p", current, screens);
    }
    return roleScopedScreen(roleUsers, current, screens);
  }

  if (group === "ORG-05") {
    if (upper.includes("РАЗБЛОКИРОВАТЬ") && !["nT7Vo", "VMDAp"].includes(current.screenId)) {
      return {
        notice: "Сотрудник разблокирован, история изменения сохранена.",
        effect: "toggle",
      };
    }
    if (["p5YVN1", "zsSXN"].includes(current.screenId) && upper.includes("ПОДТВЕРДИТЬ")) {
      return transition(current.format === "mobile" ? "VMDAp" : "nT7Vo", current, screens);
    }
    if (["nT7Vo", "VMDAp"].includes(current.screenId) && upper.includes("РАЗБЛОКИРОВАТЬ")) {
      return {
        ...transition(fixedScreens["ORG-05"][current.format], current, screens),
        notice: "Сотрудник разблокирован, история изменения сохранена.",
      };
    }
    if (["AGtab", "IX8g1"].includes(current.screenId)) {
      if (/ОТПРАВИТЬ ПРИГЛАШЕНИЕ|СОТРУДНИК ДОБАВЛЕН/.test(upper)) {
        return {
          ...transition(fixedScreens["ORG-05"][current.format], current, screens),
          notice: "Сотрудник добавлен в демонстрационном режиме.",
        };
      }
      if (/ЗАКРЫТЬ|ОТМЕНА/.test(upper)) {
        return transition(fixedScreens["ORG-05"][current.format], current, screens);
      }
    }
    if (/ДОБАВИТЬ СОТРУДНИКА|ДОБАВЛЕН/.test(upper)) {
      return transition(current.format === "mobile" ? "IX8g1" : "AGtab", current, screens);
    }
    if (/ЗАБЛОКИРОВАТЬ| МЕНЮ/.test(upper)) {
      return transition(current.format === "mobile" ? "zsSXN" : "p5YVN1", current, screens);
    }
    if (/НЕТ ДОСТУПА НАЗАД|ORG-05 MOBILE/.test(upper)) {
      return transition(fixedScreens["ORG-05"][current.format], current, screens);
    }
  }

  if (group === "PLAT-02") {
    if (upper.includes("ПРОВЕРИТЬ ПОДКЛЮЧЕНИЕ")) {
      return transition("vtcHL", current, screens);
    }
    if (upper.includes("ОШИБКА ПОВТОРИТЬ")) {
      return transition(fixedScreens["PLAT-02"][current.format], current, screens);
    }
  }

  const fixed = fixedScreens[group];
  if (fixed) return transition(fixed[current.format], current, screens);
  return { notice: "Действие выполнено в демонстрационном режиме." };
};
