import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getTagGroups } from "../../components/GroupedTagPicker";
import { MotionRegion } from "../../components/MotionRegion";
const TagList = ({ tags }: { tags: string[] }) => (
  <ul className="material-tag-list">
    {tags.map((tag) => (
      <li className="material-tag" key={tag}>
        {tag}
      </li>
    ))}
  </ul>
);
const TagGroup = ({ name, tags }: { name: string; tags: string[] }) => {
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
        <TagList tags={tags} />
      </MotionRegion>
    </div>
  );
};
export const MaterialTagGroups = ({ tags }: { tags: string[] }) => {
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
        <TagGroup key={group.id} name={group.name} tags={group.tags} />
      ))}
      {ungrouped.length > 0 && (
        <TagGroup key="ungrouped" name="Без группы" tags={ungrouped} />
      )}
    </div>
  );
};
export const CompactMaterialTags = ({ tags }: { tags: string[] }) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const unique = [...new Set(tags)];
  if (!unique.length) return null;
  return (
    <div className="material-compact-tags">
      <TagList tags={unique.slice(0, 2)} />
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
        <TagList tags={unique.slice(2)} />
      </MotionRegion>
    </div>
  );
};
