import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  buildProcessorSelectOptions,
  createUi,
  renderPipelineStepList,
} from "../../src/dom.ts";
import {
  bindInputEvent,
  bindOutputEvent,
  bindPipelineEvent,
} from "../../src/event.ts";
import { PROCESSOR_REGISTRY } from "../../src/processor-registry.ts";
import { appState } from "../../src/state.ts";

/**
 * 最小構成の DOM を用意する
 */
function setupMinimalDom(): void {
  document.body.innerHTML = `
    <button id="inputCopyBtn" type="button"></button>
    <button id="inputOpenBtn" type="button"></button>
    <textarea id="input"></textarea>
    <div id="pipelineStepList"></div>
    <select id="processorSelect"></select>
    <button id="addStepBtn" type="button"></button>
    <button id="pipelineRunBtn" type="button"></button>
    <button id="outputCopyBtn" type="button"></button>
    <button id="outputOpenBtn" type="button"></button>
    <textarea id="output"></textarea>
  `;
}

/**
 * DragEvent 用の dataTransfer を付与して発火する
 */
function dispatchDragEvent(
  target: Element,
  type: "dragstart" | "dragover" | "dragend",
): DragEvent {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as DragEvent;
  Object.defineProperty(event, "dataTransfer", {
    configurable: true,
    value: {
      effectAllowed: "",
    },
  });
  target.dispatchEvent(event);
  return event;
}

let ui: ReturnType<typeof createUi>;

beforeEach(() => {
  setupMinimalDom();
  appState.pipeline = [];
  ui = createUi();
  buildProcessorSelectOptions(ui.processorSelect, PROCESSOR_REGISTRY);
  renderPipelineStepList(
    ui.pipelineStepList,
    appState.pipeline,
    PROCESSOR_REGISTRY,
  );

  const deps = { ui, appState, processorRegistry: PROCESSOR_REGISTRY };
  bindInputEvent(deps);
  bindPipelineEvent(deps);
  bindOutputEvent(deps);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ui.inputCopyBtn.onclick", () => {
  describe("正常系", () => {
    test('input.value="" / 空文字をそのままコピーする', () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.input.value = "";
      ui.inputCopyBtn.click();

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith("");
    });

    test("input.value が1行 / そのままコピーする", () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.input.value = "a";
      ui.inputCopyBtn.click();

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith("a");
    });

    test("input.value が複数行 / 改行を維持してコピーする", () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.input.value = "a\nb";
      ui.inputCopyBtn.click();

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith("a\nb");
    });
  });
});

describe("ui.inputOpenBtn.onclick", () => {
  describe("正常系", () => {
    test("input.value が1行 / 1件だけ開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.input.value = "https://example.com";
      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
    });

    test("input.value が複数行 / 上から順に複数件開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.input.value = "https://example.com\nhttps://example.org";
      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("各行の前後に空白がある / trim 後の値を開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.input.value = " https://example.com \n https://example.org ";
      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("空行を含む / 空行を除外して開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.input.value = "https://example.com\n";
      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });

    test("空白だけの行と通常行が混在 / 通常行だけ開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.input.value = "https://example.com\n  \nhttps://example.org";
      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("URLでない文字列を含む / 非空文字列としてそのまま開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.input.value = "example.com";
      ui.inputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("example.com", "_blank");
    });
  });

  describe("異常系", () => {
    test('input.value="" / 1件も開かない', () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.input.value = "";
      ui.inputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("空白だけの行しかない / 1件も開かない", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.input.value = "  \n \t ";
      ui.inputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });
  });
});

