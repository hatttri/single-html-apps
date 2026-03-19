import { describe, expect, test, vi } from "vitest";
import {
  // 変数定義
  AppState,
  PROCESSOR_REGISTRY,
  // 純粋ロジック
  addPipelineStep,
  applyStringArrayProcessors,
  executePipeline,
  filterEmptyStrings,
  joinByNewline,
  movePipelineStep,
  pickRandomItems,
  removeExcludedItems,
  removePipelineStep,
  resolveParams,
  splitByNewline,
  trimStrings,
  updatePipelineStepParam,
  // ブラウザ副作用（非DOM）
  copyTextToClipboard,
  openUrls,
  // DOM/UI
  buildProcessorSelectOptions,
  createUi,
  getElementByIdOrThrow,
  initApp,
  renderOutput,
  renderPipelineStepList,
} from "../src/script.ts";

describe("Random Picker Unit Tests", () => {
  //
  // 変数定義
  //

  // describe("AppState", () => {});

  describe("PROCESSOR_REGISTRY", () => {
    describe("正常系", () => {
      test("必要なキーがすべて存在する", () => {
        expect(PROCESSOR_REGISTRY.excludePrevious).toBeDefined();
        expect(PROCESSOR_REGISTRY.filterEmpty).toBeDefined();
        expect(PROCESSOR_REGISTRY.pickRandom).toBeDefined();
        expect(PROCESSOR_REGISTRY.trim).toBeDefined();
      });

      test("各 execute が正常に動作する (正常系)", () => {
        const context = { previousOutput: "A" };
        expect(PROCESSOR_REGISTRY.trim.execute([" A "], {}, context)).toEqual([
          "A",
        ]);
        expect(
          PROCESSOR_REGISTRY.filterEmpty.execute(["A", "", "B"], {}, context),
        ).toEqual(["A", "B"]);
        expect(
          PROCESSOR_REGISTRY.pickRandom.execute(
            ["A", "B"],
            { count: 1 },
            context,
          ),
        ).toHaveLength(1);
        expect(
          PROCESSOR_REGISTRY.excludePrevious.execute(["A", "B"], {}, context),
        ).toEqual(["B"]);
      });
    });
  });

  //
  // 純粋ロジック
  //

  describe("addPipelineStep", () => {
    describe("正常系", () => {
      test("ステップが末尾に追加される", () => {
        const steps = [{ id: "trim" }];
        const result = addPipelineStep(steps, { id: "filterEmpty" });
        expect(result).toEqual([{ id: "trim" }, { id: "filterEmpty" }]);
      });

      test("元の配列が変更されない", () => {
        const steps = [{ id: "trim" }];
        addPipelineStep(steps, { id: "filterEmpty" });
        expect(steps).toEqual([{ id: "trim" }]);
      });
    });
  });

  // パターン整理
  // 01. 要素数／＝０件／≧１件
  // 02. 処理数／＝０件／≧１件
  //
  // パターン一覧
  // ○ 01 要素数＝０件／処理数＝０件
  // ○ 02 要素数＝０件／処理数≧１件
  // ○ 03 要素数≧１件／処理数＝０件
  // ○ 04 要素数≧１件／処理数≧１件
  describe("applyStringArrayProcessors", () => {
    test("01 要素数＝０件／処理数＝０件", () => {
      expect(applyStringArrayProcessors([], [])).toEqual([]);
    });

    test("02 要素数＝０件／処理数≧１件", () => {
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

    test("03 要素数≧１件／処理数＝０件", () => {
      expect(applyStringArrayProcessors([" A ", " B "], [])).toEqual([
        " A ",
        " B ",
      ]);
    });

    test("04 要素数≧１件／処理数≧１件", () => {
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

  describe("executePipeline", () => {
    describe("正常系", () => {
      test("paramsによるパラメータ指定（pickRandomでcount: 2を指定）", () => {
        const context = { previousOutput: "" };
        const randomSpy = vi
          .spyOn(Math, "random")
          .mockReturnValueOnce(0)
          .mockReturnValueOnce(0);
        try {
          expect(
            executePipeline(
              "A\nB\nC",
              [{ id: "pickRandom", params: { count: 2 } }],
              context,
            ),
          ).toBe("A\nB");
        } finally {
          randomSpy.mockRestore();
        }
      });

      test("resolveParamsによるデフォルト値適用（paramsなし→count: 1）", () => {
        const context = { previousOutput: "" };
        const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
        try {
          expect(executePipeline("A\nB", [{ id: "pickRandom" }], context)).toBe(
            "A",
          );
        } finally {
          randomSpy.mockRestore();
        }
      });
    });

    describe("境界系", () => {
      test("inputTextが1行", () => {
        const context = { previousOutput: "" };
        expect(executePipeline("A", [], context)).toBe("A");
      });

      test("inputTextが2行", () => {
        const context = { previousOutput: "" };
        expect(executePipeline("A\nB", [], context)).toBe("A\nB");
      });

      test("steps空", () => {
        const context = { previousOutput: "" };
        expect(executePipeline("A\nB", [], context)).toBe("A\nB");
      });

      test("stepsが1件（trimステップ単独）", () => {
        const context = { previousOutput: "" };
        expect(executePipeline(" A ", [{ id: "trim" }], context)).toBe("A");
      });

      test("stepsが1件（filterEmptyステップ単独）", () => {
        const context = { previousOutput: "" };
        expect(
          executePipeline("A\n\nB", [{ id: "filterEmpty" }], context),
        ).toBe("A\nB");
      });
    });

    describe("異常系", () => {
      test("存在しないidが含まれる場合はスキップされる", () => {
        const context = { previousOutput: "" };
        expect(executePipeline("A", [{ id: "unknown" }], context)).toBe("A");
      });
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
  // 01. 要素数／＝０件／＝１件／≧２件
  // 02. 文字数／＝０文字／≧１文字
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

  describe("movePipelineStep", () => {
    describe("正常系", () => {
      test("要素が正しく移動する", () => {
        const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
        const result = movePipelineStep(steps, 0, 2);
        expect(result).toEqual([{ id: "b" }, { id: "c" }, { id: "a" }]);
      });

      test("元の配列が変更されない", () => {
        const steps = [{ id: "a" }, { id: "b" }];
        movePipelineStep(steps, 0, 1);
        expect(steps).toEqual([{ id: "a" }, { id: "b" }]);
      });
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
        expect(() =>
          pickRandomItems([], Number.MAX_SAFE_INTEGER),
        ).not.toThrow();
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

  describe("removePipelineStep", () => {
    describe("正常系", () => {
      test("指定インデックスが削除される", () => {
        const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
        const result = removePipelineStep(steps, 1);
        expect(result).toEqual([{ id: "a" }, { id: "c" }]);
      });

      test("元の配列が変更されない", () => {
        const steps = [{ id: "a" }, { id: "b" }];
        removePipelineStep(steps, 0);
        expect(steps).toEqual([{ id: "a" }, { id: "b" }]);
      });
    });
  });

  describe("resolveParams", () => {
    describe("正常系", () => {
      test("paramsSchema が undefined のとき空オブジェクトを返す", () => {
        const def = {
          id: "test",
          name: "test",
          description: "test",
          execute: (i: string[]) => i,
        };
        expect(resolveParams(def, { a: 1 })).toEqual({ a: 1 });
      });

      test("stepParams が undefined のときデフォルト値のみ返す", () => {
        const def = {
          id: "test",
          name: "test",
          description: "test",
          paramsSchema: {
            count: { type: "number" as const, label: "count", default: 1 },
          },
          execute: (i: string[]) => i,
        };
        expect(resolveParams(def)).toEqual({ count: 1 });
      });

      test("stepParams が指定されているときデフォルト値をオーバーライドする", () => {
        const def = {
          id: "test",
          name: "test",
          description: "test",
          paramsSchema: {
            count: { type: "number" as const, label: "count", default: 1 },
          },
          execute: (i: string[]) => i,
        };
        expect(resolveParams(def, { count: 5 })).toEqual({ count: 5 });
      });
    });
  });

  // パターン整理
  // 01. 文字数／＝０文字／≧１文字
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

  describe("updatePipelineStepParam", () => {
    describe("正常系", () => {
      test("指定インデックスの params が更新される", () => {
        const steps = [{ id: "pickRandom", params: { count: 1 } }];
        const result = updatePipelineStepParam(steps, 0, "count", 5);
        expect(result[0].params).toEqual({ count: 5 });
      });

      test("元の配列が変更されない", () => {
        const steps = [{ id: "pickRandom", params: { count: 1 } }];
        updatePipelineStepParam(steps, 0, "count", 5);
        expect(steps[0].params).toEqual({ count: 1 });
      });
    });
  });

  //
  // ブラウザ副作用（非DOM）
  //

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

  //
  // DOM/UI
  //

  describe("buildProcessorSelectOptions", () => {
    describe("正常系", () => {
      test("PROCESSOR_REGISTRY の全キーがオプションとして設定される", () => {
        const select = document.createElement("select");
        const registry = {
          a: {
            id: "a",
            name: "A",
            description: "desc",
            execute: (i: any) => i,
          },
          b: {
            id: "b",
            name: "B",
            description: "desc",
            execute: (i: any) => i,
          },
        };
        buildProcessorSelectOptions(select, registry);
        expect(select.options).toHaveLength(2);
        expect(select.options[0].value).toBe("a");
        expect(select.options[0].textContent).toBe("A");
        expect(select.options[1].value).toBe("b");
        expect(select.options[1].textContent).toBe("B");
      });
    });
  });

  describe("createUi", () => {
    describe("正常系", () => {
      test("全てのUI要素が正しく取得される", () => {
        const root = document.implementation.createHTMLDocument("");
        const ids = [
          "inputCopyBtn",
          "inputOpenBtn",
          "input",
          "pipelineStepList",
          "processorSelect",
          "addStepBtn",
          "pipelineRunBtn",
          "outputCopyBtn",
          "outputOpenBtn",
          "output",
        ];
        ids.forEach((id) => {
          const el = root.createElement("div");
          el.id = id;
          root.body.appendChild(el);
        });

        const ui = createUi(root);
        expect(ui.inputCopyBtn.id).toBe("inputCopyBtn");
        expect(ui.inputOpenBtn.id).toBe("inputOpenBtn");
        expect(ui.input.id).toBe("input");
        expect(ui.pipelineStepList.id).toBe("pipelineStepList");
        expect(ui.processorSelect.id).toBe("processorSelect");
        expect(ui.addStepBtn.id).toBe("addStepBtn");
        expect(ui.pipelineRunBtn.id).toBe("pipelineRunBtn");
        expect(ui.outputCopyBtn.id).toBe("outputCopyBtn");
        expect(ui.outputOpenBtn.id).toBe("outputOpenBtn");
        expect(ui.output.id).toBe("output");
      });
    });

    describe("異常系", () => {
      test("要素が1つでも欠けている場合にエラーを投げる", () => {
        const root = document.implementation.createHTMLDocument("");
        expect(() => createUi(root)).toThrow();
      });
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

  // describe("initApp", () => {});

  // パターン整理
  // 01. 文字数／＝０文字／≧１文字
  //
  // パターン一覧
  // ○ 01 文字数＝０文字
  // ○ 02 文字数≧１文字
  describe("renderOutput", () => {
    test("01 文字数＝０文字", () => {
      const dummyDiv = document.createElement("textarea");

      renderOutput(dummyDiv, "");

      expect(dummyDiv.value).toBe("");
    });

    test("02 文字数≧１文字", () => {
      const dummyDiv = document.createElement("textarea");

      renderOutput(dummyDiv, "テスト結果");

      expect(dummyDiv.value).toBe("テスト結果");
    });
  });

  describe("renderPipelineStepList", () => {
    describe("正常系", () => {
      test("steps空のとき空メッセージが表示される", () => {
        const div = document.createElement("div");
        renderPipelineStepList(div, [], {});
        expect(div.querySelector(".pipeline-empty-msg")).not.toBeNull();
      });

      test("steps1件のときアイテムが1件描画される", () => {
        const div = document.createElement("div");
        const registry = {
          trim: {
            id: "trim",
            name: "Trim",
            description: "desc",
            execute: (i: any) => i,
          },
        };
        renderPipelineStepList(div, [{ id: "trim" }], registry);
        expect(div.querySelectorAll(".pipeline-step-item")).toHaveLength(1);
        expect(div.querySelector(".pipeline-step-name")?.textContent).toBe(
          "Trim",
        );
      });

      test("paramsSchemaありのとき入力欄が生成される", () => {
        const div = document.createElement("div");
        const registry = {
          pickRandom: {
            id: "pickRandom",
            name: "Pick",
            description: "desc",
            paramsSchema: {
              count: { type: "number" as const, label: "Count", default: 1 },
            },
            execute: (i: any) => i,
          },
        };
        renderPipelineStepList(div, [{ id: "pickRandom" }], registry);
        const input = div.querySelector(
          'input[type="number"]',
        ) as HTMLInputElement;
        expect(input).not.toBeNull();
        expect(input.value).toBe("1");
      });
    });
  });
});
