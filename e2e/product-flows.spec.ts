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

test("новая регистрация получает фактический базовый тип компании", async ({ page }) => {
  await page.goto("./?page=register&role=guest");
  await page.getByLabel("Корпоративная почта").fill("owner@new-company.ru");
  await page.getByLabel("Полное наименование").fill("ООО «Новая компания»");
  await page.getByLabel("Сокращённое наименование").fill("Новая компания");
  await page.getByLabel("ИНН").fill("1234567001");
  await page.getByLabel("Рабочие домены").fill("new-company.ru");
  await page.getByLabel("Основной email").fill("owner@new-company.ru");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  const result = page.getByRole("dialog", { name: "Регистрация завершена" });
  await expect(result).toContainText("Компания создана");
  await result.getByRole("button", { name: "Перейти в портал" }).click();
  await expect(page.getByText("Настройка сетевой лицензии", { exact: true })).toBeVisible();
  await expect(page.getByText("Настройка интеграции с САПР-комплексом", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Подготовка шаблона проекта", { exact: true })).toHaveCount(0);
  await page.goto("./?page=article&resource=update-2026&role=client-admin");
  await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toBeVisible();
});

test("регистрация соблюдает настроенную уникальность полей компании", async ({ page }) => {
  await page.goto("./?page=register&role=guest");
  await page.getByLabel("Корпоративная почта").fill("owner@another-company.ru");
  await page.getByLabel("Полное наименование").fill("ООО «СеверПромБИМ»");
  await page.getByLabel("Сокращённое наименование").fill("Другая компания");
  await page.getByLabel("ИНН").fill("1234567002");
  await page.getByLabel("Рабочие домены").fill("another-company.ru");
  await page.getByLabel("Основной email").fill("owner@another-company.ru");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  const result = page.getByRole("dialog", { name: "Заявка отправлена на проверку" });
  await expect(result).toContainText("Нужна ручная проверка");
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
  const publication = settings.getByRole("switch", { name: "Публикация статьи" });
  if ((await publication.getAttribute("aria-checked")) === "false") await publication.click();
  await settings.getByLabel("Только выбранные типы").check();
  await expect(settings.getByTestId("article-access-summary")).toContainText("Клиент");
  await expect(settings).toContainText("потеряют доступ к статье и вложениям");
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
  await dialog.getByLabel("Описание").fill("Материалы о совместимых версиях продуктов.");
  await dialog.getByRole("button", { name: "Сохранить" }).click();
  const tag = page.getByText("Совместимость", { exact: true }).locator("..");
  await expect(tag).toContainText("Материалы о совместимых версиях продуктов.");
});

test("ошибка дубликата тега остаётся внутри открытой формы", async ({ page }) => {
  await page.goto("./?page=tags&role=portal-admin");
  await page.getByRole("button", { name: "Новый тег" }).click();
  const dialog = page.getByRole("dialog", { name: "Новый тег" });
  await dialog.getByLabel("Название тега").fill("НАВИСА");
  await dialog.getByRole("button", { name: "Сохранить" }).click();
  await expect(dialog.getByRole("alert")).toContainText("KB_TAG_DUPLICATE");
  await expect(dialog).toBeVisible();
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
  await page.getByRole("button", { name: "Открыть материал: Настройка интеграции с САПР-комплексом" }).click();
  await expect(page.getByRole("heading", { name: "Настройка интеграции с САПР-комплексом" })).toBeVisible();
});

test("карточка материала открывается целиком, а раздел возвращается стрелкой", async ({ page }, testInfo) => {
  await page.goto("./?page=knowledge&role=portal-admin");
  if (testInfo.project.name.startsWith("mobile")) {
    await page.getByRole("button", { name: "Показать разделы" }).click();
  }
  await page.getByRole("button", { exact: true, name: "Установка" }).click();
  await expect(page.getByRole("heading", { name: "Установка" })).toBeVisible();
  await page.getByRole("button", { name: "Вернуться ко всем материалам" }).click();
  await expect(page.getByRole("heading", { name: "Все материалы" })).toBeVisible();

  await page.getByRole("button", { name: "Открыть материал: Настройка сетевой лицензии" }).click();
  await expect(page.getByRole("heading", { name: "Настройка сетевой лицензии" })).toBeVisible();
});

test("поиск выделяет совпадение и открывает материал кликом по карточке", async ({ page }) => {
  await page.goto("./?page=search&role=client-employee");
  const result = page.getByRole("button", { name: /Открыть материал: Настройка сетевой лицензии/ });
  await expect(result.locator("mark").filter({ hasText: /лиценз/i }).first()).toBeVisible();
  await expect(result).toContainText("Совпадение в заголовке статьи");
  await result.click();
  await expect(page.getByRole("heading", { name: "Настройка сетевой лицензии" })).toBeVisible();
});

test("статья меняет размер текста и включает полноэкранный режим чтения", async ({ page }) => {
  await page.goto("./?page=article&role=portal-admin");
  const article = page.getByRole("article");
  const before = await article.locator(".article-content").evaluate((node) => getComputedStyle(node).fontSize);
  await page.getByRole("button", { name: "Увеличить размер текста" }).click();
  await expect
    .poll(() => article.locator(".article-content").evaluate((node) => getComputedStyle(node).fontSize))
    .not.toBe(before);
  await page.getByRole("button", { name: "На весь экран" }).click();
  await expect(article).toHaveAttribute("data-reading-mode", "fullscreen");
  await expect(article.getByRole("navigation", { name: "Содержание статьи" })).toBeHidden();
  await page.getByRole("button", { name: "Выйти из полноэкранного режима" }).click();
  await expect(article).toHaveAttribute("data-reading-mode", "standard");
});

test("реестр файлов переключается между карточками и таблицей и открывает просмотр", async ({ page }) => {
  await page.goto("./?page=files&role=portal-admin");
  await page.getByRole("button", { name: "Табличный вид" }).click();
  await expect(page.getByTestId("files-table-view")).toBeVisible();
  await page.getByRole("button", { name: "Крупные карточки" }).click();
  await expect(page.getByTestId("files-card-view")).toBeVisible();
  await page.getByRole("button", { name: /Просмотреть файл: инструкция_активации.pdf/ }).click();
  await expect(page.getByRole("heading", { name: "инструкция_активации.pdf" })).toBeVisible();
  await expect(page.getByText("Предпросмотр PDF")).toBeVisible();
});

test("разные карточки сохраняют идентичность статьи, файла и компании", async ({ page }) => {
  await page.goto("./?page=knowledge&role=portal-admin");
  await page.getByRole("button", { name: "Открыть материал: Подготовка шаблона проекта" }).click();
  await expect(page.getByRole("heading", { name: "Подготовка шаблона проекта" })).toBeVisible();
  await expect(page).toHaveURL(/resource=project-template/);

  await page.goto("./?page=files&role=portal-admin");
  await page.getByRole("button", { name: "Просмотреть файл: схема_подключения.dwg" }).click();
  await expect(page.getByRole("heading", { name: "схема_подключения.dwg" })).toBeVisible();
  await expect(page.getByText("Предпросмотр DWG")).toBeVisible();

  await page.goto("./?page=companies&role=portal-admin");
  await page.getByRole("button", { name: "Открыть компанию: АО «Интегратор Про»" }).click();
  await expect(page.getByRole("heading", { name: "АО «Интегратор Про»" })).toBeVisible();
  await expect(page).toHaveURL(/resource=integrator-pro/);
});

test("поиск точно показывает источник и подсвечивает запрос без учёта регистра", async ({ page }) => {
  await page.goto("./?page=search&role=client-employee");
  const input = page.getByRole("textbox", { name: "Поиск по базе знаний" });
  await input.fill("адрес сервера");
  await input.press("Enter");
  const pdfResult = page.getByRole("button", { name: /Открыть материал: Настройка сетевой лицензии/ });
  await expect(pdfResult).toContainText("Совпадение в тексте PDF");
  await expect(pdfResult.locator("mark").first()).toBeVisible();
  await input.fill("ЛИЦЕНЗИЯ");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: /Открыть материал: Настройка сетевой лицензии/ }).locator("mark").first()).toBeVisible();
});

