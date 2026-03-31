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

describe("addPipelineStep", () => {
  describe("正常系", () => {
    test("正常 / ステップが末尾に追加される", () => {
      const steps = [{ id: "trim" }];
      const result = addPipelineStep(steps, { id: "filterEmpty" });

      expect(steps).toEqual([{ id: "trim" }]);
      expect(result).toEqual([{ id: "trim" }, { id: "filterEmpty" }]);
    });
  });

  describe("境界系", () => {
    test("steps.length=0 / ステップが末尾に追加される", () => {
      const steps: { id: string }[] = [];
      const result = addPipelineStep(steps, { id: "trim" });

      expect(steps).toEqual([]);
      expect(result).toEqual([{ id: "trim" }]);
    });
  });
});

describe("applyStringArrayProcessors", () => {
  describe("正常系", () => {
    test("正常 / 配列に処理関数が順に適用される", () => {
      const trimItems = vi
        .fn<(items: string[]) => string[]>()
        .mockImplementation((items) => items.map((item) => item.trim()));
      const addSuffix = vi
        .fn<(items: string[]) => string[]>()
        .mockImplementation((items) => items.map((item) => `${item}!`));

      expect(
        applyStringArrayProcessors([" A ", " B "], [trimItems, addSuffix]),
      ).toEqual(["A!", "B!"]);
      expect(trimItems).toHaveBeenCalledWith([" A ", " B "]);
      expect(addSuffix).toHaveBeenCalledWith(["A", "B"]);
    });
  });

  describe("境界系", () => {
    test("items.length=0 / 配列に処理関数が順に適用される", () => {
      const addFallback = vi
        .fn<(items: string[]) => string[]>()
        .mockReturnValue(["fallback"]);
      const addSuffix = vi
        .fn<(items: string[]) => string[]>()
        .mockImplementation((items) => items.map((item) => `${item}!`));

      expect(applyStringArrayProcessors([], [addFallback, addSuffix])).toEqual([
        "fallback!",
      ]);
      expect(addFallback).toHaveBeenCalledWith([]);
      expect(addSuffix).toHaveBeenCalledWith(["fallback"]);
    });

    test("processors.length=0 / 配列に処理関数が適用されない", () => {
      expect(applyStringArrayProcessors([" A ", " B "], [])).toEqual([
        " A ",
        " B ",
      ]);
    });
  });
});

describe("executePipeline", () => {
  const processorRegistry = {
    filterEmpty: {
      id: "filterEmpty",
      name: "filterEmpty",
      description: "filter empty values",
      execute: (items: string[]) => items.filter((item) => item !== ""),
    },
    pickRandom: {
      id: "pickRandom",
      name: "pickRandom",
      description: "pick random values",
      paramsSchema: {
        count: {
          type: "number" as const,
          label: "count",
          default: 1,
        },
      },
      execute: (items: string[], params: { count?: number }) =>
        items.slice(0, params.count ?? 1),
    },
    trim: {
      id: "trim",
      name: "trim",
      description: "trim values",
      execute: (items: string[]) => items.map((item) => item.trim()),
    },
  };

  describe("正常系", () => {
    test("paramsなし / デフォルト値適用 / 各行に処理関数が順に適用される", () => {
      const context = { previousOutput: "" };
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
      try {
        expect(
          executePipeline(
            "A\nB",
            [{ id: "pickRandom" }],
            context,
            processorRegistry,
          ),
        ).toBe("A");
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("paramsあり / パラメーター値適用 / 各行に処理関数が順に適用される", () => {
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
            processorRegistry,
          ),
        ).toBe("A\nB");
      } finally {
        randomSpy.mockRestore();
      }
    });
  });

  describe("境界系", () => {
    test("inputText が1行 / 各行に処理関数が順に適用される", () => {
      const context = { previousOutput: "" };
      expect(
        executePipeline(" A ", [{ id: "trim" }], context, processorRegistry),
      ).toBe("A");
    });

    test("inputText が2行 / 各行に処理関数が順に適用される", () => {
      const context = { previousOutput: "" };
      expect(
        executePipeline(
          " A \n B ",
          [{ id: "trim" }],
          context,
          processorRegistry,
        ),
      ).toBe("A\nB");
    });

    test("steps.length=0 / 処理関数が適用されない", () => {
      const context = { previousOutput: "" };
      expect(executePipeline("A\nB", [], context, processorRegistry)).toBe(
        "A\nB",
      );
    });

    test("steps.length=1 / 各行に処理関数が順に適用される", () => {
      const context = { previousOutput: "" };
      expect(
        executePipeline(" A ", [{ id: "trim" }], context, processorRegistry),
      ).toBe("A");
    });
  });

  describe("異常系", () => {
    test("registryにstep.idがない / 処理関数が適用されない", () => {
      const context = { previousOutput: "" };
      expect(
        executePipeline("A", [{ id: "unknown" }], context, processorRegistry),
      ).toBe("A");
    });
  });
});

