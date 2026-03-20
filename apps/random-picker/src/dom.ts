import type { PipelineStep, ProcessorDef, UI } from "./type.ts";

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
