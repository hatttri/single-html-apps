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
  let ui;

  beforeEach(() => {
    document.body.innerHTML = bodyHtml;
    ui = initApp();
  });
  describe("initApp", () => {
    test("ui", () => {
      expect(ui.inputArea.id).toBe("itemsInput");
      expect(ui.inputCopyBtn.id).toBe("inputCopyBtn");
      expect(ui.inputOpenBtn.id).toBe("inputOpenBtn");
      expect(ui.fullRandomBtn.id).toBe("fullRandomBtn");
      expect(ui.exclusiveRandomBtn.id).toBe("exclusiveRandomBtn");
      expect(ui.resultDisplay.id).toBe("result");
      expect(ui.resultCopyBtn.id).toBe("resultCopyBtn");
      expect(ui.resultOpenBtn.id).toBe("resultOpenBtn");
    });
  });

  // パターン整理
  // 01. 文字数＝０文字／≧１文字
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
  // 01. 行数＝１行／≧２行
  // 02. 無効行なし／あり
  //
  // パターン一覧
  // ○ 01 行数＝１行／無効行なし
  // ○ 02 行数＝１行／無効行あり
  // ○ 03 行数≧２行／無効行なし
  // ○ 04 行数≧２行／無効行あり
  describe("ui.inputOpenBtn.onclick", () => {
    test("01 行数＝１行／無効行なし", () => {
      const open = vi.fn();
      window.open = open;
      ui.inputArea.value = " https://example.com ";

      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });

    test("02 行数＝１行／無効行あり", () => {
      const open = vi.fn();
      window.open = open;
      ui.inputArea.value = "  ";

      ui.inputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("03 行数≧２行／無効行なし", () => {
      const open = vi.fn();
      window.open = open;
      ui.inputArea.value = " https://example.com \n https://example.org ";

      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("04 行数≧２行／無効行あり", () => {
      const open = vi.fn();
      window.open = open;
      ui.inputArea.value = " https://example.com \n  ";

      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });
  });

  // パターン整理
  // 01. 入力なし／あり
  // 02. 表示なし／あり
  // 03. 入力文字列内に表示文字列なし／あり
  //
  // パターン一覧
  // × 01 入力なし／表示なし／入力文字列内に表示文字列なし
  // ○ 02 入力なし／表示なし／入力文字列内に表示文字列あり
  // ○ 03 入力なし／表示あり／入力文字列内に表示文字列なし
  // × 04 入力なし／表示あり／入力文字列内に表示文字列あり
  // ○ 05 入力あり／表示なし／入力文字列内に表示文字列なし
  // ○ 06 入力あり／表示なし／入力文字列内に表示文字列あり
  // ○ 07 入力あり／表示あり／入力文字列内に表示文字列なし
  // ○ 08 入力あり／表示あり／入力文字列内に表示文字列あり
  describe("ui.fullRandomBtn.onclick", () => {
    test("02 入力なし／表示なし／入力文字列内に表示文字列あり", () => {
      ui.inputArea.value = "";
      ui.resultDisplay.textContent = "";
      ui.fullRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("03 入力なし／表示あり／入力文字列内に表示文字列なし", () => {
      ui.inputArea.value = "";
      ui.resultDisplay.textContent = "Z";
      ui.fullRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("05 入力あり／表示なし／入力文字列内に表示文字列なし", () => {
      ui.inputArea.value = "A\nB\nC";
      ui.resultDisplay.textContent = "";
      ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(ui.resultDisplay.textContent);
    });

    test("06 入力あり／表示なし／入力文字列内に表示文字列あり", () => {
      ui.inputArea.value = "A\n\nB\nC";
      ui.resultDisplay.textContent = "";
      ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(ui.resultDisplay.textContent);
    });

    test("07 入力あり／表示あり／入力文字列内に表示文字列なし", () => {
      ui.inputArea.value = "A\nB\nC";
      ui.resultDisplay.textContent = "Z";
      ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(ui.resultDisplay.textContent);
    });

    test("08 入力あり／表示あり／入力文字列内に表示文字列あり", () => {
      ui.inputArea.value = "A\nB\nC";
      ui.resultDisplay.textContent = "A";
      ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(ui.resultDisplay.textContent);
    });
  });

  // パターン整理
  // 01. 入力行数＝１行／≧２行
  // 02. 入力無効行なし／あり
  // 03. 表示行数＝１行／≧２行
  // 04. 表示無効行なし／あり
  // 05. 共通行なし／あり
  //
  // パターン一覧
  // ○ 01 入力行数＝１行／入力無効行なし／表示行数＝１行／表示無効行なし／共通行なし 入力=["A"]／表示=["X"]
  // ○ 02 入力行数＝１行／入力無効行なし／表示行数＝１行／表示無効行なし／共通行あり 入力=["A"]／表示=["A"]
  // ○ 03 入力行数＝１行／入力無効行なし／表示行数＝１行／表示無効行あり／共通行なし 入力=["A"]／表示=[""]
  // × 04 入力行数＝１行／入力無効行なし／表示行数＝１行／表示無効行あり／共通行あり
  // ○ 05 入力行数＝１行／入力無効行なし／表示行数≧２行／表示無効行なし／共通行なし 入力=["A"]／表示=["X","Y"]
  // ○ 06 入力行数＝１行／入力無効行なし／表示行数≧２行／表示無効行なし／共通行あり 入力=["A"]／表示=["A","X"]
  // ○ 07 入力行数＝１行／入力無効行なし／表示行数≧２行／表示無効行あり／共通行なし 入力=["A"]／表示=["X",""]
  // ○ 08 入力行数＝１行／入力無効行なし／表示行数≧２行／表示無効行あり／共通行あり 入力=["A"]／表示=["A",""]
  // ○ 09 入力行数＝１行／入力無効行あり／表示行数＝１行／表示無効行なし／共通行なし 入力=[""]／表示=["X"]
  // × 10 入力行数＝１行／入力無効行あり／表示行数＝１行／表示無効行なし／共通行あり
  // ○ 11 入力行数＝１行／入力無効行あり／表示行数＝１行／表示無効行あり／共通行なし 入力=[""]／表示=[" "]
  // ○ 12 入力行数＝１行／入力無効行あり／表示行数＝１行／表示無効行あり／共通行あり 入力=[""]／表示=[""]
  // ○ 13 入力行数＝１行／入力無効行あり／表示行数≧２行／表示無効行なし／共通行なし 入力=[""]／表示=["X","Y"]
  // × 14 入力行数＝１行／入力無効行あり／表示行数≧２行／表示無効行なし／共通行あり
  // ○ 15 入力行数＝１行／入力無効行あり／表示行数≧２行／表示無効行あり／共通行なし 入力=[""]／表示=["X"," "]
  // ○ 16 入力行数＝１行／入力無効行あり／表示行数≧２行／表示無効行あり／共通行あり 入力=[""]／表示=["X",""]
  // ○ 17 入力行数≧２行／入力無効行なし／表示行数＝１行／表示無効行なし／共通行なし 入力=["A","B"]／表示=["X"]
  // ○ 18 入力行数≧２行／入力無効行なし／表示行数＝１行／表示無効行なし／共通行あり 入力=["A","B"]／表示=["A"]
  // ○ 19 入力行数≧２行／入力無効行なし／表示行数＝１行／表示無効行あり／共通行なし 入力=["A","B"]／表示=[""]
  // × 20 入力行数≧２行／入力無効行なし／表示行数＝１行／表示無効行あり／共通行あり
  // ○ 21 入力行数≧２行／入力無効行なし／表示行数≧２行／表示無効行なし／共通行なし 入力=["A","B"]／表示=["X","Y"]
  // ○ 22 入力行数≧２行／入力無効行なし／表示行数≧２行／表示無効行なし／共通行あり 入力=["A","B"]／表示=["A","X"]
  // ○ 23 入力行数≧２行／入力無効行なし／表示行数≧２行／表示無効行あり／共通行なし 入力=["A","B"]／表示=["X",""]
  // ○ 24 入力行数≧２行／入力無効行なし／表示行数≧２行／表示無効行あり／共通行あり 入力=["A","B"]／表示=["A",""]
  // ○ 25 入力行数≧２行／入力無効行あり／表示行数＝１行／表示無効行なし／共通行なし 入力=["A",""]／表示=["X"]
  // ○ 26 入力行数≧２行／入力無効行あり／表示行数＝１行／表示無効行なし／共通行あり 入力=["A",""]／表示=["A"]
  // ○ 27 入力行数≧２行／入力無効行あり／表示行数＝１行／表示無効行あり／共通行なし 入力=["A",""]／表示=[" "]
  // ○ 28 入力行数≧２行／入力無効行あり／表示行数＝１行／表示無効行あり／共通行あり 入力=["A",""]／表示=[""]
  // ○ 29 入力行数≧２行／入力無効行あり／表示行数≧２行／表示無効行なし／共通行なし 入力=["A",""]／表示=["X","Y"]
  // ○ 30 入力行数≧２行／入力無効行あり／表示行数≧２行／表示無効行なし／共通行あり 入力=["A",""]／表示=["A","X"]
  // ○ 31 入力行数≧２行／入力無効行あり／表示行数≧２行／表示無効行あり／共通行なし 入力=["A",""]／表示=["X"," "]
  // ○ 32 入力行数≧２行／入力無効行あり／表示行数≧２行／表示無効行あり／共通行あり 入力=["A",""]／表示=["A",""]
  describe("ui.exclusiveRandomBtn.onclick", () => {
    test("01 入力行数＝１行／入力無効行なし／表示行数＝１行／表示無効行なし／共通行なし", () => {
      ui.inputArea.value = "A";
      ui.resultDisplay.textContent = "X";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("A");
    });

    test("02 入力行数＝１行／入力無効行なし／表示行数＝１行／表示無効行なし／共通行あり", () => {
      ui.inputArea.value = "A";
      ui.resultDisplay.textContent = "A";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("03 入力行数＝１行／入力無効行なし／表示行数＝１行／表示無効行あり／共通行なし", () => {
      ui.inputArea.value = "A";
      ui.resultDisplay.textContent = "";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("A");
    });

    test("05 入力行数＝１行／入力無効行なし／表示行数≧２行／表示無効行なし／共通行なし", () => {
      ui.inputArea.value = "A";
      ui.resultDisplay.textContent = "X\nY";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("A");
    });

    test("06 入力行数＝１行／入力無効行なし／表示行数≧２行／表示無効行なし／共通行あり", () => {
      ui.inputArea.value = "A";
      ui.resultDisplay.textContent = "A\nX";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("07 入力行数＝１行／入力無効行なし／表示行数≧２行／表示無効行あり／共通行なし", () => {
      ui.inputArea.value = "A";
      ui.resultDisplay.textContent = "X\n";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("A");
    });

    test("08 入力行数＝１行／入力無効行なし／表示行数≧２行／表示無効行あり／共通行あり", () => {
      ui.inputArea.value = "A";
      ui.resultDisplay.textContent = "A\n";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("09 入力行数＝１行／入力無効行あり／表示行数＝１行／表示無効行なし／共通行なし", () => {
      ui.inputArea.value = "";
      ui.resultDisplay.textContent = "X";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("11 入力行数＝１行／入力無効行あり／表示行数＝１行／表示無効行あり／共通行なし", () => {
      ui.inputArea.value = "";
      ui.resultDisplay.textContent = " ";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("12 入力行数＝１行／入力無効行あり／表示行数＝１行／表示無効行あり／共通行あり", () => {
      ui.inputArea.value = "";
      ui.resultDisplay.textContent = "";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("13 入力行数＝１行／入力無効行あり／表示行数≧２行／表示無効行なし／共通行なし", () => {
      ui.inputArea.value = "";
      ui.resultDisplay.textContent = "X\nY";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("15 入力行数＝１行／入力無効行あり／表示行数≧２行／表示無効行あり／共通行なし", () => {
      ui.inputArea.value = "";
      ui.resultDisplay.textContent = "X\n ";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("16 入力行数＝１行／入力無効行あり／表示行数≧２行／表示無効行あり／共通行あり", () => {
      ui.inputArea.value = "";
      ui.resultDisplay.textContent = "X\n";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("17 入力行数≧２行／入力無効行なし／表示行数＝１行／表示無効行なし／共通行なし", () => {
      ui.inputArea.value = "A\nB";
      ui.resultDisplay.textContent = "X";
      ui.exclusiveRandomBtn.click();
      expect(["A", "B"]).toContain(ui.resultDisplay.textContent);
    });

    test("18 入力行数≧２行／入力無効行なし／表示行数＝１行／表示無効行なし／共通行あり", () => {
      ui.inputArea.value = "A\nB";
      ui.resultDisplay.textContent = "A";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("B");
    });

    test("19 入力行数≧２行／入力無効行なし／表示行数＝１行／表示無効行あり／共通行なし", () => {
      ui.inputArea.value = "A\nB";
      ui.resultDisplay.textContent = "";
      ui.exclusiveRandomBtn.click();
      expect(["A", "B"]).toContain(ui.resultDisplay.textContent);
    });

    test("21 入力行数≧２行／入力無効行なし／表示行数≧２行／表示無効行なし／共通行なし", () => {
      ui.inputArea.value = "A\nB";
      ui.resultDisplay.textContent = "X\nY";
      ui.exclusiveRandomBtn.click();
      expect(["A", "B"]).toContain(ui.resultDisplay.textContent);
    });

    test("22 入力行数≧２行／入力無効行なし／表示行数≧２行／表示無効行なし／共通行あり", () => {
      ui.inputArea.value = "A\nB";
      ui.resultDisplay.textContent = "A\nX";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("B");
    });

    test("23 入力行数≧２行／入力無効行なし／表示行数≧２行／表示無効行あり／共通行なし", () => {
      ui.inputArea.value = "A\nB";
      ui.resultDisplay.textContent = "X\n";
      ui.exclusiveRandomBtn.click();
      expect(["A", "B"]).toContain(ui.resultDisplay.textContent);
    });

    test("24 入力行数≧２行／入力無効行なし／表示行数≧２行／表示無効行あり／共通行あり", () => {
      ui.inputArea.value = "A\nB";
      ui.resultDisplay.textContent = "A\n";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("B");
    });

    test("25 入力行数≧２行／入力無効行あり／表示行数＝１行／表示無効行なし／共通行なし", () => {
      ui.inputArea.value = "A\n";
      ui.resultDisplay.textContent = "X";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("A");
    });

    test("26 入力行数≧２行／入力無効行あり／表示行数＝１行／表示無効行なし／共通行あり", () => {
      ui.inputArea.value = "A\n";
      ui.resultDisplay.textContent = "A";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("27 入力行数≧２行／入力無効行あり／表示行数＝１行／表示無効行あり／共通行なし", () => {
      ui.inputArea.value = "A\n";
      ui.resultDisplay.textContent = " ";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("A");
    });

    test("28 入力行数≧２行／入力無効行あり／表示行数＝１行／表示無効行あり／共通行あり", () => {
      ui.inputArea.value = "A\n";
      ui.resultDisplay.textContent = "";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("A");
    });

    test("29 入力行数≧２行／入力無効行あり／表示行数≧２行／表示無効行なし／共通行なし", () => {
      ui.inputArea.value = "A\n";
      ui.resultDisplay.textContent = "X\nY";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("A");
    });

    test("30 入力行数≧２行／入力無効行あり／表示行数≧２行／表示無効行なし／共通行あり", () => {
      ui.inputArea.value = "A\n";
      ui.resultDisplay.textContent = "A\nX";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });

    test("31 入力行数≧２行／入力無効行あり／表示行数≧２行／表示無効行あり／共通行なし", () => {
      ui.inputArea.value = "A\n";
      ui.resultDisplay.textContent = "X\n ";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("A");
    });

    test("32 入力行数≧２行／入力無効行あり／表示行数≧２行／表示無効行あり／共通行あり", () => {
      ui.inputArea.value = "A\n";
      ui.resultDisplay.textContent = "A\n";
      ui.exclusiveRandomBtn.click();
      expect(ui.resultDisplay.textContent).toBe("");
    });
  });

  // パターン整理
  // 01. 文字数＝０文字／≧１文字
  //
  // パターン一覧
  // ○ 01 文字数＝０文字
  // ○ 02 文字数≧１文字
  describe("ui.resultCopyBtn.onclick", () => {
    test("01 文字数＝０文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.resultDisplay.textContent = "";
      await ui.resultCopyBtn.click();

      expect(writeText).toHaveBeenCalledWith("");
    });

    test("02 文字数≧１文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.resultDisplay.textContent = "表示テキスト";
      await ui.resultCopyBtn.click();

      expect(writeText).toHaveBeenCalledWith("表示テキスト");
    });
  });

  // パターン整理
  // 01. 行数＝１行／≧２行
  // 02. 無効行なし／あり
  //
  // パターン一覧
  // ○ 01 行数＝１行／無効行なし
  // ○ 02 行数＝１行／無効行あり
  // ○ 03 行数≧２行／無効行なし
  // ○ 04 行数≧２行／無効行あり
  describe("ui.resultOpenBtn.onclick", () => {
    test("01 行数＝１行／無効行なし", () => {
      const open = vi.fn();
      window.open = open;
      ui.resultDisplay.textContent = " https://example.com/result ";

      ui.resultOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com/result", "_blank");
    });

    test("02 行数＝１行／無効行あり", () => {
      const open = vi.fn();
      window.open = open;
      ui.resultDisplay.textContent = "  ";

      ui.resultOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("03 行数≧２行／無効行なし", () => {
      const open = vi.fn();
      window.open = open;
      ui.resultDisplay.textContent =
        " https://example.com/result \n https://example.org/result ";

      ui.resultOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(
        1,
        "https://example.com/result",
        "_blank",
      );
      expect(open).toHaveBeenNthCalledWith(
        2,
        "https://example.org/result",
        "_blank",
      );
    });

    test("04 行数≧２行／無効行あり", () => {
      const open = vi.fn();
      window.open = open;
      ui.resultDisplay.textContent = " https://example.com/result \n  ";

      ui.resultOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com/result", "_blank");
    });
  });
});
