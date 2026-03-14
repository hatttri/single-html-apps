import { beforeEach, describe, expect, test, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createUi, initApp } from "../src/script.ts";

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

  // パターン整理
  // 01. HTML要素のテスト
  //
  // パターン一覧
  // ○ 01 HTML要素のテスト
  describe("createUi", () => {
    test("01 HTML要素のテスト", () => {
      const createdUi = createUi();

      expect(createdUi.inputArea).toBe(document.getElementById("itemsInput"));
      expect(createdUi.inputArea.tagName).toBe("TEXTAREA");

      expect(createdUi.inputCopyBtn).toBe(
        document.getElementById("inputCopyBtn"),
      );
      expect(createdUi.inputCopyBtn.tagName).toBe("BUTTON");

      expect(createdUi.inputOpenBtn).toBe(
        document.getElementById("inputOpenBtn"),
      );
      expect(createdUi.inputOpenBtn.tagName).toBe("BUTTON");

      expect(createdUi.fullRandomBtn).toBe(
        document.getElementById("fullRandomBtn"),
      );
      expect(createdUi.fullRandomBtn.tagName).toBe("BUTTON");

      expect(createdUi.exclusiveRandomBtn).toBe(
        document.getElementById("exclusiveRandomBtn"),
      );
      expect(createdUi.exclusiveRandomBtn.tagName).toBe("BUTTON");

      expect(createdUi.outputDisplay).toBe(document.getElementById("output"));
      expect(createdUi.outputDisplay.tagName).toBe("DIV");

      expect(createdUi.outputCopyBtn).toBe(
        document.getElementById("outputCopyBtn"),
      );
      expect(createdUi.outputCopyBtn.tagName).toBe("BUTTON");

      expect(createdUi.outputOpenBtn).toBe(
        document.getElementById("outputOpenBtn"),
      );
      expect(createdUi.outputOpenBtn.tagName).toBe("BUTTON");
    });
  });

  // describe("getElementByIdOrThrow", () => {});

  describe("initApp", () => {
    let ui: ReturnType<typeof initApp>;

    beforeEach(() => {
      ui = initApp();
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

        ui.inputArea.value = "";
        await ui.inputCopyBtn.click();

        expect(writeText).toHaveBeenCalledWith("");
      });

      test("02 文字数≧１文字", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(window.navigator, "clipboard", {
          configurable: true,
          value: { writeText },
        });

        ui.inputArea.value = "A\nB";
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
        ui.inputArea.value = "https://example.com";

        ui.inputOpenBtn.click();

        expect(open).toHaveBeenCalledTimes(1);
        expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
      });

      test("02 行数＝１行／前後空白なし／無効行あり", () => {
        const open = vi.fn<typeof window.open>(() => null);
        window.open = open;
        ui.inputArea.value = "";

        ui.inputOpenBtn.click();

        expect(open).not.toHaveBeenCalled();
      });

      test("03 行数＝１行／前後空白あり／無効行なし", () => {
        const open = vi.fn<typeof window.open>(() => null);
        window.open = open;
        ui.inputArea.value = " https://example.com ";

        ui.inputOpenBtn.click();

        expect(open).toHaveBeenCalledTimes(1);
        expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
      });

      test("04 行数＝１行／前後空白あり／無効行あり", () => {
        const open = vi.fn<typeof window.open>(() => null);
        window.open = open;
        ui.inputArea.value = "  ";

        ui.inputOpenBtn.click();

        expect(open).not.toHaveBeenCalled();
      });

      test("05 行数≧２行／前後空白なし／無効行なし", () => {
        const open = vi.fn<typeof window.open>(() => null);
        window.open = open;
        ui.inputArea.value = "https://example.com\nhttps://example.org";

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
        ui.inputArea.value = "https://example.com\n";

        ui.inputOpenBtn.click();

        expect(open).toHaveBeenCalledTimes(1);
        expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
      });

      test("07 行数≧２行／前後空白あり／無効行なし", () => {
        const open = vi.fn<typeof window.open>(() => null);
        window.open = open;
        ui.inputArea.value = " https://example.com \n https://example.org ";

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
        ui.inputArea.value = " https://example.com \n  ";

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
        ui.inputArea.value = "A";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("02 入力行数＝１行／前後空白なし／無効行あり", () => {
        ui.inputArea.value = "";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("03 入力行数＝１行／前後空白あり／無効行なし", () => {
        ui.inputArea.value = " A ";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("04 入力行数＝１行／前後空白あり／無効行あり", () => {
        ui.inputArea.value = "  ";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("05 入力行数＝２行／前後空白なし／無効行なし", () => {
        ui.inputArea.value = "A\nB";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("06 入力行数＝２行／前後空白なし／無効行あり", () => {
        ui.inputArea.value = "A\n";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("07 入力行数＝２行／前後空白あり／無効行なし", () => {
        ui.inputArea.value = " A \n B ";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("08 入力行数＝２行／前後空白あり／無効行あり", () => {
        ui.inputArea.value = " A \n  ";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("09 入力行数≧３行／前後空白なし／無効行なし", () => {
        ui.inputArea.value = "A\nB\nC";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("10 入力行数≧３行／前後空白なし／無効行あり", () => {
        ui.inputArea.value = "A\n\nB";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("11 入力行数≧３行／前後空白あり／無効行なし", () => {
        ui.inputArea.value = " A \n B \n C ";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("12 入力行数≧３行／前後空白あり／無効行あり", () => {
        ui.inputArea.value = " A \n  \n B ";
        ui.outputDisplay.textContent = "OLD";

        ui.fullRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
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
        ui.inputArea.value = "A";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("02 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A";
        ui.outputDisplay.textContent = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("03 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("05 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A ";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("06 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A ";
        ui.outputDisplay.textContent = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("07 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "  ";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("09 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("10 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A";
        ui.outputDisplay.textContent = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("11 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("13 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A ";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("14 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A ";
        ui.outputDisplay.textContent = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("15 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "  ";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("17 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("18 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A";
        ui.outputDisplay.textContent = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("19 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("21 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A ";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("22 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A ";
        ui.outputDisplay.textContent = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("23 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "  ";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("25 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\nB";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("26 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\nB";
        ui.outputDisplay.textContent = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
      });

      test("27 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\n";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("28 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\n";
        ui.outputDisplay.textContent = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("29 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n B ";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("30 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n B ";
        ui.outputDisplay.textContent = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
      });

      test("31 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n  ";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("32 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n  ";
        ui.outputDisplay.textContent = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("33 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\nB";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("34 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\nB";
        ui.outputDisplay.textContent = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
      });

      test("35 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\n";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("36 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\n";
        ui.outputDisplay.textContent = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("37 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n B ";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("38 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n B ";
        ui.outputDisplay.textContent = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
      });

      test("39 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n  ";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("40 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n  ";
        ui.outputDisplay.textContent = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("41 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\nB";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("42 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\nB";
        ui.outputDisplay.textContent = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
      });

      test("43 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\n";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("44 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\n";
        ui.outputDisplay.textContent = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("45 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n B ";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("46 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n B ";
        ui.outputDisplay.textContent = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
      });

      test("47 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n  ";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("A");
      });

      test("48 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n  ";
        ui.outputDisplay.textContent = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("");
      });

      test("49 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\nB\nC";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("50 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\nB\nC";
        ui.outputDisplay.textContent = "A";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("51 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\n\nB";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("52 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\n\nB";
        ui.outputDisplay.textContent = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
      });

      test("53 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n B \n C ";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("54 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n B \n C ";
        ui.outputDisplay.textContent = "A";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("55 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n  \n B ";
        ui.outputDisplay.textContent = "X";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("56 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n  \n B ";
        ui.outputDisplay.textContent = "A";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
      });

      test("57 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\nB\nC";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("58 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\nB\nC";
        ui.outputDisplay.textContent = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("59 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\n\nB";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("60 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\n\nB";
        ui.outputDisplay.textContent = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
      });

      test("61 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n B \n C ";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("62 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n B \n C ";
        ui.outputDisplay.textContent = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("63 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n  \n B ";
        ui.outputDisplay.textContent = "X\nY";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("64 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n  \n B ";
        ui.outputDisplay.textContent = "A\nX";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
      });

      test("65 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\nB\nC";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("66 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\nB\nC";
        ui.outputDisplay.textContent = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("67 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = "A\n\nB";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("68 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = "A\n\nB";
        ui.outputDisplay.textContent = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
      });

      test("69 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n B \n C ";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("70 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n B \n C ";
        ui.outputDisplay.textContent = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(["B", "C"]).toContain(ui.outputDisplay.textContent);
      });

      test("71 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", () => {
        ui.inputArea.value = " A \n  \n B ";
        ui.outputDisplay.textContent = "X\nY\nZ";

        ui.exclusiveRandomBtn.click();

        expect(["A", "B"]).toContain(ui.outputDisplay.textContent);
      });

      test("72 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", () => {
        ui.inputArea.value = " A \n  \n B ";
        ui.outputDisplay.textContent = "A\nX\nY";

        ui.exclusiveRandomBtn.click();

        expect(ui.outputDisplay.textContent).toBe("B");
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

        ui.outputDisplay.textContent = "";
        await ui.outputCopyBtn.click();

        expect(writeText).toHaveBeenCalledWith("");
      });

      test("02 文字数≧１文字", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(window.navigator, "clipboard", {
          configurable: true,
          value: { writeText },
        });

        ui.outputDisplay.textContent = "出力テキスト";
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
        ui.outputDisplay.textContent = "https://example.com/output";

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
        ui.outputDisplay.textContent = "";

        ui.outputOpenBtn.click();

        expect(open).not.toHaveBeenCalled();
      });

      test("03 行数＝１行／前後空白あり／無効行なし", () => {
        const open = vi.fn<typeof window.open>(() => null);
        window.open = open;
        ui.outputDisplay.textContent = " https://example.com/output ";

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
        ui.outputDisplay.textContent = "  ";

        ui.outputOpenBtn.click();

        expect(open).not.toHaveBeenCalled();
      });

      test("05 行数≧２行／前後空白なし／無効行なし", () => {
        const open = vi.fn<typeof window.open>(() => null);
        window.open = open;
        ui.outputDisplay.textContent =
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
        ui.outputDisplay.textContent = "https://example.com/output\n";

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
        ui.outputDisplay.textContent =
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
        ui.outputDisplay.textContent = " https://example.com/output \n  ";

        ui.outputOpenBtn.click();

        expect(open).toHaveBeenCalledTimes(1);
        expect(open).toHaveBeenCalledWith(
          "https://example.com/output",
          "_blank",
        );
      });
    });
  });

  // describe("renderOutput", () => {});
});