describe("ui.pipelineStepList.onclick", () => {
  describe("正常系", () => {
    test("steps.length=3 / 先頭の削除ボタン押下で削除する", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const deleteBtns = ui.pipelineStepList.querySelectorAll(
        ".pipeline-delete-btn",
      );
      (deleteBtns[0] as HTMLButtonElement).click();

      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "filterEmpty",
        "excludePrevious",
      ]);

      const items = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(items).toHaveLength(2);
      expect(items[0].dataset.index).toBe("0");
      expect(items[1].dataset.index).toBe("1");
    });

    test("steps.length=3 / 中間の削除ボタン押下で削除する", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const deleteBtns = ui.pipelineStepList.querySelectorAll(
        ".pipeline-delete-btn",
      );
      (deleteBtns[1] as HTMLButtonElement).click();

      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "trim",
        "excludePrevious",
      ]);

      const items = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(items).toHaveLength(2);
      expect(items[0].dataset.index).toBe("0");
      expect(items[1].dataset.index).toBe("1");
    });

    test("steps.length=3 / 末尾の削除ボタン押下で削除する", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const deleteBtns = ui.pipelineStepList.querySelectorAll(
        ".pipeline-delete-btn",
      );
      (deleteBtns[2] as HTMLButtonElement).click();

      const items = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(items).toHaveLength(2);
      expect(items[0].dataset.index).toBe("0");
      expect(items[1].dataset.index).toBe("1");
    });
  });

  describe("異常系", () => {
    test("削除ボタン以外をクリック / 何もしない", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const item = ui.pipelineStepList.querySelector(
        ".pipeline-step-item",
      ) as HTMLDivElement;
      item.click();

      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "trim",
        "filterEmpty",
        "excludePrevious",
      ]);

      const items = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(items).toHaveLength(3);
      expect(items[0].dataset.index).toBe("0");
      expect(items[1].dataset.index).toBe("1");
      expect(items[2].dataset.index).toBe("2");
    });

    test('data-index="-1" の削除ボタンをクリック / 何もしない', () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const deleteBtns = ui.pipelineStepList.querySelectorAll(
        ".pipeline-delete-btn",
      );
      const deleteBtn = deleteBtns[0] as HTMLButtonElement;
      deleteBtn.dataset.index = "-1";
      deleteBtn.click();

      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "trim",
        "filterEmpty",
        "excludePrevious",
      ]);

      const items = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(items).toHaveLength(3);
      expect(items[0].dataset.index).toBe("0");
      expect(items[1].dataset.index).toBe("1");
      expect(items[2].dataset.index).toBe("2");
    });

    test('data-index="abc" の削除ボタンをクリック / 何もしない', () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const deleteBtns = ui.pipelineStepList.querySelectorAll(
        ".pipeline-delete-btn",
      );
      const deleteBtn = deleteBtns[0] as HTMLButtonElement;
      deleteBtn.dataset.index = "abc";
      deleteBtn.click();

      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "trim",
        "filterEmpty",
        "excludePrevious",
      ]);

      const items = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(items).toHaveLength(3);
      expect(items[0].dataset.index).toBe("0");
      expect(items[1].dataset.index).toBe("1");
      expect(items[2].dataset.index).toBe("2");
    });
  });
});

describe("ui.pipelineStepList.ondragend", () => {
  describe("正常系", () => {
    test("dragging クラスありで dragend / dragging クラスを外す", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();

      const item = ui.pipelineStepList.querySelector(
        ".pipeline-step-item",
      ) as HTMLElement;

      dispatchDragEvent(item, "dragstart");
      expect(item.classList.contains("dragging")).toBe(true);
      dispatchDragEvent(item, "dragend");
      expect(item.classList.contains("dragging")).toBe(false);
    });
  });

  describe("異常系", () => {
    test("dragging クラスなしで dragend / 何もしない", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();

      const item = ui.pipelineStepList.querySelector(
        ".pipeline-step-item",
      ) as HTMLElement;

      expect(item.classList.contains("dragging")).toBe(false);
      dispatchDragEvent(item, "dragend");
      expect(item.classList.contains("dragging")).toBe(false);
    });

    test("ステップ要素以外で dragend / 何もしない", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();

      const item = ui.pipelineStepList.querySelector(
        ".pipeline-step-item",
      ) as HTMLElement;

      dispatchDragEvent(ui.pipelineStepList, "dragend");
      expect(item.classList.contains("dragging")).toBe(false);
    });
  });
});

