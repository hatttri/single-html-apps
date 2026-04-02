import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, test } from "vitest";
import { createUi } from "../../src/dom.ts";
import { PROCESSOR_REGISTRY } from "../../src/processor-registry.ts";
import { initApp } from "../../src/script.ts";
import { appState } from "../../src/state.ts";

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
    appState.pipeline = [{ id: "trim" }];
  });

  describe("正常系", () => {
    test("引数なし", () => {
      const ui = initApp();

      expect(appState.pipeline).toEqual([]);
      expect(ui.processorSelect.options.length).toBe(
        Object.keys(PROCESSOR_REGISTRY).length,
      );
      expect(
        ui.pipelineStepList.querySelectorAll(".pipeline-step-item"),
      ).toHaveLength(0);
      expect(
        ui.pipelineStepList.querySelector(".pipeline-empty-msg"),
      ).not.toBeNull();

      expect(ui.inputCopyBtn.onclick).not.toBeNull();
      expect(ui.inputOpenBtn.onclick).not.toBeNull();
      expect(ui.pipelineStepList.onclick).not.toBeNull();
      expect(ui.pipelineStepList.ondragend).not.toBeNull();
      expect(ui.pipelineStepList.ondragover).not.toBeNull();
      expect(ui.pipelineStepList.ondragstart).not.toBeNull();
      expect(ui.pipelineStepList.oninput).not.toBeNull();
      expect(ui.addStepBtn.onclick).not.toBeNull();
      expect(ui.pipelineRunBtn.onclick).not.toBeNull();
      expect(ui.outputCopyBtn.onclick).not.toBeNull();
      expect(ui.outputOpenBtn.onclick).not.toBeNull();
    });

    test("引数あり", () => {
      const ui = createUi();
      const returnedUi = initApp(ui);

      expect(returnedUi).toBe(ui);
      expect(appState.pipeline).toEqual([]);
      expect(ui.processorSelect.options.length).toBe(
        Object.keys(PROCESSOR_REGISTRY).length,
      );
      expect(
        ui.pipelineStepList.querySelectorAll(".pipeline-step-item"),
      ).toHaveLength(0);
      expect(
        ui.pipelineStepList.querySelector(".pipeline-empty-msg"),
      ).not.toBeNull();

      expect(ui.inputCopyBtn.onclick).not.toBeNull();
      expect(ui.inputOpenBtn.onclick).not.toBeNull();
      expect(ui.pipelineStepList.onclick).not.toBeNull();
      expect(ui.pipelineStepList.ondragend).not.toBeNull();
      expect(ui.pipelineStepList.ondragover).not.toBeNull();
      expect(ui.pipelineStepList.ondragstart).not.toBeNull();
      expect(ui.pipelineStepList.oninput).not.toBeNull();
      expect(ui.addStepBtn.onclick).not.toBeNull();
      expect(ui.pipelineRunBtn.onclick).not.toBeNull();
      expect(ui.outputCopyBtn.onclick).not.toBeNull();
      expect(ui.outputOpenBtn.onclick).not.toBeNull();
    });
  });
});
