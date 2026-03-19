//
// 型定義
//

/** アプリケーションの状態 */
export type AppState = {
  pipeline: PipelineStep[];
};

/** パラメータスキーマの1フィールドの定義 */
export type ParamFieldSchema = {
  type: "number" | "string";
  label: string;
  default: number | string;
};

/** パイプライン実行時に渡す実行コンテキスト */
export type PipelineContext = {
  /** 排他ランダム等で参照する前回の出力テキスト（改行区切り） */
  previousOutput: string;
};

/** ユーザーが組み立てたパイプラインの1ステップ */
export type PipelineStep = {
  id: string;
  params?: ProcessorParams;
};

/** プロセッサの定義（メタデータ＋実行ロジック） */
export type ProcessorDef = {
  id: string;
  name: string;
  description: string;
  paramsSchema?: Record<string, ParamFieldSchema>;
  execute: (
    items: string[],
    params: ProcessorParams,
    context: PipelineContext,
  ) => string[];
};

/** プロセッサが受け取るパラメータの型 */
export type ProcessorParams = Record<string, number | string>;

/** 文字列配列を受け取り、加工して返す処理関数の型 */
export type StringArrayProcessor = (values: string[]) => string[];

export type UI = {
  inputCopyBtn: HTMLButtonElement;
  inputOpenBtn: HTMLButtonElement;
  input: HTMLTextAreaElement;
  pipelineStepList: HTMLElement;
  processorSelect: HTMLSelectElement;
  addStepBtn: HTMLButtonElement;
  pipelineRunBtn: HTMLButtonElement;
  outputCopyBtn: HTMLButtonElement;
  outputOpenBtn: HTMLButtonElement;
  output: HTMLTextAreaElement;
};

//
// 変数定義
//

/** アプリケーションのグローバル状態（初期値は空のパイプライン） */
const appState: AppState = {
  pipeline: [],
};

/** プロセッサの登録リスト */
export const PROCESSOR_REGISTRY: Record<string, ProcessorDef> = {
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

//
// 純粋ロジック
//

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
): string {
  let currentItems = splitByNewline(inputText);

  for (const step of steps) {
    const def = PROCESSOR_REGISTRY[step.id];
    if (!def) continue;
    const params = resolveParams(def, step.params);
    currentItems = def.execute(currentItems, params, context);
  }

  return joinByNewline(currentItems);
}

/**
 * 空文字列を除外する
 */
export function filterEmptyStrings(values: string[]): string[] {
  return values.filter((value) => value !== "");
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
  const [removed] = newSteps.splice(fromIndex, 1);
  newSteps.splice(toIndex, 0, removed);
  return newSteps;
}

/**
 * 配列からランダムに指定件数ぶん選んだ配列を返す
 */
export function pickRandomItems(items: string[], count: number): string[] {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError("count must be a non-negative safe integer");
  }

  const pickedCount = Math.min(count, items.length);
  const allIndexes = items.map((_, itemIndex) => itemIndex);

  for (let currentIndex = 0; currentIndex < pickedCount; currentIndex += 1) {
    const randomIndex =
      currentIndex +
      Math.floor(Math.random() * (allIndexes.length - currentIndex));
    [allIndexes[currentIndex], allIndexes[randomIndex]] = [
      allIndexes[randomIndex],
      allIndexes[currentIndex],
    ];
  }

  const pickedIndexes = allIndexes.slice(0, pickedCount).sort((left, right) => {
    return left - right;
  });

  return pickedIndexes.map((itemIndex) => items[itemIndex]);
}

/**
 * 除外リストを適用した配列を返す
 */
