// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { enhanceFormControls } from "./form-enhancements";

const render = (markup: string) => {
  document.body.innerHTML = `<div id="screen">${markup}</div>`;
  const screen = document.querySelector<HTMLElement>("#screen");
  if (!screen) throw new Error("TEST_FORM_SCREEN_MISSING");
  enhanceFormControls(screen);
  return screen;
};

describe("интерактивность полей экспортированного макета", () => {
  it("разрешает редактировать текстовые поля и многострочный текст", () => {
    const screen = render(`
      <div data-pencil-name="AUTH-03 Email поле">
        <div data-pencil-name="Inputs/Text Default Значение">old@example.ru</div>
      </div>
      <div data-pencil-name="KB-04 Описание поле">
        <div data-pencil-name="Inputs/Textarea Значение">Исходный текст</div>
      </div>
    `);
    const fields = screen.querySelectorAll<HTMLElement>('[data-prototype-editable="true"]');

    expect(fields).toHaveLength(2);
    expect(fields[0]).toHaveAttribute("role", "textbox");
    expect(fields[0]).toHaveAttribute("contenteditable", "plaintext-only");
    expect(fields[1]).toHaveAttribute("aria-multiline", "true");
    expect(fields[0]).toHaveAttribute("aria-label", "AUTH-03 Email поле");
  });

  it("делает значение select нативно управляемым", () => {
    const screen = render(`
      <div data-pencil-name="ORG-04 Роль select">
        <div data-pencil-name="Inputs/Select Значение">Менеджер</div>
      </div>
    `);
    const select = screen.querySelector<HTMLSelectElement>('[data-prototype-select="true"]');
    if (!select) throw new Error("TEST_FORM_SELECT_MISSING");

    expect(select).toHaveAttribute("role", "combobox");
    expect([...select.options].map((option) => option.value)).toContain("Менеджер");
  });

  it("применяет неявное действие после выбора статуса", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div id="screen">
        <div data-prototype-action="ACTION → KB-05 Публикация">
          <div data-pencil-name="KB-05 Статус">
            <div data-pencil-name="Inputs/Select Значение">Опубликована</div>
          </div>
        </div>
      </div>
    `;
    const screen = document.querySelector<HTMLElement>("#screen");
    if (!screen) throw new Error("TEST_FORM_SCREEN_MISSING");
    const onAction = vi.fn();
    enhanceFormControls(screen, onAction);
    const select = screen.querySelector<HTMLSelectElement>('[data-prototype-select="true"]');
    if (!select) throw new Error("TEST_FORM_SELECT_MISSING");

    select.value = "Черновик";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    vi.runAllTimers();
    expect(onAction).toHaveBeenCalledWith("ACTION → KB-05 Публикация");
    vi.useRealTimers();
  });

  it("переключает checkbox и switch кликом и пробелом", () => {
    const screen = render(`
      <div data-pencil-name="Inputs/Checkbox Checked Маркер"><span>✓</span></div>
      <div data-pencil-name="Inputs/Switch Off Трек"><span data-pencil-name="Inputs/Switch Off Thumb"></span></div>
    `);
    const checkbox = screen.querySelector<HTMLElement>('[role="checkbox"]');
    const toggle = screen.querySelector<HTMLElement>('[role="switch"]');
    if (!checkbox || !toggle) throw new Error("TEST_FORM_TOGGLE_MISSING");

    checkbox.click();
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    toggle.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("передаёт клик переключателя размеченному действию", () => {
    const screen = render(`
      <div data-pencil-name="ACTION → KB-05 Публикация">
        <div data-pencil-name="Inputs/Switch On Трек"></div>
      </div>
    `);
    const action = screen.querySelector<HTMLElement>('[data-pencil-name^="ACTION"]');
    const toggle = screen.querySelector<HTMLElement>('[role="switch"]');
    if (!action || !toggle) throw new Error("TEST_FORM_ACTION_TOGGLE_MISSING");
    const onAction = vi.fn();
    action.addEventListener("click", onAction);

    toggle.click();
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("не активирует отключённые элементы", () => {
    const screen = render(`
      <div data-pencil-name="DISABLED · настройка">
        <div data-pencil-name="Inputs/Text Default Значение">Недоступно</div>
        <div data-pencil-name="Inputs/Switch Off Трек"></div>
      </div>
    `);
    expect(screen.querySelector('[data-prototype-editable="true"]')).toBeNull();
    expect(screen.querySelector('[role="switch"]')).toHaveAttribute("aria-disabled", "true");
  });

  it("снимает фокус с однострочного поля по Enter", () => {
    const screen = render(`
      <div data-pencil-name="Поле поиска">
        <div data-pencil-name="Inputs/Search Значение">интеграция</div>
      </div>
    `);
    const field = screen.querySelector<HTMLElement>('[data-prototype-editable="true"]');
    if (!field) throw new Error("TEST_FORM_FIELD_MISSING");
    const blur = vi.spyOn(field, "blur");

    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(blur).toHaveBeenCalledOnce();
  });

  it("очищает подсказку при вводе и возвращает её для пустого поля", () => {
    const screen = render(`
      <div data-pencil-name="Имя поле">
        <div data-pencil-name="Inputs/Text Default Значение">Введите имя</div>
      </div>
    `);
    const field = screen.querySelector<HTMLElement>('[data-prototype-editable="true"]');
    if (!field) throw new Error("TEST_FORM_FIELD_MISSING");

    field.dispatchEvent(new FocusEvent("focus"));
    expect(field).toBeEmptyDOMElement();
    field.dispatchEvent(new FocusEvent("blur"));
    expect(field).toHaveTextContent("Введите имя");
  });
});
