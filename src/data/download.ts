export const mockDownload = {
  filename: "maxsoft-demo-document.txt",
  content:
    "Демонстрационный файл MaxSoft. В рабочей версии здесь будет доступен исходный документ с проверкой прав.",
};

export const downloadDemoFile = (file: { name: string; type: string }) => {
  const url = URL.createObjectURL(
    new Blob(
      [
        `Демонстрационная заглушка для ${file.name} (${file.type}). Это текстовое описание, не исходный документ.\n`,
      ],
      { type: "text/plain;charset=utf-8" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${file.name}.demo.txt`;
  link.click();
  URL.revokeObjectURL(url);
};
