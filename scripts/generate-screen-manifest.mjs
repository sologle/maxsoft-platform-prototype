import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const designRoot = resolve(appRoot, "public/design");
const outputPath = resolve(appRoot, "src/generated/screens.ts");
const files = ["auth.html", "shell.html", "kb.html", "org.html", "platform.html"];
const filePrefixes = {
  "auth.html": ["AUTH-"],
  "shell.html": ["SHELL-"],
  "kb.html": ["KB-"],
  "org.html": ["ORG-"],
  "platform.html": ["PLAT-", "SRCH-", "FLOW-00"],
};
const rootPattern = /^      <div\n        data-pencil-id="([^"]+)"\n        data-pencil-name="([^"]+)"\n        style="([^"]+)"/gm;

const parsePixels = (style, property, context, required = true) => {
  const match = style.match(new RegExp(`(?:^|; )${property}: ([\\d.]+)px`));
  if (!match && required) {
    throw new Error(`SCREEN_MANIFEST_INVALID: у корневого фрейма ${context} нет ${property}: ${style}`);
  }
  return match ? Number(match[1]) : 0;
};

const screens = [];
for (const file of files) {
  const html = await readFile(resolve(designRoot, file), "utf8");
  for (const match of html.matchAll(rootPattern)) {
    const [, id, name, style] = match;
    if (!filePrefixes[file].some((prefix) => name.startsWith(prefix))) {
      continue;
    }
    const width = parsePixels(style, "width", `${id} ${name}`);
    const height = parsePixels(style, "height", `${id} ${name}`, false);
    const format = /mobile/i.test(name) ? "mobile" : "desktop";
    screens.push({ id, name, file, width, height, format });
  }
}

const uniqueIds = new Set(screens.map((screen) => screen.id));
if (screens.length === 0 || uniqueIds.size !== screens.length) {
  const duplicates = screens
    .filter((screen, index) => screens.findIndex((candidate) => candidate.id === screen.id) !== index)
    .map((screen) => screen.id);
  throw new Error(
    `SCREEN_MANIFEST_INVALID: найдено ${screens.length} экранов, ${uniqueIds.size} уникальных; дубликаты: ${duplicates.join(", ")}`,
  );
}

const rows = screens.map((screen) => `  ${JSON.stringify(screen)},`).join("\n");
const source = `export type ScreenFormat = "desktop" | "mobile";\n\nexport interface ScreenDefinition {\n  id: string;\n  name: string;\n  file: string;\n  width: number;\n  height: number;\n  format: ScreenFormat;\n}\n\nexport const screens: ScreenDefinition[] = [\n${rows}\n];\n`;
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, source);
console.log(`Generated ${screens.length} Pencil screens`);
