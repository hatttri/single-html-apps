import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, test } from "vitest";
import { initApp } from "../../src/script.ts";

const html = fs.readFileSync(
  path.resolve(process.cwd(), "apps/random-picker/src/index.html"),
  "utf8",
);
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

if (!bodyMatch) {
  throw new Error("body not found in src/index.html");
}

const bodyHtml = bodyMatch[1];

describe("initApp", () => {
  beforeEach(() => {
    document.body.innerHTML = bodyHtml;
  });

  describe("正常系", () => {
    test("初期化時にパイプラインが空になり、セレクトボックスとリストが初期設定される", () => {
      const ui = initApp();
      expect(ui.processorSelect.options.length).toBeGreaterThan(0);
      expect(
        ui.pipelineStepList.querySelector(".pipeline-empty-msg"),
      ).not.toBeNull();
    });
  });

  describe("異常系", () => {
    test("引数なしで実行してもエラーが発生しない", () => {
      expect(() => initApp()).not.toThrow();
    });
  });
});
