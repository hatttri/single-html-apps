import { describe, expect, test } from "vitest";
import { PROCESSOR_REGISTRY } from "../../src/processor-registry.ts";

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
