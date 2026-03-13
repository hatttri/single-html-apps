import { describe, expect, test, vi } from "vitest";
import {
  applyStringArrayProcessors,
  createPickRandomItemsProcessor,
  filterEmptyStrings,
  getElementByIdOrThrow,
  joinByNewline,
  pickRandomItems,
  removeExcludedItems,
  splitByNewline,
  trimStrings,
  copyTextToClipboard,
  openUrls,
  renderResult,
} from "../src/script.ts";

describe("Random Picker Unit Tests", () => {
  // パターン整理
  // 01. 要素数／＝０件／≧１件
  // 02. 処理関数数／＝０件／≧１件
  //
  // パターン一覧
  // ○ 01 要素数＝０件／処理関数数＝０件
  // ○ 02 要素数＝０件／処理関数数≧１件
  // ○ 03 要素数≧１件／処理関数数＝０件
  // ○ 04 要素数≧１件／処理関数数≧１件
  describe("applyStringArrayProcessors", () => {
    test("01 要素数＝０件／処理関数数＝０件", () => {
      expect(applyStringArrayProcessors([], [])).toEqual([]);
    });

    test("02 要素数＝０件／処理関数数≧１件", () => {
      const addFallback = vi
        .fn<(values: string[]) => string[]>()
        .mockReturnValue(["fallback"]);
      const addSuffix = vi
        .fn<(values: string[]) => string[]>()
        .mockImplementation((values) => values.map((value) => `${value}!`));

      expect(applyStringArrayProcessors([], [addFallback, addSuffix])).toEqual([
        "fallback!",
      ]);
      expect(addFallback).toHaveBeenCalledWith([]);
      expect(addSuffix).toHaveBeenCalledWith(["fallback"]);
    });

    test("03 要素数≧１件／処理関数数＝０件", () => {
      expect(applyStringArrayProcessors([" A ", " B "], [])).toEqual([
        " A ",
        " B ",
      ]);
    });

    test("04 要素数≧１件／処理関数数≧１件", () => {
      const trimValues = vi
        .fn<(values: string[]) => string[]>()
        .mockImplementation((values) => values.map((value) => value.trim()));
      const filterValues = vi
        .fn<(values: string[]) => string[]>()
        .mockImplementation((values) => values.filter((value) => value !== ""));

      expect(
        applyStringArrayProcessors(
          [" A ", " ", " B "],
          [trimValues, filterValues],
        ),
      ).toEqual(["A", "B"]);
      expect(trimValues).toHaveBeenCalledWith([" A ", " ", " B "]);
      expect(filterValues).toHaveBeenCalledWith(["A", "", "B"]);
    });
  });

  // パターン整理
  // 01. 取得件数／＜０／＝小数／＝０／＝１／＞要素数
  //
  // パターン一覧
  // ○ 01 取得件数＜０
  // ○ 02 取得件数＝小数
  // ○ 03 取得件数＝０
  // ○ 04 取得件数＝１
  // ○ 05 取得件数＞要素数
  //
  // `pickRandomItems` の乱択ロジック全体は後続の describe で網羅する。
  // ここでは count を束縛した processor を返す責務だけを直接確認する。
  describe("createPickRandomItemsProcessor", () => {
    test("01 取得件数＜０", () => {
      expect(() => createPickRandomItemsProcessor(-1)(["A"])).toThrow(
        RangeError,
      );
    });

    test("02 取得件数＝小数", () => {
      expect(() => createPickRandomItemsProcessor(1.5)(["A"])).toThrow(
        RangeError,
      );
    });

    test("03 取得件数＝０", () => {
      expect(createPickRandomItemsProcessor(0)([""])).toEqual([]);
    });

    test("04 取得件数＝１", () => {
      expect(createPickRandomItemsProcessor(1)(["A"])).toEqual(["A"]);
    });

    test("05 取得件数＞要素数", () => {
      expect(createPickRandomItemsProcessor(2)(["A"])).toEqual(["A"]);
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
  describe("filterEmptyStrings", () => {
    test("01 要素数＝０件", () => {
      expect(filterEmptyStrings([])).toEqual([]);
    });

    test("02 要素数≧１件／文字数＝０文字", () => {
      expect(filterEmptyStrings(["", ""])).toEqual([]);
    });

    test("03 要素数≧１件／文字数≧１文字", () => {
      expect(filterEmptyStrings(["A", "B"])).toEqual(["A", "B"]);
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
  describe("joinByNewline", () => {
    test("01 要素数＝０件", () => {
      expect(joinByNewline([])).toBe("");
    });

    test("02 要素数＝１件／文字数＝０文字", () => {
      expect(joinByNewline([""])).toBe("");
    });

    test("03 要素数＝１件／文字数≧１文字", () => {
      expect(joinByNewline(["A"])).toBe("A");
    });

    test("04 要素数≧２件／文字数＝０文字", () => {
      expect(joinByNewline(["", ""])).toBe("\n");
    });

    test("05 要素数≧２件／文字数≧１文字", () => {
      expect(joinByNewline(["A", "B"])).toBe("A\nB");
    });
  });

  // パターン整理
  // 01. 要素数／＝０件／＝１件／≧２件
  // 02. 文字数／＝０文字／≧１文字
  // 03. 取得件数／＜０／＝小数／＝０／＝１／≧２
  //
  // パターン一覧
  // ○ 01 要素数＝０件／取得件数＜０
  // ○ 02 要素数＝０件／取得件数＝小数
  // ○ 03 要素数＝０件／取得件数＝０
  // ○ 04 要素数＝０件／取得件数＝１
  // ○ 05 要素数＝０件／取得件数≧２
  // ○ 06 要素数＝１件／文字数＝０文字／取得件数＜０
  // ○ 07 要素数＝１件／文字数＝０文字／取得件数＝小数
  // ○ 08 要素数＝１件／文字数＝０文字／取得件数＝０
  // ○ 09 要素数＝１件／文字数＝０文字／取得件数＝１
  // ○ 10 要素数＝１件／文字数＝０文字／取得件数≧２
  // ○ 11 要素数＝１件／文字数≧１文字／取得件数＜０
  // ○ 12 要素数＝１件／文字数≧１文字／取得件数＝小数
  // ○ 13 要素数＝１件／文字数≧１文字／取得件数＝０
  // ○ 14 要素数＝１件／文字数≧１文字／取得件数＝１
  // ○ 15 要素数＝１件／文字数≧１文字／取得件数≧２
  // ○ 16 要素数≧２件／文字数＝０文字／取得件数＜０
  // ○ 17 要素数≧２件／文字数＝０文字／取得件数＝小数
  // ○ 18 要素数≧２件／文字数＝０文字／取得件数＝０
  // ○ 19 要素数≧２件／文字数＝０文字／取得件数＝１
  // ○ 20 要素数≧２件／文字数＝０文字／取得件数≧２
  // ○ 21 要素数≧２件／文字数≧１文字／取得件数＜０
  // ○ 22 要素数≧２件／文字数≧１文字／取得件数＝小数
  // ○ 23 要素数≧２件／文字数≧１文字／取得件数＝０
  // ○ 24 要素数≧２件／文字数≧１文字／取得件数＝１
  // ○ 25 要素数≧２件／文字数≧１文字／取得件数≧２
  describe("pickRandomItems", () => {
    test("01 要素数＝０件／取得件数＜０", () => {
      expect(() => pickRandomItems([], -1)).toThrow(RangeError);
    });

    test("02 要素数＝０件／取得件数＝小数", () => {
      expect(() => pickRandomItems([], 1.5)).toThrow(RangeError);
    });

    test("03 要素数＝０件／取得件数＝０", () => {
      expect(pickRandomItems([], 0)).toEqual([]);
    });

    test("04 要素数＝０件／取得件数＝１", () => {
      expect(pickRandomItems([], 1)).toEqual([]);
    });

    test("05 要素数＝０件／取得件数≧２", () => {
      expect(pickRandomItems([], 2)).toEqual([]);
    });

    test("06 要素数＝１件／文字数＝０文字／取得件数＜０", () => {
      expect(() => pickRandomItems([""], -1)).toThrow(RangeError);
    });

    test("07 要素数＝１件／文字数＝０文字／取得件数＝小数", () => {
      expect(() => pickRandomItems([""], 1.5)).toThrow(RangeError);
    });

    test("08 要素数＝１件／文字数＝０文字／取得件数＝０", () => {
      expect(pickRandomItems([""], 0)).toEqual([]);
    });

    test("09 要素数＝１件／文字数＝０文字／取得件数＝１", () => {
      expect(pickRandomItems([""], 1)).toEqual([""]);
    });

    test("10 要素数＝１件／文字数＝０文字／取得件数≧２", () => {
      expect(pickRandomItems([""], 2)).toEqual([""]);
    });

    test("11 要素数＝１件／文字数≧１文字／取得件数＜０", () => {
      expect(() => pickRandomItems(["A"], -1)).toThrow(RangeError);
    });

    test("12 要素数＝１件／文字数≧１文字／取得件数＝小数", () => {
      expect(() => pickRandomItems(["A"], 1.5)).toThrow(RangeError);
    });

    test("13 要素数＝１件／文字数≧１文字／取得件数＝０", () => {
      expect(pickRandomItems(["A"], 0)).toEqual([]);
    });

    test("14 要素数＝１件／文字数≧１文字／取得件数＝１", () => {
      expect(pickRandomItems(["A"], 1)).toEqual(["A"]);
    });

    test("15 要素数＝１件／文字数≧１文字／取得件数≧２", () => {
      expect(pickRandomItems(["A"], 2)).toEqual(["A"]);
    });

    test("16 要素数≧２件／文字数＝０文字／取得件数＜０", () => {
      expect(() => pickRandomItems(["", ""], -1)).toThrow(RangeError);
    });

    test("17 要素数≧２件／文字数＝０文字／取得件数＝小数", () => {
      expect(() => pickRandomItems(["", ""], 1.5)).toThrow(RangeError);
    });

    test("18 要素数≧２件／文字数＝０文字／取得件数＝０", () => {
      expect(pickRandomItems(["", ""], 0)).toEqual([]);
    });

    test("19 要素数≧２件／文字数＝０文字／取得件数＝１", () => {
      expect(pickRandomItems(["", ""], 1)).toEqual([""]);
    });

    test("20 要素数≧２件／文字数＝０文字／取得件数≧２", () => {
      expect(pickRandomItems(["", ""], 3)).toEqual(["", ""]);
    });

    test("21 要素数≧２件／文字数≧１文字／取得件数＜０", () => {
      expect(() => pickRandomItems(["A", "B"], -1)).toThrow(RangeError);
    });

    test("22 要素数≧２件／文字数≧１文字／取得件数＝小数", () => {
      expect(() => pickRandomItems(["A", "B"], 1.5)).toThrow(RangeError);
    });

    test("23 要素数≧２件／文字数≧１文字／取得件数＝０", () => {
      expect(pickRandomItems(["A", "B"], 0)).toEqual([]);
    });

    test("24 要素数≧２件／文字数≧１文字／取得件数＝１", () => {
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99);

      try {
        expect(pickRandomItems(["A", "B"], 1)).toEqual(["B"]);
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("25 要素数≧２件／文字数≧１文字／取得件数≧２", () => {
      const randomSpy = vi
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0);

      try {
        expect(pickRandomItems(["A", "B"], 2)).toEqual(["B", "A"]);
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("重複値あり／取得件数＝２／同じ値を別インデックスとして抽選できる", () => {
      const randomSpy = vi
        .spyOn(Math, "random")
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.5);

      try {
        expect(pickRandomItems(["1", "2", "1", "2"], 2)).toEqual(["1", "1"]);
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("要素数≧２件／文字数≧１文字／取得件数≧２／候補が尽きたら終了する", () => {
      const randomSpy = vi
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0);

      try {
        expect(pickRandomItems(["A", "B"], 3)).toEqual(["B", "A"]);
      } finally {
        randomSpy.mockRestore();
      }
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
  // 01. 文字数／０文字／≧１文字
  // 02. 改行／なし／あり
  //
  // パターン一覧
  // ○ 01 文字数＝０文字
  // ○ 02 文字数≧１文字／改行なし
  // ○ 03 文字数≧１文字／改行あり
  describe("splitByNewline", () => {
    test("01 文字数＝０文字", () => {
      expect(splitByNewline("")).toEqual([""]);
    });

    test("02 文字数≧１文字／改行なし", () => {
      expect(splitByNewline("A")).toEqual(["A"]);
    });

    test("03 文字数≧１文字／改行あり", () => {
      expect(splitByNewline("A\nB")).toEqual(["A", "B"]);
    });
  });

  // パターン整理
  // 01. 要素数／＝０件／≧１件
  // 02. 文字数／＝０文字／≧１文字
  // 03. 前後空白／なし／あり
  //
  // パターン一覧
  // ○ 01 要素数＝０件
  // ○ 02 要素数≧１件／文字数＝０文字／前後空白なし
  // ○ 03 要素数≧１件／文字数＝０文字／前後空白あり
  // ○ 04 要素数≧１件／文字数≧１文字／前後空白なし
  // ○ 05 要素数≧１件／文字数≧１文字／前後空白あり
  describe("trimStrings", () => {
    test("01 要素数＝０件", () => {
      expect(trimStrings([])).toEqual([]);
    });

    test("02 要素数≧１件／文字数＝０文字／前後空白なし", () => {
      expect(trimStrings([""])).toEqual([""]);
    });

    test("03 要素数≧１件／文字数＝０文字／前後空白あり", () => {
      expect(trimStrings(["  "])).toEqual([""]);
    });

    test("04 要素数≧１件／文字数≧１文字／前後空白なし", () => {
      expect(trimStrings(["A", "B"])).toEqual(["A", "B"]);
    });

    test("05 要素数≧１件／文字数≧１文字／前後空白あり", () => {
      expect(trimStrings([" A ", " B "])).toEqual(["A", "B"]);
    });
  });

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
  // 02. 文字数／＝０文字／≧１文字
  //
  // パターン一覧
  // ○ 01 要素数＝０件
  // ○ 02 要素数≧１件／文字数＝０文字
  // ○ 03 要素数≧１件／文字数≧１文字
  describe("openUrls", () => {
    test("01 要素数＝０件", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls([]);

      expect(open).not.toHaveBeenCalled();
    });

    test("02 要素数≧１件／文字数＝０文字", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls(["", ""]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "", "_blank");
    });

    test("03 要素数≧１件／文字数≧１文字", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls(["a", "b"]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "a", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "b", "_blank");
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
