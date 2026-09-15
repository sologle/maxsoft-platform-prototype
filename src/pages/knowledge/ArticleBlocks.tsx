import { useState } from "react";
import type { licensingSections } from "../../data/licensing/catalog";

type Section = (typeof licensingSections)[number];
// Only version-controlled, reviewed article HTML reaches this renderer; no user HTML/import path.
const StaticContent = ({ html }: { html: string }) => (
  <div
    dangerouslySetInnerHTML={{
      __html: html.replaceAll(
        'src="content/',
        `src="${import.meta.env.BASE_URL}content/`,
      ),
    }}
  />
);
export const ArticleTabs = ({
  id,
  tabs,
}: {
  id: string;
  tabs: NonNullable<Section["tabs"]>;
}) => {
  const [active, setActive] = useState(0);
  return (
    <div className="article-tabs">
      <div role="tablist" aria-label="Виды лицензий">
        {tabs.map((tab, index) => (
          <button
            type="button"
            key={tab.id}
            role="tab"
            id={`${id}-tab-${tab.id}`}
            aria-controls={`${id}-panel-${tab.id}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (index + tabs.length - 1) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : null;
              if (next === null) return;
              event.preventDefault();
              setActive(next);
              document.getElementById(`${id}-tab-${tabs[next].id}`)?.focus();
            }}
          >
            {tab.title}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${id}-panel-${tab.id}`}
          aria-labelledby={`${id}-tab-${tab.id}`}
          hidden={active !== index}
          tabIndex={0}
        >
          <StaticContent html={tab.html} />
        </div>
      ))}
    </div>
  );
};
export const ArticleBlocks = ({ sections }: { sections: Section[] }) => (
  <>
    {sections.map((section) => {
      const Heading = `h${section.level}` as "h2" | "h3" | "h4";
      return (
        <section key={section.id}>
          <Heading id={section.id} tabIndex={-1}>
            {section.title}
          </Heading>
          <StaticContent html={section.html} />
          {section.tabs ? (
            <ArticleTabs id={section.id} tabs={section.tabs} />
          ) : null}
        </section>
      );
    })}
  </>
);
