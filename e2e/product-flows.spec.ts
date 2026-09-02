import { expect, test, type Page } from "@playwright/test";

const watchErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return () => expect(errors).toEqual([]);
};

test("гость проходит регистрацию и попадает в адаптивный кабинет", async ({ page }) => {
  const verifyErrors = watchErrors(page);
  await page.goto("./?page=register&role=guest");
  await page.getByLabel("Корпоративная почта").fill("admin@severprom.ru");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  const result = page.getByRole("dialog", { name: "Регистрация завершена" });
  await expect(result).toContainText("Компания найдена");
  await result.getByRole("button", { name: "Перейти в портал" }).click();
  await expect(page.getByRole("heading", { name: "Рабочее пространство" })).toBeVisible();
  await expect(page).toHaveURL(/role=client-admin/);
  verifyErrors();
});

test("восстановление доступа проходит все состояния", async ({ page }) => {
  await page.goto("./?page=recover&role=guest");
  await page.getByRole("button", { name: "Получить ссылку" }).click();
  await expect(page.getByRole("heading", { name: "Новый пароль" })).toBeVisible();
  await page.getByRole("button", { name: "Сохранить пароль" }).click();
  await expect(page.getByRole("heading", { name: "Пароль изменён" })).toBeVisible();
  await page.getByRole("button", { name: "Перейти ко входу" }).click();
  await expect(page.getByRole("heading", { name: /Вход|С возвращением/ })).toBeVisible();
});

test("редактор импортирует DOCX, показывает ошибку и сохраняет настройки", async ({ page }) => {
  await page.goto("./?page=editor&role=portal-admin");
  await page.getByLabel("Стиль абзаца").selectOption("Подзаголовок");
  await expect(page.getByRole("status").filter({ hasText: "Подзаголовок" })).toBeVisible();
  await page.getByRole("button", { name: "Импорт DOCX" }).click();
  const importDialog = page.getByRole("dialog", { name: "Импорт из Word" });
  await importDialog.getByRole("button", { name: "Показать ошибку" }).click();
  await expect(importDialog).toContainText("Не удалось импортировать файл");
  await importDialog.getByRole("button", { name: "Повторить" }).click();
  await importDialog.getByRole("button", { name: "Импортировать" }).click();
  await expect(importDialog).toContainText("Документ импортирован", { timeout: 4000 });
  await importDialog.getByRole("button", { name: "Открыть импортированный черновик" }).click();
  await expect(page.getByLabel("Название статьи")).toHaveValue("Регламент работы с проектами");

  await page.getByRole("button", { name: "Настройки" }).click();
  const settings = page.getByRole("dialog", { name: "Настройки статьи" });
  await settings.getByRole("switch", { name: "Публикация статьи" }).click();
  await settings.getByRole("button", { name: "Сохранить настройки" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Настройки статьи сохранены" })).toBeVisible();
});

test("фильтры поиска применяются без пустого действия", async ({ page }, testInfo) => {
  await page.goto("./?page=search&role=portal-admin");
  const apply = page.getByRole("button", { name: "Показать результаты" });
  if (testInfo.project.name.startsWith("mobile")) {
    await page.getByRole("button", { name: /^Фильтры/ }).click();
    await expect(apply).toBeVisible();
    await apply.click();
    await expect(page.getByRole("dialog", { name: "Фильтры поиска" })).toBeHidden();
  } else {
    await expect(apply).toHaveCount(0);
  }
});

test("структура раскрывается и позволяет создать раздел", async ({ page }) => {
  await page.goto("./?page=structure&role=portal-admin");
  const products = page.getByRole("button", { name: "Свернуть раздел Продукты" });
  await products.click();
  await expect(page.getByText("Model Studio CS", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Развернуть раздел Продукты" }).click();
  await expect(page.getByText("Model Studio CS", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Добавить раздел" }).click();
  const dialog = page.getByRole("dialog", { name: "Новый раздел" });
  await dialog.getByLabel("Название раздела").fill("Первые шаги");
  await dialog.getByRole("button", { name: "Создать" }).click();
  await expect(page.getByText("Первые шаги", { exact: true })).toBeVisible();
});

test("теги создаются внутри выбранной группы", async ({ page }) => {
  await page.goto("./?page=tags&role=portal-admin");
  await page.getByRole("button", { name: "Новый тег" }).click();
  const dialog = page.getByRole("dialog", { name: "Новый тег" });
  await dialog.getByLabel("Название тега").fill("Совместимость");
  await dialog.getByLabel("Группа").selectOption({ label: "Темы" });
  await dialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Совместимость", { exact: true })).toBeVisible();
});

test("реестр файлов открывает адаптивную панель использования", async ({ page }, testInfo) => {
  await page.goto("./?page=files&role=portal-admin");
  if (testInfo.project.name.startsWith("mobile")) {
    await page.getByRole("button", { name: "Где используется" }).first().click();
  } else {
    await page.getByRole("button", { name: "2 статьи" }).click();
  }
  const dialog = page.getByRole("dialog", { name: "Места использования" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Настройка сетевой лицензии/ }).click();
  await expect(page.getByRole("heading", { name: "Настройка сетевой лицензии" })).toBeVisible();
});

test("поиск меняет выдачу и открывает найденное видео", async ({ page }) => {
  await page.goto("./?page=search&role=client-employee");
  const input = page.getByRole("textbox", { name: "Поиск по базе знаний" });
  await input.fill("интеграция");
  await input.press("Enter");
  await expect(page.getByRole("heading", { name: "Настройка интеграции с САПР-комплексом" })).toBeVisible();
  await page.getByRole("button", { name: "Открыть: Настройка интеграции с САПР-комплексом" }).click();
  await expect(page.getByRole("heading", { name: "Настройка интеграции с САПР-комплексом" })).toBeVisible();
});

test("компания редактируется в modal или bottom sheet", async ({ page }) => {
  await page.goto("./?page=company&role=portal-admin");
  await page.getByRole("button", { name: "Редактировать" }).click();
  const dialog = page.getByRole("dialog", { name: "Редактирование компании" });
  await dialog.getByLabel("Рабочий домен").fill("new.severprom.ru");
  await dialog.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(page.getByRole("status")).toContainText("Изменения компании сохранены");
});

test("инженер приглашает пользователя без назначения роли", async ({ page }) => {
  await page.goto("./?page=users&role=support-engineer");
  await page.getByRole("button", { name: "Пригласить пользователя" }).click();
  const dialog = page.getByRole("dialog", { name: "Пригласить пользователя" });
  await expect(dialog.getByLabel("Роль")).toHaveCount(0);
  await dialog.getByLabel("Имя").fill("Иван");
  await dialog.getByLabel("Фамилия").fill("Петров");
  await dialog.getByLabel("Корпоративная почта").fill("i.petrov@severprom.ru");
  await dialog.getByRole("button", { name: "Отправить приглашение" }).click();
  await expect(page.getByRole("status")).toContainText("Приглашение отправлено");
});

test("интеграции и настройки полей реагируют на действия", async ({ page }) => {
  await page.goto("./?page=integrations&role=portal-admin");
  await page.getByRole("button", { name: "Проверить подключение" }).first().click();
  await expect(page.getByText("Подключение работает").first()).toBeVisible({ timeout: 3000 });
  await page.goto("./?page=fields&role=portal-admin");
  const fieldSwitch = page.getByRole("switch", { name: "Обязательное: Контактные данные" });
  const before = await fieldSwitch.getAttribute("aria-checked");
  await fieldSwitch.click();
  await expect(fieldSwitch).toHaveAttribute("aria-checked", before === "true" ? "false" : "true");
});
