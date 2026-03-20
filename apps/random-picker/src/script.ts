import type { UI } from "./type.ts";
import {
  buildProcessorSelectOptions,
  createUi,
  renderPipelineStepList,
} from "./dom.ts";
import { bindInputEvent, bindOutputEvent, bindPipelineEvent } from "./event.ts";
import { PROCESSOR_REGISTRY } from "./processor-registry.ts";
import { appState } from "./state.ts";

/**
 * アプリを初期化する
 */
export function initApp(ui: UI = createUi()): UI {
  appState.pipeline = [];

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

  return ui;
}
