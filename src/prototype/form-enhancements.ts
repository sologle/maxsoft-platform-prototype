import { demoSelectOptions } from "../data/mock-data";

const editableValueSelector = [
  '[data-pencil-name="Inputs/Text Default Значение"]',
  '[data-pencil-name="Inputs/Text Error Значение"]',
  '[data-pencil-name="Inputs/Password Значение"]',
  '[data-pencil-name="Inputs/Textarea Значение"]',
  '[data-pencil-name="Inputs/Search Значение"]',
].join(",");

const disabledAncestor = (node: HTMLElement) =>
  node.closest<HTMLElement>('[data-pencil-name*="DISABLED"], [aria-disabled="true"]');

const fieldLabel = (node: HTMLElement) => {
  let current: HTMLElement | null = node.parentElement;
  while (current) {
    const name = current.dataset.pencilName;
    if (name && !name.startsWith("Inputs/")) return name.replace(/^ACTION[^/]*\/\s*/, "");
    current = current.parentElement;
  }
  return node.dataset.pencilName ?? "Поле формы";
};

const placeholderText = (value: HTMLElement) => {
  const text = value.textContent?.trim() ?? "";
  if (value.dataset.pencilName === "Inputs/Password Значение" && /^[•●·*]{4,}$/.test(text)) {
    return text;
  }
  return /^(?:Введите|Укажите|Выберите|Найдите|Поиск|name@|email@|\+7\s|Название|Описание)/i.test(
    text,
  )
    ? text
    : undefined;
};

const enhanceEditableValues = (active: HTMLElement) => {
  active.querySelectorAll<HTMLElement>(editableValueSelector).forEach((value) => {
    if (disabledAncestor(value)) return;
    const multiline = value.dataset.pencilName === "Inputs/Textarea Значение";
    const placeholder = placeholderText(value);
    value.dataset.prototypeEditable = "true";
    value.setAttribute("contenteditable", "plaintext-only");
    value.setAttribute("role", "textbox");
    value.setAttribute("aria-label", fieldLabel(value));
    if (multiline) value.setAttribute("aria-multiline", "true");
    value.spellcheck = false;
    value.tabIndex = 0;
    value.style.cursor = "text";
    value.style.minWidth = "2px";
    value.style.maxWidth = "100%";
    value.style.overflow = "hidden";
    value.style.outline = "none";
    if (!multiline) value.style.whiteSpace = "nowrap";
    if (value.parentElement) value.parentElement.style.minWidth = "0";
    if (value.parentElement?.parentElement) value.parentElement.parentElement.style.minWidth = "0";
    if (value.dataset.pencilName === "Inputs/Password Значение") {
      value.style.setProperty("-webkit-text-security", "disc");
    }
    value.addEventListener("focus", () => {
      value.parentElement?.classList.add("prototype-control-active");
      if (placeholder && value.getAttribute("data-prototype-dirty") !== "true") {
        value.textContent = "";
      }
    });
    value.addEventListener("blur", () => {
      value.parentElement?.classList.remove("prototype-control-active");
      if (placeholder && !value.textContent?.trim()) {
        value.textContent = placeholder;
        value.removeAttribute("data-prototype-dirty");
      }
    });
    value.addEventListener("input", () => value.setAttribute("data-prototype-dirty", "true"));
    value.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !multiline) {
        event.preventDefault();
        value.blur();
      }
    });
  });
};

const findSelectOptions = (name: string, currentValue: string) => {
  const configured = Object.entries(demoSelectOptions).find(([pattern]) => name.includes(pattern))?.[1];
  return configured?.includes(currentValue) ? configured : [currentValue, ...(configured ?? [])];
};

const enhanceSelects = (active: HTMLElement, onAction?: (actionName: string) => void) => {
  active.querySelectorAll<HTMLElement>('[data-pencil-name="Inputs/Select Значение"]').forEach((value) => {
    const control = value.parentElement;
    if (!control) return;
    const disabled = Boolean(disabledAncestor(control));
    const name = control.dataset.pencilName ?? fieldLabel(value);
    const implicitAction = control.parentElement?.closest<HTMLElement>("[data-prototype-action]");
    const currentValue = value.textContent?.trim() ?? "";
    const select = active.ownerDocument.createElement("select");
    select.className = "prototype-native-select";
    select.dataset.prototypeSelect = "true";
    select.setAttribute("role", "combobox");
    select.setAttribute("aria-label", name);
    select.disabled = disabled;
    for (const optionValue of findSelectOptions(name, currentValue)) {
      const option = active.ownerDocument.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      select.append(option);
    }
    select.value = currentValue;
    select.addEventListener("focus", () => control.classList.add("prototype-control-active"));
    select.addEventListener("blur", () => control.classList.remove("prototype-control-active"));
    select.addEventListener("change", () => {
      value.textContent = select.value;
      value.setAttribute("data-prototype-dirty", "true");
      const actionName = implicitAction?.dataset.prototypeAction;
      if (actionName) {
        active.ownerDocument.defaultView?.setTimeout(() => onAction?.(actionName), 0);
      }
    });
    control.style.position = "relative";
    value.style.pointerEvents = "none";
    control.append(select);
  });
};

const enhanceBinaryControl = (
  node: HTMLElement,
  role: "checkbox" | "radio" | "switch",
  checked: boolean,
) => {
  const disabled = Boolean(disabledAncestor(node));
  const action = node.closest<HTMLElement>("[data-pencil-name^='ACTION '], [data-prototype-action]");
  node.setAttribute("role", role);
  node.setAttribute("aria-checked", String(checked));
  node.setAttribute("aria-disabled", String(disabled));
  if (!disabled) node.tabIndex = 0;
  const render = (next: boolean) => {
    node.setAttribute("aria-checked", String(next));
    node.classList.toggle("prototype-binary-off", !next);
    if (role === "switch") {
      node.style.background = next ? "#1478BD" : "#CBD5E1";
      const thumb = node.querySelector<HTMLElement>('[data-pencil-name*="Thumb"]');
      if (thumb) thumb.style.transform = next ? "translateX(16px)" : "translateX(0)";
    }
  };
  const toggle = () => {
    if (disabled) return;
    render(node.getAttribute("aria-checked") !== "true");
  };
  node.addEventListener("click", (event) => {
    event.preventDefault();
    if (!action) event.stopPropagation();
    toggle();
  });
  node.addEventListener("keydown", (event) => {
    if (event.key !== " ") return;
    event.preventDefault();
    if (!action) event.stopPropagation();
    toggle();
  });
  render(checked);
};

const enhanceBinaryControls = (active: HTMLElement) => {
  active
    .querySelectorAll<HTMLElement>('[data-pencil-name="Inputs/Checkbox Checked Маркер"]')
    .forEach((node) => enhanceBinaryControl(node, "checkbox", true));
  active
    .querySelectorAll<HTMLElement>('[data-pencil-name="Inputs/Radio Selected Маркер"]')
    .forEach((node) => enhanceBinaryControl(node, "radio", true));
  active
    .querySelectorAll<HTMLElement>(
      '[data-pencil-name="Inputs/Switch On Трек"], [data-pencil-name="Inputs/Switch Off Трек"]',
    )
    .forEach((node) =>
      enhanceBinaryControl(node, "switch", node.dataset.pencilName === "Inputs/Switch On Трек"),
    );
};

export const enhanceFormControls = (active: HTMLElement, onAction?: (actionName: string) => void) => {
  enhanceEditableValues(active);
  enhanceSelects(active, onAction);
  enhanceBinaryControls(active);
};
