import { Plus, X } from "lucide-react";
import { Button, Field } from "../../components/ui";
export const DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
export const DomainFields = ({
  values,
  errors,
  required,
  onChange,
}: {
  values: string[];
  errors: Record<string, string>;
  required: boolean;
  onChange: (values: string[]) => void;
}) => (
  <fieldset className="sm:col-span-2">
    <legend className="mb-2 text-sm font-semibold">Рабочие домены</legend>
    <div className="space-y-3">
      {values.map((value, index) => (
        <div key={index} className="flex items-start gap-2">
          <Field
            className="min-w-0 flex-1"
            label={`Рабочий домен ${index + 1}`}
            name={`domain-${index}`}
            value={value}
            placeholder="company.ru"
            required={required && index === 0}
            error={errors[`domain-${index}`]}
            onChange={(event) =>
              onChange(values.map((current, i) => (i === index ? event.target.value : current)))
            }
          />
          <button
            className="icon-button mt-8 shrink-0"
            type="button"
            aria-label={`Удалить домен ${index + 1}`}
            onClick={() =>
              onChange(values.length === 1 ? [""] : values.filter((_, i) => i !== index))
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
    <Button
      className="mt-3"
      tone="secondary"
      icon={<Plus className="h-4 w-4" />}
      onClick={() => onChange([...values, ""])}
    >
      Добавить домен
    </Button>
  </fieldset>
);
