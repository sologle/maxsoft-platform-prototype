import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { Field } from "./ui";

export const PasswordField = (props: Omit<ComponentProps<typeof Field>, "type" | "inputAction">) => {
  const [visible, setVisible] = useState(false);
  return <Field {...props} type={visible ? "text" : "password"} inputAction={
    <button aria-label={visible ? "Скрыть пароль" : "Показать пароль"} aria-pressed={visible}
      className="icon-button" type="button" onClick={() => setVisible((value) => !value)}>
      {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
    </button>
  } />;
};
