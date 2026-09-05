import { useCallback, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ReactiveCanvas } from "../ReactiveCanvas";
import type { ScenePointer } from "../scene-types";
import { ScatterControls } from "./ScatterControls";
import { createScatterWordmark } from "../scatter-scene";
import type { ScatterSettings } from "../scatter-preset";
import { readScatterSettings, saveScatterSettings } from "./scatter-settings";

export const ScatterExperiment = ({ pointer }: { pointer: RefObject<ScenePointer> }) => {
  const [settings, setSettings] = useState(readScatterSettings);
  const [storageError, setStorageError] = useState(false);
  const settingsRef = useRef(settings);
  // Read current controls each frame without remounting the canvas or restarting the word.
  const createScene = useCallback((width: number, height: number) =>
    createScatterWordmark(width, height, () => settingsRef.current), []);
  const changeSettings = (next: ScatterSettings) => {
    settingsRef.current = next;
    setSettings(next);
    setStorageError(!saveScatterSettings(next));
  };
  return (
    <>
      <ReactiveCanvas pointer={pointer} createScene={createScene} darkBackground="#0c1722" />
      {createPortal(
        <ScatterControls settings={settings} onChange={changeSettings} pointer={pointer} storageError={storageError} />,
        document.body,
      )}
    </>
  );
};
