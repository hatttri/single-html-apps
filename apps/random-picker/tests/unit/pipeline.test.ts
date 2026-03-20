import { describe, expect, test, vi } from "vitest";
import {
  addPipelineStep,
  applyStringArrayProcessors,
  executePipeline,
  joinByNewline,
  movePipelineStep,
  removePipelineStep,
  resolveParams,
  splitByNewline,
  updatePipelineStepParam,
} from "../../src/pipeline.ts";
import { PROCESSOR_REGISTRY } from "../../src/processor-registry.ts";

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
            PROCESSOR_REGISTRY,
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
        expect(
          executePipeline(
            "A\nB",
            [{ id: "pickRandom" }],
            context,
            PROCESSOR_REGISTRY,
          ),
        ).toBe("A");
      } finally {
        randomSpy.mockRestore();
      }
    });
  });

  describe("境界系", () => {
    test("inputTextが1行", () => {
      const context = { previousOutput: "" };
      expect(executePipeline("A", [], context, PROCESSOR_REGISTRY)).toBe("A");
    });

    test("inputTextが2行", () => {
      const context = { previousOutput: "" };
      expect(executePipeline("A\nB", [], context, PROCESSOR_REGISTRY)).toBe(
        "A\nB",
      );
    });

    test("steps空", () => {
      const context = { previousOutput: "" };
      expect(executePipeline("A\nB", [], context, PROCESSOR_REGISTRY)).toBe(
        "A\nB",
      );
    });

    test("stepsが1件（trimステップ単独）", () => {
      const context = { previousOutput: "" };
      expect(
        executePipeline(" A ", [{ id: "trim" }], context, PROCESSOR_REGISTRY),
      ).toBe("A");
    });

    test("stepsが1件（filterEmptyステップ単独）", () => {
      const context = { previousOutput: "" };
      expect(
        executePipeline(
          "A\n\nB",
          [{ id: "filterEmpty" }],
          context,
          PROCESSOR_REGISTRY,
        ),
      ).toBe("A\nB");
    });
  });

  describe("異常系", () => {
    test("存在しないidが含まれる場合はスキップされる", () => {
      const context = { previousOutput: "" };
      expect(
        executePipeline("A", [{ id: "unknown" }], context, PROCESSOR_REGISTRY),
      ).toBe("A");
    });
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
