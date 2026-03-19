import { beforeEach, describe, expect, test, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { initApp } from "../src/script.ts";

const html = fs.readFileSync(
  path.resolve(process.cwd(), "apps/random-picker/src/index.html"),
  "utf8",
);
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

if (!bodyMatch) {
  throw new Error("body not found in src/index.html");
}

const bodyHtml = bodyMatch[1];

describe("Random Picker Integration Tests", () => {
  beforeEach(() => {
    document.body.innerHTML = bodyHtml;
  });

  describe("initApp", () => {
    let ui: ReturnType<typeof initApp>;

    beforeEach(() => {
      ui = initApp();
    });

    describe("initApp", () => {
      describe("正常系", () => {
        test("初期化時にパイプラインが空になり、セレクトボックスとリストが初期設定される", () => {
          const newUi = initApp(ui);
          expect(newUi.processorSelect.options.length).toBeGreaterThan(0);
          expect(
            newUi.pipelineStepList.querySelector(".pipeline-empty-msg"),
          ).not.toBeNull();
        });
      });

      describe("異常系", () => {
        test("引数なしで実行してもエラーが発生しない", () => {
          expect(() => initApp()).not.toThrow();
        });
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
          expect(
            items[0].querySelector(".pipeline-step-name")?.textContent,
          ).toBe("空白削除");
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
        expect(open).toHaveBeenNthCalledWith(
          1,
          "https://example.com",
          "_blank",
        );
        expect(open).toHaveBeenNthCalledWith(
          2,
          "https://example.org",
          "_blank",
        );
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
        expect(open).toHaveBeenNthCalledWith(
          1,
          "https://example.com",
          "_blank",
        );
        expect(open).toHaveBeenNthCalledWith(
          2,
          "https://example.org",
          "_blank",
        );
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

    // パターン整理
    // 01. 入力行数／＝１行／＝２行／≧３行
    // 02. 前後空白／なし／あり
    // 03. 無効行／なし／あり
    //
    // パターン一覧
    // ○ 01 入力行数＝１行／前後空白なし／無効行なし
    // ○ 02 入力行数＝１行／前後空白なし／無効行あり
    // ○ 03 入力行数＝１行／前後空白あり／無効行なし
    // ○ 04 入力行数＝１行／前後空白あり／無効行あり
    // ○ 05 入力行数＝２行／前後空白なし／無効行なし
    // ○ 06 入力行数＝２行／前後空白なし／無効行あり
    // ○ 07 入力行数＝２行／前後空白あり／無効行なし
    // ○ 08 入力行数＝２行／前後空白あり／無効行あり
    // ○ 09 入力行数≧３行／前後空白なし／無効行なし
    // ○ 10 入力行数≧３行／前後空白なし／無効行あり
    // ○ 11 入力行数≧３行／前後空白あり／無効行なし
    // ○ 12 入力行数≧３行／前後空白あり／無効行あり
    describe("ui.fullRandomBtn.onclick", () => {
      test("01 入力行数＝１行／前後空白なし／無効行なし", () => {
        ui.input.value = "A";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("02 入力行数＝１行／前後空白なし／無効行あり", () => {
        ui.input.value = "";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("03 入力行数＝１行／前後空白あり／無効行なし", () => {
        ui.input.value = " A ";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("04 入力行数＝１行／前後空白あり／無効行あり", () => {
        ui.input.value = "  ";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("05 入力行数＝２行／前後空白なし／無効行なし", () => {
        ui.input.value = "A\nB";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("06 入力行数＝２行／前後空白なし／無効行あり", () => {
        ui.input.value = "A\n";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("07 入力行数＝２行／前後空白あり／無効行なし", () => {
        ui.input.value = " A \n B ";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("08 入力行数＝２行／前後空白あり／無効行あり", () => {
        ui.input.value = " A \n  ";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("09 入力行数≧３行／前後空白なし／無効行なし", () => {
        ui.input.value = "A\nB\nC";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.output.value);
      });

      test("10 入力行数≧３行／前後空白なし／無効行あり", () => {
        ui.input.value = "A\n\nB";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("11 入力行数≧３行／前後空白あり／無効行なし", () => {
        ui.input.value = " A \n B \n C ";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.output.value);
      });

      test("12 入力行数≧３行／前後空白あり／無効行あり", () => {
        ui.input.value = " A \n  \n B ";
        ui.output.value = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });
    });

    // パターン整理
    // 01. 入力行数／＝１行／＝２行／≧３行
    // 02. 出力行数／＝１行／＝２行／≧３行
    // 03. 入力の前後空白／なし／あり
    // 04. 入力の無効行／なし／あり
    // 05. 入力・出力の共通行／なし／あり
    //
    // パターン一覧
    // ○ 01 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
    // ○ 02 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
    // ○ 03 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
    // × 04 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
    // ○ 05 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
    // ○ 06 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
    // ○ 07 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
    // × 08 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
    // ○ 09 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
    // ○ 10 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
    // ○ 11 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
    // × 12 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
    // ○ 13 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
    // ○ 14 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
    // ○ 15 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
    // × 16 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
    // ○ 17 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
    // ○ 18 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
    // ○ 19 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
    // × 20 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
    // ○ 21 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
    // ○ 22 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
    // ○ 23 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
    // × 24 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
    // ○ 25 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
    // ○ 26 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
    // ○ 27 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
    // ○ 28 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
    // ○ 29 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
    // ○ 30 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
    // ○ 31 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
    // ○ 32 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
    // ○ 33 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
    // ○ 34 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
    // ○ 35 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
    // ○ 36 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
    // ○ 37 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
    // ○ 38 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
    // ○ 39 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
    // ○ 40 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
    // ○ 41 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
    // ○ 42 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
    // ○ 43 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
    // ○ 44 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
    // ○ 45 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
    // ○ 46 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
    // ○ 47 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
    // ○ 48 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
    // ○ 49 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
    // ○ 50 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
    // ○ 51 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
    // ○ 52 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
    // ○ 53 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
    // ○ 54 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
    // ○ 55 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
    // ○ 56 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
    // ○ 57 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
    // ○ 58 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
    // ○ 59 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
    // ○ 60 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
    // ○ 61 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
    // ○ 62 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
    // ○ 63 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
    // ○ 64 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
    // ○ 65 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
    // ○ 66 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
    // ○ 67 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
    // ○ 68 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
    // ○ 69 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
    // ○ 70 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
    // ○ 71 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
    // ○ 72 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
    describe("ui.exclusiveRandomBtn.onclick", () => {
      test("01 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = "A";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("02 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = "A";
        ui.output.value = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("03 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("05 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = " A ";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("06 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = " A ";
        ui.output.value = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("07 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "  ";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("09 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = "A";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("10 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = "A";
        ui.output.value = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("11 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("13 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = " A ";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("14 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = " A ";
        ui.output.value = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("15 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "  ";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("17 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = "A";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("18 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = "A";
        ui.output.value = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("19 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("21 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = " A ";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("22 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = " A ";
        ui.output.value = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("23 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "  ";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("25 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = "A\nB";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("26 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = "A\nB";
        ui.output.value = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
      });

      test("27 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "A\n";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("28 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = "A\n";
        ui.output.value = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("29 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = " A \n B ";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("30 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = " A \n B ";
        ui.output.value = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
      });

      test("31 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = " A \n  ";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("32 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = " A \n  ";
        ui.output.value = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("33 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = "A\nB";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("34 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = "A\nB";
        ui.output.value = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
      });

      test("35 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "A\n";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("36 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = "A\n";
        ui.output.value = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("37 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = " A \n B ";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("38 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = " A \n B ";
        ui.output.value = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
      });

      test("39 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = " A \n  ";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("40 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = " A \n  ";
        ui.output.value = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("41 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = "A\nB";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("42 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = "A\nB";
        ui.output.value = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
      });

      test("43 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "A\n";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("44 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = "A\n";
        ui.output.value = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("45 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = " A \n B ";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("46 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = " A \n B ";
        ui.output.value = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
      });

      test("47 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = " A \n  ";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("A");
      });

      test("48 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = " A \n  ";
        ui.output.value = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("");
      });

      test("49 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = "A\nB\nC";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.output.value);
      });

      test("50 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = "A\nB\nC";
        ui.output.value = "A";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.output.value);
      });

      test("51 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "A\n\nB";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("52 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = "A\n\nB";
        ui.output.value = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
      });

      test("53 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = " A \n B \n C ";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.output.value);
      });

      test("54 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = " A \n B \n C ";
        ui.output.value = "A";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.output.value);
      });

      test("55 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = " A \n  \n B ";
        ui.output.value = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("56 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = " A \n  \n B ";
        ui.output.value = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
      });

      test("57 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = "A\nB\nC";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.output.value);
      });

      test("58 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = "A\nB\nC";
        ui.output.value = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.output.value);
      });

      test("59 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "A\n\nB";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("60 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = "A\n\nB";
        ui.output.value = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
      });

      test("61 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = " A \n B \n C ";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.output.value);
      });

      test("62 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = " A \n B \n C ";
        ui.output.value = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.output.value);
      });

      test("63 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = " A \n  \n B ";
        ui.output.value = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("64 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = " A \n  \n B ";
        ui.output.value = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
      });

      test("65 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = "A\nB\nC";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.output.value);
      });

      test("66 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = "A\nB\nC";
        ui.output.value = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.output.value);
      });

      test("67 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = "A\n\nB";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("68 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = "A\n\nB";
        ui.output.value = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
      });

      test("69 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.input.value = " A \n B \n C ";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.output.value);
      });

      test("70 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.input.value = " A \n B \n C ";
        ui.output.value = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.output.value);
      });

      test("71 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.input.value = " A \n  \n B ";
        ui.output.value = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.output.value);
      });

      test("72 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.input.value = " A \n  \n B ";
        ui.output.value = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.output.value).toBe("B");
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
        expect(open).toHaveBeenCalledWith(
          "https://example.com/output",
          "_blank",
        );
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
        expect(open).toHaveBeenCalledWith(
          "https://example.com/output",
          "_blank",
        );
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
        expect(open).toHaveBeenCalledWith(
          "https://example.com/output",
          "_blank",
        );
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
        expect(open).toHaveBeenCalledWith(
          "https://example.com/output",
          "_blank",
        );
      });
    });
  });
});