test("поиск показывает подсвеченный фрагмент статьи и совпавший тег", async ({ page }) => {
  await page.goto("./?page=search&role=client-employee");
  const input = page.getByRole("textbox", { name: "Поиск по базе знаний" });
  await input.fill("синхронизации");
  await input.press("Enter");
  const articleResult = page.getByRole("button", {
    name: /Открыть материал: Настройка интеграции с САПР-комплексом/,
  });
  await expect(articleResult).toContainText("Фрагмент статьи");
  await expect(articleResult.locator("mark")).toContainText(/синхронизац/i);

  await input.fill("Стандарты");
  await input.press("Enter");
  const tagResult = page.getByRole("button", {
    name: /Открыть материал: Подготовка шаблона проекта/,
  });
  await expect(tagResult).toContainText("Совпадение в теге");
  await expect(tagResult.locator("mark")).toContainText("Стандарты");
});

test("файл наследует доступ статьи, реально поворачивается и возвращает клиента в БЗ", async ({ page }) => {
  await page.goto("./?page=file-preview&resource=дистрибутив_модуля.zip&role=client-employee");
  await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toBeVisible();
  await page.goto("./?page=file-preview&resource=инструкция_активации.pdf&role=client-employee");
  const document = page.getByTestId("file-preview-document");
  await expect(document).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await page.getByRole("button", { name: "Повернуть страницу" }).click();
  await expect(document).not.toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await page.getByRole("button", { name: "Вернуться в базу знаний" }).click();
  await expect(page.getByRole("heading", { name: "Все материалы" })).toBeVisible();
});

