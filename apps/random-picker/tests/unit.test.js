import { describe, expect, test, vi } from "vitest";
import {
  copyTextToClipboard,
  normalizeItems,
  openUrls,
  parseItems,
  pickRandomItem,
  removeExcludedItems,
  renderResult,
} from "../src/script.ts";

describe("Random Picker Unit Tests", () => {
  // パターン整理
  // 01. 文字数／＝０文字／≧１文字
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

      await copyTextToClipboard("");

      expect(writeText).toHaveBeenCalledWith("");
    });

    test("02 文字数≧１文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      await copyTextToClipboard("A");

      expect(writeText).toHaveBeenCalledWith("A");
    });
  });

  // パターン整理
  // 01. 要素数／＝０件／≧１件
  // 02. 先頭末尾空白／なし／あり
  // 03. 空白行／なし／あり
  //
  // パターン一覧
  // ○ 01 要素数＝０件
  // ○ 02 要素数≧１件／先頭末尾空白なし／空白行なし
  // ○ 03 要素数≧１件／先頭末尾空白なし／空白行あり
  // ○ 04 要素数≧１件／先頭末尾空白あり／空白行なし
  // ○ 05 要素数≧１件／先頭末尾空白あり／空白行あり
  describe("normalizeItems", () => {
    test("01 要素数＝０件", () => {
      expect(normalizeItems([])).toEqual([]);
    });

    test("02 要素数≧１件／先頭末尾空白なし／空白行なし", () => {
      expect(normalizeItems(["A"])).toEqual(["A"]);
    });

    test("03 要素数≧１件／先頭末尾空白なし／空白行あり", () => {
      expect(normalizeItems(["A", ""])).toEqual(["A"]);
    });

    test("04 要素数≧１件／先頭末尾空白あり／空白行なし", () => {
      expect(normalizeItems([" A "])).toEqual(["A"]);
    });

    test("05 要素数≧１件／先頭末尾空白あり／空白行あり", () => {
      expect(normalizeItems([" A ", "  "])).toEqual(["A"]);
    });
  });

  // パターン整理
  // 01. 要素数／＝０件／≧１件
  // 02. 文字数／＝０文字／≧１文字
  //
  // パターン一覧
  // ○ 01 要素数＝０件
  // ○ 02 要素数≧１件／文字数＝０文字
  // ○ 03 要素数≧１件／文字数≧１文字
  describe("openUrls", () => {
    test("01 要素数＝０件", () => {
      const open = vi.fn();
      window.open = open;

      openUrls([]);

      expect(open).not.toHaveBeenCalled();
    });

    test("02 要素数≧１件／文字数＝０文字", () => {
      const open = vi.fn();
      window.open = open;

      openUrls(["", ""]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "", "_blank");
    });

    test("03 要素数≧１件／文字数≧１文字", () => {
      const open = vi.fn();
      window.open = open;

      openUrls(["a", "b"]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "a", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "b", "_blank");
    });
  });

  // パターン整理
  // 01. 文字数／０文字／≧１文字
  // 02. 改行／なし／あり
  //
  // パターン一覧
  // ○ 01 文字数＝０文字
  // ○ 02 文字数≧１文字／改行なし
  // ○ 03 文字数≧１文字／改行あり
  describe("parseItems", () => {
    test("01 文字数＝０文字", () => {
      expect(parseItems("")).toEqual([]);
    });

    test("02 文字数≧１文字／改行なし", () => {
      expect(parseItems("A")).toEqual(["A"]);
    });

    test("03 文字数≧１文字／改行あり", () => {
      expect(parseItems("A\nB")).toEqual(["A", "B"]);
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
      expect(pickRandomItem([])).toBe("");
    });

    test("02 要素数＝１件／文字数＝０文字", () => {
      expect(pickRandomItem([""])).toBe("");
    });

    test("03 要素数＝１件／文字数≧１文字", () => {
      expect(pickRandomItem(["A"])).toBe("A");
    });

    test("04 要素数≧２件／文字数＝０文字", () => {
      expect(pickRandomItem(["", ""])).toBe("");
    });

    test("05 要素数≧２件／文字数≧１文字", () => {
      expect(["A", "B"]).toContain(pickRandomItem(["A", "B"]));
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
      expect(removeExcludedItems([], [])).toEqual([]);
    });

    test("02 配列１要素数＝０件／配列２要素数＝１件／配列２文字数＝０文字", () => {
      expect(removeExcludedItems([], [""])).toEqual([]);
    });

    test("03 配列１要素数＝０件／配列２要素数＝１件／配列２文字数≧１文字", () => {
      expect(removeExcludedItems([], ["A"])).toEqual([]);
    });

    test("04 配列１要素数＝０件／配列２要素数≧２件／配列２文字数＝０文字", () => {
      expect(removeExcludedItems([], ["", ""])).toEqual([]);
    });

    test("05 配列１要素数＝０件／配列２要素数≧２件／配列２文字数≧１文字", () => {
      expect(removeExcludedItems([], ["A", "B"])).toEqual([]);
    });

    test("06 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数＝０件", () => {
      expect(removeExcludedItems([""], [])).toEqual([""]);
    });

    test("07 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数＝０文字", () => {
      expect(removeExcludedItems([""], [""])).toEqual([]);
    });

    test("08 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数≧１文字", () => {
      expect(removeExcludedItems([""], ["A"])).toEqual([""]);
    });

    test("09 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数＝０文字", () => {
      expect(removeExcludedItems([""], ["", ""])).toEqual([]);
    });

    test("10 配列１要素数＝１件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数≧１文字", () => {
      expect(removeExcludedItems([""], ["A", "B"])).toEqual([""]);
    });

    test("11 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数＝０件", () => {
      expect(removeExcludedItems(["A"], [])).toEqual(["A"]);
    });

    test("12 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数＝０文字", () => {
      expect(removeExcludedItems(["A"], [""])).toEqual(["A"]);
    });

    test("13 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数≧１文字", () => {
      expect(removeExcludedItems(["A"], ["A"])).toEqual([]);
    });

    test("14 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数＝０文字", () => {
      expect(removeExcludedItems(["A"], ["", ""])).toEqual(["A"]);
    });

    test("15 配列１要素数＝１件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数≧１文字", () => {
      expect(removeExcludedItems(["A"], ["A", "B"])).toEqual([]);
    });

    test("16 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数＝０件", () => {
      expect(removeExcludedItems(["", ""], [])).toEqual(["", ""]);
    });

    test("17 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数＝０文字", () => {
      expect(removeExcludedItems(["", ""], [""])).toEqual([]);
    });

    test("18 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数＝１件／配列２文字数≧１文字", () => {
      expect(removeExcludedItems(["", ""], ["A"])).toEqual(["", ""]);
    });

    test("19 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数＝０文字", () => {
      expect(removeExcludedItems(["", ""], ["", ""])).toEqual([]);
    });

    test("20 配列１要素数≧２件／配列１文字数＝０文字／配列２要素数≧２件／配列２文字数≧１文字", () => {
      expect(removeExcludedItems(["", ""], ["A", "B"])).toEqual(["", ""]);
    });

    test("21 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数＝０件", () => {
      expect(removeExcludedItems(["A", "B"], [])).toEqual(["A", "B"]);
    });

    test("22 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数＝０文字", () => {
      expect(removeExcludedItems(["A", "B"], [""])).toEqual(["A", "B"]);
    });

    test("23 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数＝１件／配列２文字数≧１文字", () => {
      expect(removeExcludedItems(["A", "B"], ["A"])).toEqual(["B"]);
    });

    test("24 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数＝０文字", () => {
      expect(removeExcludedItems(["A", "B"], ["", ""])).toEqual(["A", "B"]);
    });

    test("25 配列１要素数≧２件／配列１文字数≧１文字／配列２要素数≧２件／配列２文字数≧１文字", () => {
      expect(removeExcludedItems(["A", "B"], ["A", "B"])).toEqual([]);
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

      renderResult(dummyDiv, "");

      expect(dummyDiv.textContent).toBe("");
    });

    test("02 文字数≧１文字", () => {
      const dummyDiv = document.createElement("div");

      renderResult(dummyDiv, "テスト結果");

      expect(dummyDiv.textContent).toBe("テスト結果");
    });
  });
});
