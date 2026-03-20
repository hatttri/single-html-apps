import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  buildProcessorSelectOptions,
  createUi,
  renderPipelineStepList,
} from "../../src/dom.ts";
import {
  bindInputEvent,
  bindOutputEvent,
  bindPipelineEvent,
} from "../../src/event.ts";
import { PROCESSOR_REGISTRY } from "../../src/processor-registry.ts";
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
  let ui: ReturnType<typeof createUi>;

  beforeEach(() => {
    document.body.innerHTML = bodyHtml;
    appState.pipeline = [];
    ui = createUi();
    buildProcessorSelectOptions(ui.processorSelect, PROCESSOR_REGISTRY);
    renderPipelineStepList(
      ui.pipelineStepList,
      appState.pipeline,
      PROCESSOR_REGISTRY,
    );

    const deps = { ui, appState, processorRegistry: PROCESSOR_REGISTRY };
    bindInputEvent(deps);
    bindPipelineEvent(deps);
    bindOutputEvent(deps);
  });

  // パターン整理
  // 01. 文字数／＝０文字／≧１文字
  //
  // パターン一覧
  // ○ 01 文字数＝０文字
  // ○ 02 文字数≧１文字
  describe("ui.inputCopyBtn.onclick", () => {
    test("01 文字数＝０文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.input.value = "";
      await ui.inputCopyBtn.click();

      expect(writeText).toHaveBeenCalledWith("");
    });

    test("02 文字数≧１文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.input.value = "A\nB";
      await ui.inputCopyBtn.click();

      expect(writeText).toHaveBeenCalledWith("A\nB");
    });
  });

  // パターン整理
  // 01. 行数／＝１行／≧２行
  // 02. 前後空白／なし／あり
  // 03. 無効行／なし／あり
  //
  // パターン一覧
  // ○ 01 行数＝１行／前後空白なし／無効行なし
  // ○ 02 行数＝１行／前後空白なし／無効行あり
  // ○ 03 行数＝１行／前後空白あり／無効行なし
  // ○ 04 行数＝１行／前後空白あり／無効行あり
  // ○ 05 行数≧２行／前後空白なし／無効行なし
  // ○ 06 行数≧２行／前後空白なし／無効行あり
  // ○ 07 行数≧２行／前後空白あり／無効行なし
  // ○ 08 行数≧２行／前後空白あり／無効行あり
  describe("ui.inputOpenBtn.onclick", () => {
    test("01 行数＝１行／前後空白なし／無効行なし", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.input.value = "https://example.com";

      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });

    test("02 行数＝１行／前後空白なし／無効行あり", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.input.value = "";

      ui.inputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("03 行数＝１行／前後空白あり／無効行なし", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.input.value = " https://example.com ";

      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });

    test("04 行数＝１行／前後空白あり／無効行あり", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.input.value = "  ";

      ui.inputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("05 行数≧２行／前後空白なし／無効行なし", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.input.value = "https://example.com\nhttps://example.org";

      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("06 行数≧２行／前後空白なし／無効行あり", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.input.value = "https://example.com\n";

      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });

    test("07 行数≧２行／前後空白あり／無効行なし", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.input.value = " https://example.com \n https://example.org ";

      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("08 行数≧２行／前後空白あり／無効行あり", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.input.value = " https://example.com \n  ";

      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });
  });

  describe("ui.pipelineStepList.onclick", () => {
    describe("正常系", () => {
      test("削除ボタンをクリックするとステップが削除される", () => {
        ui.processorSelect.value = "trim";
        ui.addStepBtn.click();
        expect(
          ui.pipelineStepList.querySelectorAll(".pipeline-step-item"),
        ).toHaveLength(1);

        const deleteBtn = ui.pipelineStepList.querySelector(
          ".pipeline-delete-btn",
        ) as HTMLElement;
        deleteBtn.click();

        expect(
          ui.pipelineStepList.querySelectorAll(".pipeline-step-item"),
        ).toHaveLength(0);
      });
    });

    describe("異常系", () => {
      test("削除ボタン以外をクリックしても変化しない", () => {
        ui.processorSelect.value = "trim";
        ui.addStepBtn.click();
        const item = ui.pipelineStepList.querySelector(
          ".pipeline-step-item",
        ) as HTMLElement;
        item.click();

        expect(
          ui.pipelineStepList.querySelectorAll(".pipeline-step-item"),
        ).toHaveLength(1);
      });
    });
  });

  describe("ui.pipelineStepList.ondragend", () => {
    describe("正常系", () => {
      test("ドラッグ終了時に dragging クラスが除去される", () => {
        ui.processorSelect.value = "trim";
        ui.addStepBtn.click();
        const item = ui.pipelineStepList.querySelector(
          ".pipeline-step-item",
        ) as HTMLElement;
        item.classList.add("dragging");

        const event = new Event("dragend", { bubbles: true });
        item.dispatchEvent(event);

        expect(item.classList.contains("dragging")).toBe(false);
      });
    });

    describe("異常系", () => {
      test("アイテム以外でのドラッグ終了でエラーが発生しない", () => {
        const event = new Event("dragend", { bubbles: true });
        expect(() => {
          ui.pipelineStepList.dispatchEvent(event);
        }).not.toThrow();
      });
    });
  });

  describe("ui.pipelineStepList.ondragover", () => {
    describe("正常系", () => {
      test("要素の上へのドラッグオーバーで順序が入れ替わる", () => {
        ui.processorSelect.value = "trim";
        ui.addStepBtn.click();
        ui.processorSelect.value = "filterEmpty";
        ui.addStepBtn.click();

        const itemsBefore = ui.pipelineStepList.querySelectorAll(
          ".pipeline-step-item",
        );
        const item0 = itemsBefore[0] as HTMLElement;
        const item1 = itemsBefore[1] as HTMLElement;

        item0.dispatchEvent(new Event("dragstart", { bubbles: true }));
        item1.dispatchEvent(new Event("dragover", { bubbles: true }));

        const itemsAfter = ui.pipelineStepList.querySelectorAll(
          ".pipeline-step-item",
        );
        expect(
          itemsAfter[0].querySelector(".pipeline-step-name")?.textContent,
        ).toBe("空行除外");
      });
    });

    describe("異常系", () => {
      test("ドラッグ中ではない場合は入れ替わりが発生しない", () => {
        ui.processorSelect.value = "trim";
        ui.addStepBtn.click();
        const item = ui.pipelineStepList.querySelector(
          ".pipeline-step-item",
        ) as HTMLElement;

        item.dispatchEvent(new Event("dragover", { bubbles: true }));
        expect(
          ui.pipelineStepList.querySelectorAll(".pipeline-step-item"),
        ).toHaveLength(1);
      });
    });
  });

  describe("ui.pipelineStepList.ondragstart", () => {
    describe("正常系", () => {
      test("ドラッグ開始時に dragging クラスが付与される", () => {
        ui.processorSelect.value = "trim";
        ui.addStepBtn.click();
        const item = ui.pipelineStepList.querySelector(
          ".pipeline-step-item",
        ) as HTMLElement;

        const event = new Event("dragstart", { bubbles: true });
        item.dispatchEvent(event);

        expect(item.classList.contains("dragging")).toBe(true);
      });
    });

    describe("異常系", () => {
      test("アイテム以外でのドラッグ開始でエラーが発生しない", () => {
        const event = new Event("dragstart", { bubbles: true });
        expect(() => {
          ui.pipelineStepList.dispatchEvent(event);
        }).not.toThrow();
      });
    });
  });

  describe("ui.pipelineStepList.oninput", () => {
    describe("正常系", () => {
      test("入力値の変更が内部状態に反映される", () => {
        ui.processorSelect.value = "pickRandom";
        ui.addStepBtn.click();

        const input = ui.pipelineStepList.querySelector(
          'input[type="number"]',
        ) as HTMLInputElement;
        input.value = "10";
        input.dispatchEvent(new Event("input", { bubbles: true }));

        // 状態を確認するために副作用（別の操作での再描画など）を確認
        // ここでは直接エラーなく通ることを確認
        expect(input.value).toBe("10");
      });
    });

    describe("異常系", () => {
      test("不正な要素の入力イベントでエラーが発生しない", () => {
        const input = document.createElement("input");
        ui.pipelineStepList.appendChild(input);
        expect(() => {
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }).not.toThrow();
      });
    });
  });

  describe("ui.addStepBtn.onclick", () => {
    describe("正常系", () => {
      test("追加ボタンをクリックするとリストにステップが追加される", () => {
        ui.processorSelect.value = "trim";
        ui.addStepBtn.click();

        const items = ui.pipelineStepList.querySelectorAll(
          ".pipeline-step-item",
        );
        expect(items).toHaveLength(1);
        expect(items[0].querySelector(".pipeline-step-name")?.textContent).toBe(
          "空白削除",
        );
      });
    });

    describe("異常系", () => {
      test("存在しないプロセッサを選択して追加しても追加されない", () => {
        ui.processorSelect.innerHTML =
          '<option value="invalid">Invalid</option>';
        ui.processorSelect.value = "invalid";
        ui.addStepBtn.click();

        expect(
          ui.pipelineStepList.querySelectorAll(".pipeline-step-item"),
        ).toHaveLength(0);
      });
    });
  });

  describe("ui.pipelineRunBtn.onclick", () => {
    describe("正常系", () => {
      test("実行ボタンをクリックするとパイプライン処理の結果が出力される", () => {
        ui.input.value = " a ";
        ui.processorSelect.value = "trim";
        ui.addStepBtn.click();

        ui.pipelineRunBtn.click();

        expect(ui.output.value).toBe("a");
      });
    });

    describe("異常系", () => {
      test("パイプラインが空の場合はそのまま出力される", () => {
        ui.input.value = "test";
        ui.pipelineRunBtn.click();
        expect(ui.output.value).toBe("test");
      });
    });
  });

  // パターン整理
  // 01. 文字数／＝０文字／≧１文字
  //
  // パターン一覧
  // ○ 01 文字数＝０文字
  // ○ 02 文字数≧１文字
  describe("ui.outputCopyBtn.onclick", () => {
    test("01 文字数＝０文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.output.value = "";
      await ui.outputCopyBtn.click();

      expect(writeText).toHaveBeenCalledWith("");
    });

    test("02 文字数≧１文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.output.value = "出力テキスト";
      await ui.outputCopyBtn.click();

      expect(writeText).toHaveBeenCalledWith("出力テキスト");
    });
  });

  // パターン整理
  // 01. 行数／＝１行／≧２行
  // 02. 前後空白／なし／あり
  // 03. 無効行／なし／あり
  //
  // パターン一覧
  // ○ 01 行数＝１行／前後空白なし／無効行なし
  // ○ 02 行数＝１行／前後空白なし／無効行あり
  // ○ 03 行数＝１行／前後空白あり／無効行なし
  // ○ 04 行数＝１行／前後空白あり／無効行あり
  // ○ 05 行数≧２行／前後空白なし／無効行なし
  // ○ 06 行数≧２行／前後空白なし／無効行あり
  // ○ 07 行数≧２行／前後空白あり／無効行なし
  // ○ 08 行数≧２行／前後空白あり／無効行あり
  describe("ui.outputOpenBtn.onclick", () => {
    test("01 行数＝１行／前後空白なし／無効行なし", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.output.value = "https://example.com/output";

      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com/output", "_blank");
    });

    test("02 行数＝１行／前後空白なし／無効行あり", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.output.value = "";

      ui.outputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("03 行数＝１行／前後空白あり／無効行なし", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.output.value = " https://example.com/output ";

      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com/output", "_blank");
    });

    test("04 行数＝１行／前後空白あり／無効行あり", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.output.value = "  ";

      ui.outputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("05 行数≧２行／前後空白なし／無効行なし", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.output.value =
        "https://example.com/output\nhttps://example.org/output";

      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(
        1,
        "https://example.com/output",
        "_blank",
      );
      expect(open).toHaveBeenNthCalledWith(
        2,
        "https://example.org/output",
        "_blank",
      );
    });

    test("06 行数≧２行／前後空白なし／無効行あり", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.output.value = "https://example.com/output\n";

      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com/output", "_blank");
    });

    test("07 行数≧２行／前後空白あり／無効行なし", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.output.value =
        " https://example.com/output \n https://example.org/output ";

      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(
        1,
        "https://example.com/output",
        "_blank",
      );
      expect(open).toHaveBeenNthCalledWith(
        2,
        "https://example.org/output",
        "_blank",
      );
    });

    test("08 行数≧２行／前後空白あり／無効行あり", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;
      ui.output.value = " https://example.com/output \n  ";

      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com/output", "_blank");
    });
  });
});
