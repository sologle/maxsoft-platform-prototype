import type { ReactNode } from "react";
import "./file-type-icon.css";

const symbols: Record<string, ReactNode> = {
  PDF: <path d="M9 23c7-2 10-10 8-11-3-1 0 12 8 11 5-2-7-6-13 0" />,
  DOCX: <path d="M10 12v9l3-5 3 5v-9m5 1h9m-9 4h9m-9 4h6" />,
  XLSX: (
    <>
      <path d="M10 12l7 10m0-10-7 10" />
      <path d="M22 12h9v10h-9zm0 5h9m-5-5v10" />
    </>
  ),
  CSV: (
    <>
      <path d="M9 12h7m6 0h8M9 18h7m6 0h8" />
      <path d="M18 13l-1 3m1 3-1 3" />
    </>
  ),
  ZIP: (
    <>
      <path d="M20 8v14" strokeDasharray="2 2" />
      <rect x="17" y="21" width="6" height="4" rx="1" />
    </>
  ),
  DWG: (
    <>
      <path d="M10 31v-8l7-3v11m5 0V21l9-3v13" strokeWidth="3" />
      <path d="M9 33h23" />
    </>
  ),
};

export const FileTypeIcon = ({
  type,
  large = false,
}: {
  type: string;
  large?: boolean;
}) => (
  <span
    className={`file-type-icon ${large ? "file-type-icon-large" : ""}`}
    data-file-type={type}
    role="img"
    aria-label={`Файл ${type}`}
  >
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect
        className="file-type-tile"
        x="1"
        y="1"
        width="38"
        height="38"
        rx={type === "DWG" ? 3 : 8}
      />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {symbols[type] ?? <path d="M13 9h10l5 5v10H13zm10 0v6h5" />}
      </g>
      <text
        x="20"
        y={type === "DWG" ? 15 : 34}
        textAnchor="middle"
        fill="currentColor"
        fontFamily="system-ui, sans-serif"
        fontWeight="800"
        fontSize={type === "DWG" ? 11 : 8.5}
      >
        {type}
      </text>
    </svg>
  </span>
);
