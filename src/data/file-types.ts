export const canPreviewFile = (file: { type: string }) =>
  file.type === "PDF" || file.type === "DOCX";
