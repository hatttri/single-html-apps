import { beforeEach, describe, expect, test, vi } from "vitest";
import fs from "fs";
import path from "path";

const html = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf8");

describe("Random Picker Integration Tests", () => {
  beforeEach(() => {
    document.body.innerHTML = html;

    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      let scriptContent = scriptMatch[1];

      delete window.ui;

      scriptContent = scriptContent.replace("const ui = {", "window.ui = {");

      scriptContent += `
        window.copyTextToClipboard = copyTextToClipboard;
        window.normalizeItems = normalizeItems;
        window.openUrls = openUrls;
        window.parseItems = parseItems;
        window.pickRandomItem = pickRandomItem;
        window.removeExcludedItems = removeExcludedItems;
        window.renderResult = renderResult;
        window.initApp = initApp;
      `;

      try {
        const execute = new Function("window", "document", scriptContent);
        execute(window, document);
      } catch (e) {
        console.error("Script execution error:", e);
      }
    }

    if (window.initApp) {
      window.initApp();
    }
  });

  describe("initApp", () => {
    test("ui", () => {
      expect(window.ui.inputArea.id).toBe("itemsInput");
      expect(window.ui.inputCopyBtn.id).toBe("inputCopyBtn");
      expect(window.ui.inputOpenBtn.id).toBe("inputOpenBtn");
      expect(window.ui.fullRandomBtn.id).toBe("fullRandomBtn");
      expect(window.ui.exclusiveRandomBtn.id).toBe("exclusiveRandomBtn");
      expect(window.ui.resultDisplay.id).toBe("result");
      expect(window.ui.resultCopyBtn.id).toBe("resultCopyBtn");
      expect(window.ui.resultOpenBtn.id).toBe("resultOpenBtn");
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

      window.ui.inputArea.value = "";
      await window.ui.inputCopyBtn.click();

      expect(writeText).toHaveBeenCalledWith("");
    });

    test("02 文字数≧１文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      window.ui.inputArea.value = "A\nB";
      await window.ui.inputCopyBtn.click();

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
      window.ui.inputArea.value = " https://example.com ";

      window.ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });

    test("02 行数＝１行／無効行あり", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.inputArea.value = "  ";

      window.ui.inputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("03 行数≧２行／無効行なし", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.inputArea.value =
        " https://example.com \n https://example.org ";

      window.ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("04 行数≧２行／無効行あり", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.inputArea.value = " https://example.com \n  ";

      window.ui.inputOpenBtn.click();

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
      window.ui.inputArea.value = "";
      window.ui.resultDisplay.textContent = "";
      window.ui.fullRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    test("03 入力なし／表示あり／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "";
      window.ui.resultDisplay.textContent = "Z";
      window.ui.fullRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    test("05 入力あり／表示なし／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "";
      window.ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("06 入力あり／表示なし／入力文字列内に表示文字列あり", () => {
      window.ui.inputArea.value = "A\n\nB\nC";
      window.ui.resultDisplay.textContent = "";
      window.ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("07 入力あり／表示あり／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "Z";
      window.ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("08 入力あり／表示あり／入力文字列内に表示文字列あり", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "A";
      window.ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
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
  describe("ui.exclusiveRandomBtn.onclick", () => {
    test("02 入力なし／表示なし／入力文字列内に表示文字列あり", () => {
      window.ui.inputArea.value = "";
      window.ui.resultDisplay.textContent = "";
      window.ui.exclusiveRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    test("03 入力なし／表示あり／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "";
      window.ui.resultDisplay.textContent = "Z";
      window.ui.exclusiveRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    test("05 入力あり／表示なし／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "";
      window.ui.exclusiveRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("06 入力あり／表示なし／入力文字列内に表示文字列あり", () => {
      window.ui.inputArea.value = "A\n\nB\nC";
      window.ui.resultDisplay.textContent = "";
      window.ui.exclusiveRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("07 入力あり／表示あり／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "Z";
      window.ui.exclusiveRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("08 入力あり／表示あり／入力文字列内に表示文字列あり", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "A";
      window.ui.exclusiveRandomBtn.click();
      expect(["B", "C"]).toContain(window.ui.resultDisplay.textContent);
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

      window.ui.resultDisplay.textContent = "";
      await window.ui.resultCopyBtn.click();

      expect(writeText).toHaveBeenCalledWith("");
    });

    test("02 文字数≧１文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      window.ui.resultDisplay.textContent = "表示テキスト";
      await window.ui.resultCopyBtn.click();

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
      window.ui.resultDisplay.textContent = " https://example.com/result ";

      window.ui.resultOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com/result", "_blank");
    });

    test("02 行数＝１行／無効行あり", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.resultDisplay.textContent = "  ";

      window.ui.resultOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("03 行数≧２行／無効行なし", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.resultDisplay.textContent =
        " https://example.com/result \n https://example.org/result ";

      window.ui.resultOpenBtn.click();

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
      window.ui.resultDisplay.textContent = " https://example.com/result \n  ";

      window.ui.resultOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com/result", "_blank");
    });
  });
});
