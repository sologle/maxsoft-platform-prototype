import { ArticleBlocks } from "./ArticleBlocks";
import { getArticleContent } from "../../data/article-content";
import { usePersonalArticle } from "../../hooks/usePersonalArticle";
import { licensingArticleId } from "../../data/licensing/catalog";
import { legacyArticleSections as articleSections } from "../../data/article-content";
import { demoResources } from "../../app/demo-resources";
import {
  Bookmark,
  Maximize2,
  Pause,
  Pencil,
  Play,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Navigate, UserRole } from "../../app/types";
import { Badge, Breadcrumbs, Button } from "../../components/ui";
import {
  articles,
  files,
  canRoleAccessArticle,
  isArticlePublished,
  type ArticleSummary,
} from "../../data/platform-data";
import {
  getArticleSections,
  getArticleTags,
} from "../../data/prototype-entities";
import { ReadingLayout } from "./ReadingLayout";
import { ArticleAttachments } from "./ArticleAttachments";
interface ArticlePageProps {
  onDownload: () => void;
  onNavigate: Navigate;
  onNotice: (message: string) => void;
  resource?: string;
  role: UserRole;
  companyId?: string;
  companyType?: string;
}
const ArticleHeader = ({
  article,
  onNavigate,
  role,
  companyId,
  companyType,
  onNotice,
}: {
  article: ArticleSummary;
  onNavigate: Navigate;
  role: UserRole;
  companyId?: string;
  companyType?: string;
  onNotice: (message: string) => void;
}) => {
  const { saved, toggle } = usePersonalArticle(
    article,
    role,
    companyId,
    companyType,
    onNotice,
  );
  const canEdit = role === "portal-admin" || role === "support-engineer";
  const primarySection = getArticleSections(article)[0];
  if (!primarySection)
    throw new Error(
      `KB_ARTICLE_SECTION_MISSING: у статьи ${article.id} не задан раздел`,
    );
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "База знаний", onClick: () => onNavigate("knowledge") },
          ...primarySection.split(" / ").map((label) => ({ label })),
        ]}
      />
      <div className="flex flex-col gap-4 border-b border-[var(--ms-border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={isArticlePublished(article) ? "green" : "amber"}>
              {isArticlePublished(article) ? "Опубликована" : "Черновик"}
            </Badge>
            {getArticleTags(article).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <h1 className="font-heading text-[clamp(1.9rem,5vw,2.8rem)] font-bold leading-[1.12] tracking-[-.03em]">
            {article.title}
          </h1>
          <p className="mt-4 text-sm text-[var(--ms-muted)]">
            {article.id.startsWith("licensing-")
              ? "Иван Немков · Источник: 09.07.2026 · "
              : "Демонстрационный материал · "}
            Обновлено в демо: {article.updated}
          </p>
        </div>
        <div className="article-actions flex shrink-0 flex-wrap gap-2">
          <Button
            aria-pressed={saved}
            icon={
              <Bookmark
                className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
                aria-hidden="true"
              />
            }
            onClick={toggle}
            disabled={!isArticlePublished(article)}
            tone="secondary"
          >
            {saved ? "Сохранено" : "Сохранить"}
          </Button>
          {canEdit ? (
            <Button
              icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
              onClick={() => onNavigate("editor", article.id)}
            >
              Редактировать
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
};

export const ArticlePage = ({
  onNavigate,
  resource,
  role,
  companyId,
  companyType,
  onNotice,
}: ArticlePageProps) => {
  const article = articles.find(
    (item) => item.id === (resource ?? demoResources.article),
  )!;
  const content = getArticleContent(article.id);
  const sections = content.length ? content : articleSections[article.id];
  return (
    <ReadingLayout
      onNavigate={onNavigate}
      articleId={article.id}
      role={role}
      companyType={companyType}
      sections={[
        ...sections,
        ...(files.some((f) => f.relatedArticleIds.includes(article.id))
          ? [{ id: "attachments-title", title: "Вложения" }]
          : []),
      ]}
    >
      <ArticleHeader
        article={article}
        onNavigate={onNavigate}
        role={role}
        companyId={companyId}
        companyType={companyType}
        onNotice={onNotice}
      />
      <div className="article-content mt-8">
        <p className="article-lead">{article.description}</p>
        {content.length &&
        article.id !== licensingArticleId &&
        canRoleAccessArticle(
          articles.find((a) => a.id === licensingArticleId)!,
          role,
          companyType,
        ) ? (
          <p>
            <Button
              tone="secondary"
              onClick={() => onNavigate("article", licensingArticleId)}
            >
              Читать полный источник
            </Button>
          </p>
        ) : null}
        {content.length ? (
          <ArticleBlocks sections={content} />
        ) : (
          articleSections[article.id].map((section, index) => (
            <section key={section.id}>
              <h2 id={section.id} tabIndex={-1}>
                {section.title}
              </h2>
              <p>{section.text}</p>
              {article.id === "network-license" && index === 0 ? (
                <div className="my-6 rounded-xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-sm text-sky-900">
                    Для установки потребуются права администратора и файл
                    лицензии, полученный от менеджера MaxSoft.
                  </p>
                </div>
              ) : null}
            </section>
          ))
        )}
        <ArticleAttachments articleId={article.id} onNavigate={onNavigate} />
      </div>
    </ReadingLayout>
  );
};
const timecodes = [
  { label: "00:00", seconds: 0, title: "Введение и требования" },
  { label: "02:15", seconds: 135, title: "Подключение модуля" },
  { label: "07:12", seconds: 432, title: "Настройка обмена" },
  { label: "14:40", seconds: 880, title: "Проверка результата" },
];
const videoDuration = 1080;

export const VideoArticlePage = ({
  onNavigate,
  resource,
  role,
  companyId,
  companyType,
  onNotice,
}: ArticlePageProps) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(135);
  const article = articles.find(
    (candidate) => candidate.id === (resource ?? demoResources.video),
  )!;

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      setProgress((current) => (current >= videoDuration ? 0 : current + 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [playing]);

  const displayTime = (seconds: number) =>
    `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <ReadingLayout
      onNavigate={onNavigate}
      articleId={article.id}
      role={role}
      companyType={companyType}
      sections={[
        { id: "video-details", title: "Что показано в видео" },
        { id: "attachments-title", title: "Вложения" },
      ]}
    >
      <ArticleHeader
        article={article}
        onNavigate={onNavigate}
        role={role}
        companyId={companyId}
        companyType={companyType}
        onNotice={onNotice}
      />
      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="min-w-0">
          <div className="relative aspect-video min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#153550] via-[#0e2438] to-[#081827] shadow-[0_18px_48px_rgba(9,25,40,.28)]">
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_60%_35%,rgba(61,155,219,.32),transparent_38%)]">
              <button
                aria-label={playing ? "Пауза" : "Воспроизвести"}
                className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-[var(--ms-primary)] shadow-[0_10px_35px_rgba(0,0,0,.32)] transition hover:scale-105"
                onClick={() => setPlaying((current) => !current)}
                type="button"
              >
                {playing ? (
                  <Pause className="h-7 w-7 fill-current" aria-hidden="true" />
                ) : (
                  <Play
                    className="ml-1 h-7 w-7 fill-current"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-white">
              <button
                aria-label="Перейти по видео"
                className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/25"
                onClick={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setProgress(
                    Math.round(
                      ((event.clientX - bounds.left) / bounds.width) *
                        videoDuration,
                    ),
                  );
                }}
                type="button"
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-[#48aee8] transition-[width] duration-300"
                  style={{ width: `${(progress / videoDuration) * 100}%` }}
                />
              </button>
              <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                <button
                  aria-label={playing ? "Пауза" : "Воспроизвести"}
                  onClick={() => setPlaying((current) => !current)}
                  type="button"
                >
                  {playing ? (
                    <Pause
                      className="h-4 w-4 fill-current"
                      aria-hidden="true"
                    />
                  ) : (
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  )}
                </button>
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                <span>{displayTime(progress)} / 18:00</span>
                <Maximize2 className="ml-auto h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div className="article-content mt-7">
            <p className="article-lead">{article.description}</p>
            <h2 id="video-details">Что показано в видео</h2>
            <p className="text-sm text-[var(--ms-muted)]">
              Демонстрация плеера и таймкодов; видеозапись не подключена.
            </p>
            <p>
              Подготовка интеграционного модуля, выбор проекта, сопоставление
              справочников и контроль первой синхронизации.
            </p>
          </div>
        </section>
        <aside className="min-w-0 rounded-2xl border border-[var(--ms-border)] bg-slate-50 p-3 sm:p-4 lg:self-start">
          <h2 className="px-2 pb-3 font-heading text-lg font-bold">Таймкоды</h2>
          <div className="space-y-1.5">
            {timecodes.map((timecode) => {
              const active =
                progress >= timecode.seconds &&
                progress <
                  (timecodes[timecodes.indexOf(timecode) + 1]?.seconds ??
                    videoDuration);
              return (
                <button
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${active ? "bg-white text-[var(--ms-primary)] shadow-sm" : "hover:bg-white"}`}
                  key={timecode.label}
                  onClick={() => {
                    setProgress(timecode.seconds);
                    setPlaying(true);
                  }}
                  type="button"
                >
                  <span className="rounded-lg bg-[var(--ms-primary-soft)] px-2 py-1 font-mono text-xs font-bold text-[var(--ms-primary)]">
                    {timecode.label}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold">
                    {timecode.title}
                  </span>
                  {active ? (
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
      <div className="article-content">
        <ArticleAttachments articleId={article.id} onNavigate={onNavigate} />
      </div>
    </ReadingLayout>
  );
};
