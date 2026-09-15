import { SelectField } from "../../components/ui";
import type { MaterialKind } from "../../data/material-query";
export const MaterialFilters = ({
  kind,
  setKind,
  sort,
  setSort,
}: {
  kind: MaterialKind;
  setKind: (v: MaterialKind) => void;
  sort: string;
  setSort: (v: string) => void;
}) => (
  <>
    <SelectField
      className="min-w-0 sm:w-40"
      label="Вид материала"
      onChange={(e) => setKind(e.target.value as MaterialKind)}
      value={kind}
    >
      <option value="all">Все</option>
      <option value="article">Статьи</option>
      <option value="video">Видео</option>
      <option value="file">Файлы</option>
    </SelectField>
    <SelectField
      className="min-w-0 sm:w-56"
      label="Сортировка"
      onChange={(e) => setSort(e.target.value)}
      value={sort}
    >
      <option value="updated">По дате обновления · новые первыми</option>
      <option value="title">По названию</option>
    </SelectField>
  </>
);