export function removeExcludedItems(
  items: string[],
  excludedItems: string[],
): string[] {
  const excludedItemSet = new Set(excludedItems);
  return items.filter((item) => !excludedItemSet.has(item));
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
 * 文字列配列の各要素を trim する
 */
export function trimStrings(values: string[]): string[] {
  return values.map((value) => value.trim());
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

//
// ブラウザ副作用（非DOM）
//

/**
 * テキストをクリップボードにコピーする
 */
export async function copyTextToClipboard(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

/**
 * URL 配列を新しいタブで順に開く
 */
export function openUrls(urls: string[]): void {
  urls.forEach((url) => {
    window.open(url, "_blank");
  });
}

//
// DOM/UI
//

/**
 * PROCESSOR_REGISTRY からセレクトボックスのオプションを構築して設定する
 */
export function buildProcessorSelectOptions(
  selectEl: HTMLSelectElement,
  registry: Record<string, ProcessorDef>,
): void {
  const sortedKeys = Object.keys(registry).sort();
  selectEl.innerHTML = "";
  sortedKeys.forEach((key) => {
    const def = registry[key];
    const option = document.createElement("option");
    option.value = def.id;
    option.textContent = def.name;
    selectEl.appendChild(option);
  });
}

/**
 * UI 要素を取得する
 */
export function createUi(root: Document = document): UI {
  return {
    inputCopyBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "inputCopyBtn",
    ),
    inputOpenBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "inputOpenBtn",
    ),
    input: getElementByIdOrThrow<HTMLTextAreaElement>(root, "input"),
    pipelineStepList: getElementByIdOrThrow<HTMLElement>(
      root,
      "pipelineStepList",
    ),
    processorSelect: getElementByIdOrThrow<HTMLSelectElement>(
      root,
      "processorSelect",
    ),
    addStepBtn: getElementByIdOrThrow<HTMLButtonElement>(root, "addStepBtn"),
    pipelineRunBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "pipelineRunBtn",
    ),
    outputCopyBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "outputCopyBtn",
    ),
    outputOpenBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "outputOpenBtn",
    ),
    output: getElementByIdOrThrow<HTMLTextAreaElement>(root, "output"),
  };
}

/**
 * 指定した ID の要素を取得し、見つからない場合は例外にする
 */
export function getElementByIdOrThrow<T extends HTMLElement>(
  root: Document,
  id: string,
): T {
  const element = root.getElementById(id);
  if (!element) {
    throw new Error(`Element not found: #${id}`);
  }

  return element as T;
}

/**
 * アプリを初期化してイベントを結線する
 */
export function initApp(ui: UI = createUi()): UI {
  // 状態のリセット
  appState.pipeline = [];

  // パイプラインUIの初期化
  buildProcessorSelectOptions(ui.processorSelect, PROCESSOR_REGISTRY);
  renderPipelineStepList(
    ui.pipelineStepList,
    appState.pipeline,
    PROCESSOR_REGISTRY,
  );

  // ドラッグ＆ドロップ
  let draggingIndex: number | null = null;

  ui.pipelineStepList.onclick = (e) => {
    const target = e.target as HTMLElement;
    const deleteBtn = target.closest(".pipeline-delete-btn") as HTMLElement;
    if (deleteBtn) {
      const index = parseInt(deleteBtn.dataset.index ?? "-1", 10);
      if (index >= 0) {
        appState.pipeline = removePipelineStep(appState.pipeline, index);
        renderPipelineStepList(
          ui.pipelineStepList,
          appState.pipeline,
          PROCESSOR_REGISTRY,
        );
      }
    }
  };

  ui.pipelineStepList.ondragend = (e) => {
    const target = e.target as HTMLElement;
    const item = target.closest(".pipeline-step-item") as HTMLElement;
    if (item) {
      item.classList.remove("dragging");
    }
    draggingIndex = null;
  };

  ui.pipelineStepList.ondragover = (e) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const overItem = target.closest(".pipeline-step-item") as HTMLElement;
    if (overItem && draggingIndex !== null) {
      const overIndex = parseInt(overItem.dataset.index ?? "-1", 10);
      if (overIndex !== draggingIndex) {
        appState.pipeline = movePipelineStep(
          appState.pipeline,
          draggingIndex,
          overIndex,
        );
        draggingIndex = overIndex;
        renderPipelineStepList(
          ui.pipelineStepList,
          appState.pipeline,
          PROCESSOR_REGISTRY,
        );
      }
    }
  };

  ui.pipelineStepList.ondragstart = (e) => {
    const target = e.target as HTMLElement;
    const item = target.closest(".pipeline-step-item") as HTMLElement;
    if (item) {
      draggingIndex = parseInt(item.dataset.index ?? "-1", 10);
      item.classList.add("dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
      }
    }
  };

  ui.pipelineStepList.oninput = (e) => {
    const target = e.target as HTMLInputElement;
    if (
      target.tagName === "INPUT" &&
      target.dataset.index &&
      target.dataset.key
    ) {
      const index = parseInt(target.dataset.index, 10);
      const key = target.dataset.key;
      const value =
        target.type === "number" ? parseFloat(target.value) : target.value;
      appState.pipeline = updatePipelineStepParam(
        appState.pipeline,
        index,
        key,
        value,
      );
    }
  };

  ui.addStepBtn.onclick = () => {
    const processorId = ui.processorSelect.value;
    const def = PROCESSOR_REGISTRY[processorId];
    if (!def) return;

    appState.pipeline = addPipelineStep(appState.pipeline, {
      id: processorId,
    });
    renderPipelineStepList(
      ui.pipelineStepList,
      appState.pipeline,
      PROCESSOR_REGISTRY,
    );
  };

  ui.pipelineRunBtn.onclick = () => {
    const inputText = ui.input.value;
    const context: PipelineContext = {
      previousOutput: ui.output.value ?? "",
    };
    const outputText = executePipeline(inputText, appState.pipeline, context);
    renderOutput(ui.output, outputText);
  };

  ui.inputCopyBtn.onclick = async () => {
    // 入力文字列を取得する
    const inputText = ui.input.value;

    // 入力文字列をコピーする
    await copyTextToClipboard(inputText);
  };

  ui.inputOpenBtn.onclick = () => {
    // 入力文字列を取得する
    const inputText = ui.input.value;

    // 入力文字列を入力文字列配列に分割する
    const inputLines = splitByNewline(inputText);

    // 入力文字列配列を URL 配列に変換する
    const urls = applyStringArrayProcessors(inputLines, [
      trimStrings,
      filterEmptyStrings,
    ]);

    // URL 配列を開く
    openUrls(urls);
  };

  ui.outputCopyBtn.onclick = async () => {
    // 出力文字列を取得する
    const outputText = ui.output.value ?? "";

    // 出力文字列をコピーする
    await copyTextToClipboard(outputText);
  };

  ui.outputOpenBtn.onclick = () => {
    // 出力文字列を取得する
    const outputText = ui.output.value ?? "";

    // 出力文字列を出力文字列配列に分割する
    const outputLines = splitByNewline(outputText);

    // 出力文字列配列を URL 配列に変換する
    const urls = applyStringArrayProcessors(outputLines, [
      trimStrings,
      filterEmptyStrings,
    ]);

    // URL 配列を開く
    openUrls(urls);
  };

  return ui;
}