describe("ui.pipelineStepList.ondragover", () => {
  describe("正常系", () => {
    test("draggingIndex=0 / overIndex=1 / 0番目を1番目へ移動する", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const items = ui.pipelineStepList.querySelectorAll(".pipeline-step-item");
      const draggingItem = items[0] as HTMLElement;
      const overItem = items[1] as HTMLElement;

      dispatchDragEvent(draggingItem, "dragstart");
      const event = dispatchDragEvent(overItem, "dragover");

      expect(event.defaultPrevented).toBe(true);
      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "filterEmpty",
        "trim",
        "excludePrevious",
      ]);

      const reorderedItems = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(reorderedItems).toHaveLength(3);
      expect(reorderedItems[0].dataset.index).toBe("0");
      expect(reorderedItems[1].dataset.index).toBe("1");
      expect(reorderedItems[2].dataset.index).toBe("2");
    });

    test("draggingIndex=0 / overIndex=2 / 0番目を2番目へ移動する", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const items = ui.pipelineStepList.querySelectorAll(".pipeline-step-item");
      const draggingItem = items[0] as HTMLElement;
      const overItem = items[2] as HTMLElement;

      dispatchDragEvent(draggingItem, "dragstart");
      const event = dispatchDragEvent(overItem, "dragover");

      expect(event.defaultPrevented).toBe(true);
      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "filterEmpty",
        "excludePrevious",
        "trim",
      ]);

      const reorderedItems = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(reorderedItems).toHaveLength(3);
      expect(reorderedItems[0].dataset.index).toBe("0");
      expect(reorderedItems[1].dataset.index).toBe("1");
      expect(reorderedItems[2].dataset.index).toBe("2");
    });

    test("draggingIndex=1 / overIndex=0 / 1番目を0番目へ移動する", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const items = ui.pipelineStepList.querySelectorAll(".pipeline-step-item");
      const draggingItem = items[1] as HTMLElement;
      const overItem = items[0] as HTMLElement;

      dispatchDragEvent(draggingItem, "dragstart");
      const event = dispatchDragEvent(overItem, "dragover");

      expect(event.defaultPrevented).toBe(true);
      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "filterEmpty",
        "trim",
        "excludePrevious",
      ]);

      const reorderedItems = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(reorderedItems).toHaveLength(3);
      expect(reorderedItems[0].dataset.index).toBe("0");
      expect(reorderedItems[1].dataset.index).toBe("1");
      expect(reorderedItems[2].dataset.index).toBe("2");
    });

    test("draggingIndex=1 / overIndex=2 / 1番目を2番目へ移動する", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const items = ui.pipelineStepList.querySelectorAll(".pipeline-step-item");
      const draggingItem = items[1] as HTMLElement;
      const overItem = items[2] as HTMLElement;

      dispatchDragEvent(draggingItem, "dragstart");
      const event = dispatchDragEvent(overItem, "dragover");

      expect(event.defaultPrevented).toBe(true);
      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "trim",
        "excludePrevious",
        "filterEmpty",
      ]);

      const reorderedItems = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(reorderedItems).toHaveLength(3);
      expect(reorderedItems[0].dataset.index).toBe("0");
      expect(reorderedItems[1].dataset.index).toBe("1");
      expect(reorderedItems[2].dataset.index).toBe("2");
    });

    test("draggingIndex=2 / overIndex=0 / 2番目を0番目へ移動する", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const items = ui.pipelineStepList.querySelectorAll(".pipeline-step-item");
      const draggingItem = items[2] as HTMLElement;
      const overItem = items[0] as HTMLElement;

      dispatchDragEvent(draggingItem, "dragstart");
      const event = dispatchDragEvent(overItem, "dragover");

      expect(event.defaultPrevented).toBe(true);
      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "excludePrevious",
        "trim",
        "filterEmpty",
      ]);

      const reorderedItems = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(reorderedItems).toHaveLength(3);
      expect(reorderedItems[0].dataset.index).toBe("0");
      expect(reorderedItems[1].dataset.index).toBe("1");
      expect(reorderedItems[2].dataset.index).toBe("2");
    });

    test("draggingIndex=2 / overIndex=1 / 2番目を1番目へ移動する", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();

      const items = ui.pipelineStepList.querySelectorAll(".pipeline-step-item");
      const draggingItem = items[2] as HTMLElement;
      const overItem = items[1] as HTMLElement;

      dispatchDragEvent(draggingItem, "dragstart");
      const event = dispatchDragEvent(overItem, "dragover");

      expect(event.defaultPrevented).toBe(true);
      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "trim",
        "excludePrevious",
        "filterEmpty",
      ]);

      const reorderedItems = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(reorderedItems).toHaveLength(3);
      expect(reorderedItems[0].dataset.index).toBe("0");
      expect(reorderedItems[1].dataset.index).toBe("1");
      expect(reorderedItems[2].dataset.index).toBe("2");
    });
  });

  describe("異常系", () => {
    test("draggingIndex=null / 何もしない", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();

      const items = ui.pipelineStepList.querySelectorAll(".pipeline-step-item");
      const draggingItem = items[0] as HTMLElement;
      const overItem = items[1] as HTMLElement;

      expect(draggingItem.dataset.index).toBe("0");
      dispatchDragEvent(overItem, "dragover");

      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "trim",
        "filterEmpty",
      ]);

      const reorderedItems = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(reorderedItems).toHaveLength(2);
      expect(reorderedItems[0].dataset.index).toBe("0");
      expect(reorderedItems[1].dataset.index).toBe("1");
    });

    test("draggingIndex=overIndex / 何もしない", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();

      const items = ui.pipelineStepList.querySelectorAll(".pipeline-step-item");
      const draggingItem = items[0] as HTMLElement;
      const overItem = items[0] as HTMLElement;

      dispatchDragEvent(draggingItem, "dragstart");
      dispatchDragEvent(overItem, "dragover");

      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "trim",
        "filterEmpty",
      ]);

      const reorderedItems = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(reorderedItems).toHaveLength(2);
      expect(reorderedItems[0].dataset.index).toBe("0");
      expect(reorderedItems[1].dataset.index).toBe("1");
    });

    test("overItem がステップ要素以外 / 何もしない", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();

      const items = ui.pipelineStepList.querySelectorAll(".pipeline-step-item");
      const draggingItem = items[0] as HTMLElement;
      const overItem = ui.pipelineStepList;

      dispatchDragEvent(draggingItem, "dragstart");
      dispatchDragEvent(overItem, "dragover");

      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "trim",
        "filterEmpty",
      ]);

      const reorderedItems = ui.pipelineStepList.querySelectorAll<HTMLElement>(
        ".pipeline-step-item",
      );

      expect(reorderedItems).toHaveLength(2);
      expect(reorderedItems[0].dataset.index).toBe("0");
      expect(reorderedItems[1].dataset.index).toBe("1");
    });
  });
});

