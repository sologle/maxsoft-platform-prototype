import { useState, type ReactNode, type HTMLAttributes } from "react";
import { usePresence } from "../hooks/usePresence";
export const MotionMessage = ({
  message,
  icon,
  className = "",
  ...props
}: Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  message: string | null | undefined;
  icon?: ReactNode;
}) => {
  const open = Boolean(message);
  const mounted = usePresence(open);
  const [text, setText] = useState(message);
  if (message && text !== message) setText(message);
  if (!mounted) return null;
  return (
    <span
      {...props}
      className={`motion-surface ${className}`}
      data-state={open ? "open" : "closed"}
      aria-hidden={!open || undefined}
      inert={!open || undefined}
    >
      {icon}
      {text}
    </span>
  );
};
