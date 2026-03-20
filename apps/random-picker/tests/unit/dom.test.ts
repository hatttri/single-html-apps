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

// パターン整理
// 01. 対象要素／なし／あり
//
// パターン一覧
// ○ 01 対象要素なし
// ○ 02 対象要素あり
describe("getElementByIdOrThrow", () => {
  test("01 対象要素なし", () => {
    const root = document.implementation.createHTMLDocument("");

    expect(() => getElementByIdOrThrow(root, "missing-id")).toThrowError(
      new Error("Element not found: #missing-id"),
    );
  });

  test("02 対象要素あり", () => {
    const root = document.implementation.createHTMLDocument("");
    const button = root.createElement("button");
    button.id = "target-button";
    root.body.append(button);

    expect(
      getElementByIdOrThrow<HTMLButtonElement>(root, "target-button"),
    ).toBe(button);
  });
});

// describe("initApp", () => {});

// パターン整理
// 01. 文字数／＝０文字／≧１文字
//
// パターン一覧
// ○ 01 文字数＝０文字
// ○ 02 文字数≧１文字
describe("renderOutput", () => {
  test("01 文字数＝０文字", () => {
    const dummyDiv = document.createElement("textarea");

    renderOutput(dummyDiv, "");

    expect(dummyDiv.value).toBe("");
  });

  test("02 文字数≧１文字", () => {
    const dummyDiv = document.createElement("textarea");

    renderOutput(dummyDiv, "テスト結果");

    expect(dummyDiv.value).toBe("テスト結果");
  });
});

describe("renderPipelineStepList", () => {
  describe("正常系", () => {
    test("steps空のとき空メッセージが表示される", () => {
      const div = document.createElement("div");
      renderPipelineStepList(div, [], {});
      expect(div.querySelector(".pipeline-empty-msg")).not.toBeNull();
    });

    test("steps1件のときアイテムが1件描画される", () => {
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
      expect(div.querySelectorAll(".pipeline-step-item")).toHaveLength(1);
      expect(div.querySelector(".pipeline-step-name")?.textContent).toBe(
        "Trim",
      );
    });

    test("paramsSchemaありのとき入力欄が生成される", () => {
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
  });
});
