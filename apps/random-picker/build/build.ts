import fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";
import { build } from "esbuild";

const sourceHtmlPath = fileURLToPath(
  new URL("../src/index.html", import.meta.url),
);
const sourceCssPath = fileURLToPath(
  new URL("../src/style.css", import.meta.url),
);
const sourceScriptPath = fileURLToPath(
  new URL("../src/script.ts", import.meta.url),
);
const outputDirPath = fileURLToPath(new URL("../generated", import.meta.url));
const outputHtmlPath = fileURLToPath(
  new URL("../generated/index.html", import.meta.url),
);

async function bundleScript(): Promise<string> {
  const result = await build({
    entryPoints: [sourceScriptPath],
    bundle: true,
    format: "iife",
    globalName: "RandomPickerApp",
    platform: "browser",
    target: ["es2020"],
    write: false,
    outfile: "script.js",
  });

  const outputFile = result.outputFiles.find((file) =>
    file.path.endsWith(".js"),
  );
  if (!outputFile) {
    throw new Error("script bundle output not found");
  }

  return outputFile.text;
}

async function bundleStyle(): Promise<string> {
  const result = await build({
    entryPoints: [sourceCssPath],
    bundle: true,
    write: false,
    outfile: "style.css",
  });

  const outputFile = result.outputFiles.find((file) =>
    file.path.endsWith(".css"),
  );
  if (!outputFile) {
    throw new Error("style bundle output not found");
  }

  return outputFile.text;
}

function inlineTemplate(
  template: string,
  styleText: string,
  scriptText: string,
): string {
  const escapedScript = scriptText.replace(/<\/script>/g, "<\\/script>");
  const bootScript = `${escapedScript}\nRandomPickerApp.initApp();`;

  return template
    .replace("/* __INLINE_STYLE__ */", styleText)
    .replace("/* __INLINE_SCRIPT__ */", bootScript);
}

async function main(): Promise<void> {
  const template = fs.readFileSync(sourceHtmlPath, "utf8");
  const styleText = await bundleStyle();
  const scriptText = await bundleScript();
  const outputHtml = inlineTemplate(template, styleText, scriptText);
  const formattedHtml = await prettier.format(outputHtml, { parser: "html" });

  fs.mkdirSync(outputDirPath, { recursive: true });
  fs.writeFileSync(outputHtmlPath, formattedHtml, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
