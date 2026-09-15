import { Button, SelectField } from "../../components/ui";
import { InfoHint } from "../../components/InfoHint";
export const TypeRemoval = ({
  name,
  isDefault,
  types,
  companies,
  lastAudience,
  shared,
  companyReplacement,
  audienceReplacement,
  setCompanyReplacement,
  setAudienceReplacement,
  onCancel,
  onRemove,
}: {
  name: string;
  isDefault: boolean;
  types: string[];
  companies: number;
  lastAudience: string[];
  shared: number;
  companyReplacement: string;
  audienceReplacement: string;
  setCompanyReplacement: (value: string) => void;
  setAudienceReplacement: (value: string) => void;
  onCancel: () => void;
  onRemove: () => void;
}) => (
  <div>
    <div className="flex items-center">
      <p className="text-sm font-bold">Удаление типа «{name}»</p>
      <InfoHint
        label="Удаление типа"
        text="У статей с другой разрешённой аудиторией удаляется только связь с этим типом. Последняя аудитория и компании требуют явно выбранной замены."
      />
    </div>
    <dl className="my-4 space-y-2 text-sm">
      <div>Компании: {companies}</div>
      <div>Статьи с потерей последней аудитории: {lastAudience.length}</div>
      <div>Статьи с удалением одной связи: {shared}</div>
    </dl>
    <p className="text-sm leading-6">
      Права остальных типов, режим «Все типы» и публикация сохранятся. Все связанные компании должны
      получить другой тип; его права будут действовать для их сотрудников.
    </p>
    {isDefault ? (
      <p className="my-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
        Этот тип базовый. Сначала явно назначьте другой базовый тип через его карточку.
      </p>
    ) : null}
    {companies > 0 ? (
      <SelectField
        className="mt-4"
        label="Новый тип для компаний"
        value={companyReplacement}
        onChange={(event) => setCompanyReplacement(event.target.value)}
      >
        <option value="" disabled>
          Выберите тип
        </option>
        {types.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </SelectField>
    ) : null}
    {lastAudience.length > 0 ? (
      <>
        <ul className="my-4 list-disc pl-5 text-sm">
          {lastAudience.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
        <SelectField
          label="Новая аудитория статей"
          value={audienceReplacement}
          onChange={(event) => setAudienceReplacement(event.target.value)}
        >
          <option value="" disabled>
            Выберите тип
          </option>
          {types.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </SelectField>
      </>
    ) : null}
    <div className="mt-6 flex flex-wrap justify-end gap-2">
      <Button tone="ghost" onClick={onCancel}>
        Отмена
      </Button>
      <Button
        tone="danger"
        disabled={
          isDefault ||
          (companies > 0 && !companyReplacement) ||
          (lastAudience.length > 0 && !audienceReplacement)
        }
        onClick={onRemove}
      >
        Удалить тип
      </Button>
    </div>
  </div>
);
