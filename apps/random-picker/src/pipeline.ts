import type {
  PipelineContext,
  PipelineStep,
  ProcessorDef,
  ProcessorParams,
  ProcessorRegistry,
  StringArrayProcessor,
} from "./type.ts";

/**
 * appState.pipeline に1ステップを末尾追加して返す（元の配列は変更しない）
 */
export function addPipelineStep(
  steps: PipelineStep[],
  newStep: PipelineStep,
): PipelineStep[] {
  return [...steps, newStep];
}

/**
 * 文字列配列に処理関数を順番に適用する
 */
export function applyStringArrayProcessors(
  values: string[],
  processors: StringArrayProcessor[],
): string[] {
  return processors.reduce(
    (currentValues, processor) => processor(currentValues),
    values,
  );
}

/**
 * パイプラインステップを順番に実行し、出力テキストを返す
 */
export function executePipeline(
  inputText: string,
  steps: PipelineStep[],
  context: PipelineContext,
  processorRegistry: ProcessorRegistry,
): string {
  let currentItems = splitByNewline(inputText);

  for (const step of steps) {
    const def = processorRegistry[step.id];
    if (!def) continue;
    const params = resolveParams(def, step.params);
    currentItems = def.execute(currentItems, params, context);
  }

  return joinByNewline(currentItems);
}

/**
 * 文字列配列を改行文字で結合する
 */
export function joinByNewline(values: string[]): string {
  return values.join("\n");
}

/**
 * appState.pipeline の fromIndex → toIndex へ要素を移動して返す（元の配列は変更しない）
 */
export function movePipelineStep(
  steps: PipelineStep[],
  fromIndex: number,
  toIndex: number,
): PipelineStep[] {
  const newSteps = [...steps];

  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) {
    return newSteps;
  }

  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= newSteps.length ||
    toIndex >= newSteps.length
  ) {
    return newSteps;
  }

  if (fromIndex === toIndex) {
    return newSteps;
  }

  const [removed] = newSteps.splice(fromIndex, 1);
  newSteps.splice(toIndex, 0, removed);

  return newSteps;
}

/**
 * appState.pipeline の指定インデックスを削除して返す（元の配列は変更しない）
 */
export function removePipelineStep(
  steps: PipelineStep[],
  index: number,
): PipelineStep[] {
  return steps.filter((_, i) => i !== index);
}

/**
 * paramsSchema のデフォルト値を基準に、ステップの params をマージして返す
 */
export function resolveParams(
  def: ProcessorDef,
  stepParams?: ProcessorParams,
): ProcessorParams {
  const defaults: ProcessorParams = {};
  if (def.paramsSchema) {
    for (const [key, field] of Object.entries(def.paramsSchema)) {
      defaults[key] = field.default;
    }
  }
  return { ...defaults, ...stepParams };
}

/**
 * 改行で文字列を分割する
 */
export function splitByNewline(sourceText: string): string[] {
  return sourceText.split("\n");
}

/**
 * 指定インデックスのステップの params を更新して返す（元の配列は変更しない）
 */
export function updatePipelineStepParam(
  steps: PipelineStep[],
  index: number,
  key: string,
  value: number | string,
): PipelineStep[] {
  return steps.map((step, i) => {
    if (i !== index) return step;
    return {
      ...step,
      params: {
        ...(step.params ?? {}),
        [key]: value,
      },
    };
  });
}
