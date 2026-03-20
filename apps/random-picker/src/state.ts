import type { AppState } from "./type.ts";

/** アプリケーションのグローバル状態（初期値は空のパイプライン） */
export const appState: AppState = {
  pipeline: [],
};