test("реестр файлов показывает раздел связанной статьи для каждого файла", async ({ page }) => {
  await page.goto("./?page=files&role=portal-admin");
  await page.getByRole("button", { name: "Табличный вид" }).click();
  const row = page.getByRole("row").filter({ hasText: "дистрибутив_модуля.zip" });
  await expect(row).toContainText("НАВИСА / Обновление");
});

test("закрытая ссылка возвращает к исходному материалу после входа", async ({ page }) => {
  await page.goto("./?page=article&resource=project-template&role=guest");
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Подготовка шаблона проекта" })).toBeVisible();
  await expect(page).toHaveURL(/resource=project-template/);
});

test("тип компании определяет доступ к статье", async ({ page }) => {
  await page.goto("./?page=article&resource=update-2026&role=client-employee");
  await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toBeVisible();
  await page.goto("./?page=company&resource=integrator-pro&role=portal-admin");
  await page.getByRole("button", { name: "Редактировать" }).click();
  const companyEditor = page.getByRole("dialog", { name: "Редактирование компании" });
  await companyEditor.getByLabel("Тип компании").selectOption("ВИП-клиент");
  await companyEditor.getByRole("button", { name: "Сохранить компанию" }).click();
  await page.goto("./?page=article&resource=update-2026&role=client-employee");
  await expect(page.getByRole("heading", { name: "Обновление компонентов до версии 2026" })).toBeVisible();
});

test("редактор сохраняет исходные права статьи и отклоняет неизвестный resource", async ({ page }) => {
  await page.goto("./?page=editor&resource=update-2026&role=portal-admin");
  await page.getByRole("button", { name: "Настройки" }).click();
  const settings = page.getByRole("dialog", { name: "Настройки статьи" });
  await expect(settings.getByRole("switch", { name: "Публикация статьи" })).toHaveAttribute("aria-checked", "true");
  await expect(settings.getByTestId("article-access-summary")).toContainText("ВИП-клиент");
  await settings.getByRole("button", { name: "Сохранить настройки" }).click();
  await page.goto("./?page=article&resource=update-2026&role=client-employee");
  await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toBeVisible();
  await page.goto("./?page=editor&resource=unknown-article&role=portal-admin");
  await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toBeVisible();
});

test("административные справочники показывают обязательные настройки", async ({ page }) => {
  await page.goto("./?page=company-types&role=portal-admin");
  await expect(page.getByText("Базовый тип", { exact: true })).toBeVisible();
  const baseType = page.getByRole("article").filter({ hasText: "Базовый" });
  await baseType.getByRole("button", { name: "Удалить" }).click();
  const deleteDialog = page.getByRole("dialog", { name: "Удалить тип компании" });
  await expect(deleteDialog).toContainText("назначен базовым");
  await expect(deleteDialog.getByRole("button", { name: "Удалить тип" })).toBeDisabled();
  await expect(deleteDialog.getByRole("button", { name: /Открыть компании/ })).toBeVisible();
  await expect(deleteDialog.getByRole("button", { name: /Открыть статьи/ })).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Закрыть" }).click();
  await page.getByRole("button", { name: "Новый тип" }).click();
  const typeDialog = page.getByRole("dialog", { name: "Новый тип" });
  await expect(typeDialog.getByLabel("Описание")).toBeVisible();
  await expect(typeDialog.getByRole("checkbox", { name: "Сделать базовым типом" })).toBeVisible();
  await typeDialog.getByRole("button", { name: "Закрыть" }).click();

  await page.goto("./?page=client-users&role=client-admin");
  await expect(page.getByText("Руководитель BIM-отдела").filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "Добавить сотрудника" }).click();
  const employeeDialog = page.getByRole("dialog", { name: "Добавить сотрудника" });
  await expect(employeeDialog.getByLabel("Должность")).toBeVisible();
  await expect(employeeDialog.getByLabel("Отдел")).toBeVisible();
  await expect(employeeDialog.getByLabel("Телефон")).toBeVisible();
  await expect(employeeDialog.getByLabel("Клиентская роль")).toBeVisible();
});

