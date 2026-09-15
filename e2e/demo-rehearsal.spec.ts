import { test, expect } from "@playwright/test";

test("репетиция короткого маршрута по пяти ролям без технических переходов", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  page.setDefaultTimeout(15000);
  const started = Date.now();
  const button = (name: string) =>
    page.getByRole("button", { name, exact: true });
  const closeDialog = async () => {
    const dialog = page.getByRole("dialog");
    await dialog.evaluate(async (node) => {
      await Promise.all(
        node
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      );
    });
    await dialog.getByRole("button", { name: "Закрыть", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  };
  const nav = async (name: string) => {
    if (info.project.name.includes("mobile") && name === "Поиск") {
      await page
        .getByRole("button", { name: "Открыть поиск", exact: true })
        .click();
      return;
    }
    if (info.project.name.includes("mobile"))
      await button("Открыть меню").click();
    await page.getByRole("link", { name, exact: true }).click();
  };
  const role = async (label: string) => {
    await button("Открыть панель сценариев").click();
    await page
      .locator('button[aria-describedby="scenario-role-label"]')
      .click();
    await page.getByRole("option", { name: label, exact: true }).click();
    await button("Свернуть панель").click();
  };
  const admin = async (label: string) => {
    await nav("Администрирование");
    await page
      .getByRole("button")
      .filter({ has: page.getByText(label, { exact: true }) })
      .click();
  };
  await page.goto("./?page=landing&role=guest");
  await button("Регистрация").click();
  await expect(page.getByLabel("Отдел", { exact: true })).toBeVisible();
  await button("Уже есть аккаунт").click();
  await page.getByLabel("Электронная почта").fill("o.gurov@integrator-pro.ru");
  await page.getByLabel("Пароль", { exact: true }).fill("maxsoft-demo");
  await button("Войти").click();
  await expect(
    page.getByRole("heading", { name: "Рабочее пространство" }),
  ).toBeVisible();
  await nav("База знаний");
  if (info.project.name.includes("mobile"))
    await button("Показать разделы").click();
  await button("НАВИСА").click();
  if (info.project.name.includes("mobile"))
    await button("Показать разделы").click();
  await button("Вся база знаний").click();
  await button("Крупные карточки").click();
  await button("Открыть материал: Настройка сетевой лицензии").click();
  await button("Развернуть содержание статьи").click();
  for (let i = 0; i < 4; i++) await button("Увеличить размер текста").click();
  await button("Развернуть содержание статьи").click();
  await page
    .getByRole("link", { name: "Перед началом работы", exact: true })
    .click();
  if (await button("Развернуть содержание статьи").count())
    await button("Развернуть содержание статьи").click();
  await button("Сбросить размер текста до 100%").click();
  await button("На весь экран").click();
  await button("Развернуть содержание статьи").click();
  await button("Закрыть содержание").click();
  await button("Выйти из полноэкранного режима").click();
  await page
    .getByRole("button", {
      name: "Открыть файл: инструкция_активации.pdf",
      exact: true,
    })
    .click();
  await button("Повернуть страницу").click();
  await button("Сбросить вид").click();
  await button("Назад").click();
  await page
    .getByRole("button", {
      name: "Открыть файл: регламент_обновления.docx",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("file-preview-document")).toContainText(
    "журнал обновления",
  );
  await button("Назад").click();
  await button("Назад").click();
  await button(
    "Открыть материал: Настройка интеграции с САПР-комплексом",
  ).click();
  await page.getByRole("button", { name: /07:12/ }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /схема_подключения.dwg/ }).click();
  expect((await download).suggestedFilename()).toContain(".demo.txt");
  await nav("Поиск");
  await page
    .getByRole("textbox", { name: "Поиск по базе знаний" })
    .fill("адрес сервера");
  await button("Найти").click();
  await button("Открыть материал: Настройка сетевой лицензии").click();
  await button("Назад").click();
  await expect(
    page.getByRole("textbox", { name: "Поиск по базе знаний" }),
  ).toHaveValue("адрес сервера");
  await button("Очистить поиск").click();
  if (info.project.name.includes("mobile")) await button("Фильтры").click();
  await button("Лицензирование").click();
  await button("НАВИСА").and(page.locator("[aria-pressed]")).click();
  await button("Сбросить фильтры").click();
  if (info.project.name.includes("mobile"))
    await button("Показать результаты").click();
  await role("Администратор клиента");
  await nav("Сотрудники");
  await button("Добавить сотрудника").click();
  const invite = page.getByRole("dialog");
  for (const [label, value] of [
    ["Имя", "Иван"],
    ["Фамилия", "Демо"],
    ["Корпоративная почта", "ivan.demo1609@severprom.ru"],
    ["Должность", "Инженер"],
    ["Отдел", "Проектирование"],
    ["Телефон", "+7 999 000-16-09"],
  ])
    await invite.getByLabel(label, { exact: true }).fill(value);
  await invite.getByLabel("Роль").selectOption("Сотрудник клиента");
  await button("Отправить приглашение").click();
  await expect(
    page.getByText("Иван Демо", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await button("Действия: Иван Демо").click();
  await page
    .getByRole("menuitem", { name: "Заблокировать", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Заблокировать сотрудника" }),
  ).toBeVisible();
  await closeDialog();
  await role("Менеджер");
  await nav("Компании");
  await page
    .getByRole("button", {
      name: "Открыть компанию: ООО «СеверПромБИМ»",
      exact: true,
    })
    .filter({ visible: true })
    .click();
  await button("Редактировать").click();
  await button("Добавить домен").click();
  await page
    .getByLabel("Рабочий домен 3", { exact: true })
    .fill("docs.demo1609.example");
  await button("Отмена").click();
  await button("Назад").click();
  await nav("Пользователи");
  await role("Инженер ТП");
  await nav("База знаний");
  await button("Открыть материал: Настройка сетевой лицензии").click();
  await button("Редактировать").click();
  await button("Настройки").click();
  await expect(page.getByRole("dialog")).toContainText("Темы");
  await closeDialog();
  await button("Импорт DOCX").click();
  await page
    .getByRole("dialog")
    .locator('input[type="file"]')
    .setInputFiles("e2e/fixtures/MaxSoft_demo_import.docx");
  await button("Показать демонстрацию").click();
  await button("Открыть демонстрационный черновик").click();
  await expect(
    page.getByText(/Демонстрационный макет — не сохранён/),
  ).toBeVisible();
  await role("Администратор");
  await admin("Поля компании");
  await button("Пояснение: Требовать заполнения").first().click();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await admin("Типы компаний");
  await page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "ВИП-клиент", exact: true }),
    })
    .getByRole("button", { name: "Удалить", exact: true })
    .click();
  await button("Отмена").click();
  await admin("Теги и группы");
  await admin("Структура базы знаний");
  await button("Добавить подраздел: Установка").click();
  await page.getByLabel("Название раздела").fill("Демо 1609");
  await button("Создать").click();
  await admin("Доступ к материалам");
  await page.getByLabel("Компания для проверки").selectOption("integrator-pro");
  await expect(
    page.locator("summary").filter({ hasText: "Демо 1609" }),
  ).toBeVisible();
  await page
    .locator("details")
    .filter({ has: page.locator("summary").filter({ hasText: /^Установка/ }) })
    .last()
    .getByRole("button", { name: "Закрыть раздел", exact: true })
    .first()
    .click();
  await button("Отмена").click();
  await admin("Реестр файлов");
  await button("Табличный вид").click();
  await page.getByRole("row").filter({ hasText: "регламент_обновления.docx" }).getByRole("button", { name: "3 статьи", exact: true }).click();
  await closeDialog();
  await admin("Журнал действий");
  await admin("Интеграции");
  await nav("Пользователи");
  await page
    .getByRole("textbox", { name: "Поиск пользователей" })
    .fill("ivan.demo1609@severprom.ru");
  await button("Действия: Иван Демо").click();
  await page
    .getByRole("menuitem", { name: "Изменить роль", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByLabel("Новая роль")).toHaveValue(
    "Сотрудник клиента",
  );
  await button("Отмена").click();
  await button("Действия: Иван Демо").click();
  await page.screenshot({
    path: `/tmp/demo-publish-menu-${info.project.name}.png`,
    animations: "disabled",
  });
  await page
    .getByRole("menuitem", { name: "Отозвать доступ", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Отозвать доступ" }),
  ).toBeVisible();
  await button("Отмена").click();
  console.log(
    `REHEARSAL ${info.project.name}: ${((Date.now() - started) / 1000).toFixed(1)} seconds; five roles completed`,
  );
});
