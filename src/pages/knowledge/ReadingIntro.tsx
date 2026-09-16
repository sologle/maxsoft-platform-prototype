import { useRef, useState, type RefObject } from "react";
import type { Navigate } from "../../app/types";
import { ArticleAttachments } from "./ArticleAttachments";
import type { ReadingSection } from "./ReadingToc";
export const ReadingIntro = ({
  sections,
  articleId,
  onNavigate,
  attachmentCount,
  detailsRef,
}: {
  sections: ReadingSection[];
  articleId: string;
  onNavigate: Navigate;
  attachmentCount: number;
  detailsRef: RefObject<HTMLDetailsElement | null>;
}) => {
  const [open, setOpen] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches,
  );
  const initial = useRef(open);
  return (
    <details
      ref={detailsRef}
      className="reading-intro"
      open={initial.current}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary aria-expanded={open}>
        <span>Содержание и вложения</span>
        <span className="reading-file-count">Файлов: {attachmentCount}</span>
      </summary>
      <div className="reading-intro-grid">
        <nav aria-label="Начальное содержание статьи">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              style={{
                paddingInlineStart:
                  8 + Math.max(0, (section.level ?? 2) - 2) * 8,
              }}
            >
              {section.title}
            </a>
          ))}
        </nav>
        <ArticleAttachments articleId={articleId} onNavigate={onNavigate} />
      </div>
    </details>
  );
};
