import { useState, type SetStateAction } from "react";
// View state belongs to a history entry, so nested pages and browser back retain context.
export function usePageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => window.history.state?.view?.[key] ?? initial);
  const update = (next: SetStateAction<T>) => {
    const resolved = typeof next === "function" ? (next as (value: T) => T)(value) : next;
    const state = window.history.state ?? {};
    window.history.replaceState({ ...state, view: { ...state.view, [key]: resolved } }, "");
    setValue(resolved);
  };
  return [value, update] as const;
}
