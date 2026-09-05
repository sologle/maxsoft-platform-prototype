import { lazy, Suspense, type RefObject } from "react";
import type { AuthBackground } from "./background-state";
import { ReactiveCanvas } from "./ReactiveCanvas";
import { createAmbientField } from "./field-scene";
import { createScatterWordmark } from "./scatter-scene";
import { defaultScatterSettings } from "./scatter-preset";
import type { ScenePointer } from "./scene-types";

const ArchivedBackgroundArt = lazy(() => import("./archive/BackgroundArt"));

const createMainWordmark = (width: number, height: number) =>
  createScatterWordmark(width, height, () => defaultScatterSettings);

export const BackgroundArt = ({ variant, pointer, showWordmark, comparing }: {
  variant: AuthBackground;
  comparing: boolean;
  showWordmark: boolean;
  pointer: RefObject<ScenePointer>;
}) => !comparing ? (
  <ReactiveCanvas pointer={pointer} createScene={showWordmark ? createMainWordmark : createAmbientField} darkBackground="#0c1722" />
) : (
  <Suspense fallback={null}>
    <ArchivedBackgroundArt variant={variant} pointer={pointer} showWordmark={showWordmark} />
  </Suspense>
);
