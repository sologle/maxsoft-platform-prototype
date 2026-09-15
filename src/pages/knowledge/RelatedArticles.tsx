import type { Navigate } from "../../app/types";
import type { ArticleSummary } from "../../data/platform-data";
export const RelatedArticles = ({
  articles,
  onNavigate,
}: {
  articles: ArticleSummary[];
  onNavigate: Navigate;
}) => (
  <section
    aria-label="Связанные статьи"
    className="rounded-xl border border-[var(--ms-border)] bg-white p-4"
  >
    <h2 className="font-heading text-lg font-bold">
      Связанные статьи · {articles.length}
    </h2>
    {articles.length ? (
      <ul className="mt-3 max-h-80 space-y-2 overflow-auto">
        {articles.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className="w-full rounded-lg p-2 text-left text-sm font-semibold text-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)]"
              onClick={() =>
                onNavigate(a.kind === "video" ? "video" : "article", a.id)
              }
            >
              {a.title}
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-3 text-sm text-[var(--ms-muted)]">
        Нет доступных связанных статей.
      </p>
    )}
  </section>
);
