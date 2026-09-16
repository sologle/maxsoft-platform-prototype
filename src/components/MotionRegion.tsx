import { type HTMLAttributes } from "react";
import { usePresence } from "../hooks/usePresence";

// Keep the component mounted; only its surface leaves after the exit transition.
export const MotionRegion = ({
  open,
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { open: boolean }) => {
  const mounted = usePresence(open);
  if (!mounted) return null;
  return (
    <div
      {...props}
      className={`motion-surface ${className}`}
      data-state={open ? "open" : "closed"}
      inert={!open || undefined}
      aria-hidden={!open || undefined}
    >
      {children}
    </div>
  );
};
