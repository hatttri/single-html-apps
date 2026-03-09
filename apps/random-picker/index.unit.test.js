import { beforeEach, describe, expect, test, vi } from "vitest";
import fs from "fs";
import path from "path";

const html = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf8");

describe("Random Picker Unit Tests", () => {
  beforeEach(() => {
    // DOMのセットアップ
    document.body.innerHTML = html;

    // scriptタグの中身を抽出して実行
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      let scriptContent = scriptMatch[1];

      // 前のテストの残骸を掃除
      delete window.ui;

      // uiオブジェクトをwindowに紐付けて、テストからアクセス可能にする
      // 'const ui = {' を 'window.ui = {' に置換する
      scriptContent = scriptContent.replace("const ui = {", "window.ui = {");

      // 関数を明示的に window に紐付ける
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

      // 実行環境（window, document）を渡してスクリプトを実行
      try {
        const execute = new Function("window", "document", scriptContent);
        execute(window, document);
      } catch (e) {
        console.error("Script execution error:", e);
      }
    }

    // 初期化関数を直接呼ぶ（リスナーの重複を防ぐため）
    if (window.initApp) {
      window.initApp();
    }
  });

  describe("copyTextToClipboard", () => {
    test("指定したテキストをクリップボードにコピーする", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      await window.copyTextToClipboard("A\nB");

      expect(writeText).toHaveBeenCalledWith("A\nB");
    });
  });

  describe("normalizeItems", () => {
    test("空白なし／空行なし", () => {
      expect(window.normalizeItems(["A"])).toEqual(["A"]);
    });

    test("空白なし／空行あり", () => {
      expect(window.normalizeItems(["A", ""])).toEqual(["A"]);
    });

    test("空白あり／空行なし", () => {
      expect(window.normalizeItems([" A "])).toEqual(["A"]);
    });

    test("空白あり／空行あり", () => {
      expect(window.normalizeItems([" A ", "  "])).toEqual(["A"]);
    });
  });

  describe("openUrls: 3パターン", () => {
    test("0件", () => {
      const open = vi.fn();
      window.open = open;

      window.openUrls([]);

      expect(open).not.toHaveBeenCalled();
    });

    test("1件", () => {
      const open = vi.fn();
      window.open = open;

      window.openUrls(["https://example.com"]);

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });

    test("2件", () => {
      const open = vi.fn();
      window.open = open;

      window.openUrls(["https://example.net", "https://example.com"]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.net", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.com", "_blank");
    });
  });

  describe("parseItems", () => {
    // 8パターン網羅マトリクス (2^3 = 8)
    // 1. 行数 (split) : 単一 ・ 複数
    // 2. 空白 (trim)  : あり ・ なし
    // 3. 空行 (filter): あり ・ なし

    test("単一行／空白なし／空行なし", () => {
      expect(window.parseItems("A")).toEqual(["A"]);
    });

    test("単一行／空白なし／空行あり", () => {
      expect(window.parseItems("")).toEqual([]);
    });

    test("単一行／空白あり／空行なし", () => {
      expect(window.parseItems(" A ")).toEqual(["A"]);
    });

    test("単一行／空白あり／空行あり", () => {
      expect(window.parseItems("  ")).toEqual([]);
    });

    test("複数行／空白なし／空行なし", () => {
      expect(window.parseItems("A\nB")).toEqual(["A", "B"]);
    });

    test("複数行／空白なし／空行あり", () => {
      expect(window.parseItems("A\n")).toEqual(["A"]);
    });

    test("複数行／空白あり／空行なし", () => {
      expect(window.parseItems(" A \nB")).toEqual(["A", "B"]);
    });

    test("複数行／空白あり／空行あり", () => {
      expect(window.parseItems(" A \n  ")).toEqual(["A"]);
    });
  });

  describe("pickRandomItem", () => {
    test("候補なし", () => {
      expect(window.pickRandomItem([])).toBe("");
    });

    test("候補あり／試行100回", () => {
      const pool = ["A", "B", "C"];
      const expected = new Set(pool);
      const seen = new Set();
      const trials = 100;

      for (let i = 0; i < trials; i += 1) {
        seen.add(window.pickRandomItem(pool));
      }

      expect(seen).toEqual(expected);
    });
  });

  describe("removeExcludedItems: 3パターン", () => {
    test("0件", () => {
      expect(window.removeExcludedItems([], ["A"])).toEqual([]);
    });

    test("1件", () => {
      expect(window.removeExcludedItems(["A"], ["B"])).toEqual(["A"]);
    });

    test("2件", () => {
      expect(window.removeExcludedItems(["A", "B"], ["B", "C"])).toEqual(["A"]);
    });
  });

  describe("renderResult", () => {
    test("指定した要素にテキストが反映される", () => {
      const dummyDiv = document.createElement("div");
      window.renderResult(dummyDiv, "テスト結果");
      expect(dummyDiv.textContent).toBe("テスト結果");
    });
  });

  describe("initApp", () => {
    test("window.ui の各プロパティがDOM要素を正しく参照しているか", () => {
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

  describe("ui.inputCopyBtn.onclick", () => {
    test("入力あり", async () => {
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

  describe("ui.inputOpenBtn.onclick: 8パターン", () => {
    test("単一行／空白なし／空行なし", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.inputArea.value = "https://example.com";

      window.ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });

    test("単一行／空白なし／空行あり", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.inputArea.value = "";

      window.ui.inputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("単一行／空白あり／空行なし", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.inputArea.value = " https://example.com ";

      window.ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });

    test("単一行／空白あり／空行あり", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.inputArea.value = "  ";

      window.ui.inputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("複数行／空白なし／空行なし", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.inputArea.value = "https://example.com\nhttps://example.org";

      window.ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("複数行／空白なし／空行あり", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.inputArea.value = "https://example.com\n";

      window.ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });

    test("複数行／空白あり／空行なし", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.inputArea.value =
        " https://example.com \n https://example.org ";

      window.ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("複数行／空白あり／空行あり", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.inputArea.value = " https://example.com \n  ";

      window.ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });
  });

  describe("ui.fullRandomBtn.onclick: 8パターン", () => {
    // 入力なし／表示なし／入力文字列内に表示文字列なし（論理的に存在しないため未実装）

    test("入力なし／表示なし／入力文字列内に表示文字列あり", () => {
      window.ui.inputArea.value = "";
      window.ui.resultDisplay.textContent = "";
      window.ui.fullRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    test("入力なし／表示あり／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "";
      window.ui.resultDisplay.textContent = "Z";
      window.ui.fullRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    // 入力なし／表示あり／入力文字列内に表示文字列あり（論理的に存在しないため未実装）

    test("入力あり／表示なし／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "";
      window.ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("入力あり／表示なし／入力文字列内に表示文字列あり", () => {
      window.ui.inputArea.value = "A\n\nB\nC";
      window.ui.resultDisplay.textContent = "";
      window.ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("入力あり／表示あり／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "Z";
      window.ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("入力あり／表示あり／入力文字列内に表示文字列あり", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "A";
      window.ui.fullRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });
  });

  describe("ui.exclusiveRandomBtn.onclick: 8パターン", () => {
    // 入力なし／表示なし／入力文字列内に表示文字列なし（論理的に存在しないため未実装）

    test("入力なし／表示なし／入力文字列内に表示文字列あり", () => {
      window.ui.inputArea.value = "";
      window.ui.resultDisplay.textContent = "";
      window.ui.exclusiveRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    test("入力なし／表示あり／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "";
      window.ui.resultDisplay.textContent = "Z";
      window.ui.exclusiveRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    // 入力なし／表示あり／入力文字列内に表示文字列あり（論理的に存在しないため未実装）

    test("入力あり／表示なし／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "";
      window.ui.exclusiveRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("入力あり／表示なし／入力文字列内に表示文字列あり", () => {
      window.ui.inputArea.value = "A\n\nB\nC";
      window.ui.resultDisplay.textContent = "";
      window.ui.exclusiveRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("入力あり／表示あり／入力文字列内に表示文字列なし", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "Z";
      window.ui.exclusiveRandomBtn.click();
      expect(["A", "B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });

    test("入力あり／表示あり／入力文字列内に表示文字列あり", () => {
      window.ui.inputArea.value = "A\nB\nC";
      window.ui.resultDisplay.textContent = "A";
      window.ui.exclusiveRandomBtn.click();
      expect(["B", "C"]).toContain(window.ui.resultDisplay.textContent);
    });
  });

  describe("ui.resultCopyBtn.onclick: 2パターン", () => {
    test("表示なし", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      window.ui.resultDisplay.textContent = "";
      await window.ui.resultCopyBtn.click();

      expect(writeText).toHaveBeenCalledWith("");
    });

    test("表示あり", async () => {
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

  describe("ui.resultOpenBtn.onclick: 2パターン", () => {
    test("表示なし", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.resultDisplay.textContent = "";

      window.ui.resultOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("表示あり", () => {
      const open = vi.fn();
      window.open = open;
      window.ui.resultDisplay.textContent = "https://example.com/result";

      window.ui.resultOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com/result", "_blank");
    });
  });
});