describe("joinByNewline", () => {
  describe("正常系", () => {
    test("items.length=2 / 改行で結合する", () => {
      expect(joinByNewline(["A", "B"])).toBe("A\nB");
    });
  });

  describe("境界系", () => {
    test("items.length=0 / 空文字列を返す", () => {
      expect(joinByNewline([])).toBe("");
    });

    test("items.length=1 / 要素をそのまま返す", () => {
      expect(joinByNewline(["A"])).toBe("A");
    });
  });
});

describe("movePipelineStep", () => {
  describe("正常系", () => {
    test("fromIndex < toIndex / 0 から 2 へ移動する", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 0, 2);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "b" }, { id: "c" }, { id: "a" }]);
    });

    test("fromIndex = toIndex / 1 から 1 へ移動する", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 1, 1);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });

    test("fromIndex > toIndex / 2 から 0 へ移動する", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 2, 0);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "c" }, { id: "a" }, { id: "b" }]);
    });
  });

  describe("境界系", () => {
    test("newSteps.length=0", () => {
      const steps: { id: string }[] = [];
      const newSteps = movePipelineStep(steps, 0, 0);

      expect(steps).toEqual([]);
      expect(newSteps).toEqual([]);
    });

    test("newSteps.length=1", () => {
      const steps = [{ id: "a" }];
      const newSteps = movePipelineStep(steps, 0, 0);

      expect(steps).toEqual([{ id: "a" }]);
      expect(newSteps).toEqual([{ id: "a" }]);
    });

    test("newSteps.length=2", () => {
      const steps = [{ id: "a" }, { id: "b" }];
      const newSteps = movePipelineStep(steps, 0, 1);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }]);
      expect(newSteps).toEqual([{ id: "b" }, { id: "a" }]);
    });

    test("fromIndex=-1", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, -1, 2);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });

    test("fromIndex=0", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 0, 2);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "b" }, { id: "c" }, { id: "a" }]);
    });

    test("fromIndex=1", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 1, 2);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "a" }, { id: "c" }, { id: "b" }]);
    });

    test("toIndex=-1", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 2, -1);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });

    test("toIndex=0", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 2, 0);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "c" }, { id: "a" }, { id: "b" }]);
    });

    test("toIndex=1", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 2, 1);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "a" }, { id: "c" }, { id: "b" }]);
    });

    test("fromIndex=newSteps.length-1", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 2, 0);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "c" }, { id: "a" }, { id: "b" }]);
    });

    test("fromIndex=newSteps.length", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 3, 0);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });

    test("toIndex=newSteps.length-1", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 0, 2);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "b" }, { id: "c" }, { id: "a" }]);
    });

    test("toIndex=newSteps.length", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 0, 3);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });
  });

  describe("異常系", () => {
    test("fromIndex が小数 / 配列が変わらない", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 1.2, 0);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });

    test("fromIndex がNaN / 配列が変わらない", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, Number.NaN, 0);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });

    test("toIndex が小数 / 配列が変わらない", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 0, 1.8);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });

    test("toIndex がNaN / 配列が変わらない", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const newSteps = movePipelineStep(steps, 0, Number.NaN);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(newSteps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });
  });
});

describe("removePipelineStep", () => {
  describe("正常系", () => {
    test("ステップが削除される", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const result = removePipelineStep(steps, 1);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(result).toEqual([{ id: "a" }, { id: "c" }]);
    });
  });

  describe("境界系", () => {
    test("steps.length=0", () => {
      const steps: { id: string }[] = [];
      const result = removePipelineStep(steps, 0);

      expect(steps).toEqual([]);
      expect(result).toEqual([]);
    });

    test("steps.length=1", () => {
      const steps = [{ id: "a" }];
      const result = removePipelineStep(steps, 0);

      expect(steps).toEqual([{ id: "a" }]);
      expect(result).toEqual([]);
    });

    test("index=-1", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const result = removePipelineStep(steps, -1);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(result).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });

    test("index=0", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const result = removePipelineStep(steps, 0);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(result).toEqual([{ id: "b" }, { id: "c" }]);
    });

    test("index=1", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const result = removePipelineStep(steps, 1);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(result).toEqual([{ id: "a" }, { id: "c" }]);
    });

    test("index=steps.length-1", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const result = removePipelineStep(steps, steps.length - 1);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(result).toEqual([{ id: "a" }, { id: "b" }]);
    });

    test("index=steps.length", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const result = removePipelineStep(steps, steps.length);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(result).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });
  });

  describe("異常系", () => {
    test("index が小数", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const result = removePipelineStep(steps, 1.2);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(result).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });

    test("index がNaN", () => {
      const steps = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const result = removePipelineStep(steps, Number.NaN);

      expect(steps).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
      expect(result).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    });
  });
});

