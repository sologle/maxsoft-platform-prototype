import { useEffect, useState } from "react";

export const usePresence = (open: boolean, exitDuration = 220) => {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timeout = window.setTimeout(() => setMounted(false), exitDuration);
    return () => window.clearTimeout(timeout);
  }, [exitDuration, open]);

  return mounted;
};
