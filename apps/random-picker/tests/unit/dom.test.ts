import { describe, expect, test } from "vitest";
import {
  buildProcessorSelectOptions,
  createUi,
  getElementByIdOrThrow,
  renderOutput,
  renderPipelineStepList,
} from "../../src/dom.ts";

describe("buildProcessorSelectOptions", () => {
  describe("正常系", () => {
    test("PROCESSOR_REGISTRY の全キーがオプションとして設定される", () => {
      const select = document.createElement("select");
      const registry = {
        a: {
          id: "a",
          name: "A",
          description: "desc",
          execute: (i: any) => i,
        },
        b: {
          id: "b",
          name: "B",
          description: "desc",
          execute: (i: any) => i,
        },
      };
      buildProcessorSelectOptions(select, registry);
      expect(select.options).toHaveLength(2);
      expect(select.options[0].value).toBe("a");
      expect(select.options[0].textContent).toBe("A");
      expect(select.options[1].value).toBe("b");
      expect(select.options[1].textContent).toBe("B");
    });
  });
});

describe("createUi", () => {
  describe("正常系", () => {
    test("全てのUI要素が正しく取得される", () => {
      const root = document.implementation.createHTMLDocument("");
      const ids = [
        "inputCopyBtn",
        "inputOpenBtn",
        "input",
        "pipelineStepList",
        "processorSelect",
        "addStepBtn",
        "pipelineRunBtn",
        "outputCopyBtn",
        "outputOpenBtn",
        "output",
      ];
      ids.forEach((id) => {
        const el = root.createElement("div");
        el.id = id;
        root.body.appendChild(el);
      });

      const ui = createUi(root);
      expect(ui.inputCopyBtn.id).toBe("inputCopyBtn");
      expect(ui.inputOpenBtn.id).toBe("inputOpenBtn");
      expect(ui.input.id).toBe("input");
      expect(ui.pipelineStepList.id).toBe("pipelineStepList");
      expect(ui.processorSelect.id).toBe("processorSelect");
      expect(ui.addStepBtn.id).toBe("addStepBtn");
      expect(ui.pipelineRunBtn.id).toBe("pipelineRunBtn");
      expect(ui.outputCopyBtn.id).toBe("outputCopyBtn");
      expect(ui.outputOpenBtn.id).toBe("outputOpenBtn");
      expect(ui.output.id).toBe("output");
    });
  });

  describe("異常系", () => {
    test("要素が1つでも欠けている場合にエラーを投げる", () => {
      const root = document.implementation.createHTMLDocument("");
      expect(() => createUi(root)).toThrow();
    });
  });
});

describe("getElementByIdOrThrow", () => {
  describe("正常系", () => {
    test("対象要素あり", () => {
      const root = document.implementation.createHTMLDocument("");
      const button = root.createElement("button");
      button.id = "target-button";
      root.body.append(button);

      expect(
        getElementByIdOrThrow<HTMLButtonElement>(root, "target-button"),
      ).toBe(button);
    });
  });

  describe("異常系", () => {
    test("対象要素なし", () => {
      const root = document.implementation.createHTMLDocument("");

      expect(() => getElementByIdOrThrow(root, "missing-id")).toThrowError(
        new Error("Element not found: #missing-id"),
      );
    });
  });
});

describe("renderOutput", () => {
  describe("正常系", () => {
    test("文字列を出力する", () => {
      const dummyDiv = document.createElement("textarea");

      renderOutput(dummyDiv, "テスト結果");

      expect(dummyDiv.value).toBe("テスト結果");
    });
  });

  describe("境界系", () => {
    test("空文字列を出力する", () => {
      const dummyDiv = document.createElement("textarea");

      renderOutput(dummyDiv, "");

      expect(dummyDiv.value).toBe("");
    });
  });
});

