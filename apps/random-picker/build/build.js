const fs = require("node:fs");
const path = require("node:path");
const prettier = require("prettier");
const { build } = require("esbuild");

const appDir = path.resolve(__dirname, "..");
const sourceHtmlPath = path.join(appDir, "src", "index.html");
const sourceCssPath = path.join(appDir, "src", "style.css");
const sourceScriptPath = path.join(appDir, "src", "script.js");
const outputDirPath = path.join(appDir, "generated");
const outputHtmlPath = path.join(outputDirPath, "index.html");

async function bundleScript() {
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

async function bundleStyle() {
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

function inlineTemplate(template, styleText, scriptText) {
  const escapedScript = scriptText.replace(/<\/script>/g, "<\\/script>");
  const bootScript = `${escapedScript}\nRandomPickerApp.initApp();`;

  return template
    .replace("/* __INLINE_STYLE__ */", styleText)
    .replace("/* __INLINE_SCRIPT__ */", bootScript);
}

async function main() {
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
