import { useId, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { MotionRegion } from "../../components/MotionRegion";

// The first entries and primary actions stay visible at every screen size.
export function HomeCollection<T>({
  title,
  icon: Icon,
  accent,
  items,
  renderItem,
  itemKey,
  empty,
  note,
  grid = false,
  action,
}: {
  title: string;
  icon: LucideIcon;
  accent: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  itemKey: (item: T) => string;
  empty: string;
  note?: string;
  grid?: boolean;
  action?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const previewCount = 3;
  const remainder = items.slice(previewCount);
  const list = (entries: T[]) => (
    <ul className={grid ? "home-product-grid" : "home-article-list"}>
      {entries.map((item) => (
        <li key={itemKey(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
  return (
    <section aria-label={title} className="home-collection">
      <div className="home-collection-heading">
        <span className={`home-accent ${accent}`}>
          <Icon size={20} aria-hidden="true" />
        </span>
        <h2>
          {title} <span className="home-count">· {items.length}</span>
        </h2>
        {action}
      </div>
      {note && <p className="home-note">{note}</p>}
      {items.length ? (
        list(items.slice(0, previewCount))
      ) : (
        <p className="home-empty">{empty}</p>
      )}
      <MotionRegion open={expanded} id={id}>
        {list(remainder)}
      </MotionRegion>
      {remainder.length > 0 && (
        <button
          type="button"
          className="home-more"
          aria-controls={id}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Свернуть" : `Ещё ${remainder.length}`}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={expanded ? "rotate-180" : ""}
          />
        </button>
      )}
    </section>
  );
}
