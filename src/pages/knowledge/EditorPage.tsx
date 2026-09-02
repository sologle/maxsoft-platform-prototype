import {
  Bold,
  Check,
  ChevronLeft,
  Eye,
  FileText,
  Heading2,
  Image,
  Italic,
  Link,
  List,
  LoaderCircle,
  PanelRight,
  Quote,
  Redo2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AppPage } from "../../app/types";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Button, Switch } from "../../components/ui";

interface EditorPageProps {
  onNavigate: (page: AppPage) => void;
  onNotice: (message: string) => void;
}

type ImportPhase = "select" | "processing" | "success" | "error";

const toolbarActions = [
  { id: "bold", label: "Полужирный", icon: Bold },
  { id: "italic", label: "Курсив", icon: Italic },
  { id: "heading", label: "Заголовок", icon: Heading2 },
  { id: "list", label: "Список", icon: List },
  { id: "quote", label: "Цитата", icon: Quote },
  { id: "link", label: "Ссылка", icon: Link },
  { id: "image", label: "Изображение", icon: Image },
];

export const EditorPage = ({ onNavigate, onNotice }: EditorPageProps) => {
  const [title, setTitle] = useState("Настройка сетевой лицензии");
  const [content, setContent] = useState(
    "Сетевая лицензия позволяет централизованно управлять доступом к продуктам НАВИСА.\n\nПеред началом работы убедитесь, что сервер доступен из корпоративной сети.",
  );
  const [saved, setSaved] = useState(true);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [paragraphStyle, setParagraphStyle] = useState("Обычный текст");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importPhase, setImportPhase] = useState<ImportPhase>("select");
  const [published, setPublished] = useState(false);
  const [allCompanies, setAllCompanies] = useState(true);
  const [sections, setSections] = useState(["Установка"]);
  const [tags, setTags] = useState(["НАВИСА", "Лицензирование"]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saved) return;
    const timeout = window.setTimeout(() => setSaved(true), 900);
    return () => window.clearTimeout(timeout);
  }, [content, saved, title]);

  useEffect(() => {
    if (importPhase !== "processing") return;
    const timeout = window.setTimeout(() => setImportPhase("success"), 1500);
    return () => window.clearTimeout(timeout);
  }, [importPhase]);

  const markChanged = () => setSaved(false);
  const toggleItem = (value: string, items: string[], setItems: (next: string[]) => void) => {
    setItems(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
    markChanged();
  };

  const finishImport = () => {
    setTitle("Регламент работы с проектами");
    setContent(
      "Импортированный документ преобразован в редактируемую статью.\n\nСтруктура заголовков, списки и ссылки сохранены. Проверьте оформление перед публикацией.",
    );
    setImportOpen(false);
    setImportPhase("select");
    markChanged();
    onNotice("Документ импортирован в черновик.");
  };

  return (
    <>
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            icon={<ChevronLeft className="h-4 w-4" aria-hidden="true" />}
            onClick={() => onNavigate("knowledge")}
            tone="ghost"
          >
            К материалам
          </Button>
          <span
            className="ml-auto flex items-center gap-2 text-xs font-semibold text-[var(--ms-muted)]"
            role="status"
          >
            {saved ? (
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            ) : (
              <LoaderCircle className="h-4 w-4 animate-spin text-[var(--ms-primary)]" aria-hidden="true" />
            )}
            {saved ? "Все изменения сохранены" : "Сохраняем…"}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)]">
          <header className="flex flex-col gap-3 border-b border-[var(--ms-border)] p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--ms-primary)]">
                Редактор статьи
              </p>
              <p className="mt-1 truncate text-sm text-[var(--ms-muted)]">
                Черновик · автосохранение включено
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                icon={<Upload className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setImportOpen(true)}
                tone="secondary"
              >
                Импорт DOCX
              </Button>
              <Button
                icon={<Eye className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setPreviewOpen(true)}
                tone="secondary"
              >
                Предпросмотр
              </Button>
              <Button
                icon={<PanelRight className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setSettingsOpen(true)}
              >
                Настройки
              </Button>
            </div>
          </header>

          <div className="border-b border-[var(--ms-border)] bg-slate-50 px-3 py-2 sm:px-5">
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              <button
                aria-label="Отменить"
                className="editor-tool"
                onClick={() => onNotice("Последнее изменение отменено.")}
                type="button"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                aria-label="Повторить"
                className="editor-tool"
                onClick={() => onNotice("Изменение повторено.")}
                type="button"
              >
                <Redo2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="mx-1 h-6 w-px bg-[var(--ms-border)]" aria-hidden="true" />
              {toolbarActions.map(({ icon: Icon, id, label }) => {
                const active = activeTools.includes(id);
                return (
                  <button
                    aria-label={label}
                    aria-pressed={active}
                    className={`editor-tool ${active ? "editor-tool-active" : ""}`}
                    key={id}
                    onClick={() => {
                      setActiveTools((current) =>
                        current.includes(id) ? current.filter((tool) => tool !== id) : [...current, id],
                      );
                      onNotice(`${label}: режим ${active ? "выключен" : "включён"}.`);
                    }}
                    type="button"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                );
              })}
              <span className="mx-1 h-6 w-px bg-[var(--ms-border)]" aria-hidden="true" />
              <label className="sr-only" htmlFor="paragraph-style">
                Стиль абзаца
              </label>
              <select
                className="h-9 max-w-40 rounded-lg border border-[var(--ms-border-strong)] bg-white px-2 text-xs font-semibold outline-none focus:border-[var(--ms-primary)]"
                id="paragraph-style"
                onChange={(event) => {
                  setParagraphStyle(event.target.value);
                  markChanged();
                  onNotice(`${event.target.value}: стиль абзаца применён.`);
                }}
                value={paragraphStyle}
              >
                <option>Обычный текст</option>
                <option>Подзаголовок</option>
                <option>Цитата</option>
              </select>
            </div>
          </div>

          <div className="mx-auto max-w-[900px] p-5 sm:p-8 lg:p-12">
            <label className="block">
              <span className="sr-only">Название статьи</span>
              <textarea
                className="w-full resize-none overflow-hidden border-0 bg-transparent font-heading text-[clamp(2rem,5vw,3rem)] font-bold leading-[1.12] tracking-[-.03em] outline-none placeholder:text-slate-300"
                onChange={(event) => {
                  setTitle(event.target.value);
                  markChanged();
                }}
                placeholder="Название статьи"
                rows={2}
                value={title}
              />
            </label>
            <div className="my-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
              <Badge tone="amber">Черновик</Badge>
            </div>
            <label className="block">
              <span className="sr-only">Содержимое статьи</span>
              <textarea
                className={`min-h-[460px] w-full resize-y border-0 bg-transparent leading-8 text-slate-700 outline-none placeholder:text-slate-300 ${paragraphStyle === "Подзаголовок" ? "text-xl font-semibold" : paragraphStyle === "Цитата" ? "border-l-4 border-[var(--ms-primary)] pl-4 text-base italic" : "text-base"} ${activeTools.includes("bold") ? "font-semibold" : ""} ${activeTools.includes("italic") ? "italic" : ""}`}
                onChange={(event) => {
                  setContent(event.target.value);
                  markChanged();
                }}
                placeholder="Начните писать статью…"
                value={content}
              />
            </label>
          </div>
        </div>
      </div>

      <ResponsiveOverlay
        description="Публикация, разделы, теги и права доступа"
        label="Настройки статьи"
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
      >
        <div className="space-y-7">
          <section>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
              <div>
                <h3 className="font-bold">Публикация</h3>
                <p className="mt-1 text-sm text-[var(--ms-muted)]">
                  Опубликованная статья видна в поиске и базе знаний.
                </p>
              </div>
              <Switch
                checked={published}
                label="Публикация статьи"
                onChange={() => {
                  setPublished((current) => !current);
                  markChanged();
                }}
              />
            </div>
          </section>
          <section>
            <h3 className="mb-3 font-heading text-lg font-bold">Разделы</h3>
            <div className="space-y-2">
              {["Установка", "Настройка", "Администрирование"].map((item) => (
                <label className="option-row" key={item}>
                  <input
                    checked={sections.includes(item)}
                    onChange={() => toggleItem(item, sections, setSections)}
                    type="checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-3 font-heading text-lg font-bold">Теги</h3>
            <div className="flex flex-wrap gap-2">
              {["НАВИСА", "Лицензирование", "Интеграция", "Обновление"].map((tag) => (
                <button
                  aria-pressed={tags.includes(tag)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ring-1 transition ${tags.includes(tag) ? "bg-[var(--ms-primary)] text-white ring-[var(--ms-primary)]" : "bg-white text-[var(--ms-muted)] ring-[var(--ms-border-strong)] hover:ring-[var(--ms-primary)]"}`}
                  key={tag}
                  onClick={() => toggleItem(tag, tags, setTags)}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-3 font-heading text-lg font-bold">Доступ</h3>
            <label className="option-row">
              <input
                checked={allCompanies}
                onChange={() => setAllCompanies(true)}
                name="access"
                type="radio"
              />
              <span>Все типы компаний</span>
            </label>
            <label className="option-row mt-2">
              <input
                checked={!allCompanies}
                onChange={() => setAllCompanies(false)}
                name="access"
                type="radio"
              />
              <span>Только выбранные типы</span>
            </label>
            {!allCompanies ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="option-row">
                  <input defaultChecked type="checkbox" />
                  Клиент
                </label>
                <label className="option-row">
                  <input type="checkbox" />
                  Интегратор
                </label>
              </div>
            ) : null}
          </section>
          <Button
            className="w-full"
            onClick={() => {
              setSettingsOpen(false);
              setSaved(true);
              onNotice("Настройки статьи сохранены.");
            }}
          >
            Сохранить настройки
          </Button>
        </div>
      </ResponsiveOverlay>

      <ResponsiveOverlay
        desktop="modal"
        label="Импорт из Word"
        onClose={() => {
          setImportOpen(false);
          setImportPhase("select");
        }}
        open={importOpen}
      >
        {importPhase === "select" ? (
          <div className="text-center">
            <button
              className="w-full rounded-2xl border-2 border-dashed border-[var(--ms-border-strong)] bg-slate-50 p-8 transition hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)]"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-[var(--ms-primary)] shadow-sm">
                <Upload className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="mt-4 block font-bold">Выберите DOCX-файл</span>
              <span className="mt-1 block text-sm text-[var(--ms-muted)]">
                До 20 МБ, заголовки и списки будут сохранены
              </span>
            </button>
            <input
              accept=".docx"
              className="sr-only"
              onChange={() => onNotice("Файл выбран для импорта.")}
              ref={fileInputRef}
              type="file"
            />
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--ms-border)] p-3 text-left">
              <FileText className="h-5 w-5 shrink-0 text-[var(--ms-primary)]" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">регламент_работы_с_проектами.docx</span>
                <span className="text-xs text-[var(--ms-muted)]">1,8 МБ</span>
              </span>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setImportPhase("error")} tone="ghost">
                Показать ошибку
              </Button>
              <Button onClick={() => setImportPhase("processing")}>Импортировать</Button>
            </div>
          </div>
        ) : null}
        {importPhase === "processing" ? (
          <div className="py-10 text-center">
            <LoaderCircle
              className="mx-auto h-10 w-10 animate-spin text-[var(--ms-primary)]"
              aria-hidden="true"
            />
            <h3 className="mt-4 font-heading text-xl font-bold">Обрабатываем документ</h3>
            <p className="mt-2 text-sm text-[var(--ms-muted)]">
              Распознаём структуру и переносим содержимое в редактор.
            </p>
          </div>
        ) : null}
        {importPhase === "success" ? (
          <div className="py-5 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-heading text-xl font-bold">Документ импортирован</h3>
            <p className="mt-2 text-sm text-[var(--ms-muted)]">Черновик готов к проверке и оформлению.</p>
            <Button className="mt-6 w-full" onClick={finishImport}>
              Открыть импортированный черновик
            </Button>
          </div>
        ) : null}
        {importPhase === "error" ? (
          <div className="py-5 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
              <FileText className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-heading text-xl font-bold">Не удалось импортировать файл</h3>
            <p className="mt-2 text-sm text-[var(--ms-muted)]">
              Проверьте формат документа и попробуйте ещё раз.
            </p>
            <Button className="mt-6 w-full" onClick={() => setImportPhase("select")}>
              Повторить
            </Button>
          </div>
        ) : null}
      </ResponsiveOverlay>

      <ResponsiveOverlay
        desktop="modal"
        label="Предпросмотр статьи"
        onClose={() => setPreviewOpen(false)}
        open={previewOpen}
      >
        <article className="article-content">
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <h1 className="!mt-0 font-heading text-3xl font-bold">{title}</h1>
          {content
            .split("\n")
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={`${paragraph}-${index}`}>{paragraph}</p>
            ))}
        </article>
      </ResponsiveOverlay>
    </>
  );
};