describe("ui.pipelineStepList.ondragstart", () => {
  describe("正常系", () => {
    test('dragging クラスを付与 / effectAllowed="move" を設定', () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();

      const item = ui.pipelineStepList.querySelector(
        ".pipeline-step-item",
      ) as HTMLElement;

      const dataTransfer = { effectAllowed: "" };
      const event = new Event("dragstart", {
        bubbles: true,
        cancelable: true,
      }) as DragEvent;
      Object.defineProperty(event, "dataTransfer", {
        configurable: true,
        value: dataTransfer,
      });

      item.dispatchEvent(event);

      expect(item.classList.contains("dragging")).toBe(true);
      expect(dataTransfer.effectAllowed).toBe("move");
    });
  });

  describe("異常系", () => {
    test("dataTransfer なしの dragstart / dragging クラスを付与", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();

      const item = ui.pipelineStepList.querySelector(
        ".pipeline-step-item",
      ) as HTMLElement;

      const event = new Event("dragstart", {
        bubbles: true,
        cancelable: true,
      }) as DragEvent;

      item.dispatchEvent(event);

      expect(item.classList.contains("dragging")).toBe(true);
    });

    test('data-index="abc" のステップで dragstart / dragging クラスを付与', () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();

      const item = ui.pipelineStepList.querySelector(
        ".pipeline-step-item",
      ) as HTMLElement;
      item.dataset.index = "abc";

      const dataTransfer = { effectAllowed: "" };
      const event = new Event("dragstart", {
        bubbles: true,
        cancelable: true,
      }) as DragEvent;
      Object.defineProperty(event, "dataTransfer", {
        configurable: true,
        value: dataTransfer,
      });

      item.dispatchEvent(event);

      expect(item.classList.contains("dragging")).toBe(true);
      expect(dataTransfer.effectAllowed).toBe("move");
    });

    test("ステップ要素以外で dragstart / 何もしない", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();

      const item = ui.pipelineStepList.querySelector(
        ".pipeline-step-item",
      ) as HTMLElement;

      const dataTransfer = { effectAllowed: "" };
      const event = new Event("dragstart", {
        bubbles: true,
        cancelable: true,
      }) as DragEvent;
      Object.defineProperty(event, "dataTransfer", {
        configurable: true,
        value: dataTransfer,
      });

      ui.pipelineStepList.dispatchEvent(event);

      expect(item.classList.contains("dragging")).toBe(false);
    });
  });
});

