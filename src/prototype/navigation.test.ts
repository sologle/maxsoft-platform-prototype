import { describe, expect, it } from "vitest";
import { screens } from "../generated/screens";
import {
  canRoleViewScreen,
  createInitialState,
  registrationOutcomeState,
  resolveAction,
  startForRole,
  type PrototypeState,
} from "./navigation";

const state = (overrides: Partial<PrototypeState> = {}): PrototypeState => ({
  ...createInitialState(),
  screenId: "oge4c",
  role: "manager",
  format: "desktop",
  ...overrides,
});

describe("маршрутизация прототипа этапа 1", () => {
  it("не показывает в прямой ссылке и селекторе экраны чужой роли", () => {
    const adminKnowledgeBase = screens.find((screen) => screen.id === "Fy0nE");
    const supportCompanies = screens.find((screen) => screen.id === "umm3u");
    const managerUsers = screens.find((screen) => screen.id === "du8aB");
    if (!adminKnowledgeBase || !supportCompanies || !managerUsers) {
      throw new Error("TEST_ROLE_SCREEN_MISSING");
    }

    expect(canRoleViewScreen(adminKnowledgeBase, "portal-admin")).toBe(true);
    expect(canRoleViewScreen(adminKnowledgeBase, "client-employee")).toBe(false);
    expect(canRoleViewScreen(supportCompanies, "manager")).toBe(false);
    expect(canRoleViewScreen(managerUsers, "support-engineer")).toBe(false);
  });

  it("открывает отдельную desktop/mobile ветку для каждой роли", () => {
    expect(startForRole("portal-admin", "desktop", screens).screenId).toBe("pmHIA");
    expect(startForRole("portal-admin", "mobile", screens).screenId).toBe("NllPS");
    expect(startForRole("guest", "mobile", screens).screenId).toBe("kiGN4");
  });

  it("отличает мобильный полноэкранный flow от модального фрагмента", () => {
    const registration = resolveAction(
      "ACTION → AUTH-03 · mobile",
      state({ screenId: "kiGN4", role: "guest", format: "mobile" }),
      screens,
    );
    expect(registration.nextState?.screenId).toBe("atKnC");
    expect(registration.presentation).toBe("screen");

    const structureModal = resolveAction(
      "ACTION → KB-06 Создание раздела mobile",
      state({ screenId: "n50Krp", role: "portal-admin", format: "mobile" }),
      screens,
    );
    expect(structureModal.nextState?.screenId).toBe("h89rfQ");
    expect(structureModal.presentation).toBe("overlay");
  });

  it("не переводит mobile-сценарий на desktop-фрейм", () => {
    const result = resolveAction(
      "ACTION → KB-01-DESKTOP",
      state({ screenId: "bLysq", format: "mobile" }),
      screens,
    );
    expect(result.nextState?.format).toBe("mobile");
    expect(result.nextState?.screenId).toBe("EZ9x6");
  });

  it("не даёт менеджеру открыть редактор", () => {
    const result = resolveAction("ACTION → KB-04", state(), screens);
    expect(result.nextState?.screenId).toBe("RsiVN");
    expect(result.notice).toContain("недоступен");
  });

  it("не даёт инженеру менять роли пользователей", () => {
    const result = resolveAction(
      "ACTION → ORG-04 смена роли",
      state({ screenId: "zqEl6", role: "support-engineer" }),
      screens,
    );
    expect(result.nextState).toBeUndefined();
    expect(result.notice).toContain("администратор портала");
  });

  it("не выдаёт доступ после ручной проверки регистрации", () => {
    const result = resolveAction(
      "ACTION → SHELL-02-CLIENT-EMPLOYEE-DESKTOP",
      state({ screenId: "M7poB", role: "guest" }),
      screens,
    );
    expect(result.nextState?.screenId).toBe("o046g");
    expect(result.nextState?.role).toBe("guest");
  });

  it("возвращает клиента по закрытой ссылке к статье после входа", () => {
    const result = resolveAction(
      "ACTION → KB-02 исходная статья · D/M",
      state({ screenId: "sj2b0", role: "guest" }),
      screens,
    );
    expect(result.nextState?.screenId).toBe("yretl");
  });

  it("открывает карточку из меню действий компании и форму создания", () => {
    const admin = state({ screenId: "zv0ob", role: "portal-admin" });
    expect(
      resolveAction(
        "ACTION → ORG-01 Компании / ORG-01 Действия ООО «СеверПромБИМ»",
        admin,
        screens,
      ).nextState?.screenId,
    ).toBe("pgMj9");
    expect(
      resolveAction("ACTION → ORG-01 Компании / ORG-01 Добавить компанию", admin, screens)
        .nextState?.screenId,
    ).toBe("rj3oR");
  });

  it("отвечает заглушкой на внешнее или ещё не моделируемое действие", () => {
    const result = resolveAction(
      "ACTION → BITRIX24 / Карточка компании",
      state({ role: "portal-admin" }),
      screens,
    );
    expect(result.nextState).toBeUndefined();
    expect(result.notice).toContain("демонстрационном режиме");
  });

  it("выполняет гостевой happy path входа и регистрации", () => {
    const login = resolveAction(
      "ACTION → SHELL-02",
      state({ screenId: "o046g", role: "guest" }),
      screens,
    );
    expect(login.nextState?.screenId).toBe("uLhhN");
    expect(login.nextState?.role).toBe("client-employee");

    const registration = resolveAction(
      "ACTION → AUTH-03 РЕЗУЛЬТАТ",
      state({ screenId: "YDq1G", role: "guest" }),
      screens,
    );
    expect(registration.effect).toBe("registration-choice");
  });

  it("проводит восстановление пароля по шагам", () => {
    const guest = state({ screenId: "wP6Wy", role: "guest" });
    expect(resolveAction("ACTION → AUTH-04 ШАГ 2", guest, screens).nextState?.screenId).toBe(
      "Dl3Cm",
    );
    expect(
      resolveAction("ACTION → AUTH-04 УСПЕХ", { ...guest, screenId: "mr7T4" }, screens).nextState
        ?.screenId,
    ).toBe("O2bvy");
  });

  it("моделирует импорт и скачивание вложения", () => {
    const author = state({ screenId: "sUjWN", role: "support-engineer" });
    const imported = resolveAction("ACTION → KB-04 Импорт DOCX", author, screens);
    expect(imported.nextState?.screenId).toBe("oCUJK");
    expect(imported.presentation).toBe("overlay");

    const download = resolveAction(
      "ACTION → KB-03 Статья / KB-03 Скачать инструкция.pdf",
      { ...author, screenId: "M6IoTK" },
      screens,
    );
    expect(download.effect).toBe("download");

    const mobileAttachment = resolveAction(
      "ACTION → KB-08 Файл инструкция_подключения.pdf",
      { ...author, screenId: "dcJkq", format: "mobile", role: "portal-admin" },
      screens,
    );
    expect(mobileAttachment.effect).toBe("download");
    expect(mobileAttachment.notice).toContain("файл");
  });

  it("открывает мобильные места использования файла и отдельно скачивает его", () => {
    const registry = state({ screenId: "EzOlK", role: "portal-admin", format: "mobile" });
    expect(
      resolveAction("ACTION → KB-08 Места использования · mobile", registry, screens).nextState
        ?.screenId,
    ).toBe("xqWeH");
    expect(
      resolveAction(
        "ACTION → KB-08 Меню: Скачать / Открыть места использования",
        registry,
        screens,
      ).nextState?.screenId,
    ).toBe("xqWeH");
    expect(resolveAction("ACTION → KB-08 Скачать файл", registry, screens).effect).toBe(
      "download",
    );
  });

  it("открывает достижимые состояния перемещения и удаления структуры", () => {
    const structure = state({ screenId: "CQojg", role: "portal-admin" });
    expect(
      resolveAction(
        "ACTION → KB-06 Настройка структуры БЗ / KB-06 Узел Продукты Drag handle",
        structure,
        screens,
      ).nextState?.screenId,
    ).toBe("skXOD");
    expect(
      resolveAction(
        "ACTION → KB-06 Настройка структуры БЗ / KB-06 Узел Продукты Удалить",
        structure,
        screens,
      ).nextState?.screenId,
    ).toBe("QTBXk");
  });

  it("предлагает выбрать один из трёх бизнес-исходов регистрации", () => {
    const registration = state({ screenId: "YDq1G", role: "guest" });
    const result = resolveAction(
      "ACTION → AUTH-03 РЕЗУЛЬТАТ",
      registration,
      screens,
    );
    expect(result.effect).toBe("registration-choice");
    expect(result.nextState).toBeUndefined();
    expect(registrationOutcomeState("existing-company", registration, screens).screenId).toBe(
      "Onl5J",
    );
    expect(registrationOutcomeState("new-company", registration, screens).screenId).toBe("ljwfR");
    expect(registrationOutcomeState("manual-review", registration, screens).screenId).toBe("M7poB");

    const newCompanyLogin = resolveAction(
      "ACTION → SHELL-02",
      state({ screenId: "ljwfR", role: "guest" }),
      screens,
    );
    expect(newCompanyLogin.nextState?.role).toBe("client-admin");
  });

  it("связывает CRUD компании и типа компании", () => {
    const admin = state({ screenId: "rj3oR", role: "portal-admin" });
    expect(
      resolveAction(
        "ACTION → ORG-01 Компании · добавить компанию / ORG01 Добавить компанию кнопка",
        admin,
        screens,
      ).nextState?.screenId,
    ).toBe("TZvbH");
    expect(
      resolveAction(
        "ACTION → ORG-02 Карточка компании · Общее / ORG-02 Общее / Добавить домен",
        { ...admin, screenId: "pgMj9" },
        screens,
      ).nextState?.screenId,
    ).toBe("nrtGI");
    expect(
      resolveAction(
        "ACTION → ORG-03 Типы компаний / ORG-03 Новый тип",
        { ...admin, screenId: "iPAn6" },
        screens,
      ).nextState?.screenId,
    ).toBe("gjiKL");
    expect(
      resolveAction(
        "ACTION → ORG-03 Типы компаний / ВИП-клиент Удалить",
        { ...admin, screenId: "iPAn6" },
        screens,
      ).nextState?.screenId,
    ).toBe("E0Svd3");
  });

  it("подтверждает блокировку сотрудника клиента", () => {
    const clientAdmin = state({ screenId: "p5YVN1", role: "client-admin" });
    expect(
      resolveAction(
        "ACTION → ORG-05 Пользователи компании · заблокировать сотрудника / ORG05 Диалог подтвердить",
        clientAdmin,
        screens,
      ).nextState?.screenId,
    ).toBe("nT7Vo");
    const unblocked = resolveAction(
      "ACTION → ORG-05 разблокировать mobile / Сидоров Павёл",
      state({ screenId: "YD7vh", role: "client-admin", format: "mobile" }),
      screens,
    );
    expect(unblocked.nextState).toBeUndefined();
    expect(unblocked.notice).toContain("разблокирован");
  });

  it("открывает подсказки поиска и ошибку проверки интеграции", () => {
    expect(
      resolveAction(
        "ACTION → SRCH-01-DESKTOP-TAG-SUGGESTIONS",
        state({ screenId: "Tb3co", role: "client-employee" }),
        screens,
      ).nextState?.screenId,
    ).toBe("neKET");
    expect(
      resolveAction(
        "ACTION → PLAT-02 Интеграции / PLAT-02 Проверить подключение",
        state({ screenId: "o43HZq", role: "portal-admin" }),
        screens,
      ).nextState?.screenId,
    ).toBe("vtcHL");
    expect(
      resolveAction(
        "ACTION INPUT → SRCH-01-EMPTY-DESKTOP",
        state({ screenId: "Tb3co", role: "client-employee" }),
        screens,
      ).nextState?.screenId,
    ).toBe("c4Kmz");
  });

  it("обрабатывает все четыре таймкода видео", () => {
    const video = state({ screenId: "M6IoTK", role: "client-employee" });
    expect(resolveAction("ACTION → KB-03 Видео 07:12", video, screens)).toMatchObject({
      effect: "toggle",
      notice: expect.stringContaining("07:12"),
    });
  });

  it("завершает публикацию переходом к статье, а снятие — к редактору", () => {
    const publishedPanel = state({ screenId: "cuZKn", role: "portal-admin" });
    expect(resolveAction("ACTION → KB-05 Публикация", publishedPanel, screens)).toMatchObject({
      nextState: { screenId: "sUjWN", format: "desktop" },
      notice: expect.stringContaining("снята с публикации"),
    });

    const draftPanel = state({
      screenId: "Q5hjgX",
      role: "portal-admin",
      format: "mobile",
    });
    expect(resolveAction("ACTION → KB-05 Публикация", draftPanel, screens)).toMatchObject({
      nextState: { screenId: "FYI4I", format: "mobile" },
      notice: expect.stringContaining("опубликована"),
    });
  });

  it("разрешает авторизованным ролям универсальные экраны отказа", () => {
    const platformDenied = screens.find((screen) => screen.id === "ka4TG");
    if (!platformDenied) throw new Error("TEST_DENIED_SCREEN_MISSING");
    expect(canRoleViewScreen(platformDenied, "manager")).toBe(true);
    expect(canRoleViewScreen(platformDenied, "guest")).toBe(false);
  });

  it("открывает черновик менеджеру только для чтения", () => {
    const result = resolveAction(
      "ACTION → KB-04 Редактор статьи",
      state({ screenId: "zmzYb", role: "manager" }),
      screens,
    );
    expect(result.nextState?.screenId).toBe("yretl");
    expect(result.notice).toContain("режиме просмотра");
  });

  it("возвращает из мобильных форм пользователей к спискам после сохранения", () => {
    const admin = state({ screenId: "P3UQ6", role: "portal-admin", format: "mobile" });
    expect(
      resolveAction("ACTION → ORG-04 приглашение отправлено mobile", admin, screens).nextState
        ?.screenId,
    ).toBe("FmZWA");
    expect(
      resolveAction(
        "ACTION → ORG-04 Смена роли успех mobile",
        { ...admin, screenId: "R7HSg" },
        screens,
      ).nextState?.screenId,
    ).toBe("FmZWA");

    const clientAdmin = state({
      screenId: "IX8g1",
      role: "client-admin",
      format: "mobile",
    });
    expect(
      resolveAction("ACTION → ORG-05 сотрудник добавлен mobile", clientAdmin, screens).nextState
        ?.screenId,
    ).toBe("YD7vh");
  });

  it("закрывает мобильные операции со структурой БЗ после применения", () => {
    const admin = state({ screenId: "h89rfQ", role: "portal-admin", format: "mobile" });
    expect(
      resolveAction("ACTION → KB-06 создание Создать", admin, screens).nextState?.screenId,
    ).toBe("n50Krp");
    expect(
      resolveAction(
        "ACTION → KB-06 переименование Готово",
        { ...admin, screenId: "rXopt" },
        screens,
      ).nextState?.screenId,
    ).toBe("n50Krp");
  });

  it("показывает сохранённое состояние после отправки полноэкранной формы тега", () => {
    const admin = state({ screenId: "zdyBM", role: "portal-admin", format: "mobile" });
    expect(
      resolveAction(
        "ACTION → KB-07 Теги и группы тегов · новый тег · mobile / KB07 Mobile Сохранить",
        admin,
        screens,
      ).nextState?.screenId,
    ).toBe("HCLrN");
    expect(
      resolveAction(
        "ACTION → KB-07 Теги и группы тегов · сохранено · mobile / KB07 Mobile К списку",
        { ...admin, screenId: "HCLrN" },
        screens,
      ).nextState?.screenId,
    ).toBe("WmKrc");
  });
});
