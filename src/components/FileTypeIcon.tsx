import { FileArchive, FileText } from "lucide-react";

const fileColors: Record<string, string> = {
  PDF: "bg-red-50 text-red-600",
  DOCX: "bg-blue-50 text-blue-600",
  DWG: "bg-amber-50 text-amber-700",
  ZIP: "bg-violet-50 text-violet-700",
  XLSX: "bg-emerald-50 text-emerald-700",
  CSV: "bg-emerald-50 text-emerald-700",
};

export const FileTypeIcon = ({ type, large = false }: { type: string; large?: boolean }) => {
  const Icon = type === "ZIP" ? FileArchive : FileText;
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl ${large ? "h-16 w-16" : "h-10 w-10"} ${fileColors[type] ?? "bg-slate-100 text-slate-600"}`}>
      <Icon className={large ? "h-8 w-8" : "h-5 w-5"} aria-hidden="true" />
    </span>
  );
};