describe("ui.pipelineStepList.oninput", () => {
  describe("正常系", () => {
    test("number input の変更 / 対応 params を number で更新する", () => {
      ui.processorSelect.value = "pickRandom";
      ui.addStepBtn.click();

      const input = ui.pipelineStepList.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement;
      input.value = "10";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      expect(appState.pipeline[0].params).toEqual({ count: 10 });
    });

    test("text input の変更 / 対応 params を string で更新する", () => {
      appState.pipeline = [{ id: "trim", params: { label: "old" } }];
      ui.pipelineStepList.innerHTML = "";

      const input = document.createElement("input");
      input.type = "text";
      input.value = "new";
      input.dataset.index = "0";
      input.dataset.key = "label";
      ui.pipelineStepList.appendChild(input);

      input.dispatchEvent(new Event("input", { bubbles: true }));

      expect(appState.pipeline[0].params).toEqual({ label: "new" });
    });

    test("既存 params あり / 指定 key だけ更新して他 params は維持する", () => {
      appState.pipeline = [{ id: "pickRandom", params: { count: 3 } }];
      renderPipelineStepList(
        ui.pipelineStepList,
        appState.pipeline,
        PROCESSOR_REGISTRY,
      );

      const input = ui.pipelineStepList.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement;
      input.value = "5";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      expect(appState.pipeline[0].params).toEqual({ count: 5 });
    });

    test("steps.length=2 / 対象 index の step だけ更新する", () => {
      appState.pipeline = [
        { id: "pickRandom", params: { count: 3 } },
        { id: "pickRandom" },
      ];
      renderPipelineStepList(
        ui.pipelineStepList,
        appState.pipeline,
        PROCESSOR_REGISTRY,
      );

      const inputs = ui.pipelineStepList.querySelectorAll(
        'input[type="number"]',
      );
      const second = inputs[1] as HTMLInputElement;
      second.value = "7";
      second.dispatchEvent(new Event("input", { bubbles: true }));

      expect(appState.pipeline[0].params).toEqual({ count: 3 });
      expect(appState.pipeline[1].params).toEqual({ count: 7 });
    });
  });

  describe("異常系", () => {
    test("INPUT 以外から input イベント / 何もしない", () => {
      ui.processorSelect.value = "pickRandom";
      ui.addStepBtn.click();

      const item = ui.pipelineStepList.querySelector(
        ".pipeline-step-item",
      ) as HTMLElement;
      item.dispatchEvent(new Event("input", { bubbles: true }));

      expect(appState.pipeline[0].params).toBeUndefined();
    });

    test("data-index なしの INPUT / 何もしない", () => {
      ui.processorSelect.value = "pickRandom";
      ui.addStepBtn.click();

      const input = ui.pipelineStepList.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement;
      delete input.dataset.index;
      input.value = "4";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      expect(appState.pipeline[0].params).toBeUndefined();
    });

    test("data-key なしの INPUT / 何もしない", () => {
      ui.processorSelect.value = "pickRandom";
      ui.addStepBtn.click();

      const input = ui.pipelineStepList.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement;
      delete input.dataset.key;
      input.value = "4";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      expect(appState.pipeline[0].params).toBeUndefined();
    });

    test("data-index が範囲外 / 何もしない", () => {
      ui.processorSelect.value = "pickRandom";
      ui.addStepBtn.click();

      const input = ui.pipelineStepList.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement;
      input.dataset.index = "10";
      input.value = "4";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      expect(appState.pipeline[0].params).toBeUndefined();
    });

    test('number input.value="" / NaN で更新する', () => {
      ui.processorSelect.value = "pickRandom";
      ui.addStepBtn.click();

      const input = ui.pipelineStepList.querySelector(
        'input[type="number"]',
      ) as HTMLInputElement;
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      expect(Number.isNaN(appState.pipeline[0].params?.count as number)).toBe(
        true,
      );
    });
  });
});

