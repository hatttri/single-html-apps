import { copyTextToClipboard, openUrls } from "./browser";
import { renderOutput, renderPipelineStepList } from "./dom";
import {
  addPipelineStep,
  applyStringArrayProcessors,
  executePipeline,
  movePipelineStep,
  removePipelineStep,
  splitByNewline,
  updatePipelineStepParam,
} from "./pipeline";
import { filterEmptyStrings, trimStrings } from "./processor";
import type { EventDeps, PipelineContext } from "./type.ts";

/**
 * 入力欄まわりのイベントを結線する
 */
export function bindInputEvent(deps: EventDeps): void {
  deps.ui.inputCopyBtn.onclick = async () => {
    await handleInputCopyBtnClick(deps);
  };

  deps.ui.inputOpenBtn.onclick = () => {
    handleInputOpenBtnClick(deps);
  };
}

/**
 * パイプラインまわりのイベントを結線する
 */
export function bindPipelineEvent(deps: EventDeps): void {
  let draggingIndex: number | null = null;

  deps.ui.pipelineStepList.onclick = (event) => {
    handlePipelineStepListClick(deps, event);
  };

  deps.ui.pipelineStepList.ondragend = (event) => {
    handlePipelineStepListDragEnd(deps, event, (value) => {
      draggingIndex = value;
    });
  };

  deps.ui.pipelineStepList.ondragover = (event) => {
    handlePipelineStepListDragOver(deps, event, draggingIndex, (value) => {
      draggingIndex = value;
    });
  };

  deps.ui.pipelineStepList.ondragstart = (event) => {
    handlePipelineStepListDragStart(deps, event, (value) => {
      draggingIndex = value;
    });
  };

  deps.ui.pipelineStepList.oninput = (event) => {
    handlePipelineStepListInput(deps, event);
  };

  deps.ui.addStepBtn.onclick = () => {
    handleAddStepBtnClick(deps);
  };

  deps.ui.pipelineRunBtn.onclick = () => {
    handlePipelineRunBtnClick(deps);
  };
}

/**
 * 出力欄まわりのイベントを結線する
 */
export function bindOutputEvent(deps: EventDeps): void {
  deps.ui.outputCopyBtn.onclick = async () => {
    await handleOutputCopyBtnClick(deps);
  };

  deps.ui.outputOpenBtn.onclick = () => {
    handleOutputOpenBtnClick(deps);
  };
}

/**
 * 入力欄のコピーボタン押下時の処理を行う
 */
async function handleInputCopyBtnClick(deps: EventDeps): Promise<void> {
  // 入力文字列を取得する
  const inputText = deps.ui.input.value;

  // 入力文字列をコピーする
  await copyTextToClipboard(inputText);
}

/**
 * 入力欄のURLオープンボタン押下時の処理を行う
 */
function handleInputOpenBtnClick(deps: EventDeps): void {
  // 入力文字列を取得する
  const inputText = deps.ui.input.value;

  // 入力文字列を入力文字列配列に分割する
  const inputLines = splitByNewline(inputText);

  // 入力文字列配列を URL 配列に変換する
  const urls = applyStringArrayProcessors(inputLines, [
    trimStrings,
    filterEmptyStrings,
  ]);

  // URL 配列を開く
  openUrls(urls);
}

/**
 * ステップ一覧クリック時の処理を行う
 */
function handlePipelineStepListClick(deps: EventDeps, event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const deleteBtn = target.closest(".pipeline-delete-btn") as HTMLElement;
  if (deleteBtn) {
    const index = parseInt(deleteBtn.dataset.index ?? "-1", 10);
    if (index >= 0) {
      deps.appState.pipeline = removePipelineStep(
        deps.appState.pipeline,
        index,
      );
      renderPipelineStepList(
        deps.ui.pipelineStepList,
        deps.appState.pipeline,
        deps.processorRegistry,
      );
    }
  }
}

/**
 * ステップ一覧ドラッグ終了時の処理を行う
 */
