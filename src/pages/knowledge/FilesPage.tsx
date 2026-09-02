import { Download, ExternalLink, FileArchive, FileText, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppPage } from "../../app/types";
import { ActionMenu } from "../../components/ActionMenu";
import { ResponsiveOverlay } from "../../components/ResponsiveOverlay";
import { Badge, Button, PageHeading } from "../../components/ui";
import { files } from "../../data/platform-data";

interface FilesPageProps {
  onDownload: () => void;
  onNavigate: (page: AppPage) => void;
  onNotice: (message: string) => void;
}

export const FilesPage = ({ onDownload, onNavigate, onNotice }: FilesPageProps) => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
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

  const FileIcon = ({ kind }: { kind: string }) =>
    kind === "ZIP" ? (
      <FileArchive className="h-5 w-5" aria-hidden="true" />
    ) : (
      <FileText className="h-5 w-5" aria-hidden="true" />
    );

  return (
    <>
      <PageHeading
        eyebrow="Администрирование БЗ"
        subtitle="Все загруженные документы и места их использования в статьях."
        title="Реестр файлов"
      />
      <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-[var(--ms-border)] bg-white p-3 shadow-[var(--ms-card-shadow)] sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Поиск файлов</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            className="h-11 w-full min-w-0 rounded-xl border border-[var(--ms-border-strong)] pl-10 pr-3 text-sm outline-none focus:border-[var(--ms-primary)] focus:ring-4 focus:ring-[var(--ms-primary-ring)]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название файла"
            value={query}
          />
        </label>
        <label className="relative sm:w-48">
          <span className="sr-only">Тип файла</span>
          <Filter
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <select
            className="h-11 w-full appearance-none rounded-xl border border-[var(--ms-border-strong)] bg-white pl-10 pr-3 text-sm font-medium outline-none focus:border-[var(--ms-primary)]"
            onChange={(event) => setType(event.target.value)}
            value={type}
          >
            <option value="all">Все типы</option>
            <option value="PDF">PDF</option>
            <option value="DOCX">DOCX</option>
            <option value="DWG">DWG</option>
            <option value="ZIP">ZIP</option>
          </select>
        </label>
      </div>

      <div className="hidden overflow-visible rounded-2xl border border-[var(--ms-border)] bg-white shadow-[var(--ms-card-shadow)] md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--ms-border)] text-xs uppercase tracking-[.08em] text-[var(--ms-muted)]">
              <th className="px-5 py-4 font-bold">Файл</th>
              <th className="px-5 py-4 font-bold">Тип</th>
              <th className="px-5 py-4 font-bold">Размер</th>
              <th className="px-5 py-4 font-bold">Используется</th>
              <th className="px-5 py-4 font-bold">Обновлён</th>
              <th className="w-16 px-3">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((file) => (
              <tr
                className="border-b border-[var(--ms-border)] last:border-0 hover:bg-slate-50"
                key={file.name}
              >
                <td className="px-5 py-4">
                  <button
                    className="flex min-w-0 items-center gap-3 font-semibold hover:text-[var(--ms-primary)]"
                    onClick={() => download()}
                    type="button"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                      <FileIcon kind={file.type} />
                    </span>
                    <span className="truncate">{file.name}</span>
                  </button>
                </td>
                <td className="px-5 py-4">
                  <Badge tone="slate">{file.type}</Badge>
                </td>
                <td className="px-5 py-4 text-[var(--ms-muted)]">{file.size}</td>
                <td className="px-5 py-4">
                  <button
                    className="font-semibold text-[var(--ms-primary)] hover:underline"
                    onClick={() => setSelected(file)}
                    type="button"
                  >
                    {file.uses} {file.uses === 1 ? "статья" : "статьи"}
                  </button>
                </td>
                <td className="px-5 py-4 text-[var(--ms-muted)]">{file.updated}</td>
                <td className="px-3">
                  <ActionMenu
                    label={`Действия: ${file.name}`}
                    onOpenChange={(open) => setMenu(open ? file.name : null)}
                    open={menu === file.name}
                  >
                    <button className="menu-action" onClick={download} role="menuitem" type="button">
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Скачать
                    </button>
                    <button
                      className="menu-action"
                      onClick={() => {
                        setSelected(file);
                        setMenu(null);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Места использования
                    </button>
                  </ActionMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {visible.map((file) => (
          <article
            className="min-w-0 rounded-2xl border border-[var(--ms-border)] bg-white p-4 shadow-[var(--ms-card-shadow)]"
            key={file.name}
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ms-primary-soft)] text-[var(--ms-primary)]">
                <FileIcon kind={file.type} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-sm font-bold">{file.name}</h2>
                <p className="mt-1 text-xs text-[var(--ms-muted)]">
                  {file.type} · {file.size} · {file.updated}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                icon={<Download className="h-4 w-4" aria-hidden="true" />}
                onClick={download}
                tone="secondary"
              >
                Скачать
              </Button>
              <Button onClick={() => setSelected(file)}>Где используется</Button>
            </div>
          </article>
        ))}
      </div>

      <ResponsiveOverlay
        description={selected?.name}
        label="Места использования"
        onClose={() => setSelected(null)}
        open={Boolean(selected)}
      >
        <div className="space-y-3">
          {[
            { title: "Настройка сетевой лицензии", page: "article" as AppPage },
            { title: "Настройка интеграции с САПР-комплексом", page: "video" as AppPage },
          ]
            .slice(0, selected?.uses ?? 0)
            .map((item) => (
              <button
                className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border border-[var(--ms-border)] p-4 text-left transition hover:border-[var(--ms-primary)] hover:bg-[var(--ms-primary-soft)]"
                key={item.title}
                onClick={() => {
                  setSelected(null);
                  onNavigate(item.page);
                }}
                type="button"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[var(--ms-primary)] shadow-sm">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{item.title}</span>
                  <span className="mt-1 block text-xs text-[var(--ms-muted)]">База знаний / НАВИСА</span>
                </span>
                <ExternalLink
                  className="h-4 w-4 shrink-0 text-[var(--ms-primary)] transition group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            ))}
        </div>
        <Button
          className="mt-5 w-full"
          icon={<Download className="h-4 w-4" aria-hidden="true" />}
          onClick={download}
          tone="secondary"
        >
          Скачать файл
        </Button>
      </ResponsiveOverlay>
    </>
  );
};
