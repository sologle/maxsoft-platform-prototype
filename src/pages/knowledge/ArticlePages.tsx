import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Download,
  FileText,
  Maximize2,
  Pause,
  Pencil,
  Play,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AppPage, UserRole } from "../../app/types";
import { Badge, Breadcrumbs, Button } from "../../components/ui";

interface ArticlePageProps {
  onDownload: () => void;
  onNavigate: (page: AppPage) => void;
  onNotice: (message: string) => void;
  role: UserRole;
}

const ArticleHeader = ({
  onNavigate,
  role,
  video = false,
}: {
  onNavigate: (page: AppPage) => void;
  role: UserRole;
  video?: boolean;
}) => {
  const [saved, setSaved] = useState(false);
  const canEdit = role === "portal-admin" || role === "support-engineer";
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "База знаний", onClick: () => onNavigate("knowledge") },
          { label: "НАВИСА" },
          { label: video ? "Настройка" : "Установка" },
        ]}
      />
      <div className="flex flex-col gap-4 border-b border-[var(--ms-border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="green">Опубликована</Badge>
            <Badge>НАВИСА</Badge>
            <Badge>{video ? "Интеграция" : "Лицензирование"}</Badge>
          </div>
          <h1 className="font-heading text-[clamp(1.9rem,5vw,2.8rem)] font-bold leading-[1.12] tracking-[-.03em]">
            {video ? "Настройка интеграции с САПР-комплексом" : "Настройка сетевой лицензии"}
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
              onClick={() => onNavigate("editor")}
            >
              Редактировать
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
};

export const ArticlePage = ({ onDownload, onNavigate, onNotice, role }: ArticlePageProps) => (
  <article className="mx-auto max-w-[1180px] rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] sm:p-8 lg:p-10">
    <ArticleHeader onNavigate={onNavigate} role={role} />
    <div className="mt-8 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_250px]">
      <div className="article-content min-w-0">
        <p className="article-lead">
          Сетевая лицензия позволяет централизованно управлять доступом к продуктам НАВИСА и распределять
          лицензии между рабочими местами организации.
        </p>
        <h2 id="preparation">Перед началом работы</h2>
        <p>
          Убедитесь, что сервер лицензий доступен из корпоративной сети, а системное время на сервере и
          рабочих станциях синхронизировано.
        </p>
        <div className="my-6 rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:p-5">
          <p className="flex items-start gap-3 text-sm leading-6 text-sky-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
            Для установки потребуются права администратора и файл лицензии, полученный от менеджера MaxSoft.
          </p>
        </div>
        <h2 id="installation">Установка сервера лицензий</h2>
        <ol>
          <li>Скачайте актуальный дистрибутив сервера лицензий.</li>
          <li>Запустите установщик от имени администратора.</li>
          <li>Укажите каталог хранения лицензий и завершите установку.</li>
        </ol>
        <h2 id="connection">Подключение рабочего места</h2>
        <p>
          Откройте настройки продукта, выберите сетевой тип лицензирования и укажите адрес сервера в формате{" "}
          <code>server.company.local:1947</code>.
        </p>
        <h2 id="diagnostics">Диагностика</h2>
        <p>
          Если лицензия не найдена, проверьте доступность порта, журнал службы и совпадение версии сервера
          лицензий с версией продукта.
        </p>

        <section
          className="mt-10 border-t border-[var(--ms-border)] pt-7"
          aria-labelledby="attachments-title"
        >
          <h2 className="!mt-0" id="attachments-title">
            Вложения
          </h2>
          <button
            className="mt-4 flex w-full min-w-0 items-center gap-3 rounded-2xl border border-[var(--ms-border)] p-4 text-left transition hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)]"
            onClick={() => {
              onDownload();
              onNotice("Файл подготовлен к скачиванию.");
            }}
            type="button"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">инструкция_активации.pdf</span>
              <span className="mt-1 block text-xs text-[var(--ms-muted)]">PDF · 2,4 МБ</span>
            </span>
            <Download className="h-5 w-5 shrink-0 text-[var(--ms-primary)]" aria-hidden="true" />
          </button>
        </section>
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-28 rounded-2xl bg-slate-50 p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.12em] text-slate-400">В этой статье</p>
          {[
            ["preparation", "Перед началом"],
            ["installation", "Установка"],
            ["connection", "Подключение"],
            ["diagnostics", "Диагностика"],
          ].map(([id, label]) => (
            <a
              className="block rounded-lg px-2 py-2 text-sm text-[var(--ms-muted)] transition hover:bg-white hover:text-[var(--ms-primary)]"
              href={`#${id}`}
              key={id}
            >
              {label}
            </a>
          ))}
        </div>
      </aside>
    </div>
  </article>
);

const timecodes = [
  { label: "00:00", seconds: 0, title: "Введение и требования" },
  { label: "02:15", seconds: 135, title: "Подключение модуля" },
  { label: "07:12", seconds: 432, title: "Настройка обмена" },
  { label: "14:40", seconds: 880, title: "Проверка результата" },
];
const videoDuration = 1080;

export const VideoArticlePage = ({ onNavigate, role }: ArticlePageProps) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(135);

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
      <ArticleHeader onNavigate={onNavigate} role={role} video />
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
              Пошаговая настройка обмена данными между НАВИСА и САПР-комплексом с проверкой подключения.
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