describe("resolveParams", () => {
  describe("正常系", () => {
    test("paramsSchema=undefined / stepParamsあり", () => {
      const def = {
        id: "test",
        name: "test",
        description: "test",
        execute: (i: string[]) => i,
      };
      expect(resolveParams(def, { a: 1 })).toEqual({ a: 1 });
    });

    test("paramsSchemaあり / stepParams=undefined / default値を返す", () => {
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

    test("paramsSchemaあり / stepParamsあり / default値を上書きする", () => {
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

describe("splitByNewline", () => {
  describe("正常系", () => {
    test("改行なし", () => {
      expect(splitByNewline("A")).toEqual(["A"]);
    });

    test("改行あり", () => {
      expect(splitByNewline("A\nB")).toEqual(["A", "B"]);
    });
  });

  describe("境界系", () => {
    test("文字数=0", () => {
      expect(splitByNewline("")).toEqual([""]);
    });
  });
});

describe("updatePipelineStepParam", () => {
  describe("正常系", () => {
    test("keyが新規", () => {
      const steps = [{ id: "pickRandom", params: { count: 1 } }];
      const result = updatePipelineStepParam(steps, 0, "mode", "all");

      expect(steps).toEqual([{ id: "pickRandom", params: { count: 1 } }]);
      expect(result).toEqual([
        { id: "pickRandom", params: { count: 1, mode: "all" } },
      ]);
    });

    test("paramsなし", () => {
      const steps = [{ id: "pickRandom" }];
      const result = updatePipelineStepParam(steps, 0, "count", 5);

      expect(steps).toEqual([{ id: "pickRandom" }]);
      expect(result).toEqual([{ id: "pickRandom", params: { count: 5 } }]);
    });

    test("paramsあり", () => {
      const steps = [{ id: "pickRandom", params: { count: 1, mode: "all" } }];
      const result = updatePipelineStepParam(steps, 0, "count", 5);

      expect(steps).toEqual([
        { id: "pickRandom", params: { count: 1, mode: "all" } },
      ]);
      expect(result).toEqual([
        { id: "pickRandom", params: { count: 5, mode: "all" } },
      ]);
    });
  });

  describe("境界系", () => {
    test("steps.length=0", () => {
      const steps: { id: string; params?: Record<string, number | string> }[] =
        [];
      const result = updatePipelineStepParam(steps, 0, "count", 5);

      expect(steps).toEqual([]);
      expect(result).toEqual([]);
    });

    test("steps.length=1", () => {
      const steps = [{ id: "pickRandom", params: { count: 1 } }];
      const result = updatePipelineStepParam(steps, 0, "count", 5);

      expect(steps).toEqual([{ id: "pickRandom", params: { count: 1 } }]);
      expect(result).toEqual([{ id: "pickRandom", params: { count: 5 } }]);
    });

    test("index=-1", () => {
      const steps = [
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ];
      const result = updatePipelineStepParam(steps, -1, "count", 5);

      expect(steps).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
      expect(result).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
    });

    test("index=0", () => {
      const steps = [
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ];
      const result = updatePipelineStepParam(steps, 0, "count", 5);

      expect(steps).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
      expect(result).toEqual([
        { id: "a", params: { count: 5 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
    });

    test("index=1", () => {
      const steps = [
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ];
      const result = updatePipelineStepParam(steps, 1, "count", 5);

      expect(steps).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
      expect(result).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 5 } },
        { id: "c", params: { count: 3 } },
      ]);
    });

    test("index=steps.length-1", () => {
      const steps = [
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ];
      const result = updatePipelineStepParam(
        steps,
        steps.length - 1,
        "count",
        5,
      );

      expect(steps).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
      expect(result).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 5 } },
      ]);
    });

    test("index=steps.length", () => {
      const steps = [
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ];
      const result = updatePipelineStepParam(steps, steps.length, "count", 5);

      expect(steps).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
      expect(result).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
    });
  });

  describe("異常系", () => {
    test("indexが小数", () => {
      const steps = [
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ];
      const result = updatePipelineStepParam(steps, 1.2, "count", 5);

      expect(steps).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
      expect(result).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
    });

    test("index=NaN", () => {
      const steps = [
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ];
      const result = updatePipelineStepParam(steps, Number.NaN, "count", 5);

      expect(steps).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
      expect(result).toEqual([
        { id: "a", params: { count: 1 } },
        { id: "b", params: { count: 2 } },
        { id: "c", params: { count: 3 } },
      ]);
    });
  });
});
