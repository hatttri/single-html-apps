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

  // パターン整理
  // 01. 文字数＝０文字／≧１文字
  //
  // パターン一覧
  // ○ 01 文字数＝０文字
  // ○ 02 文字数≧１文字
  describe("copyTextToClipboard", () => {
    test("01 文字数＝０文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      await window.copyTextToClipboard("");

      expect(writeText).toHaveBeenCalledWith("");
    });

    test("02 文字数≧１文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      await window.copyTextToClipboard("A");

      expect(writeText).toHaveBeenCalledWith("A");
    });
  });
  // パターン整理
  // 01. 要素数＝０件／＝１件／≧２件
  // 02. 空白なし／あり
  // 03. 空行なし／あり
  //
  // パターン一覧
  // ○ 01 要素数＝０件
  // ○ 02 要素数＝１件／空白なし／空行なし
  // ○ 03 要素数＝１件／空白なし／空行あり
  // ○ 04 要素数＝１件／空白あり／空行なし
  // ○ 05 要素数＝１件／空白あり／空行あり
  // ○ 06 要素数≧２件／空白なし／空行なし
  // ○ 07 要素数≧２件／空白なし／空行あり
  // ○ 08 要素数≧２件／空白あり／空行なし
  // ○ 09 要素数≧２件／空白あり／空行あり
  describe("normalizeItems", () => {
    test("01 要素数＝０件", () => {
      expect(window.normalizeItems([])).toEqual([]);
    });

    test("02 要素数＝１件／空白なし／空行なし", () => {
      expect(window.normalizeItems(["A"])).toEqual(["A"]);
    });

    test("03 要素数＝１件／空白なし／空行あり", () => {
      expect(window.normalizeItems([""])).toEqual([]);
    });

    test("04 要素数＝１件／空白あり／空行なし", () => {
      expect(window.normalizeItems([" A "])).toEqual(["A"]);
    });

    test("05 要素数＝１件／空白あり／空行あり", () => {
      expect(window.normalizeItems(["  "])).toEqual([]);
    });

    test("06 要素数≧２件／空白なし／空行なし", () => {
      expect(window.normalizeItems(["A", "B"])).toEqual(["A", "B"]);
    });

    test("07 要素数≧２件／空白なし／空行あり", () => {
      expect(window.normalizeItems(["A", ""])).toEqual(["A"]);
    });

    test("08 要素数≧２件／空白あり／空行なし", () => {
      expect(window.normalizeItems([" A ", " B "])).toEqual(["A", "B"]);
    });

    test("09 要素数≧２件／空白あり／空行あり", () => {
      expect(window.normalizeItems([" A ", "  "])).toEqual(["A"]);
    });
  });

  // パターン整理
  // 01. 要素数＝０件／＝１件／≧２件
  // 02. 文字数＝０文字／≧１文字
  //
  // パターン一覧
  // ○ 01 要素数＝０件
  // ○ 02 要素数＝１件／文字数＝０文字
  // ○ 03 要素数＝１件／文字数≧１文字
  // ○ 04 要素数≧２件／文字数＝０文字
  // ○ 05 要素数≧２件／文字数≧１文字
  describe("openUrls", () => {
    test("01 要素数＝０件", () => {
      const open = vi.fn();
      window.open = open;

      window.openUrls([]);

      expect(open).not.toHaveBeenCalled();
    });

    test("02 要素数＝１件／文字数＝０文字", () => {
      const open = vi.fn();
      window.open = open;

      window.openUrls([""]);

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("", "_blank");
    });

    test("03 要素数＝１件／文字数≧１文字", () => {
      const open = vi.fn();
      window.open = open;

      window.openUrls(["a"]);

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("a", "_blank");
    });

    test("04 要素数≧２件／文字数＝０文字", () => {
      const open = vi.fn();
      window.open = open;

      window.openUrls(["", ""]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "", "_blank");
    });

    test("05 要素数≧２件／文字数≧１文字", () => {
      const open = vi.fn();
      window.open = open;

      window.openUrls(["a", "b"]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "a", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "b", "_blank");
    });
  });

  // パターン整理
  // 01. 文字数＝０文字／≧１文字
  // 02. 改行なし／あり
  //
  // パターン一覧
  // ○ 01 文字数＝０文字／改行なし
  // ○ 02 文字数＝０文字／改行あり
  // ○ 03 文字数≧１文字／改行なし
  // ○ 04 文字数≧１文字／改行あり
  describe("parseItems", () => {
    test("01 文字数＝０文字／改行なし", () => {
      expect(window.parseItems("")).toEqual([]);
    });

    test("02 文字数＝０文字／改行あり", () => {
      expect(window.parseItems("\n")).toEqual([]);
    });

    test("03 文字数≧１文字／改行なし", () => {
      expect(window.parseItems("A")).toEqual(["A"]);
    });

    test("04 文字数≧１文字／改行あり", () => {
      expect(window.parseItems("A\nB")).toEqual(["A", "B"]);
    });
  });

  // パターン整理
  // 01. 要素数＝０件／＝１件／≧２件
  // 02. 文字数＝０文字／≧１文字
  //
  // パターン一覧
  // ○ 01 要素数＝０件
  // ○ 02 要素数＝１件／文字数＝０文字
  // ○ 03 要素数＝１件／文字数≧１文字
  // ○ 04 要素数≧２件／文字数＝０文字
  // ○ 05 要素数≧２件／文字数≧１文字
  describe("pickRandomItem", () => {
    test("01 要素数＝０件", () => {
      expect(window.pickRandomItem([])).toBe("");
    });

    test("02 要素数＝１件／文字数＝０文字", () => {
      expect(window.pickRandomItem([""])).toBe("");
    });

    test("03 要素数＝１件／文字数≧１文字", () => {
      expect(window.pickRandomItem(["A"])).toBe("A");
    });

    test("04 要素数≧２件／文字数＝０文字", () => {
      expect(window.pickRandomItem(["", ""])).toBe("");
    });

    test("05 要素数≧２件／文字数≧１文字", () => {
      expect(["A", "B"]).toContain(window.pickRandomItem(["A", "B"]));
    });
  });

  // パターン整理
  // 01. 配列１要素数＝０件／＝１件／≧２件
  // 02. 配列１文字数＝０文字／≧１文字
  // 03. 配列２要素数＝０件／＝１件／≧２件
  // 04. 配列２文字数＝０文字／≧１文字
  //
  // パターン一覧
  // ○ 01 配列１要素数＝０件／配列２要素数＝０件
  // ○ 02 配列１要素数＝０件／配列２要素数＝１件／配列２文字数＝０文字
  // ○ 03 配列１要素数＝０件／配列２要素数＝１件／配列２文字数≧１文字
  // ○ 04 配列１要素数＝０件／配列２要素数≧２件／配列２文字数＝０文字
  // ○ 05 配列１要素数＝０件／配列２要素数≧２件／配列２文字数≧１文字
  // ○ 06 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数＝０件
  // ○ 07 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数＝０文字
  // ○ 08 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数≧１文字
  // ○ 09 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数＝０文字
  // ○ 10 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数≧１文字
  // ○ 11 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数＝０件
  // ○ 12 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数＝０文字
  // ○ 13 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数≧１文字
  // ○ 14 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数＝０文字
  // ○ 15 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数≧１文字
  // ○ 16 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数＝０件
  // ○ 17 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数＝０文字
  // ○ 18 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数≧１文字
  // ○ 19 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数＝０文字
  // ○ 20 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数≧１文字
  // ○ 21 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数＝０件
  // ○ 22 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数＝０文字
  // ○ 23 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数≧１文字
  // ○ 24 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数＝０文字
  // ○ 25 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数≧１文字
  describe("removeExcludedItems", () => {
    test("01 配列１要素数＝０件／配列２要素数＝０件", () => {
      expect(window.removeExcludedItems([], [])).toEqual([]);
    });

    test("02 配列１要素数＝０件／配列２要素数＝１件／配列２文字数＝０文字", () => {
      expect(window.removeExcludedItems([], [""])).toEqual([]);
    });

    test("03 配列１要素数＝０件／配列２要素数＝１件／配列２文字数≧１文字", () => {
      expect(window.removeExcludedItems([], ["A"])).toEqual([]);
    });

    test("04 配列１要素数＝０件／配列２要素数≧２件／配列２文字数＝０文字", () => {
      expect(window.removeExcludedItems([], ["", ""])).toEqual([]);
    });

    test("05 配列１要素数＝０件／配列２要素数≧２件／配列２文字数≧１文字", () => {
      expect(window.removeExcludedItems([], ["A", "B"])).toEqual([]);
    });

    test("06 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数＝０件", () => {
      expect(window.removeExcludedItems([""], [])).toEqual([""]);
    });

    test("07 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数＝０文字", () => {
      expect(window.removeExcludedItems([""], [""])).toEqual([]);
    });

    test("08 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数≧１文字", () => {
      expect(window.removeExcludedItems([""], ["A"])).toEqual([""]);
    });

    test("09 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数＝０文字", () => {
      expect(window.removeExcludedItems([""], ["", ""])).toEqual([]);
    });

    test("10 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数≧１文字", () => {
      expect(window.removeExcludedItems([""], ["A", "B"])).toEqual([""]);
    });

    test("11 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数＝０件", () => {
      expect(window.removeExcludedItems(["A"], [])).toEqual(["A"]);
    });

    test("12 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数＝０文字", () => {
      expect(window.removeExcludedItems(["A"], [""])).toEqual(["A"]);
    });

    test("13 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数≧１文字", () => {
      expect(window.removeExcludedItems(["A"], ["A"])).toEqual([]);
    });

    test("14 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数＝０文字", () => {
      expect(window.removeExcludedItems(["A"], ["", ""])).toEqual(["A"]);
    });

    test("15 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数≧１文字", () => {
      expect(window.removeExcludedItems(["A"], ["A", "B"])).toEqual([]);
    });

    test("16 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数＝０件", () => {
      expect(window.removeExcludedItems(["", ""], [])).toEqual(["", ""]);
    });

    test("17 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数＝０文字", () => {
      expect(window.removeExcludedItems(["", ""], [""])).toEqual([]);
    });

    test("18 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数≧１文字", () => {
      expect(window.removeExcludedItems(["", ""], ["A"])).toEqual(["", ""]);
    });

    test("19 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数＝０文字", () => {
      expect(window.removeExcludedItems(["", ""], ["", ""])).toEqual([]);
    });

    test("20 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数≧１文字", () => {
      expect(window.removeExcludedItems(["", ""], ["A", "B"])).toEqual([
        "",
        "",
      ]);
    });

    test("21 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数＝０件", () => {
      expect(window.removeExcludedItems(["A", "B"], [])).toEqual(["A", "B"]);
    });

    test("22 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数＝０文字", () => {
      expect(window.removeExcludedItems(["A", "B"], [""])).toEqual(["A", "B"]);
    });

    test("23 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数≧１文字", () => {
      expect(window.removeExcludedItems(["A", "B"], ["A"])).toEqual(["B"]);
    });

    test("24 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数＝０文字", () => {
      expect(window.removeExcludedItems(["A", "B"], ["", ""])).toEqual([
        "A",
        "B",
      ]);
    });

    test("25 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数≧１文字", () => {
      expect(window.removeExcludedItems(["A", "B"], ["A", "B"])).toEqual([]);
    });
  });

  // パターン整理
  // 01. 文字数＝０文字／≧１文字
  //
  // パターン一覧
  // ○ 01 文字数＝０文字
  // ○ 02 文字数≧１文字
  describe("renderResult", () => {
    test("01 文字数＝０文字", () => {
      const dummyDiv = document.createElement("div");

      window.renderResult(dummyDiv, "");

      expect(dummyDiv.textContent).toBe("");
    });

    test("02 文字数≧１文字", () => {
      const dummyDiv = document.createElement("div");

      window.renderResult(dummyDiv, "テスト結果");

      expect(dummyDiv.textContent).toBe("テスト結果");
    });
  });
});
