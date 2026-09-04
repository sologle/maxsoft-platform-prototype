import { demoResources } from "../../app/demo-resources";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Grid2X2,
  List,
  RotateCw,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Navigate, UserRole } from "../../app/types";
import { FileTypeIcon } from "../../components/FileTypeIcon";
import { canPreviewFile } from "../../data/file-types";
import { ActionMenu } from "../../components/ActionMenu";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Breadcrumbs, Button, EmptyState, PageHeading, SelectField } from "../../components/ui";
import { articles, canRoleAccessArticle, files } from "../../data/platform-data";
import { getArticleSections } from "../../data/prototype-entities";

interface FilesPageProps {
  companyType?: string;
  onDownload: () => void;
  onNavigate: Navigate;
  onNotice: (message: string) => void;
  resource?: string;
  role: UserRole;
}

const usesLabel = (uses: number) =>
  `${uses} ${uses === 1 ? "статья" : uses < 5 ? "статьи" : "статей"}`;

const primaryArticleForFile = (file: (typeof files)[number]) => {
  const article = articles.find((candidate) => candidate.id === file.relatedArticleIds[0]);
  if (!article) throw new Error(`KB_FILE_ARTICLE_MISSING: ${file.name}`);
  return article;
};

export const FilesPage = ({ onDownload, onNavigate, onNotice }: FilesPageProps) => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [view, setView] = useState<"table" | "cards">("cards");
  const [selected, setSelected] = useState<(typeof files)[number] | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const visible = useMemo(
    () =>
      files.filter(
        (file) =>
          (type === "all" || file.type === type) && file.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, type],
  );

  const download = () => {
    onDownload();
    onNotice("Демонстрационный файл подготовлен к скачиванию.");
    setMenu(null);
  };
  const openFile = (file: (typeof files)[number]) => {
    setMenu(null);
    if (canPreviewFile(file)) onNavigate("file-preview", file.name);
    else download();
  };
  return (
    <>
      <PageHeading
        actions={
          <div aria-label="Режим просмотра файлов" className="flex rounded-xl border border-[var(--ms-border)] bg-white p-1 shadow-sm" role="group">
            <button
              aria-label="Табличный вид"
              aria-pressed={view === "table"}
              className={`flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold transition ${view === "table" ? "bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]" : "text-[var(--ms-muted)] hover:bg-slate-50"}`}
              onClick={() => setView("table")}
              type="button"
            >
              <List className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Таблица</span>
            </button>
            <button
              aria-label="Крупные карточки"
              aria-pressed={view === "cards"}
              className={`flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold transition ${view === "cards" ? "bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]" : "text-[var(--ms-muted)] hover:bg-slate-50"}`}
              onClick={() => setView("cards")}
              type="button"
            >
              <Grid2X2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Карточки</span>
            </button>
          </div>
        }
        eyebrow="Администрирование БЗ"
        subtitle="Все загруженные документы, их разделы и места использования в статьях."
        title="Реестр файлов"
      />
      <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--ms-border)] bg-white p-3 shadow-[var(--ms-card-shadow)] sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Поиск файлов</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            className="h-11 w-full min-w-0 rounded-xl border border-[var(--ms-border-strong)] pl-10 pr-3 text-sm outline-none focus:border-[var(--ms-primary)] focus:ring-4 focus:ring-[var(--ms-primary-ring)]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название файла"
            value={query}
          />
        </label>
        <SelectField className="sm:w-48" label="Тип файла" labelHidden leadingIcon={<Filter className="h-4 w-4" aria-hidden="true" />} onChange={(event) => setType(event.target.value)} value={type}>
            <option value="all">Все типы</option>
            <option value="PDF">PDF</option>
            <option value="DOCX">DOCX</option>
            <option value="DWG">DWG</option>
            <option value="ZIP">ZIP</option>
        </SelectField>
      </div>

      {!visible.length ? (
        <EmptyState
          action={<Button onClick={() => { setQuery(""); setType("all"); }}>Сбросить фильтры</Button>}
          text="Измените название или тип файла."
          title="Файлы не найдены"
        />
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)]" data-testid="files-table-view">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--ms-border)] text-xs uppercase tracking-[.08em] text-[var(--ms-muted)]">
                <th className="px-5 py-4 font-bold">Файл</th><th className="px-5 py-4 font-bold">Тип</th><th className="px-5 py-4 font-bold">Размер</th><th className="px-5 py-4 font-bold">Раздел</th><th className="px-5 py-4 font-bold">Используется</th><th className="px-5 py-4 font-bold">Обновлён</th><th className="w-16 px-3"><span className="sr-only">Действия</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((file) => (
                <tr className="border-b border-[var(--ms-border)] last:border-0 hover:bg-slate-50" key={file.name}>
                  <td className="px-5 py-4">
                    <button className="flex min-w-0 items-center gap-3 font-semibold hover:text-[var(--ms-primary)]" onClick={() => openFile(file)} type="button">
                      <FileTypeIcon type={file.type} /><span className="truncate">{file.name}</span>
                    </button>
                  </td>
                  <td className="px-5 py-4"><Badge tone="slate">{file.type}</Badge></td><td className="px-5 py-4 text-[var(--ms-muted)]">{file.size}</td><td className="px-5 py-4 text-[var(--ms-muted)]">{getArticleSections(primaryArticleForFile(file)).join(" · ")}</td>
                  <td className="px-5 py-4"><button className="font-semibold text-[var(--ms-primary)] hover:underline" onClick={() => setSelected(file)} type="button">{usesLabel(file.uses)}</button></td>
                  <td className="px-5 py-4 text-[var(--ms-muted)]">{file.updated}</td>
                  <td className="px-3">
                    <ActionMenu label={`Действия: ${file.name}`} onOpenChange={(open) => setMenu(open ? file.name : null)} open={menu === file.name}>
                      {canPreviewFile(file) ? <button className="menu-action" onClick={() => openFile(file)} role="menuitem" type="button"><Eye className="h-4 w-4" aria-hidden="true" />Просмотреть</button> : null}
                      <button className="menu-action" onClick={download} role="menuitem" type="button"><Download className="h-4 w-4" aria-hidden="true" />Скачать</button>
                      <button className="menu-action" onClick={() => { setSelected(file); setMenu(null); }} role="menuitem" type="button"><ExternalLink className="h-4 w-4" aria-hidden="true" />Места использования</button>
                    </ActionMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" data-testid="files-card-view">
          {visible.map((file) => (
            <article className="group flex min-w-0 flex-col rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--ms-primary)] hover:shadow-[var(--ms-card-shadow-hover)]" key={file.name}>
              <button aria-label={`${canPreviewFile(file) ? "Просмотреть" : "Скачать"} файл: ${file.name}`} className="min-w-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ms-primary)]" onClick={() => openFile(file)} type="button">
                <FileTypeIcon type={file.type} large />
                <span className="mt-5 block break-words font-heading text-lg font-bold leading-snug">{file.name}</span><span className="mt-2 block text-sm text-[var(--ms-muted)]">{file.type} · {file.size} · {file.updated}</span><span className="mt-3 block text-xs font-semibold text-[var(--ms-primary)]">База знаний / {getArticleSections(primaryArticleForFile(file)).join(" · ")}</span>
              </button>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                <Button icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={download} tone="secondary">Скачать</Button>
                <Button onClick={() => setSelected(file)}><span className="md:hidden">Где используется</span><span className="hidden md:inline">{usesLabel(file.uses)}</span></Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ResponsiveOverlay description={selected?.name} label="Места использования" onClose={() => setSelected(null)} open={Boolean(selected)}>
        <div className="space-y-3">
          {articles.filter((article) => selected?.relatedArticleIds.includes(article.id)).map((article) => (
            <button className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border border-[var(--ms-border)] p-4 text-left transition hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)]" key={article.id} onClick={() => { setSelected(null); onNavigate(article.kind === "video" ? "video" : "article", article.id); }} type="button">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[var(--ms-primary)] shadow-sm"><FileText className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{article.title}</span><span className="mt-1 block text-xs text-[var(--ms-muted)]">{getArticleSections(article).join(" · ")}</span></span><ExternalLink className="h-4 w-4 shrink-0 text-[var(--ms-primary)] transition group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          ))}
        </div>
        <Button className="mt-5 w-full" icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={download} tone="secondary">Скачать файл</Button>
      </ResponsiveOverlay>
    </>
  );
};

export const FilePreviewPage = ({
  companyType,
  onDownload,
  onNavigate,
  onNotice,
  resource,
  role,
}: FilesPageProps) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const file = files.find((candidate) => candidate.name === (resource ?? demoResources.file))!;
  const backPage = role === "portal-admin" ? "files" : "knowledge";
  if (!canPreviewFile(file)) {
    return (
      <>
        <PageHeading eyebrow="Файл" title={file.name} subtitle={`${file.type} · ${file.size}`} onBack={() => onNavigate(backPage)} />
        <EmptyState
          title="Скачайте файл для работы с ним"
          text="Предпросмотр доступен для PDF и DOCX. Этот файл можно открыть на вашем устройстве."
          action={<Button icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={() => { onDownload(); onNotice("Демонстрационный файл подготовлен к скачиванию."); }}>Скачать файл</Button>}
        />
      </>
    );
  }
  const relatedArticles = articles.filter(
    (article) =>
      file.relatedArticleIds.includes(article.id) &&
      canRoleAccessArticle(article, role, companyType),
  );
  const primaryArticle = relatedArticles[0]!;
  const primarySection = getArticleSections(primaryArticle)[0];
  if (!primarySection)
    throw new Error(`KB_ARTICLE_SECTION_MISSING: у статьи ${primaryArticle.id} не задан раздел`);
  const documentTitle = file.name.replace(/\.[^.]+$/, "").replaceAll("_", " ");
  const download = () => {
    onDownload();
    onNotice("Демонстрационный файл подготовлен к скачиванию.");
  };
  return (
    <>
      <Breadcrumbs items={[{ label: "База знаний", onClick: () => onNavigate("knowledge") }, ...(role === "portal-admin" ? [{ label: "Реестр файлов", onClick: () => onNavigate("files") }] : []), { label: file.name }]} />
      <PageHeading actions={<Button icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={download}>Скачать</Button>} backLabel={role === "portal-admin" ? "Вернуться к файлам" : "Вернуться в базу знаний"} eyebrow={`Просмотр файла · ${file.type} · ${file.size}`} onBack={() => onNavigate(backPage)} subtitle={`${primarySection} · ${usesLabel(file.uses)}`} title={file.name} />
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[var(--ms-border)] bg-[#dce3ea] shadow-[var(--ms-card-shadow)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ms-border)] bg-white p-2.5">
            <Badge tone="red">Предпросмотр {file.type}</Badge><span className="ml-auto text-sm font-bold text-[var(--ms-muted)]">{zoom}%</span>
            <button aria-label="Уменьшить масштаб" className="icon-button" onClick={() => setZoom((current) => Math.max(70, current - 10))} type="button"><ZoomOut className="h-4 w-4" aria-hidden="true" /></button>
            <button aria-label="Увеличить масштаб" className="icon-button" onClick={() => setZoom((current) => Math.min(140, current + 10))} type="button"><ZoomIn className="h-4 w-4" aria-hidden="true" /></button>
            <button aria-label="Повернуть страницу" className="icon-button" onClick={() => { setRotation((current) => (current + 90) % 360); onNotice("Страница повёрнута на 90°."); }} type="button"><RotateCw className="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <div className="min-h-[65dvh] overflow-auto p-4 sm:p-8">
            <div className="mx-auto min-h-[760px] origin-top rounded-sm bg-white p-8 text-[#273445] shadow-[0_14px_45px_rgba(30,44,58,.22)] transition-transform sm:p-12" data-testid="file-preview-document" style={{ maxWidth: 760, transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1478bd]">MaxSoft · {primarySection.split(" / ")[0]}</p><h2 className="mt-8 font-heading text-3xl font-bold first-letter:uppercase">{documentTitle}</h2><p className="mt-4 text-sm text-slate-500">Редакция 3.2 · 3 сентября 2026</p>
              <div className="mt-10 space-y-7 text-[15px] leading-7"><section><h3 className="text-lg font-bold">1. Подготовка</h3><p className="mt-2">Проверьте адрес сервера лицензии и доступность порта 1947 из корпоративной сети.</p></section><section><h3 className="text-lg font-bold">2. Активация</h3><p className="mt-2">Откройте мастер лицензирования, выберите сетевой режим и укажите имя сервера.</p></section><div className="rounded-xl border border-sky-200 bg-sky-50 p-5 text-sky-900">Файл доступен только пользователям, которым разрешена связанная статья.</div></div>
            </div>
          </div>
        </section>
        <aside className="space-y-4 xl:self-start">
          <section className="rounded-2xl border border-[var(--ms-border)] bg-white p-5 shadow-[var(--ms-card-shadow)]"><h2 className="font-heading text-lg font-bold">О файле</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs font-bold uppercase tracking-[.08em] text-slate-400">Раздел</dt><dd className="mt-1 font-semibold">{getArticleSections(primaryArticle).join(" · ")}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[.08em] text-slate-400">Загрузила</dt><dd className="mt-1 font-semibold">Анна Смирнова</dd></div><div><dt className="text-xs font-bold uppercase tracking-[.08em] text-slate-400">Обновлён</dt><dd className="mt-1 font-semibold">{file.updated}</dd></div></dl></section>
          <Button className="w-full" icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />} onClick={() => onNavigate(primaryArticle.kind === "video" ? "video" : "article", primaryArticle.id)} tone="secondary">К связанной статье</Button>
        </aside>
      </div>
    </>
  );
};