function handlePipelineStepListDragEnd(
  _deps: EventDeps,
  event: DragEvent,
  setDraggingIndex: (value: number | null) => void,
): void {
  const target = event.target as HTMLElement;
  const item = target.closest(".pipeline-step-item") as HTMLElement;
  if (item) {
    item.classList.remove("dragging");
  }
  setDraggingIndex(null);
}

/**
 * ステップ一覧ドラッグ中の重なり時の処理を行う
 */
function handlePipelineStepListDragOver(
  deps: EventDeps,
  event: DragEvent,
  draggingIndex: number | null,
  setDraggingIndex: (value: number) => void,
): void {
  event.preventDefault();
  const target = event.target as HTMLElement;
  const overItem = target.closest(".pipeline-step-item") as HTMLElement;
  if (overItem && draggingIndex !== null) {
    const overIndex = parseInt(overItem.dataset.index ?? "-1", 10);
    if (overIndex !== draggingIndex) {
      deps.appState.pipeline = movePipelineStep(
        deps.appState.pipeline,
        draggingIndex,
        overIndex,
      );
      setDraggingIndex(overIndex);
      renderPipelineStepList(
        deps.ui.pipelineStepList,
        deps.appState.pipeline,
        deps.processorRegistry,
      );
    }
  }
}

/**
 * ステップ一覧ドラッグ開始時の処理を行う
 */
function handlePipelineStepListDragStart(
  _deps: EventDeps,
  event: DragEvent,
  setDraggingIndex: (value: number) => void,
): void {
  const target = event.target as HTMLElement;
  const item = target.closest(".pipeline-step-item") as HTMLElement;
  if (item) {
    setDraggingIndex(parseInt(item.dataset.index ?? "-1", 10));
    item.classList.add("dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }
}

/**
 * ステップ一覧入力変更時の処理を行う
 */
function handlePipelineStepListInput(deps: EventDeps, event: Event): void {
  const target = event.target as HTMLInputElement;
  if (
    target.tagName === "INPUT" &&
    target.dataset.index &&
    target.dataset.key
  ) {
    const index = parseInt(target.dataset.index, 10);
    const key = target.dataset.key;
    const value =
      target.type === "number" ? parseFloat(target.value) : target.value;
    deps.appState.pipeline = updatePipelineStepParam(
      deps.appState.pipeline,
      index,
      key,
      value,
    );
  }
}

/**
 * ステップ追加ボタン押下時の処理を行う
 */
function handleAddStepBtnClick(deps: EventDeps): void {
  const processorId = deps.ui.processorSelect.value;
  const def = deps.processorRegistry[processorId];
  if (!def) return;

  deps.appState.pipeline = addPipelineStep(deps.appState.pipeline, {
    id: processorId,
  });
  renderPipelineStepList(
    deps.ui.pipelineStepList,
    deps.appState.pipeline,
    deps.processorRegistry,
  );
}

/**
 * パイプライン実行ボタン押下時の処理を行う
 */
function handlePipelineRunBtnClick(deps: EventDeps): void {
  const inputText = deps.ui.input.value;
  const context: PipelineContext = {
    previousOutput: deps.ui.output.value ?? "",
  };
  const outputText = executePipeline(
    inputText,
    deps.appState.pipeline,
    context,
    deps.processorRegistry,
  );
  renderOutput(deps.ui.output, outputText);
}

/**
 * 出力欄のコピーボタン押下時の処理を行う
 */
async function handleOutputCopyBtnClick(deps: EventDeps): Promise<void> {
  // 出力文字列を取得する
  const outputText = deps.ui.output.value ?? "";

  // 出力文字列をコピーする
  await copyTextToClipboard(outputText);
}

/**
 * 出力欄のURLオープンボタン押下時の処理を行う
 */
function handleOutputOpenBtnClick(deps: EventDeps): void {
  // 出力文字列を取得する
  const outputText = deps.ui.output.value ?? "";

  // 出力文字列を出力文字列配列に分割する
  const outputLines = splitByNewline(outputText);

  // 出力文字列配列を URL 配列に変換する
  const urls = applyStringArrayProcessors(outputLines, [
    trimStrings,
    filterEmptyStrings,
  ]);

  // URL 配列を開く
  openUrls(urls);
}
