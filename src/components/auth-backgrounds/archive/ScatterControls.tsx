import { Copy, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Button } from "../../ui";
import type { ScenePointer } from "../scene-types";
import { defaultScatterSettings, type ScatterSettings } from "../scatter-preset";
import { exportScatterSettings, formatScatterValue, scatterControls, scatterGroups } from "./scatter-settings";
import "./scatter-controls.css";

export const ScatterControls = ({ settings, onChange, pointer, storageError }: {
  settings: ScatterSettings;
  onChange: (settings: ScatterSettings) => void;
  pointer: RefObject<ScenePointer>;
  storageError: boolean;
}) => {
  const copyRequest = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (restoreFocus.current) containerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open]);
  const close = () => {
    restoreFocus.current = true;
    setOpen(false);
  };
  const update = (next: ScatterSettings) => {
    copyRequest.current += 1;
    setCopyState("idle");
    onChange(next);
  };
  const copy = async () => {
    const request = ++copyRequest.current;
    try {
      await navigator.clipboard.writeText(exportScatterSettings(settings));
      if (copyRequest.current === request) setCopyState("copied");
    } catch {
      // Clipboard permissions vary by browser; expose the same text for manual copying.
      if (copyRequest.current === request) setCopyState("manual");
    }
  };

  return (
    <div
      className="scatter-controls"
      ref={containerRef}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        event.preventDefault();
        event.stopPropagation();
        close();
      }}
      onPointerEnter={() => { pointer.current.active = false; }}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
    >
      {open ? (
        <section aria-label="Настройки разлёта" className="scatter-panel" id="scatter-settings-panel">
          <div className="scatter-panel-heading">
            <h2>Настройки разлёта</h2>
            <button aria-label="Свернуть настройки" className="icon-button" ref={closeRef} onClick={close} type="button">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="scatter-panel-description">Води мышью или пальцем — палочки немного разлетаются. Остановись — держатся на круге. Уведи мышь или отпусти палец — собираются в буквы. Настройки применяются сразу.</p>
          <div className="scatter-sliders">
            {scatterGroups.map((group) => (
              <fieldset className="scatter-group" key={group.id}>
                <legend>{group.title}</legend>
                <p>{group.hint}</p>
                {scatterControls.filter((control) => control.group === group.id).map((control) => (
                  <label className="scatter-control" key={control.key}>
                    <span><strong>{control.label}</strong><output aria-hidden="true">{formatScatterValue(settings[control.key], control.unit)}</output></span>
                    <input
                      aria-label={control.label}
                      aria-describedby={`scatter-hint-${control.key}`}
                      aria-valuetext={formatScatterValue(settings[control.key], control.unit)}
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      type="range"
                      value={settings[control.key]}
                      onChange={(event) => update({ ...settings, [control.key]: Number(event.target.value) })}
                    />
                    <small id={`scatter-hint-${control.key}`}>{control.hint}</small>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <div className="scatter-panel-actions">
            <Button icon={<Copy size={16} aria-hidden="true" />} onClick={copy}>Скопировать настройки</Button>
            <Button icon={<RotateCcw size={15} aria-hidden="true" />} onClick={() => update({ ...defaultScatterSettings })} tone="ghost">Сбросить настройки</Button>
          </div>
          {copyState === "copied" ? <p className="scatter-feedback" role="status">Настройки скопированы — отправь их в чат.</p> : null}
          {copyState === "manual" ? (
            <div className="scatter-feedback">
              <p role="alert">Не удалось скопировать автоматически. Скопируй текст ниже вручную. SCATTER_COPY_UNAVAILABLE</p>
              <textarea aria-label="Настройки для отправки" onFocus={(event) => event.target.select()} readOnly rows={5} value={exportScatterSettings(settings)} />
            </div>
          ) : null}
          {storageError ? <p className="scatter-feedback" aria-live="polite">Браузер не сохранил настройки. Скопируй их перед закрытием страницы. SCATTER_SAVE_UNAVAILABLE</p> : null}
        </section>
      ) : null}
      {!open ? (
        <Button aria-controls="scatter-settings-panel" aria-expanded={open} className="scatter-open" icon={<SlidersHorizontal size={17} aria-hidden="true" />} onClick={() => setOpen(true)} tone="secondary">
          Настроить разлёт
        </Button>
      ) : null}
    </div>
  );
};
