import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePresence } from "./usePresence";

describe("usePresence", () => {
  let reduced: boolean;
  beforeEach(() => {
    vi.useFakeTimers();
    reduced = false;
    document.documentElement.style.setProperty("--ms-motion-exit", "120ms");
    vi.stubGlobal("matchMedia", () => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it("сохраняет поверхность для выхода и отменяет удаление при повторном открытии", () => {
    const view = renderHook(({ open }) => usePresence(open), {
      initialProps: { open: true },
    });
    view.rerender({ open: false });
    expect(view.result.current).toBe(true);
    act(() => vi.advanceTimersByTime(60));
    view.rerender({ open: true });
    act(() => vi.runAllTimers());
    expect(view.result.current).toBe(true);
    view.rerender({ open: false });
    act(() => vi.advanceTimersByTime(120));
    expect(view.result.current).toBe(false);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each(["120ms", "120.0ms", "0.12s", ".12s"])(
    "сохраняет 120 ms выхода при CSS-длительности %s, включая production minify",
    (duration) => {
      document.documentElement.style.setProperty("--ms-motion-exit", duration);
      const view = renderHook(({ open }) => usePresence(open), {
        initialProps: { open: true },
      });
      view.rerender({ open: false });
      act(() => vi.advanceTimersByTime(119));
      expect(view.result.current).toBe(true);
      act(() => vi.advanceTimersByTime(1));
      expect(view.result.current).toBe(false);
      view.unmount();
      expect(vi.getTimerCount()).toBe(0);
    },
  );
  it.each(["", "120", "-120ms", "NaNs"])(
    "отклоняет недопустимую CSS-длительность %j без запасного таймера",
    (duration) => {
      document.documentElement.style.setProperty("--ms-motion-exit", duration);
      const view = renderHook(({ open }) => usePresence(open), {
        initialProps: { open: true },
      });
      expect(() => view.rerender({ open: false })).toThrow("UI_MOTION_TOKEN_INVALID");
      expect(vi.getTimerCount()).toBe(0);
    },
  );
  it("не задерживает закрытие при reduced motion", () => {
    reduced = true;
    const view = renderHook(({ open }) => usePresence(open), {
      initialProps: { open: true },
    });
    view.rerender({ open: false });
    expect(view.result.current).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

it("прерывает выход при включении reduced motion и убирает таймер", () => {
  vi.useFakeTimers();
  let reduced = false;
  let changed = () => {};
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return reduced;
    },
    addEventListener: (_: string, handler: () => void) => {
      changed = handler;
    },
    removeEventListener: vi.fn(),
  }));
  document.documentElement.style.setProperty("--ms-motion-exit", "120ms");
  const view = renderHook(({ open }) => usePresence(open), {
    initialProps: { open: true },
  });
  view.rerender({ open: false });
  expect(view.result.current).toBe(true);
  act(() => {
    reduced = true;
    changed();
  });
  expect(view.result.current).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  view.unmount();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
