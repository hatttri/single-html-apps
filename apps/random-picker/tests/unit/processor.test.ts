import { describe, expect, test, vi } from "vitest";
import {
  filterEmptyStrings,
  pickRandomItems,
  removeExcludedItems,
  trimStrings,
} from "../../src/processor.ts";

describe("filterEmptyStrings", () => {
  describe("正常系", () => {
    test("空文字列なし", () => {
      const items = ["A", "B"];
      const result = filterEmptyStrings(items);

      expect(items).toEqual(["A", "B"]);
      expect(result).toEqual(["A", "B"]);
    });

    test("空文字列あり", () => {
      const items = ["A", "", "B"];
      const result = filterEmptyStrings(items);

      expect(items).toEqual(["A", "", "B"]);
      expect(result).toEqual(["A", "B"]);
    });
  });

  describe("境界系", () => {
    test("values.length=0", () => {
      const items: string[] = [];
      const result = filterEmptyStrings(items);

      expect(items).toEqual([]);
      expect(result).toEqual([]);
    });
  });
});

describe("pickRandomItems", () => {
  describe("正常系", () => {
    test("ランダムに選ばれる", () => {
      const randomSpy = vi
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0.99);

      try {
        const items = ["A", "B", "C"];
        const result = pickRandomItems(items, 2);

        expect(items).toEqual(["A", "B", "C"]);
        expect(result).toEqual(["A", "C"]);
      } finally {
        randomSpy.mockRestore();
      }
    });
  });

  describe("境界系", () => {
    test("items.length=0", () => {
      const items: string[] = [];
      const result = pickRandomItems(items, 1);

      expect(items).toEqual([]);
      expect(result).toEqual([]);
    });

    test("items.length=1", () => {
      const items = ["A"];
      const result = pickRandomItems(items, 1);

      expect(items).toEqual(["A"]);
      expect(result).toEqual(["A"]);
    });

    test("count=-1", () => {
      const items = ["A", "B", "C"];

      expect(() => {
        try {
          pickRandomItems(items, -1);
        } finally {
          expect(items).toEqual(["A", "B", "C"]);
        }
      }).toThrow(RangeError);
    });

    test("count=0", () => {
      const items = ["A", "B", "C"];
      const result = pickRandomItems(items, 0);

      expect(items).toEqual(["A", "B", "C"]);
      expect(result).toEqual([]);
    });

    test("count=1", () => {
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99);

      try {
        const items = ["A", "B", "C"];
        const result = pickRandomItems(items, 1);

        expect(items).toEqual(["A", "B", "C"]);
        expect(result).toEqual(["C"]);
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("count=items.length-1", () => {
      const randomSpy = vi
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0.99);

      try {
        const items = ["A", "B", "C"];
        const result = pickRandomItems(items, items.length - 1);

        expect(items).toEqual(["A", "B", "C"]);
        expect(result).toEqual(["A", "C"]);
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("count=items.length", () => {
      const items = ["A", "B", "C"];
      const result = pickRandomItems(items, items.length);

      expect(items).toEqual(["A", "B", "C"]);
      expect(result).toEqual(["A", "B", "C"]);
    });

    test("count=items.length+1", () => {
      const items = ["A", "B", "C"];
      const result = pickRandomItems(items, items.length + 1);

      expect(items).toEqual(["A", "B", "C"]);
      expect(result).toEqual(["A", "B", "C"]);
    });
  });

  describe("異常系", () => {
    test("count=小数", () => {
      const items = ["A", "B", "C"];

      expect(() => {
        try {
          pickRandomItems(items, 1.5);
        } finally {
          expect(items).toEqual(["A", "B", "C"]);
        }
      }).toThrow(RangeError);
    });

    test("count=NaN", () => {
      const items = ["A", "B", "C"];

      expect(() => {
        try {
          pickRandomItems(items, Number.NaN);
        } finally {
          expect(items).toEqual(["A", "B", "C"]);
        }
      }).toThrow(RangeError);
    });
  });
});

describe("removeExcludedItems", () => {
  describe("正常系", () => {
    test("重複なし", () => {
      const items = ["A", "A", "B", "C"];
      const excludedItems = ["X", "Y", "Y"];
      const result = removeExcludedItems(items, excludedItems);

      expect(items).toEqual(["A", "A", "B", "C"]);
      expect(excludedItems).toEqual(["X", "Y", "Y"]);
      expect(result).toEqual(["A", "A", "B", "C"]);
    });

    test("重複あり / 一部重複", () => {
      const items = ["A", "B", "B", "C", "D", "D"];
      const excludedItems = ["B", "X", "X"];
      const result = removeExcludedItems(items, excludedItems);

      expect(items).toEqual(["A", "B", "B", "C", "D", "D"]);
      expect(excludedItems).toEqual(["B", "X", "X"]);
      expect(result).toEqual(["A", "C", "D", "D"]);
    });

    test("重複あり / 全部重複", () => {
      const items = ["B", "B", "C", "C"];
      const excludedItems = ["B", "C", "C", "X"];
      const result = removeExcludedItems(items, excludedItems);

      expect(items).toEqual(["B", "B", "C", "C"]);
      expect(excludedItems).toEqual(["B", "C", "C", "X"]);
      expect(result).toEqual([]);
    });
  });

  describe("境界系", () => {
    test("items.length=0", () => {
      const items: string[] = [];
      const excludedItems = ["A", "B", "B"];
      const result = removeExcludedItems(items, excludedItems);

      expect(items).toEqual([]);
      expect(excludedItems).toEqual(["A", "B", "B"]);
      expect(result).toEqual([]);
    });

    test("items.length=1", () => {
      const items = ["A"];
      const excludedItems = ["B", "C", "C"];
      const result = removeExcludedItems(items, excludedItems);

      expect(items).toEqual(["A"]);
      expect(excludedItems).toEqual(["B", "C", "C"]);
      expect(result).toEqual(["A"]);
    });

    test("excludedItems.length=0", () => {
      const items = ["A", "B", "B", "C"];
      const excludedItems: string[] = [];
      const result = removeExcludedItems(items, excludedItems);

      expect(items).toEqual(["A", "B", "B", "C"]);
      expect(excludedItems).toEqual([]);
      expect(result).toEqual(["A", "B", "B", "C"]);
    });

    test("excludedItems.length=1", () => {
      const items = ["A", "B", "B", "C"];
      const excludedItems = ["B"];
      const result = removeExcludedItems(items, excludedItems);

      expect(items).toEqual(["A", "B", "B", "C"]);
      expect(excludedItems).toEqual(["B"]);
      expect(result).toEqual(["A", "C"]);
    });
  });
});

describe("trimStrings", () => {
  describe("正常系", () => {
    test("先頭末尾空白なし", () => {
      const values = ["A", "BC"];
      const result = trimStrings(values);

      expect(values).toEqual(["A", "BC"]);
      expect(result).toEqual(["A", "BC"]);
    });

    test("先頭末尾空白あり", () => {
      const values = [" A ", " B"];
      const result = trimStrings(values);

      expect(values).toEqual([" A ", " B"]);
      expect(result).toEqual(["A", "B"]);
    });
  });

  describe("境界系", () => {
    test("values.length=0", () => {
      const values: string[] = [];
      const result = trimStrings(values);

      expect(values).toEqual([]);
      expect(result).toEqual([]);
    });

    test("values[i].length=0", () => {
      const values = ["", ""];
      const result = trimStrings(values);

      expect(values).toEqual(["", ""]);
      expect(result).toEqual(["", ""]);
    });
  });
});