// テストケース一覧
// - steps.length=0 / 空メッセージを表示する
// - steps.length=1 / registryにstep.idがない / 描画しない
// - steps.length=1 / registryにstep.idがある / paramsSchemaがない / pipeline-step-paramsにinputを生成しない
// - steps.length=1 / registryにstep.idがある / paramsSchemaが1件ある / step.paramsがない / defaultを使用する
// - steps.length=1 / registryにstep.idがある / paramsSchemaが1件ある / step.paramsがある / step.paramsを優先する
// - steps.length=1 / registryにstep.idがある / paramsSchemaが2件ある
// - steps.length=2 / 描画する
describe("renderPipelineStepList", () => {
  describe("正常系", () => {
    test("steps.length=0 / 空メッセージを表示する", () => {
      const div = document.createElement("div");
      renderPipelineStepList(div, [], {});
      expect(div.querySelector(".pipeline-empty-msg")).not.toBeNull();
    });

    test("steps.length=1 / registryにstep.idがない / 描画しない", () => {
      const div = document.createElement("div");
      const registry = {
        trim: {
          id: "trim",
          name: "Trim",
          description: "desc",
          execute: (i: any) => i,
        },
      };

      renderPipelineStepList(div, [{ id: "missing" }], registry);
      expect(div.querySelector(".pipeline-step-item")).toBeNull();
    });

    test("steps.length=1 / registryにstep.idがある / paramsSchemaがない / pipeline-step-paramsにinputを生成しない", () => {
      const div = document.createElement("div");
      const registry = {
        trim: {
          id: "trim",
          name: "Trim",
          description: "desc",
          execute: (i: any) => i,
        },
      };

      renderPipelineStepList(div, [{ id: "trim" }], registry);

      expect(div.querySelector(".pipeline-step-params")).not.toBeNull();
      expect(
        div.querySelector(".pipeline-step-params")?.querySelector("input"),
      ).toBeNull();
    });

    test("steps.length=1 / registryにstep.idがある / paramsSchemaが1件ある / step.paramsがない / defaultを使用する", () => {
      const div = document.createElement("div");
      const registry = {
        pickRandom: {
          id: "pickRandom",
          name: "Pick",
          description: "desc",
          paramsSchema: {
            count: { type: "number" as const, label: "Count", default: 1 },
          },
          execute: (i: any) => i,
        },
      };
      renderPipelineStepList(div, [{ id: "pickRandom" }], registry);
      const input = div.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.value).toBe("1");
    });

    test("steps.length=1 / registryにstep.idがある / paramsSchemaが1件ある / step.paramsがある / step.paramsを優先する", () => {
      const div = document.createElement("div");
      const registry = {
        pickRandom: {
          id: "pickRandom",
          name: "Pick",
          description: "desc",
          paramsSchema: {
            count: { type: "number" as const, label: "Count", default: 1 },
          },
          execute: (i: any) => i,
        },
      };

      renderPipelineStepList(
        div,
        [{ id: "pickRandom", params: { count: 3 } }],
        registry,
      );

      const input = div.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.value).toBe("3");
    });

    test("steps.length=1 / registryにstep.idがある / paramsSchemaが2件ある", () => {
      const div = document.createElement("div");
      const registry = {
        pickRandom: {
          id: "pickRandom",
          name: "Pick",
          description: "desc",
          paramsSchema: {
            count: { type: "number" as const, label: "Count", default: 1 },
            seed: { type: "string" as const, label: "Seed", default: "abc" },
          },
          execute: (i: any) => i,
        },
      };

      renderPipelineStepList(div, [{ id: "pickRandom" }], registry);

      const inputs = div.querySelectorAll("input");
      expect(inputs).toHaveLength(2);
      expect((inputs[0] as HTMLInputElement).value).toBe("1");
      expect((inputs[1] as HTMLInputElement).value).toBe("abc");
    });

    test("steps.length=2 / 描画する", () => {
      const div = document.createElement("div");
      const registry = {
        trim: {
          id: "trim",
          name: "Trim",
          description: "desc",
          execute: (i: any) => i,
        },
      };
      renderPipelineStepList(div, [{ id: "trim" }, { id: "trim" }], registry);
      expect(div.querySelectorAll(".pipeline-step-item")).toHaveLength(2);
    });
  });
});
