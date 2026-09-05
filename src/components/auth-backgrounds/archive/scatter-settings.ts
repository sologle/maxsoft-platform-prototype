export interface ScatterSettings {
  force: number;
  radius: number;
  spring: number;
  damping: number;
  spin: number;
  trail: number;
  variation: number;
}

export const defaultScatterSettings: Readonly<ScatterSettings> = Object.freeze({
  force: 1, radius: 1, spring: 14, damping: 4.4, spin: 1, trail: 1, variation: 1,
});

export const scatterControls = [
  { key: "force", label: "Сила разлёта", hint: "Насколько далеко улетают штрихи", min: 0, max: 2.5, step: 0.05 },
  { key: "radius", label: "Радиус влияния", hint: "Размер области вокруг курсора", min: 0.35, max: 2, step: 0.05 },
  { key: "spring", label: "Сила возврата", hint: "Как сильно штрихи тянутся в надпись", min: 4, max: 32, step: 0.5 },
  { key: "damping", label: "Затухание", hint: "Выше — меньше инерции и колебаний", min: 1, max: 10, step: 0.1 },
  { key: "spin", label: "Вращение", hint: "Закручивание при разлёте", min: 0, max: 3, step: 0.05 },
  { key: "trail", label: "Длина следа", hint: "Шлейф за летящими штрихами", min: 0, max: 3, step: 0.05 },
  { key: "variation", label: "Разброс", hint: "Разница в силе между штрихами", min: 0, max: 2, step: 0.05 },
] as const;

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
  JSON.stringify({ experiment: "maxsoft-scatter-v1", settings }, null, 2);
