import { describe, expect, it } from "vitest";
import { screens } from "../generated/screens";
import {
  createInitialState,
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
  it("открывает отдельную desktop/mobile ветку для каждой роли", () => {
    expect(startForRole("portal-admin", "desktop", screens).screenId).toBe("pmHIA");
    expect(startForRole("portal-admin", "mobile", screens).screenId).toBe("NllPS");
    expect(startForRole("guest", "mobile", screens).screenId).toBe("kiGN4");
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
    expect(registration.nextState?.screenId).toBe("Onl5J");
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
