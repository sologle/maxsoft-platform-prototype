import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Eye,
  FileText,
  Maximize2,
  Minimize2,
  Minus,
  Pause,
  Pencil,
  Play,
  Plus,
  Type,
  Volume2,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import type { Navigate, UserRole } from "../../app/types";
import { Badge, Breadcrumbs, Button } from "../../components/ui";
import { articles, isArticlePublished, type ArticleSummary } from "../../data/platform-data";
import { getArticleSections, getArticleTags } from "../../data/prototype-entities";

interface ArticlePageProps {
  onDownload: () => void;
  onNavigate: Navigate;
  onNotice: (message: string) => void;
  resource?: string;
  role: UserRole;
}

const ArticleHeader = ({
  article,
  onNavigate,
  role,
}: {
  article: ArticleSummary;
  onNavigate: Navigate;
  role: UserRole;
}) => {
  const [saved, setSaved] = useState(false);
  const canEdit = role === "portal-admin" || role === "support-engineer";
  const primarySection = getArticleSections(article)[0];
  if (!primarySection)
    throw new Error(`KB_ARTICLE_SECTION_MISSING: у статьи ${article.id} не задан раздел`);
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
            {getArticleTags(article).map((tag) => <Badge key={tag}>{tag}</Badge>)}
          </div>
          <h1 className="font-heading text-[clamp(1.9rem,5vw,2.8rem)] font-bold leading-[1.12] tracking-[-.03em]">
            {article.title}
          </h1>
          <p className="mt-4 text-sm text-[var(--ms-muted)]">
            Анна Смирнова · Обновлено сегодня в 10:42 · 8 минут чтения
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            aria-pressed={saved}
            icon={<Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden="true" />}
            onClick={() => setSaved((current) => !current)}
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

const defaultArticleId = "network-license";
const defaultVideoId = "cad-integration";

const articleSections: Record<string, Array<{ id: string; text: string; title: string }>> = {
  "network-license": [
    { id: "preparation", title: "Перед началом работы", text: "Убедитесь, что сервер лицензий доступен из корпоративной сети, а системное время на сервере и рабочих станциях синхронизировано." },
    { id: "installation", title: "Установка сервера лицензий", text: "Скачайте актуальный дистрибутив, запустите установщик от имени администратора и укажите каталог хранения лицензий." },
    { id: "connection", title: "Подключение рабочего места", text: "Откройте настройки продукта, выберите сетевой тип лицензирования и укажите адрес сервера server.company.local:1947." },
    { id: "diagnostics", title: "Диагностика", text: "Если лицензия не найдена, проверьте доступность порта, журнал службы и совместимость версий." },
  ],
  "project-template": [
    { id: "preparation", title: "Подготовка структуры", text: "Создайте единый корневой каталог проекта и согласуйте правила именования файлов с командой." },
    { id: "installation", title: "Шаблоны проекта", text: "Добавьте утверждённые шаблоны, библиотеки и общие параметры до начала моделирования." },
    { id: "connection", title: "Совместная работа", text: "Назначьте владельцев разделов и настройте регулярную синхронизацию изменений." },
    { id: "diagnostics", title: "Контроль качества", text: "Перед публикацией проверьте структуру, ссылки и обязательные свойства моделей." },
  ],
  "server-migration": [
    { id: "preparation", title: "Подготовка миграции", text: "Зафиксируйте текущие лицензии, сделайте резервную копию и уведомите пользователей о техническом окне." },
    { id: "installation", title: "Перенос службы", text: "Установите сервер лицензий на новом узле и восстановите проверенную конфигурацию." },
    { id: "connection", title: "Переключение клиентов", text: "Обновите адрес сервера на рабочих местах и проверьте выдачу лицензий тестовой группе." },
    { id: "diagnostics", title: "Завершение", text: "После контрольного периода отключите старую службу и сохраните журнал миграции." },
  ],
  "update-2026": [
    { id: "preparation", title: "Перед обновлением", text: "Сделайте резервную копию проектов и проверьте системные требования версии 2026." },
    { id: "installation", title: "Обновление компонентов", text: "Устанавливайте компоненты в согласованном порядке и фиксируйте результат каждого шага." },
    { id: "connection", title: "Проверка модулей", text: "Откройте контрольный проект и проверьте совместимость подключённых модулей." },
    { id: "diagnostics", title: "Возврат к работе", text: "После успешной проверки обновите рабочие места и сообщите пользователям о завершении." },
  ],
};

const articleAttachment: Record<string, string | undefined> = {
  "network-license": "инструкция_активации.pdf",
  "update-2026": "регламент_обновления.docx",
};

export const ArticlePage = ({ onNavigate, resource, role }: ArticlePageProps) => {
  const [fontScale, setFontScale] = useState(1);
  const [readingMode, setReadingMode] = useState(false);
  const article = articles.find((candidate) => candidate.id === (resource ?? defaultArticleId))!;
  const sections = articleSections[article.id];
  const attachment = articleAttachment[article.id];

  useEffect(() => {
    if (!readingMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [readingMode]);

  return (
  <article
    className={
      readingMode
        ? "fixed inset-0 z-[85] overflow-y-auto bg-white p-4 sm:p-8 lg:p-10"
        : "mx-auto max-w-[1180px] rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] sm:p-8 lg:p-10"
    }
    data-reading-mode={readingMode ? "fullscreen" : "standard"}
    style={{ "--article-font-size": `${fontScale}rem` } as CSSProperties}
  >
    <div className={readingMode ? "mx-auto max-w-[1480px]" : undefined}>
      <div className="mb-5 flex flex-wrap items-center justify-end gap-2 rounded-xl border border-[var(--ms-border)] bg-slate-50 p-2">
        <span className="mr-auto flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[.1em] text-[var(--ms-muted)]">
          <Type className="h-4 w-4" aria-hidden="true" />
          Размер текста
        </span>
        <button
          aria-label="Уменьшить размер текста"
          className="icon-button bg-white"
          disabled={fontScale <= 0.9}
          onClick={() => setFontScale((current) => Math.max(0.9, current - 0.1))}
          type="button"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span aria-live="polite" className="min-w-12 text-center text-sm font-bold">
          {Math.round(fontScale * 100)}%
        </span>
        <button
          aria-label="Увеличить размер текста"
          className="icon-button bg-white"
          disabled={fontScale >= 1.3}
          onClick={() => setFontScale((current) => Math.min(1.3, current + 0.1))}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        <Button
          aria-label={readingMode ? "Выйти из полноэкранного режима" : "На весь экран"}
          icon={
            readingMode ? (
              <Minimize2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            )
          }
          onClick={() => setReadingMode((current) => !current)}
          tone="secondary"
        >
          {readingMode ? "Обычный режим" : "Режим чтения"}
        </Button>
      </div>
      <ArticleHeader article={article} onNavigate={onNavigate} role={role} />
    <div className="mt-8 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_250px]">
      <div className="article-content min-w-0">
        <p className="article-lead">
          {article.description}
        </p>
        {sections.map((section, index) => <div key={section.id}>
          <h2 id={section.id}>{section.title}</h2>
          <p>{section.text}</p>
          {article.id === "network-license" && index === 0 ? <div className="my-6 rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:p-5">
          <p className="flex items-start gap-3 text-sm leading-6 text-sky-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
            Для установки потребуются права администратора и файл лицензии, полученный от менеджера MaxSoft.
          </p>
          </div> : null}
        </div>)}

        {attachment ? <section
          className="mt-10 border-t border-[var(--ms-border)] pt-7"
          aria-labelledby="attachments-title"
        >
          <h2 className="!mt-0" id="attachments-title">
            Вложения
          </h2>
          <button
            className="mt-4 flex w-full min-w-0 items-center gap-3 rounded-2xl border border-[var(--ms-border)] p-4 text-left transition hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)]"
            onClick={() => onNavigate("file-preview", attachment)}
            type="button"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{attachment}</span>
              <span className="mt-1 block text-xs text-[var(--ms-muted)]">Файл · открыть предпросмотр</span>
            </span>
            <Eye className="h-5 w-5 shrink-0 text-[var(--ms-primary)]" aria-hidden="true" />
          </button>
        </section> : null}
      </div>
      <aside className={readingMode ? "hidden" : "hidden lg:block"}>
        <nav aria-label="Содержание статьи" className="sticky top-28 rounded-2xl bg-slate-50 p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.12em] text-slate-400">В этой статье</p>
          {sections.map(({ id, title: label }) => (
            <a
              className="block rounded-lg px-2 py-2 text-sm text-[var(--ms-muted)] transition hover:bg-white hover:text-[var(--ms-primary)]"
              href={`#${id}`}
              key={id}
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>
    </div>
    </div>
  </article>
  );
};

const timecodes = [
  { label: "00:00", seconds: 0, title: "Введение и требования" },
  { label: "02:15", seconds: 135, title: "Подключение модуля" },
  { label: "07:12", seconds: 432, title: "Настройка обмена" },
  { label: "14:40", seconds: 880, title: "Проверка результата" },
];
const videoDuration = 1080;

export const VideoArticlePage = ({ onNavigate, resource, role }: ArticlePageProps) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(135);
  const article = articles.find((candidate) => candidate.id === (resource ?? defaultVideoId))!;

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
    <article className="mx-auto max-w-[1180px] rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] sm:p-8 lg:p-10">
      <ArticleHeader article={article} onNavigate={onNavigate} role={role} />
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
                  <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
                )}
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-white">
              <button
                aria-label="Перейти по видео"
                className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/25"
                onClick={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setProgress(Math.round(((event.clientX - bounds.left) / bounds.width) * videoDuration));
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
                    <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
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
            <p className="article-lead">
              {article.description}
            </p>
            <h2>Что показано в видео</h2>
            <p>
              Подготовка интеграционного модуля, выбор проекта, сопоставление справочников и контроль первой
              синхронизации.
            </p>
          </div>
        </section>
        <aside className="min-w-0 rounded-2xl border border-[var(--ms-border)] bg-slate-50 p-3 sm:p-4 lg:self-start">
          <h2 className="px-2 pb-3 font-heading text-lg font-bold">Таймкоды</h2>
          <div className="space-y-1.5">
            {timecodes.map((timecode) => {
              const active =
                progress >= timecode.seconds &&
                progress < (timecodes[timecodes.indexOf(timecode) + 1]?.seconds ?? videoDuration);
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
                  <span className="min-w-0 flex-1 text-sm font-semibold">{timecode.title}</span>
                  {active ? <Play className="h-4 w-4 fill-current" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
      <Button
        className="mt-8"
        icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        onClick={() => onNavigate("knowledge")}
        tone="ghost"
      >
        Вернуться в раздел
      </Button>
    </article>
  );
};
