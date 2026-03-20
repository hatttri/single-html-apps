import type { ProcessorRegistry } from "./type.ts";
import { splitByNewline } from "./pipeline.ts";
import {
  filterEmptyStrings,
  pickRandomItems,
  removeExcludedItems,
  trimStrings,
} from "./processor.ts";

/** プロセッサの登録リスト */
export const PROCESSOR_REGISTRY: ProcessorRegistry = {
  excludePrevious: {
    id: "excludePrevious",
    name: "前回出力を除外",
    description: "前回の出力結果に含まれる項目を除外します",
    execute: (items, _params, context) =>
      removeExcludedItems(items, splitByNewline(context.previousOutput)),
  },
  filterEmpty: {
    id: "filterEmpty",
    name: "空行除外",
    description: "空の行を除外します",
    execute: (items) => filterEmptyStrings(items),
  },
  pickRandom: {
    id: "pickRandom",
    name: "ランダム抽出",
    description: "指定した件数だけランダムに選びます",
    paramsSchema: {
      count: { type: "number", label: "抽出件数", default: 1 },
    },
    execute: (items, params) =>
      pickRandomItems(items, params["count"] as number),
  },
  trim: {
    id: "trim",
    name: "空白削除",
    description: "各行の前後の空白を削除します",
    execute: (items) => trimStrings(items),
  },
};
