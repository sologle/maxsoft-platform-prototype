import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getTagGroups } from "../../components/GroupedTagPicker";
import { MotionRegion } from "../../components/MotionRegion";
interface MaterialTagsProps {
  tags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
}
const TagList = ({ tags, selectedTags, onTagSelect }: MaterialTagsProps) => (
  <ul className="material-tag-list">
    {tags.map((tag) => (
      <li key={tag}>
        <button
          type="button"
          className="material-tag"
          aria-label={`Фильтровать по тегу ${tag}`}
          aria-pressed={selectedTags.includes(tag)}
          onClick={() => onTagSelect(tag)}
        >
          {tag}
        </button>
      </li>
    ))}
  </ul>
);
const TagGroup = ({ name, tags, ...actions }: MaterialTagsProps & { name: string }) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="material-tag-group">
      <button
        type="button"
        className="material-disclosure"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        <span>
          {name} · {tags.length}
        </span>
        <ChevronDown aria-hidden="true" size={14} />
      </button>
      <MotionRegion open={open} id={id}>
        <TagList tags={tags} {...actions} />
      </MotionRegion>
    </div>
  );
};
export const MaterialTagGroups = ({ tags, ...actions }: MaterialTagsProps) => {
  const unique = [...new Set(tags)];
  const groups = getTagGroups();
  const assigned = groups
    .map((group) => ({
      ...group,
      tags: unique.filter((tag) =>
        group.tags.some((item) => item.name === tag),
      ),
    }))
    .filter((group) => group.tags.length);
  const ungrouped = unique.filter(
    (tag) =>
      !groups.some((group) => group.tags.some((item) => item.name === tag)),
  );
  return (
    <div className="material-tag-groups">
      {assigned.map((group) => (
        <TagGroup key={group.id} name={group.name} tags={group.tags} {...actions} />
      ))}
      {ungrouped.length > 0 && (
        <TagGroup key="ungrouped" name="Без группы" tags={ungrouped} {...actions} />
      )}
    </div>
  );
};
export const CompactMaterialTags = ({ tags, ...actions }: MaterialTagsProps) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const unique = [...new Set(tags)];
  if (!unique.length) return null;
  return (
    <div className="material-compact-tags">
      <TagList tags={unique.slice(0, 2)} {...actions} />
      {unique.length > 2 && (
        <button
          type="button"
          className="material-disclosure"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Свернуть" : `Ещё ${unique.length - 2}`}
        </button>
      )}
      <MotionRegion open={open} id={id}>
        <TagList tags={unique.slice(2)} {...actions} />
      </MotionRegion>
    </div>
  );
};