describe("ui.addStepBtn.onclick", () => {
  describe("正常系", () => {
    test('processorSelect.value="trim" / 末尾に1件追加する', () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();

      expect(appState.pipeline.map((step) => step.id)).toEqual(["trim"]);
      expect(
        ui.pipelineStepList.querySelectorAll(".pipeline-step-item"),
      ).toHaveLength(1);
    });

    test("2回連続クリック / 追加順のまま2件になる", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();

      expect(appState.pipeline.map((step) => step.id)).toEqual([
        "trim",
        "filterEmpty",
      ]);
      expect(
        ui.pipelineStepList.querySelectorAll(".pipeline-step-item"),
      ).toHaveLength(2);
    });

    test("steps.length=0 / 空メッセージ表示からステップ表示に切り替わる", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();

      expect(
        ui.pipelineStepList.querySelector(".pipeline-empty-msg"),
      ).toBeNull();
      expect(
        ui.pipelineStepList.querySelector(".pipeline-step-item"),
      ).not.toBeNull();
    });

    test("追加後 / 追加した step の表示名が描画される", () => {
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();

      expect(
        ui.pipelineStepList.querySelector(".pipeline-step-name")?.textContent,
      ).toBe("空白削除");
    });
  });

  describe("異常系", () => {
    test("processorSelect.value が未登録 id / 何もしない", () => {
      ui.processorSelect.value = "unknown";
      ui.addStepBtn.click();

      const items = ui.pipelineStepList.querySelectorAll(".pipeline-step-item");
      expect(appState.pipeline).toHaveLength(0);
      expect(items).toHaveLength(0);
      expect(
        ui.pipelineStepList.querySelector(".pipeline-empty-msg"),
      ).not.toBeNull();
    });

    test("processorSelect.value が未登録 id / pipeline を変更しない", () => {
      ui.processorSelect.value = "unknown";
      ui.addStepBtn.click();

      const items = ui.pipelineStepList.querySelectorAll(".pipeline-step-item");
      expect(appState.pipeline).toEqual([]);
      expect(items).toHaveLength(0);
      expect(
        ui.pipelineStepList.querySelector(".pipeline-empty-msg"),
      ).not.toBeNull();
    });
  });
});

