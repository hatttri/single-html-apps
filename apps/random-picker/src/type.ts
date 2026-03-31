/** アプリケーションの状態 */
export type AppState = {
  pipeline: PipelineStep[];
};

/** イベント結線で受け渡す依存関係 */
export type EventDeps = {
  ui: UI;
  appState: AppState;
  processorRegistry: ProcessorRegistry;
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

/** プロセッサの登録表 */
export type ProcessorRegistry = Record<string, ProcessorDef>;

/** 文字列配列を受け取り、加工して返す処理関数の型 */
export type StringArrayProcessor = (items: string[]) => string[];

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
