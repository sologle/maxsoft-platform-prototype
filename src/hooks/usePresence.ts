import { useLayoutEffect, useState } from "react";

// CSS owns the timing; consumers keep this hook mounted while open changes.
export const usePresence = (open: boolean) => {
  const [mounted, setMounted] = useState(open);
  useLayoutEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) {
      setMounted(false);
      return;
    }
    const duration = getComputedStyle(document.documentElement)
      .getPropertyValue("--ms-motion-exit")
      .trim();
    // Production CSS can shorten 120ms to .12s without changing its duration.
    const time = /^(\d+(?:\.\d+)?|\.\d+)(ms|s)$/.exec(duration);
    if (!time)
      throw new Error(
        "UI_MOTION_TOKEN_INVALID: --ms-motion-exit must be a non-negative duration in ms or s.",
      );
    const timeout = window.setTimeout(
      () => setMounted(false),
      Number(time[1]) * (time[2] === "s" ? 1000 : 1),
    );
    const reduce = () => {
      if (preference.matches) {
        window.clearTimeout(timeout);
        setMounted(false);
      }
    };
    preference.addEventListener("change", reduce);
    return () => {
      window.clearTimeout(timeout);
      preference.removeEventListener("change", reduce);
    };
  }, [open, mounted]);
  return open || mounted;
};
