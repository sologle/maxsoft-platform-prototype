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
import type { Navigate } from "../../app/types";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Button, SelectField, Switch } from "../../components/ui";
import {
  articles,
  companyTypes,
  isArticlePublished,
  tagGroups,
  type AuditEvent,
} from "../../data/platform-data";
import {
  getArticleAccess,
  getArticleSections,
  getArticleTags,
  writeArticleSettings,
} from "../../data/prototype-entities";
import { appendPrototypeValue, prototypeStorageKeys, readPrototypeValue } from "../../data/prototype-store";

interface EditorPageProps {
  onNavigate: Navigate;
  onNotice: (message: string) => void;
  resource?: string;
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

export const EditorPage = ({ onNavigate, onNotice, resource }: EditorPageProps) => {
  const sourceArticle = articles.find((article) => article.id === (resource ?? "network-license"))!;
  const [availableTags] = useState(() =>
    readPrototypeValue<Array<{ tags: Array<{ name: string }> }>>(
      prototypeStorageKeys.tags,
      tagGroups.map((group) => ({ tags: group.tags.map((name) => ({ name })) })),
    ).flatMap((group) => group.tags.map((tag) => tag.name)),
  );
  const [availableCompanyTypes] = useState(() =>
    readPrototypeValue(prototypeStorageKeys.companyTypes, companyTypes),
  );
  const initialAccess = getArticleAccess(sourceArticle);
  const [title, setTitle] = useState(sourceArticle.title);
  const [content, setContent] = useState(
    `${sourceArticle.description}\n\nМатериал открыт в редакторе и готов к изменению.`,
  );
  const [saved, setSaved] = useState(true);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [paragraphStyle, setParagraphStyle] = useState("Обычный текст");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importPhase, setImportPhase] = useState<ImportPhase>("select");
  const [published, setPublished] = useState(() => isArticlePublished(sourceArticle));
  const [allCompanies, setAllCompanies] = useState(initialAccess === "all");
  const [selectedCompanyTypes, setSelectedCompanyTypes] = useState(() =>
    initialAccess === "all"
      ? availableCompanyTypes.map((companyType) => companyType.name)
      : initialAccess,
  );
  const [sections, setSections] = useState(() => getArticleSections(sourceArticle));
  const [tags, setTags] = useState(() => getArticleTags(sourceArticle));
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
                {published ? "Опубликована" : "Черновик"} · автосохранение включено
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
              <SelectField
                className="max-w-40"
                id="paragraph-style"
                label="Стиль абзаца"
                labelHidden
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
              </SelectField>
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
              <Badge tone={published ? "green" : "amber"}>
                {published ? "Опубликована" : "Черновик"}
              </Badge>
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
              {[
                { label: "Установка", path: "НАВИСА / Установка" },
                { label: "Настройка", path: "НАВИСА / Настройка" },
                { label: "Администрирование", path: "НАВИСА / Администрирование" },
              ].map((item) => (
                <label className="option-row" key={item.path}>
                  <input
                    checked={sections.includes(item.path)}
                    onChange={() => toggleItem(item.path, sections, setSections)}
                    type="checkbox"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            {!sections.length ? (
              <p className="mt-3 text-sm font-semibold text-red-600" role="alert">
                Выберите хотя бы один раздел. Код: KB_SECTION_REQUIRED.
              </p>
            ) : null}
          </section>
          <section>
            <h3 className="mb-3 font-heading text-lg font-bold">Теги</h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
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
                onChange={() => {
                  setAllCompanies(true);
                  markChanged();
                }}
                name="access"
                type="radio"
              />
              <span>Все типы компаний</span>
            </label>
            <label className="option-row mt-2">
              <input
                checked={!allCompanies}
                onChange={() => {
                  setAllCompanies(false);
                  markChanged();
                }}
                name="access"
                type="radio"
              />
              <span>Только выбранные типы</span>
            </label>
            {!allCompanies ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {availableCompanyTypes.map((companyType) => (
                  <label className="option-row" key={companyType.name}>
                    <input
                      checked={selectedCompanyTypes.includes(companyType.name)}
                      onChange={() =>
                        toggleItem(companyType.name, selectedCompanyTypes, setSelectedCompanyTypes)
                      }
                      type="checkbox"
                    />
                    {companyType.name}
                  </label>
                ))}
              </div>
            ) : null}
            {!allCompanies && !selectedCompanyTypes.length ? (
              <p className="mt-3 text-sm font-semibold text-red-600">
                Выберите хотя бы один тип компании. Код: KB_ACCESS_TYPE_REQUIRED.
              </p>
            ) : null}
            {published && !allCompanies ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-700">
                После сохранения исключённые типы компаний сразу потеряют доступ к статье и вложениям.
              </p>
            ) : null}
            <div className="mt-3 rounded-xl border border-[var(--ms-border)] bg-slate-50 p-3 text-sm leading-6" data-testid="article-access-summary">
              <strong>Итоговый доступ:</strong>{" "}
              {allCompanies ? "все типы компаний" : selectedCompanyTypes.join(", ") || "не настроен"}.
            </div>
          </section>
          <Button
            className="w-full"
            disabled={!sections.length || (!allCompanies && !selectedCompanyTypes.length)}
            onClick={() => {
              writeArticleSettings(sourceArticle, {
                access: allCompanies ? "all" : selectedCompanyTypes,
                published,
                sections,
                tags,
              });
              appendPrototypeValue<AuditEvent>(prototypeStorageKeys.audit, {
                action: "Изменил настройки и права доступа статьи",
                category: "access",
                date: "Только что",
                object: sourceArticle.title,
                page: sourceArticle.kind === "video" ? "video" : "article",
                resource: sourceArticle.id,
                result: "Успешно",
                user: "Администратор портала",
              });
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