describe("ui.pipelineRunBtn.onclick", () => {
  describe("正常系", () => {
    test("steps.length=0 / input.value をそのまま output.value に設定する", () => {
      ui.input.value = "a";
      ui.pipelineRunBtn.click();

      expect(ui.output.value).toBe("a");
    });

    test("trim 1件 / trim 結果を output.value に設定する", () => {
      ui.input.value = " a ";
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.pipelineRunBtn.click();

      expect(ui.output.value).toBe("a");
    });

    test("trim -> filterEmpty / 複数 step を順に実行する", () => {
      ui.input.value = " a \n\n b ";
      ui.processorSelect.value = "trim";
      ui.addStepBtn.click();
      ui.processorSelect.value = "filterEmpty";
      ui.addStepBtn.click();
      ui.pipelineRunBtn.click();

      expect(ui.output.value).toBe("a\nb");
    });

    test("excludePrevious 1件 / 実行前の output.value を previousOutput として使う", () => {
      ui.input.value = "a\nb";
      ui.output.value = "b";
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();
      ui.pipelineRunBtn.click();

      expect(ui.output.value).toBe("a");
    });

    test("1回目実行後に input.value を変更 / 2回目は最新 input.value を使う", () => {
      ui.input.value = "a";
      ui.pipelineRunBtn.click();
      ui.input.value = "b";
      ui.pipelineRunBtn.click();

      expect(ui.output.value).toBe("b");
    });

    test("1回目実行後の output.value がある / 2回目は最新 output.value を previousOutput として使う", () => {
      ui.input.value = "a\nb";
      ui.processorSelect.value = "excludePrevious";
      ui.addStepBtn.click();
      ui.output.value = "b";
      ui.pipelineRunBtn.click();

      expect(ui.output.value).toBe("a");
    });
  });

  describe("異常系", () => {
    test("input.value が1行 / 未登録 step.id を無視して実行する", () => {
      appState.pipeline = [{ id: "unknown" }, { id: "trim" }];
      renderPipelineStepList(
        ui.pipelineStepList,
        appState.pipeline,
        PROCESSOR_REGISTRY,
      );
      ui.input.value = " a ";
      ui.pipelineRunBtn.click();

      expect(ui.output.value).toBe("a");
    });

    test("input.value が複数行 / 未登録 step.id を無視して実行する", () => {
      appState.pipeline = [{ id: "unknown" }, { id: "trim" }];
      renderPipelineStepList(
        ui.pipelineStepList,
        appState.pipeline,
        PROCESSOR_REGISTRY,
      );
      ui.input.value = "a\nb";

      ui.pipelineRunBtn.click();

      expect(ui.output.value).toBe("a\nb");
    });
  });
});

describe("ui.outputCopyBtn.onclick", () => {
  describe("正常系", () => {
    test('output.value="" / 空文字をそのままコピーする', () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.output.value = "";
      ui.outputCopyBtn.click();

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith("");
    });

    test("output.value が1行 / そのままコピーする", () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.output.value = "a";
      ui.outputCopyBtn.click();

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith("a");
    });

    test("output.value が複数行 / 改行を維持してコピーする", () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      ui.output.value = "a\nb";
      ui.outputCopyBtn.click();

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith("a\nb");
    });
  });
});

describe("ui.outputOpenBtn.onclick", () => {
  describe("正常系", () => {
    test("output.value が1行 / 1件だけ開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.output.value = "https://example.com";
      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
    });

    test("output.value が複数行 / 上から順に複数件開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.output.value = "https://example.com\nhttps://example.org";
      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("各行の前後に空白がある / trim 後の値を開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.output.value = " https://example.com \n https://example.org ";
      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("空行を含む / 空行を除外して開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.output.value = "https://example.com\n";
      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("https://example.com", "_blank");
    });

    test("空白だけの行と通常行が混在 / 通常行だけ開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.output.value = "https://example.com\n  \nhttps://example.org";
      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://example.org", "_blank");
    });

    test("URLでない文字列を含む / 非空文字列としてそのまま開く", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.output.value = "example.com";
      ui.outputOpenBtn.click();

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledWith("example.com", "_blank");
    });
  });

  describe("異常系", () => {
    test('output.value="" / 1件も開かない', () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.output.value = "";
      ui.outputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });

    test("空白だけの行しかない / 1件も開かない", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);

      ui.output.value = "  \n \t ";
      ui.outputOpenBtn.click();

      expect(open).not.toHaveBeenCalled();
    });
  });
});
