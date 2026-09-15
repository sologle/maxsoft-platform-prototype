import { tagGroups } from "../data/platform-data";
import { prototypeStorageKeys, readPrototypeValue } from "../data/prototype-store";
export interface PickerGroup {
  id: string;
  name: string;
  tags: Array<{ name: string }>;
}
export const getTagGroups = () =>
  readPrototypeValue<PickerGroup[]>(
    prototypeStorageKeys.tags,
    tagGroups.map((group) => ({
      ...group,
      tags: group.tags.map((name) => ({ name })),
    })),
  );
export const GroupedTagPicker = ({
  groups,
  selected,
  onToggle,
}: {
  groups: PickerGroup[];
  selected: string[];
  onToggle: (tag: string) => void;
}) => (
  <div className="space-y-3">
    {groups.map((group) => (
      <details key={group.id} open className="rounded-xl border border-[var(--ms-border)] p-3">
        <summary className="cursor-pointer text-sm font-bold">
          {group.name}{" "}
          <span className="text-xs text-[var(--ms-muted)]">
            {group.tags.filter((tag) => selected.includes(tag.name)).length} / {group.tags.length}
          </span>
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {group.tags.map((tag) => (
            <button
              type="button"
              key={tag.name}
              aria-pressed={selected.includes(tag.name)}
              className={`rounded-xl px-3 py-2 text-sm ring-1 ${selected.includes(tag.name) ? "bg-[var(--ms-primary)] text-white ring-[var(--ms-primary)]" : "bg-white ring-[var(--ms-border)]"}`}
              onClick={() => onToggle(tag.name)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </details>
    ))}
  </div>
);