test("смена базового типа требует отдельного подтверждения", async ({ page }) => {
  await page.goto("./?page=company-types&role=portal-admin");
  await page.getByRole("button", { name: "Новый тип" }).click();
  const editor = page.getByRole("dialog", { name: "Новый тип" });
  await editor.getByLabel("Название типа").fill("Новый базовый");
  await editor.getByRole("checkbox", { name: "Сделать базовым типом" }).check();
  await editor.getByRole("button", { name: "Сохранить" }).click();
  const confirmation = page.getByRole("dialog", { name: "Назначить базовый тип" });
  await expect(confirmation).toContainText("Текущие компании и их права не изменятся");
  await confirmation.getByRole("button", { name: "Назначить базовым" }).click();
  await expect(page.getByRole("article").filter({ hasText: "Новый базовый" })).toContainText(
    "Базовый тип",
  );
});

test("переименование справочников мигрирует теги и права статей", async ({ page }) => {
  await page.goto("./?page=tags&role=portal-admin");
  await page.getByRole("button", { name: "Действия: НАВИСА" }).click();
  await page.getByRole("menuitem", { name: "Переименовать" }).click();
  const tagEditor = page.getByRole("dialog", { name: "Переименовать тег" });
  await tagEditor.getByLabel("Название тега").fill("НАВИСА 2026");
  await tagEditor.getByRole("button", { name: "Сохранить" }).click();
  await page.goto("./?page=editor&resource=network-license&role=portal-admin");
  await page.getByRole("button", { name: "Настройки" }).click();
  await expect(page.getByRole("button", { name: "НАВИСА 2026" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.goto("./?page=company&resource=integrator-pro&role=portal-admin");
  await page.getByRole("button", { name: "Редактировать" }).click();
  const companyEditor = page.getByRole("dialog", { name: "Редактирование компании" });
  await companyEditor.getByLabel("Тип компании").selectOption("ВИП-клиент");
  await companyEditor.getByRole("button", { name: "Сохранить компанию" }).click();

  await page.goto("./?page=company-types&role=portal-admin");
  await page.getByRole("article").filter({ hasText: "ВИП-клиент" }).getByRole("button", { name: "Изменить" }).click();
  const typeEditor = page.getByRole("dialog", { name: "Изменить тип" });
  await typeEditor.getByLabel("Название типа").fill("Премиум");
  await typeEditor.getByRole("button", { name: "Сохранить" }).click();
  await page.goto("./?page=editor&resource=update-2026&role=portal-admin");
  await page.getByRole("button", { name: "Настройки" }).click();
  await expect(page.getByTestId("article-access-summary")).toContainText("Премиум");
  await page.goto("./?page=article&resource=update-2026&role=client-employee");
  await expect(page.getByRole("heading", { name: "Обновление компонентов до версии 2026" })).toBeVisible();
});

test("административные настройки влияют на редактор и форму компании", async ({ page }) => {
  await page.goto("./?page=tags&role=portal-admin");
  await page.getByRole("button", { name: "Новый тег" }).click();
  const tagDialog = page.getByRole("dialog", { name: "Новый тег" });
  await tagDialog.getByLabel("Название тега").fill("Совместимость 2026");
  await tagDialog.getByRole("button", { name: "Сохранить" }).click();
  await page.goto("./?page=editor&role=portal-admin");
  await page.getByRole("button", { name: "Настройки" }).click();
  await expect(page.getByRole("button", { name: "Совместимость 2026" })).toBeVisible();
  await page.getByRole("button", { name: "Закрыть" }).click();

  await page.goto("./?page=company-types&role=portal-admin");
  await page.getByRole("button", { name: "Новый тип" }).click();
  const typeDialog = page.getByRole("dialog", { name: "Новый тип" });
  await typeDialog.getByLabel("Название типа").fill("Партнёр");
  await typeDialog.getByRole("button", { name: "Сохранить" }).click();
  await page.goto("./?page=companies&role=portal-admin");
  await page.getByRole("button", { name: "Добавить компанию" }).click();
  await expect(page.getByLabel("Тип компании").getByRole("option", { name: "Партнёр" })).toHaveCount(1);
  await page.getByRole("button", { name: "Закрыть" }).click();

  await page.goto("./?page=fields&role=portal-admin");
  await page.getByRole("switch", { name: "В форме: Проект" }).click();
  await page.getByRole("button", { name: "Сохранить настройки" }).click();
  await expect(page.getByRole("status")).toContainText("серверной проверки", { timeout: 3000 });
  await page.goto("./?page=companies&role=portal-admin");
  await page.getByRole("button", { name: "Добавить компанию" }).click();
  await expect(page.getByRole("dialog", { name: "Новая компания" }).getByLabel("Проект", { exact: true })).toHaveCount(0);

  await page.goto("./?page=audit&role=portal-admin");
  await expect(page.getByText("Совместимость 2026")).toBeVisible();
  await expect(page.getByText("Партнёр")).toBeVisible();
  await expect(page.getByText("Поля компании").first()).toBeVisible();
});

test("журнал показывает результат, пустую выдачу и переход к объекту", async ({ page }) => {
  await page.goto("./?page=audit&role=portal-admin");
  await expect(page.getByText("Успешно").first()).toBeVisible();
  await expect(page.getByText("Отклонено")).toBeVisible();
  await page.getByPlaceholder("Пользователь или объект").fill("несуществующее событие");
  await expect(page.getByRole("heading", { name: "События не найдены" })).toBeVisible();
  await page.getByRole("button", { name: "Сбросить фильтры" }).click();
  await page.getByRole("button", { name: "Настройка сетевой лицензии" }).click();
  await expect(page.getByRole("heading", { name: "Настройка сетевой лицензии" })).toBeVisible();
});

test("удаление пользователя отзывает доступ и сохраняет запись", async ({ page }, testInfo) => {
  await page.goto("./?page=users&role=portal-admin");
  await page.getByRole("button", { name: "Действия: Анна Смирнова" }).click();
  await page.getByRole("menuitem", { name: "Отозвать доступ" }).click();
  await page.getByRole("dialog", { name: "Отозвать доступ" }).getByRole("button", { name: "Подтвердить" }).click();
  const record = testInfo.project.name.startsWith("mobile")
    ? page.getByRole("article").filter({ hasText: "Анна Смирнова" })
    : page.getByRole("row").filter({ hasText: "Анна Смирнова" });
  await expect(record).toContainText("Доступ отозван");
  await expect(record).toContainText("Анна Смирнова");
  await page.reload();
  const persistedRecord = testInfo.project.name.startsWith("mobile")
    ? page.getByRole("article").filter({ hasText: "Анна Смирнова" })
    : page.getByRole("row").filter({ hasText: "Анна Смирнова" });
  await expect(persistedRecord).toContainText("Доступ отозван");
  await page.getByRole("button", { name: "Действия: Анна Смирнова" }).click();
  await page.getByRole("menuitem", { name: "Открыть записи журнала" }).click();
  await expect(page.getByRole("heading", { name: "Журнал действий" })).toBeVisible();
});

test("поля компании показывают операции и блокируют противоречивые настройки", async ({ page }, testInfo) => {
  await page.goto("./?page=fields&role=portal-admin");
  const fieldSurface = testInfo.project.name.startsWith("mobile")
    ? page.getByRole("article").filter({ hasText: "ИНН" })
    : page.getByRole("table");
  await expect(fieldSurface.getByText("Создание", { exact: true }).first()).toBeVisible();
  await expect(fieldSurface.getByText("Редактирование", { exact: true }).first()).toBeVisible();
  const visible = page.getByRole("switch", { name: "В форме: ИНН" });
  const required = page.getByRole("switch", { name: "Обязательное: ИНН" });
  if ((await required.getAttribute("aria-checked")) === "false") await required.click();
  await visible.click();
  await expect(required).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText("Есть несохранённые изменения")).toBeVisible();
});

test("компания редактируется в modal или bottom sheet", async ({ page }) => {
  await page.goto("./?page=company&role=portal-admin");
  await page.getByRole("button", { name: "Редактировать" }).click();
  const dialog = page.getByRole("dialog", { name: "Редактирование компании" });
  await dialog.getByLabel("Рабочий домен").fill("new.severprom.ru");
  await dialog.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(page.getByRole("status")).toContainText("Изменения компании сохранены");
});

test("созданная компания сохраняется в списке и открывается после перезагрузки", async ({ page }) => {
  await page.goto("./?page=companies&role=portal-admin");
  await page.getByRole("button", { name: "Добавить компанию" }).click();
  const dialog = page.getByRole("dialog", { name: "Новая компания" });
  await dialog.getByLabel("Полное наименование").fill("ООО «Новая орбита»");
  await dialog.getByLabel("Сокращённое наименование").fill("Новая орбита");
  await dialog.getByLabel("ИНН").fill("1234567891");
  await dialog.getByLabel("Рабочий домен").fill("new-orbit.ru");
  await dialog.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(page.getByRole("button", { name: "Открыть компанию: ООО «Новая орбита»" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Открыть компанию: ООО «Новая орбита»" }).click();
  await expect(page.getByRole("heading", { name: "ООО «Новая орбита»" })).toBeVisible();
});

test("новый тип нельзя удалить после назначения сохранённой компании", async ({ page }) => {
  await page.goto("./?page=company-types&role=portal-admin");
  await page.getByRole("button", { name: "Новый тип" }).click();
  const typeDialog = page.getByRole("dialog", { name: "Новый тип" });
  await typeDialog.getByLabel("Название типа").fill("Контрагент");
  await typeDialog.getByRole("button", { name: "Сохранить" }).click();

  await page.goto("./?page=companies&role=portal-admin");
  await page.getByRole("button", { name: "Добавить компанию" }).click();
  const companyDialog = page.getByRole("dialog", { name: "Новая компания" });
  await companyDialog.getByLabel("Полное наименование").fill("ООО «Связанный контрагент»");
  await companyDialog.getByLabel("Сокращённое наименование").fill("Связанный контрагент");
  await companyDialog.getByLabel("ИНН").fill("1234567892");
  await companyDialog.getByLabel("Тип компании").selectOption("Контрагент");
  await companyDialog.getByLabel("Рабочий домен").fill("linked-partner.ru");
  await companyDialog.getByRole("button", { name: "Сохранить компанию" }).click();

  await page.goto("./?page=company-types&role=portal-admin");
  const typeCard = page.getByRole("article").filter({ hasText: "Контрагент" });
  await typeCard.getByRole("button", { name: "Удалить" }).click();
  const deleteDialog = page.getByRole("dialog", { name: "Удалить тип компании" });
  await expect(deleteDialog).toContainText("1 компанией");
  await expect(deleteDialog.getByRole("button", { name: "Удалить тип" })).toBeDisabled();
});

test("форма компании отклоняет некорректный и занятый домен", async ({ page }) => {
  await page.goto("./?page=companies&role=portal-admin");
  await page.getByRole("button", { name: "Добавить компанию" }).click();
  const dialog = page.getByRole("dialog", { name: "Новая компания" });
  await dialog.getByLabel("Полное наименование").fill("ООО «Тест»");
  await dialog.getByLabel("Сокращённое наименование").fill("Тест");
  await dialog.getByLabel("ИНН").fill("1234567890");
  await dialog.getByLabel("Рабочий домен").fill("не домен");
  await dialog.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(dialog).toContainText("ACC_DOMAIN_INVALID");
  await dialog.getByLabel("Рабочий домен").fill("INTEGRATOR-PRO.RU");
  await dialog.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(dialog).toContainText("ACC_DOMAIN_CONFLICT");
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
  await expect(page.getByText("Иван Петров", { exact: true }).filter({ visible: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Иван Петров", { exact: true }).filter({ visible: true })).toBeVisible();
});

test("приглашение пользователя обновляет счётчик компании", async ({ page }, testInfo) => {
  await page.goto("./?page=users&role=portal-admin");
  await page.getByRole("button", { name: "Пригласить пользователя" }).click();
  const editor = page.getByRole("dialog", { name: "Пригласить пользователя" });
  await editor.getByLabel("Имя").fill("Новый");
  await editor.getByLabel("Фамилия").fill("Сотрудник");
  await editor.getByLabel("Корпоративная почта").fill("new.user@severprom.ru");
  await editor.getByLabel("Компания").selectOption("ООО «СеверПромБИМ»");
  await editor.getByRole("button", { name: "Отправить приглашение" }).click();
  await page.goto("./?page=companies&role=portal-admin");
  if (testInfo.project.name.startsWith("mobile")) {
    await expect(
      page.getByRole("button", { name: "Открыть компанию: ООО «СеверПромБИМ»" }),
    ).toContainText("19 пользователей");
  } else {
    await expect(
      page.getByRole("row").filter({ hasText: "ООО «СеверПромБИМ»" }),
    ).toContainText("19");
  }
});

test("настройка PLAT-04 управляет полями самостоятельной регистрации", async ({ page }) => {
  await page.goto("./?page=fields&role=portal-admin");
  await page.getByRole("switch", { name: "Регистрация: Полное наименование" }).click();
  await page.getByRole("button", { name: "Сохранить настройки" }).click();
  await expect(page.getByRole("status")).toContainText("серверной проверки", { timeout: 3000 });
  await page.goto("./?page=register&role=guest");
  await expect(page.getByLabel("Полное наименование")).toHaveCount(0);
  await expect(page.getByLabel("ИНН")).toBeVisible();
});

test("ACL клиента определяется его компанией и не подменяется через URL", async ({ page }) => {
  await page.goto(
    "./?page=article&resource=update-2026&role=client-employee&companyType=ВИП-клиент",
  );
  await expect(page.getByRole("heading", { name: "Нет доступа к разделу" })).toBeVisible();

  await page.goto("./?page=company&resource=integrator-pro&role=portal-admin");
  await page.getByRole("button", { name: "Редактировать" }).click();
  const companyEditor = page.getByRole("dialog", { name: "Редактирование компании" });
  await companyEditor.getByLabel("Тип компании").selectOption("ВИП-клиент");
  await companyEditor.getByRole("button", { name: "Сохранить компанию" }).click();
  await page.goto("./?page=article&resource=update-2026&role=client-employee");
  await expect(
    page.getByRole("heading", { name: "Обновление компонентов до версии 2026" }),
  ).toBeVisible();
});

test("переименование компании сохраняет связь с пользователями", async ({ page }) => {
  await page.goto("./?page=company&resource=severprom&role=portal-admin");
  await page.getByRole("button", { name: "Редактировать" }).click();
  const editor = page.getByRole("dialog", { name: "Редактирование компании" });
  await editor.getByLabel("Полное наименование").fill("ООО «СеверПромБИМ 2026»");
  await editor.getByRole("button", { name: "Сохранить компанию" }).click();
  await page.getByRole("tab", { name: /Пользователи/ }).click();
  await expect(page.getByText("Анна Смирнова", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: /Пользователи/ }).click();
  await expect(page.getByText("Анна Смирнова", { exact: true })).toBeVisible();
});

test("названия типов компаний остаются уникальными", async ({ page }) => {
  await page.goto("./?page=company-types&role=portal-admin");
  await page.getByRole("button", { name: "Новый тип" }).click();
  const editor = page.getByRole("dialog", { name: "Новый тип" });
  await editor.getByLabel("Название типа").fill("клиент");
  await editor.getByRole("button", { name: "Сохранить" }).click();
  await expect(editor.getByRole("alert")).toContainText("ACC_COMPANY_TYPE_DUPLICATE");
  await expect(editor).toBeVisible();
});

test("PLAT-04 управляет уникальностью всех полей компании", async ({ page }) => {
  await page.goto("./?page=companies&role=portal-admin");
  await page.evaluate(() => {
    const key = "maxsoft-prototype-company-fields";
    const fields = [
      ["name", "Полное наименование", true],
      ["shortName", "Сокращённое наименование", true],
      ["inn", "ИНН", false],
      ["kpp", "КПП", true],
      ["legalAddress", "Юридический адрес", false],
      ["domains", "Рабочие домены", false],
      ["primaryEmail", "Основной email", true],
      ["phone", "Телефон", false],
      ["type", "Тип компании", false],
      ["status", "Статус компании", false],
      ["statusUntil", "Срок действия статуса", false],
      ["contract", "Договор / основание", false],
      ["contractDate", "Дата договора", false],
      ["project", "Проект", false],
      ["bitrix", "Ссылка на Битрикс24", true],
    ].map(([id, label, unique]) => ({
      id,
      label,
      unique,
      visible: true,
      required: ["name", "shortName", "inn", "domains", "type", "status"].includes(id as string),
      manager: id !== "type" && id !== "bitrix",
      registration: false,
      creation: true,
      editing: true,
    }));
    window.localStorage.setItem(key, JSON.stringify(fields));
  });
  await page.reload();
  await page.getByRole("button", { name: "Добавить компанию" }).click();
  const editor = page.getByRole("dialog", { name: "Новая компания" });
  await editor.getByLabel("Полное наименование").fill("ООО «Уникальная компания»");
  await editor.getByLabel("Сокращённое наименование").fill("Уникальное имя");
  await editor.getByLabel("ИНН").fill("2463128457");
  await editor.getByLabel("КПП").fill("246301001");
  await editor.getByLabel("Рабочий домен").fill("severprom.ru");
  await editor.getByLabel("Основной email").fill("unique@example.ru");
  await editor.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(editor).toContainText("ACC_COMPANY_FIELD_CONFLICT");

  await editor.getByLabel("КПП").fill("123456789");
  await editor.getByLabel("Полное наименование").fill("ООО «СеверПромБИМ»");
  await editor.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(editor).toContainText("ACC_COMPANY_FIELD_CONFLICT");

  await editor.getByLabel("Полное наименование").fill("ООО «Уникальная компания»");
  await editor.getByRole("button", { name: "Сохранить компанию" }).click();
  await expect(
    page.getByRole("button", { name: "Открыть компанию: ООО «Уникальная компания»" }),
  ).toBeVisible();
});

test("сохранённые разделы статьи меняют её размещение", async ({ page }, testInfo) => {
  await page.goto("./?page=editor&resource=network-license&role=portal-admin");
  await page.getByRole("button", { name: "Настройки" }).click();
  const editor = page.getByRole("dialog", { name: "Настройки статьи" });
  await editor.getByLabel("Настройка").check();
  await editor.getByRole("button", { name: "Сохранить настройки" }).click();
  await page.goto("./?page=knowledge&role=portal-admin");
  if (testInfo.project.name.startsWith("mobile"))
    await page.getByRole("button", { name: "Показать разделы" }).click();
  await page.getByRole("button", { name: "Настройка", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Открыть материал: Настройка сетевой лицензии" }),
  ).toBeVisible();
});

test("интеграции и настройки полей реагируют на действия", async ({ page }) => {
  await page.goto("./?page=integrations&role=portal-admin");
  await page.getByRole("button", { name: "Проверить подключение" }).first().click();
  await expect(page.getByText("Подключение работает").first()).toBeVisible({ timeout: 3000 });
  await page.getByLabel("Адрес портала").fill("https://invalid.example");
  await page.getByRole("button", { name: "Проверить подключение" }).nth(1).click();
  await expect(page.getByRole("alert")).toContainText("PLAT_INTEGRATION_CONNECTION_FAILED", { timeout: 3000 });
  await page.goto("./?page=fields&role=portal-admin");
  const fieldSwitch = page.getByRole("switch", { name: "Обязательное: Телефон" });
  const before = await fieldSwitch.getAttribute("aria-checked");
  await fieldSwitch.click();
  await expect(fieldSwitch).toHaveAttribute("aria-checked", before === "true" ? "false" : "true");
  await page.getByRole("switch", { name: "Уникальное: Телефон" }).click();
  await page.getByRole("button", { name: "Сохранить настройки" }).click();
  await expect(page.getByRole("alert")).toContainText("PLAT_FIELD_UNIQUENESS_CONFLICT", { timeout: 3000 });
});

test("административные списки показывают ошибку загрузки и восстанавливаются", async ({ page }) => {
  const collections = ["tags", "companies", "company-types", "users", "audit"];
  for (const collection of collections) {
    await page.goto(`./?page=${collection}&resource=load-error&role=portal-admin`);
    await expect(page.getByRole("heading", { name: "Не удалось загрузить данные" })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("APP_ADMIN_LIST_LOAD_FAILED");
    await page.getByRole("button", { name: "Повторить загрузку" }).click();
    await expect(page).not.toHaveURL(/resource=load-error/);
  }

  await page.goto("./?page=client-users&resource=load-error&role=client-admin");
  await expect(page.getByRole("heading", { name: "Не удалось загрузить данные" })).toBeVisible();
  await page.getByRole("button", { name: "Повторить загрузку" }).click();
  await expect(page.getByRole("heading", { name: "Сотрудники", exact: true })).toBeVisible();
});
