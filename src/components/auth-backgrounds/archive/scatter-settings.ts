export interface ScatterSettings {
  force: number;
  radius: number;
  spring: number;
  damping: number;
  spin: number;
  trail: number;
  variation: number;
  orbitRadius: number;
  orbitStrength: number;
}

export const defaultScatterSettings: Readonly<ScatterSettings> = Object.freeze({
  force: 0.2, radius: 0.65, spring: 20, damping: 6.3, spin: 1, trail: 1, variation: 1,
  orbitRadius: 60, orbitStrength: 0.7,
});

export const scatterGroups = [
  { id: "orbit", title: "Круг вокруг мыши", hint: "Штрихи держатся здесь, даже когда мышь стоит." },
  { id: "scatter", title: "Разлёт при движении", hint: "Проведи мышью или пальцем по буквам, чтобы увидеть разницу." },
  { id: "return", title: "Возвращение на место", hint: "Уведи мышь или отпусти палец — надпись снова соберётся." },
  { id: "appearance", title: "Вид летящих палочек", hint: "Вращение и след заметнее при быстром взмахе." },
] as const;

export const scatterControls = [
  { key: "orbitRadius", group: "orbit", label: "Расстояние от курсора", hint: "Примерный размер свободного круга вокруг мыши. Больше — палочки держатся дальше от его центра.", min: 25, max: 160, step: 5, unit: "px" },
  { key: "orbitStrength", group: "orbit", label: "Удержание на круге", hint: "0% — только разлёт. 100% — штрихи собираются вдоль круга, пока мышь рядом.", min: 0, max: 1, step: 0.05, unit: "percent" },
  { key: "force", group: "scatter", label: "Сила разлёта", hint: "Сила толчка от движения мыши. 0% — без толчка. Больше — палочки улетают дальше.", min: 0, max: 2.5, step: 0.05, unit: "percent" },
  { key: "radius", group: "scatter", label: "Область разлёта", hint: "Ширина области, которую задевает взмах мыши. Больше — в разлёте участвует больше палочек.", min: 0.35, max: 2, step: 0.05, unit: "percent" },
  { key: "variation", group: "scatter", label: "Неравномерность разлёта", hint: "0% — одинаковая реакция на одинаковый толчок. Больше — одни палочки летят дальше, другие ближе.", min: 0, max: 2, step: 0.05, unit: "percent" },
  { key: "spring", group: "return", label: "Тяга обратно", hint: "Больше — сильнее тянет обратно к буквам. Рядом с мышью эта же тяга возвращает палочки на круг.", min: 4, max: 32, step: 0.5, unit: "number" },
  { key: "damping", group: "return", label: "Торможение", hint: "Больше — быстрее теряют скорость и меньше покачиваются. Меньше — дольше летят по инерции.", min: 1, max: 10, step: 0.1, unit: "number" },
  { key: "spin", group: "appearance", label: "Кручение палочек", hint: "Как сильно каждая палочка вертится после толчка. 0% — без дополнительного кручения.", min: 0, max: 3, step: 0.05, unit: "percent" },
  { key: "trail", group: "appearance", label: "Длина хвостика", hint: "Полупрозрачный след за быстро летящей палочкой. Больше — длиннее хвостик. 0% — следа нет.", min: 0, max: 3, step: 0.05, unit: "percent" },
] as const;

export const formatScatterValue = (value: number, unit: "px" | "percent" | "number") => {
  if (unit === "percent") return `${Math.round(value * 100)}%`;
  if (unit === "px") return `${value} px`;
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
};

// Keep the shipped storage key so the owner's seven existing controls survive this update.
const STORAGE_KEY = "maxsoft-scatter-settings-v1";

export const readScatterSettings = (): ScatterSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultScatterSettings };
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return { ...defaultScatterSettings };
    const record = value as Record<string, unknown>;
    const settings = { ...defaultScatterSettings };
    for (const control of scatterControls) {
      const entry = record[control.key];
      // The earlier seven-control format has no orbit preferences yet.
      if (entry === undefined && (control.key === "orbitRadius" || control.key === "orbitStrength")) continue;
      if (typeof entry !== "number" || !Number.isFinite(entry) || entry < control.min || entry > control.max) {
        return { ...defaultScatterSettings };
      }
      settings[control.key] = entry;
    }
    return settings;
  } catch {
    // These optional visual preferences do not prevent opening the experiment.
    return { ...defaultScatterSettings };
  }
};

export const saveScatterSettings = (settings: ScatterSettings): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false; // The panel reports that this browser could not retain the visual preference.
  }
};

export const exportScatterSettings = (settings: ScatterSettings) =>
  JSON.stringify({ experiment: "maxsoft-scatter-v2", settings }, null, 2);
