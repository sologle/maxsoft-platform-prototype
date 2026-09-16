import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { Navigate, UserRole } from "../../app/types";
import { files } from "../../data/platform-data";
import {
  readPrototypeValue,
  writePrototypeValue,
} from "../../data/prototype-store";
import { ReadingNavigation } from "./ReadingNavigation";
import { ReadingIntro } from "./ReadingIntro";
import { ReadingToc, type ReadingSection } from "./ReadingToc";
import { visibleViewport } from "../../hooks/viewport";
import "./reading.css";
const panelKey = "maxsoft-prototype-reading-panel-open";
export const ReadingLayout = ({
  children,
  header,
  sections,
  onNavigate,
  articleId,
  role,
  companyType,
}: {
  children: ReactNode;
  header: ReactNode;
  sections: ReadingSection[];
  onNavigate: Navigate;
  articleId: string;
  role: UserRole;
  companyType?: string;
}) => {
  const [scale, setScale] = useState(1);
  const [reading, setReading] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(() =>
    readPrototypeValue(panelKey, true),
  );
  const [mobile, setMobile] = useState(
    () => !window.matchMedia("(min-width: 1024px)").matches,
  );
  const [surface, setSurface] = useState<"tools" | "toc" | null>(null);
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const root = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const modeButton = useRef<HTMLButtonElement>(null);
  const intro = useRef<HTMLDetailsElement>(null);
  const savedScroll = useRef(0);
  const anchor = useRef<{ element: HTMLElement; top: number } | null>(null);
  const attachmentCount = files.filter((f) =>
    f.relatedArticleIds.includes(articleId),
  ).length;
  const tocSections = attachmentCount
    ? [
        { id: "attachments-title", title: `Вложения · ${attachmentCount}` },
        ...sections,
      ]
    : sections;
  const headingOffset = () => {
    const header = reading
      ? parseFloat(getComputedStyle(root.current!).paddingTop)
      : document.querySelector("header")!.getBoundingClientRect().height;
    const controls = mobile
      ? toolbar.current!.getBoundingClientRect().height +
        root
          .current!.querySelector(".reading-toc-trigger")!
          .getBoundingClientRect().height +
        16
      : 24;
    return visibleViewport().top + header + controls;
  };
  const preservePosition = () => {
    const elements = Array.from(
      root.current!.querySelectorAll<HTMLElement>(
        "article h1, .article-content h2, .article-content h3, .article-content p",
      ),
    );
    const element = elements.find(
      (node) => node.getBoundingClientRect().bottom > headingOffset(),
    );
    if (element)
      anchor.current = { element, top: element.getBoundingClientRect().top };
  };
  useLayoutEffect(() => {
    if (!anchor.current) return;
    const { element, top } = anchor.current;
    const delta = element.getBoundingClientRect().top - top;
    if (reading) root.current!.scrollTop += delta;
    else window.scrollBy({ top: delta, behavior: "instant" });
    anchor.current = null;
  }, [scale, desktopOpen, reading]);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setMobile(!query.matches);
      setSurface(null);
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useLayoutEffect(() => {
    const update = () => {
      const viewport = visibleViewport();
      root.current!.style.setProperty(
        "--reading-viewport-height",
        `${viewport.height}px`,
      );
      root.current!.style.setProperty(
        "--reading-viewport-top",
        `${viewport.top}px`,
      );
    };
    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  useEffect(() => {
    if (!reading) return;
    const background: HTMLElement[] = [];
    let ancestor: HTMLElement | null = root.current;
    while (ancestor && ancestor !== document.body) {
      for (const sibling of Array.from(
        ancestor.parentElement?.children ?? [],
      )) {
        if (
          sibling !== ancestor &&
          sibling instanceof HTMLElement &&
          !sibling.inert
        ) {
          sibling.inert = true;
          background.push(sibling);
        }
      }
      ancestor = ancestor.parentElement;
    }
    root.current!.scrollTop = savedScroll.current;
    return () => {
      background.forEach((node) => {
        node.inert = false;
      });
      if (root.current?.isConnected)
        window.scrollTo({ top: savedScroll.current, behavior: "instant" });
    };
  }, [reading]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const offset = headingOffset();
        const targets = tocSections
          .map((s) =>
            root.current?.querySelector<HTMLElement>(`#${CSS.escape(s.id)}`),
          )
          .filter((s): s is HTMLElement => Boolean(s));
        const passed = targets.filter(
          (t) => t.getBoundingClientRect().top <= offset + 24,
        );
        const current = passed.at(-1) ?? targets[0];
        if (current) setActive(current.id);
      });
    };
    const container = reading ? root.current! : window;
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(root.current!.querySelector("article")!);
    update();
    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [reading, sections, scale, attachmentCount, mobile]);
  const jump = (id: string) => {
    if (id === "attachments-title" && intro.current) intro.current.open = true;
    const target = root.current?.querySelector<HTMLElement>(
      `#${CSS.escape(id)}`,
    );
    if (!target) return;
    const top = target.getBoundingClientRect().top - headingOffset();
    if (reading)
      root.current!.scrollTo({
        top: root.current!.scrollTop + top,
        behavior: "instant",
      });
    else window.scrollTo({ top: window.scrollY + top, behavior: "instant" });
    setActive(id);
    target.focus({ preventScroll: true });
  };
  return (
    <div
      ref={root}
      className={`reading-layout ${reading ? "reading-fullscreen" : ""}`}
      data-panel-open={desktopOpen}
      data-reading-mode={reading ? "fullscreen" : "standard"}
      onKeyDown={(event) => {
        if (event.key === "Escape" && reading && !surface) {
          event.preventDefault();
          setReading(false);
          modeButton.current?.focus({ preventScroll: true });
        }
      }}
      onClick={(event) => {
        const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
          'a[href^="#"]',
        );
        if (link && !event.defaultPrevented && root.current?.contains(link)) {
          event.preventDefault();
          jump(link.hash.slice(1));
        }
      }}
    >
      <ReadingNavigation
        onNavigate={onNavigate}
        articleId={articleId}
        role={role}
        companyType={companyType}
        mobile={mobile}
        open={mobile ? surface === "tools" : desktopOpen}
        setOpen={(open) => {
          if (mobile) setSurface(open ? "tools" : null);
          else {
            preservePosition();
            writePrototypeValue(panelKey, open);
            setDesktopOpen(open);
          }
        }}
        scale={scale}
        setScale={(value) => {
          if (value === scale) return;
          preservePosition();
          setScale(value);
        }}
        reading={reading}
        toggleReading={() => {
          if (!reading) savedScroll.current = window.scrollY;
          setReading((value) => !value);
        }}
        modeButton={modeButton}
        toolbar={toolbar}
      />
      <div className="reading-material">
        <ReadingToc
          sections={tocSections}
          active={active}
          jump={jump}
          open={surface === "toc"}
          setOpen={(open) => setSurface(open ? "toc" : null)}
        />
        <article
          className="article-scaled"
          style={{ "--article-scale": scale } as CSSProperties}
        >
          {header}
          <ReadingIntro
            sections={sections}
            articleId={articleId}
            onNavigate={onNavigate}
            attachmentCount={attachmentCount}
            detailsRef={intro}
          />
          {children}
        </article>
      </div>
    </div>
  );
};
