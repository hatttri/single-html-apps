import { describe, expect, test, vi } from "vitest";
import {
  filterEmptyStrings,
  pickRandomItems,
  removeExcludedItems,
  trimStrings,
} from "../../src/processor.ts";

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

describe("pickRandomItems", () => {
  // パターン整理
  // 01. 数値
  //
  // パターン一覧
  // ○ 01 数値＝NaN
  // ○ 02 数値＝1.5
  // ○ 03 数値＝Number.MIN_SAFE_INTEGER-1
  // ○ 04 数値＝Number.MIN_SAFE_INTEGER
  // ○ 05 数値＝-1
  // ○ 06 数値＝0
  // ○ 07 数値＝1
  // ○ 08 数値＝Number.MAX_SAFE_INTEGER
  // ○ 09 数値＝Number.MAX_SAFE_INTEGER+1
  describe("境界値", () => {
    test("01 数値＝NaN", () => {
      expect(() => pickRandomItems([], Number.NaN)).toThrow(RangeError);
    });

    test("02 数値＝1.5", () => {
      expect(() => pickRandomItems([], 1.5)).toThrow(RangeError);
    });

    test("03 数値＝Number.MIN_SAFE_INTEGER-1", () => {
      expect(() => pickRandomItems([], Number.MIN_SAFE_INTEGER - 1)).toThrow(
        RangeError,
      );
    });

    test("04 数値＝Number.MIN_SAFE_INTEGER", () => {
      expect(() => pickRandomItems([], Number.MIN_SAFE_INTEGER)).toThrow(
        RangeError,
      );
    });

    test("05 数値＝-1", () => {
      expect(() => pickRandomItems([], -1)).toThrow(RangeError);
    });

    test("06 数値＝0", () => {
      expect(() => pickRandomItems([], 0)).not.toThrow();
    });

    test("07 数値＝1", () => {
      expect(() => pickRandomItems([], 1)).not.toThrow();
    });

    test("08 数値＝Number.MAX_SAFE_INTEGER", () => {
      expect(() => pickRandomItems([], Number.MAX_SAFE_INTEGER)).not.toThrow();
    });

    test("09 数値＝Number.MAX_SAFE_INTEGER+1", () => {
      expect(() => pickRandomItems([], Number.MAX_SAFE_INTEGER + 1)).toThrow(
        RangeError,
      );
    });
  });

  // パターン整理
  // 01. 要素数／＝０件／＝１件／＝２件／≧３件
  // 02. 取得数／＝０件／＝１件／＝２件／≧３件
  // 03. 重複／なし／あり
  //
  // パターン一覧
  // ○ 01 要素数＝０件
  // ○ 02 要素数＝１件／取得数＝０件
  // ○ 03 要素数＝１件／取得数＝１件
  // ○ 04 要素数＝１件／取得数＝２件
  // ○ 05 要素数＝１件／取得数≧３件
  // ○ 06 要素数＝２件／取得数＝０件／重複なし
  // ○ 07 要素数＝２件／取得数＝０件／重複あり
  // ○ 08 要素数＝２件／取得数＝１件／重複なし
  // ○ 09 要素数＝２件／取得数＝１件／重複あり
  // ○ 10 要素数＝２件／取得数＝２件／重複なし
  // ○ 11 要素数＝２件／取得数＝２件／重複あり
  // ○ 12 要素数＝２件／取得数≧３件／重複なし
  // ○ 13 要素数＝２件／取得数≧３件／重複あり
  // ○ 14 要素数≧３件／取得数＝０件／重複なし
  // ○ 15 要素数≧３件／取得数＝０件／重複あり
  // ○ 16 要素数≧３件／取得数＝１件／重複なし
  // ○ 17 要素数≧３件／取得数＝１件／重複あり
  // ○ 18 要素数≧３件／取得数＝２件／重複なし
  // ○ 19 要素数≧３件／取得数＝２件／重複あり
  // ○ 20 要素数≧３件／取得数≧３件／重複なし
  // ○ 21 要素数≧３件／取得数≧３件／重複あり
  describe("正常系", () => {
    test("01 要素数＝０件", () => {
      expect(pickRandomItems([], 2)).toEqual([]);
    });

    test("02 要素数＝１件／取得数＝０件", () => {
      expect(pickRandomItems(["A"], 0)).toEqual([]);
    });

    test("03 要素数＝１件／取得数＝１件", () => {
      expect(pickRandomItems(["A"], 1)).toEqual(["A"]);
    });

    test("04 要素数＝１件／取得数＝２件", () => {
      expect(pickRandomItems(["A"], 2)).toEqual(["A"]);
    });

    test("05 要素数＝１件／取得数≧３件", () => {
      expect(pickRandomItems(["A"], 3)).toEqual(["A"]);
    });

    test("06 要素数＝２件／取得数＝０件／重複なし", () => {
      expect(pickRandomItems(["A", "B"], 0)).toEqual([]);
    });

    test("07 要素数＝２件／取得数＝０件／重複あり", () => {
      expect(pickRandomItems(["A", "A"], 0)).toEqual([]);
    });

    test("08 要素数＝２件／取得数＝１件／重複なし", () => {
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99);

      try {
        expect(pickRandomItems(["A", "B"], 1)).toEqual(["B"]);
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("09 要素数＝２件／取得数＝１件／重複あり", () => {
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

      try {
        expect(pickRandomItems(["A", "A"], 1)).toEqual(["A"]);
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("10 要素数＝２件／取得数＝２件／重複なし", () => {
      expect(pickRandomItems(["A", "B"], 2)).toEqual(["A", "B"]);
    });

    test("11 要素数＝２件／取得数＝２件／重複あり", () => {
      expect(pickRandomItems(["A", "A"], 2)).toEqual(["A", "A"]);
    });

    test("12 要素数＝２件／取得数≧３件／重複なし", () => {
      expect(pickRandomItems(["A", "B"], 3)).toEqual(["A", "B"]);
    });

    test("13 要素数＝２件／取得数≧３件／重複あり", () => {
      expect(pickRandomItems(["A", "A"], 3)).toEqual(["A", "A"]);
    });

    test("14 要素数≧３件／取得数＝０件／重複なし", () => {
      expect(pickRandomItems(["A", "B", "C", "D"], 0)).toEqual([]);
    });

    test("15 要素数≧３件／取得数＝０件／重複あり", () => {
      expect(pickRandomItems(["1", "2", "1", "2"], 0)).toEqual([]);
    });

    test("16 要素数≧３件／取得数＝１件／重複なし", () => {
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99);

      try {
        expect(pickRandomItems(["A", "B", "C", "D"], 1)).toEqual(["D"]);
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("17 要素数≧３件／取得数＝１件／重複あり", () => {
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

      try {
        expect(pickRandomItems(["1", "2", "1", "2"], 1)).toEqual(["1"]);
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("18 要素数≧３件／取得数＝２件／重複なし", () => {
      const randomSpy = vi
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0);

      try {
        expect(pickRandomItems(["A", "B", "C", "D"], 2)).toEqual(["B", "D"]);
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("19 要素数≧３件／取得数＝２件／重複あり", () => {
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

    test("20 要素数≧３件／取得数≧３件／重複なし", () => {
      const randomSpy = vi
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0.5);

      try {
        expect(pickRandomItems(["A", "B", "C", "D"], 3)).toEqual([
          "B",
          "C",
          "D",
        ]);
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("21 要素数≧３件／取得数≧３件／重複あり", () => {
      const randomSpy = vi
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0.5);

      try {
        expect(pickRandomItems(["1", "2", "1", "2"], 3)).toEqual([
          "2",
          "1",
          "2",
        ]);
      } finally {
        randomSpy.mockRestore();
      }
    });
  });
});

// パターン整理
// 01. 配列１要素数／＝０件／＝１件／≧２件
// 02. 配列１文字数／＝０文字／≧１文字
// 03. 配列２要素数／＝０件／＝１件／≧２件
// 04. 配列２文字数／＝０文字／≧１文字
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