/**
 * 画面に出力する
 */
export function renderOutput(
  element: HTMLTextAreaElement,
  value: string,
): void {
  element.value = value;
}

/**
 * appState.pipeline を読んでステップ一覧のDOMを再描画する
 */
export function renderPipelineStepList(
  listEl: HTMLElement,
  steps: PipelineStep[],
  registry: Record<string, ProcessorDef>,
): void {
  listEl.innerHTML = "";

  if (steps.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "pipeline-empty-msg";
    emptyMsg.textContent = "ステップがありません。追加してください。";
    listEl.appendChild(emptyMsg);
    return;
  }

  steps.forEach((step, index) => {
    const def = registry[step.id];
    if (!def) return;

    const item = document.createElement("div");
    item.className = "pipeline-step-item";
    item.draggable = true;
    item.dataset.index = index.toString();

    // ドラッグハンドル
    const handle = document.createElement("div");
    handle.className = "pipeline-drag-handle";
    handle.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9h14M5 15h14"/></svg>';
    item.appendChild(handle);

    // 名前
    const name = document.createElement("span");
    name.className = "pipeline-step-name";
    name.textContent = def.name;
    item.appendChild(name);

    // パラメータ
    const paramsContainer = document.createElement("div");
    paramsContainer.className = "pipeline-step-params";
    if (def.paramsSchema) {
      Object.entries(def.paramsSchema).forEach(([key, schema]) => {
        const span = document.createElement("span");
        span.textContent = schema.label;
        paramsContainer.appendChild(span);

        const input = document.createElement("input");
        input.type = schema.type === "number" ? "number" : "text";
        input.value = (step.params?.[key] ?? schema.default).toString();
        input.dataset.index = index.toString();
        input.dataset.key = key;
        paramsContainer.appendChild(input);
      });
    }
    item.appendChild(paramsContainer);

    // 削除ボタン
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "pipeline-delete-btn";
    deleteBtn.type = "button";
    deleteBtn.dataset.index = index.toString();
    deleteBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    item.appendChild(deleteBtn);

    listEl.appendChild(item);
  });
}
