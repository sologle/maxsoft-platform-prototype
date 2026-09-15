export const SearchHighlight = ({
  query,
  text,
}: {
  query: string;
  text: string;
}) => {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .flatMap((term) => (term.length > 5 ? [term, term.slice(0, -1)] : [term]))
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  if (!terms.length) return text;
  const escaped = [...new Set(terms)].map((term) =>
    term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const matcher = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(matcher).map((part, index) =>
    terms.includes(part.toLowerCase()) ? (
      <mark className="search-highlight" key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
};
