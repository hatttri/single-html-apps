# Random Picker リファクタリング実装指示書

## 目的

`apps/random-picker/src/script.ts` に集中している型定義・状態・プロセッサ・パイプラインロジック・ブラウザ副作用・DOM描画・イベント結線を分割し、**責務ごとに別ファイルへ移動**する。
同時に `apps/random-picker/tests/unit.test.ts` と `apps/random-picker/tests/integration.test.ts` を廃止し、**unit と integration を明確に分離した複数ファイル構成**へ変更する。
**挙動変更はしない。UI・仕様・文言・HTML ID・CSS class は変えない。**

---

## 最重要ルール

1. **これは挙動維持のためのリファクタリングである。**
   仕様変更・UI変更・文言変更・バグ修正を同時に入れないこと。

2. **`apps/random-picker/build/build.ts` のエントリーポイントは変えない。**
   引き続き `../src/script.ts` を bundle 対象にすること。
   `script.ts` は最終的に **エントリーポイント専用** にする。

3. **`index.html` と `style.css` は変更しない。**
   今回の作業は TypeScript とテストと設定ファイルだけに限定する。

4. **`appState` は `state.ts` にだけ定義する。**
   他ファイルで新たに状態変数を定義しない。

5. **`PROCESSOR_REGISTRY` は `processor-registry.ts` にだけ定義する。**
   `state.ts` に置かない。

6. **`event.ts` は `appState` や `PROCESSOR_REGISTRY` を直接 import しない。**
   `deps` 経由で受け取ること。
   ただし、純粋関数や描画関数は通常 import してよい。

7. **`pipeline.ts` は `PROCESSOR_REGISTRY` を直接 import しない。**
   `executePipeline` は registry を引数で受け取る形に変更すること。
   これにより循環依存を防ぐ。

8. **テストはレベルで分ける。**
   - unit: 関数単体
   - integration: イベントと複数モジュール連携
   - e2e: Playwright
     この境界を崩さない。

9. **旧ファイルを残さない。**
   最終状態で `apps/random-picker/tests/unit.test.ts` と `apps/random-picker/tests/integration.test.ts` は削除されていること。

10. **関数順は原則アルファベット順。**
    ただし `event.ts` の bind/handler 群だけは **DOM の出現順** を優先する。

---

## 最終ディレクトリ構成

最終状態は次の構成にすること。

```txt
apps/random-picker/
  build/
    build.ts
  generated/
    index.html
  src/
    browser.ts
    dom.ts
    event.ts
    index.html
    pipeline.ts
    processor-registry.ts
    processor.ts
    script.ts
    state.ts
    style.css
    type.ts
  tests/
    e2e.spec.ts
    integration/
      event.test.ts
      script.test.ts
    unit/
      browser.test.ts
      dom.test.ts
      pipeline.test.ts
      processor-registry.test.ts
      processor.test.ts
```

---

## 依存関係ルール

以下の依存方向を守ること。これを崩すと循環依存や責務混在が発生する。

| ファイル                | 役割                     | import してよいもの                                                  | import してはいけないもの                                              |
| ----------------------- | ------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `type.ts`               | 型定義                   | なし                                                                 | 全部                                                                   |
| `state.ts`              | グローバル状態           | `type.ts`                                                            | `processor-registry.ts`, `dom.ts`, `event.ts`, `script.ts`             |
| `processor.ts`          | 文字列配列変換処理       | `type.ts` の型のみ                                                   | `state.ts`, `dom.ts`, `event.ts`, `script.ts`                          |
| `pipeline.ts`           | パイプライン構成・実行   | `type.ts`                                                            | `processor-registry.ts`, `state.ts`, `dom.ts`, `event.ts`, `script.ts` |
| `processor-registry.ts` | プロセッサ定義表         | `type.ts`, `processor.ts`, `pipeline.ts`                             | `state.ts`, `dom.ts`, `event.ts`, `script.ts`                          |
| `browser.ts`            | clipboard / window.open  | なし                                                                 | `state.ts`, `dom.ts`, `event.ts`, `script.ts`                          |
| `dom.ts`                | DOM取得と描画            | `type.ts`                                                            | `state.ts`, `event.ts`, `script.ts`                                    |
| `event.ts`              | イベント結線とハンドラー | `type.ts`, `pipeline.ts`, `browser.ts`, `dom.ts`                     | `state.ts`, `processor-registry.ts`, `script.ts`                       |
| `script.ts`             | 初期化だけ               | `type.ts`, `state.ts`, `processor-registry.ts`, `dom.ts`, `event.ts` | 逆方向 import                                                          |

---

## ソースコードの実装指示

## 1. `apps/random-picker/src/type.ts` を新規作成

### このファイルに置くもの

現在の `script.ts` から以下の型定義を移動する。

- `AppState`
- `ParamFieldSchema`
- `PipelineContext`
- `PipelineStep`
- `ProcessorDef`
- `ProcessorParams`
- `StringArrayProcessor`
- `UI`

### このファイルで新規追加する型

新しく次を追加する。

- `ProcessorRegistry = Record<string, ProcessorDef>`
- `EventDeps`

### `EventDeps` の内容

`EventDeps` は次を持つこと。

```ts
type EventDeps = {
  ui: UI;
  appState: AppState;
  processorRegistry: ProcessorRegistry;
};
```

### 注意

- `type.ts` には **関数を1つも置かない**。
- `const` や `let` を置かない。
- DOM 要素取得処理や registry 実体を置かない。

---

## 2. `apps/random-picker/src/state.ts` を新規作成

### このファイルに置くもの

現在の `script.ts` にある `appState` をここへ移動する。

### 最終責務

- `appState` の定義だけ

### 注意

- `PROCESSOR_REGISTRY` を置かない。
- ここに関数を増やさない。
- 初期値は現状維持で `pipeline: []`。

---

## 3. `apps/random-picker/src/processor.ts` を新規作成

### このファイルに置くもの

現在の `script.ts` から次の関数を移動する。

- `filterEmptyStrings`
- `pickRandomItems`
- `removeExcludedItems`
- `trimStrings`

### ルール

- **「文字列配列を受け取って文字列配列を返す加工処理」だけ**を置くこと。
- 関数本体のロジックは変更しない。
- 例外条件や `Math.random` の扱いも変更しない。

### 注意

- `splitByNewline` はここに置かない。
  これはユーティリティ兼パイプライン補助なので `pipeline.ts` に置く。
- `PROCESSOR_REGISTRY` はここに置かない。

---

## 4. `apps/random-picker/src/pipeline.ts` を新規作成

### このファイルに置くもの

現在の `script.ts` から次の関数を移動する。

- `addPipelineStep`
- `applyStringArrayProcessors`
- `executePipeline`
- `joinByNewline`
- `movePipelineStep`
- `removePipelineStep`
- `resolveParams`
- `splitByNewline`
- `updatePipelineStepParam`

### 重要な変更

`executePipeline` は **`PROCESSOR_REGISTRY` を直接 import しない**。
代わりに registry を引数で受け取るように変更する。

### 新しい `executePipeline` の形

```ts
executePipeline(
  inputText: string,
  steps: PipelineStep[],
  context: PipelineContext,
  processorRegistry: ProcessorRegistry,
): string
```

### 必須ルール

- `pipeline.ts` から `processor-registry.ts` を import しない。
- `pipeline.ts` から `state.ts` を import しない。
- ここに DOM 操作を置かない。

---

## 5. `apps/random-picker/src/processor-registry.ts` を新規作成

### このファイルに置くもの

現在の `script.ts` にある `PROCESSOR_REGISTRY` をここへ移動する。

### import 先

このファイルは次を import する。

- `ProcessorRegistry` など型 (`type.ts`)
- `filterEmptyStrings`
- `pickRandomItems`
- `removeExcludedItems`
- `trimStrings`
- `splitByNewline`

### `excludePrevious` について

現状と同じく、`context.previousOutput` を `splitByNewline` で分割し、`removeExcludedItems` に渡すこと。
挙動は変えない。

### 注意

- `appState` は import しない。
- DOM 関数は import しない。
- ここは **定義テーブルだけ**にする。

---

## 6. `apps/random-picker/src/browser.ts` を新規作成

### このファイルに置くもの

現在の `script.ts` から次を移動する。

- `copyTextToClipboard`
- `openUrls`

### 注意

- シグネチャは現状維持。
- `window.open(url, "_blank")` も現状維持。
- バリデーション追加や `noopener` 追加などの仕様変更は今回は入れない。

---

## 7. `apps/random-picker/src/dom.ts` を新規作成

### このファイルに置くもの

現在の `script.ts` から次を移動する。

- `buildProcessorSelectOptions`
- `createUi`
- `getElementByIdOrThrow`
- `renderOutput`
- `renderPipelineStepList`

### ルール

- DOM 取得と DOM 描画だけを担当する。
- `appState` を直接読まない。
- 受け取った引数だけで描画する。

### 注意

- HTML ID 名は一切変更しない。
- class 名も一切変更しない。
- `renderPipelineStepList` の DOM 構造・属性・文言は変更しない。

---

## 8. `apps/random-picker/src/event.ts` を新規作成

### このファイルの役割

`initApp` 内に匿名関数で書かれているイベントリスナーを、**bind 関数 + private handler** に分離する。

### export する関数

次の3つだけを export すること。

- `bindInputEvent`
- `bindPipelineEvent`
- `bindOutputEvent`

### export しない private handler

次の handler を `event.ts` 内部関数として作ること。
**export しないこと。**

- `handleInputCopyBtnClick`
- `handleInputOpenBtnClick`
- `handlePipelineStepListClick`
- `handlePipelineStepListDragEnd`
- `handlePipelineStepListDragOver`
- `handlePipelineStepListDragStart`
- `handlePipelineStepListInput`
- `handleAddStepBtnClick`
- `handlePipelineRunBtnClick`
- `handleOutputCopyBtnClick`
- `handleOutputOpenBtnClick`

### bind 関数の考え方

- `bindInputEvent(deps)` は入力欄まわりのイベントだけを結線する。
- `bindPipelineEvent(deps)` はパイプライン欄まわりのイベントだけを結線する。
- `bindOutputEvent(deps)` は出力欄まわりのイベントだけを結線する。

### `deps` の扱い

- `event.ts` は `EventDeps` を受け取って処理する。
- `event.ts` 自身は `appState` や `PROCESSOR_REGISTRY` を import しない。
- `deps.ui`, `deps.appState`, `deps.processorRegistry` を使う。

### `draggingIndex` の扱い

- これは `appState` に入れない。
- `event.ts` のモジュールスコープにも置かない。
- **`bindPipelineEvent` のローカル変数として閉じ込めること。**

### 重要

`event.ts` は **グローバル直触り禁止**。
つまり以下のような書き方は禁止。

```ts
import { appState } from "./state.ts";
import { PROCESSOR_REGISTRY } from "./processor-registry.ts";
```

この書き方はしないこと。

### 例外

純粋関数・描画関数は通常 import してよい。
例:

- `addPipelineStep`
- `applyStringArrayProcessors`
- `copyTextToClipboard`
- `executePipeline`
- `filterEmptyStrings`
- `movePipelineStep`
- `openUrls`
- `removePipelineStep`
- `renderOutput`
- `renderPipelineStepList`
- `splitByNewline`
- `trimStrings`
- `updatePipelineStepParam`

### DOM順ルール

`event.ts` の bind/handler は DOM の出現順に並べること。
このファイルだけはアルファベット順ではなく DOM 順を優先してよい。

---

## 9. `apps/random-picker/src/script.ts` を置き換える

### このファイルの最終責務

- `initApp` だけを export する
- UI 作成
- state 初期化
- select 初期化
- 初期描画
- `deps` 作成
- `bind*` 呼び出し

### `script.ts` に残してよいもの

- `initApp`

### `script.ts` から削除するもの

以下は **すべて他ファイルへ移動**すること。

- 型定義全部
- `appState`
- `PROCESSOR_REGISTRY`
- 純粋ロジック全部
- browser 副作用全部
- DOM 関数全部
- イベントハンドラー全部

### `initApp` の処理順

`initApp` は次の順に実装すること。

1. `ui` を作る（引数がなければ `createUi()`）
2. `appState.pipeline = []` で状態を初期化
3. `buildProcessorSelectOptions(ui.processorSelect, PROCESSOR_REGISTRY)`
4. `renderPipelineStepList(ui.pipelineStepList, appState.pipeline, PROCESSOR_REGISTRY)`
5. `deps` を作る
6. `bindInputEvent(deps)`
7. `bindPipelineEvent(deps)`
8. `bindOutputEvent(deps)`
9. `ui` を返す

### 注意

- `renderOutput` を初期化時に追加で呼ばない。現状仕様を変えないため。
- `RandomPickerApp.initApp();` を build 時に使っているため、`initApp` export は必須。

---

## テスト再編成の実装指示

## 最終テスト構成

```txt
apps/random-picker/tests/
  e2e.spec.ts
  integration/
    event.test.ts
    script.test.ts
  unit/
    browser.test.ts
    dom.test.ts
    pipeline.test.ts
    processor-registry.test.ts
    processor.test.ts
```

---

## 旧テストファイルの扱い

### 最終的に削除するファイル

- `apps/random-picker/tests/unit.test.ts`
- `apps/random-picker/tests/integration.test.ts`

### 削除タイミング

**新しいテストファイルに内容を移したあとで削除**すること。
先に削除しないこと。

---

## unit テスト分割ルール

## 10. `apps/random-picker/tests/unit/processor.test.ts` を新規作成

### import 対象

- `filterEmptyStrings`
- `pickRandomItems`
- `removeExcludedItems`
- `trimStrings`

### 旧 `unit.test.ts` から移す describe

- `describe("filterEmptyStrings", ...)`
- `describe("pickRandomItems", ...)`
- `describe("removeExcludedItems", ...)`
- `describe("trimStrings", ...)`

### ルール

- 他モジュールとの連携テストを書かない。
- DOM を使わない。
- `initApp` を import しない。

---

## 11. `apps/random-picker/tests/unit/pipeline.test.ts` を新規作成

### import 対象

- `addPipelineStep`
- `applyStringArrayProcessors`
- `executePipeline`
- `joinByNewline`
- `movePipelineStep`
- `removePipelineStep`
- `resolveParams`
- `splitByNewline`
- `updatePipelineStepParam`
- `PROCESSOR_REGISTRY`
  ※ `executePipeline` のテストで registry 引数が必要になるため

### 旧 `unit.test.ts` から移す describe

- `describe("addPipelineStep", ...)`
- `describe("applyStringArrayProcessors", ...)`
- `describe("executePipeline", ...)`
- `describe("joinByNewline", ...)`
- `describe("movePipelineStep", ...)`
- `describe("removePipelineStep", ...)`
- `describe("resolveParams", ...)`
- `describe("splitByNewline", ...)`
- `describe("updatePipelineStepParam", ...)`

### 重要変更

`executePipeline` のテストは全件、**registry を第4引数で渡す形に書き換える**こと。

---

## 12. `apps/random-picker/tests/unit/processor-registry.test.ts` を新規作成

### import 対象

- `PROCESSOR_REGISTRY`

### 旧 `unit.test.ts` から移す describe

- `describe("PROCESSOR_REGISTRY", ...)`

### ルール

- registry 定義の存在確認と `execute` の単体動作だけに限定する。
- DOM を使わない。

---

## 13. `apps/random-picker/tests/unit/browser.test.ts` を新規作成

### import 対象

- `copyTextToClipboard`
- `openUrls`

### 旧 `unit.test.ts` から移す describe

- `describe("copyTextToClipboard", ...)`
- `describe("openUrls", ...)`

### ルール

- `navigator.clipboard.writeText`
- `window.open`
  をモックして単体責務だけ確認する。

---

## 14. `apps/random-picker/tests/unit/dom.test.ts` を新規作成

### import 対象

- `buildProcessorSelectOptions`
- `createUi`
- `getElementByIdOrThrow`
- `renderOutput`
- `renderPipelineStepList`
- `PROCESSOR_REGISTRY`
  ※ option 構築と描画で必要になるため

### 旧 `unit.test.ts` から移す describe

- `describe("buildProcessorSelectOptions", ...)`
- `describe("createUi", ...)`
- `describe("getElementByIdOrThrow", ...)`
- `describe("renderOutput", ...)`
- `describe("renderPipelineStepList", ...)`

### 注意

- `initApp` のテストはここに入れない。
- `initApp` は `script.test.ts` に置く。

---

## integration テスト分割ルール

## 15. `apps/random-picker/tests/integration/script.test.ts` を新規作成

### import 対象

- `initApp`

### セットアップ

現在の `integration.test.ts` と同様に、`src/index.html` から `<body>` 内 HTML を取り出して `document.body.innerHTML` に入れる方式を使うこと。

### 旧 `integration.test.ts` から移す describe

- `describe("initApp", ...)` のみ

### ルール

- `script.test.ts` では **`initApp` だけを直接テストする**。
- `bindInputEvent` などをここで直接呼ばない。
- ここでは起動時の最低限の確認だけを行う。
- イベント個別挙動は `event.test.ts` へ移す。

---

## 16. `apps/random-picker/tests/integration/event.test.ts` を新規作成

### import 対象

- `appState`
- `PROCESSOR_REGISTRY`
- `buildProcessorSelectOptions`
- `createUi`
- `renderPipelineStepList`
- `bindInputEvent`
- `bindPipelineEvent`
- `bindOutputEvent`

### 重要

`event.test.ts` では **`initApp` を使わない**。
代わりに次の手順でセットアップすること。

### `beforeEach` セットアップ手順

1. `document.body.innerHTML = bodyHtml`
2. `appState.pipeline = []`
3. `const ui = createUi()`
4. `buildProcessorSelectOptions(ui.processorSelect, PROCESSOR_REGISTRY)`
5. `renderPipelineStepList(ui.pipelineStepList, appState.pipeline, PROCESSOR_REGISTRY)`
6. `const deps = { ui, appState, processorRegistry: PROCESSOR_REGISTRY }`
7. `bindInputEvent(deps)`
8. `bindPipelineEvent(deps)`
9. `bindOutputEvent(deps)`

### 旧 `integration.test.ts` から移す describe

- `describe("ui.pipelineStepList.onclick", ...)`
- `describe("ui.pipelineStepList.ondragend", ...)`
- `describe("ui.pipelineStepList.ondragover", ...)`
- `describe("ui.pipelineStepList.ondragstart", ...)`
- `describe("ui.pipelineStepList.oninput", ...)`
- `describe("ui.addStepBtn.onclick", ...)`
- `describe("ui.pipelineRunBtn.onclick", ...)`
- `describe("ui.inputCopyBtn.onclick", ...)`
- `describe("ui.inputOpenBtn.onclick", ...)`
- `describe("ui.outputCopyBtn.onclick", ...)`
- `describe("ui.outputOpenBtn.onclick", ...)`

### ルール

- ここでは DOM event を発火して連携を見る。
- ただし Playwright は使わない。
- ブラウザ外部副作用だけモックする。
- `initApp` の責務と混ぜない。

---

## E2E テスト

## 17. `apps/random-picker/tests/e2e.spec.ts`

### 方針

このファイルは **原則そのまま残す**。
今回の作業は責務分割であり、UI の見た目・ID・文言・ユーザー挙動は変えないため、E2E のテスト内容は基本的に変更不要。

### 変更してよい範囲

- import 整理
- lint/format 対応
- 実装変更に伴って本当に必要な最小修正

### 変更してはいけないこと

- テストケース削除
- 挙動変更
- セレクタ変更
- テスト名称変更（不要な場合）

---

## 設定ファイル変更指示

## 18. `package.json` を変更

### 目的

unit / integration / e2e を明確に分けて実行できるようにする。

### 必須変更

`scripts` を次の方針に変更すること。

- `test` は **unit → integration → e2e** の順に実行する
- `test:integration` を追加する
- `precommit` はそのまま `npm run test` を呼ぶので、結果的に integration も通るようにする

### 期待する最終形

少なくとも以下の意味になるようにすること。

```json
{
  "scripts": {
    "build": "node scripts/build-all.ts",
    "concat": "node scripts/concat-all.ts . generated/concat.txt",
    "format": "prettier --write .",
    "precommit": "npm run format && npm run tscheck && npm run test && npm run concat",
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:e2e": "npm run build && playwright test",
    "test:e2e:headed": "npm run build && playwright test --headed",
    "test:integration": "vitest run apps/random-picker/tests/integration",
    "test:unit": "vitest run apps/random-picker/tests/unit",
    "tscheck": "node scripts/typecheck-all.ts"
  }
}
```

### 注意

- `test:e2e` と `test:e2e:headed` は build 前置きを維持する。
- `test:unit` と `test:integration` で Playwright を実行しない。
- `precommit` の順序は崩さない。

---

## 19. `vitest.config.ts` を変更

### 目的

新しい unit / integration ディレクトリ構成を認識させる。

### 必須変更

`include` を次の2系統に置き換える。

- `apps/**/tests/unit/**/*.test.ts`
- `apps/**/tests/integration/**/*.test.ts`

### `exclude`

`apps/**/tests/e2e.spec.ts` を除外対象に残す。

### 変更してはいけないもの

- `environment: "jsdom"`
- `globals: true`
- `environmentOptions.jsdom.runScripts`
- `environmentOptions.jsdom.resources`

これらは維持すること。

---

## 20. `tsconfig.vitest.json` を変更

### 目的

Vitest 用型チェック対象を新しいテスト配置に合わせる。

### 必須変更

`include` を次に変更すること。

```json
["apps/**/tests/unit/**/*.test.ts", "apps/**/tests/integration/**/*.test.ts"]
```

### 維持するもの

- `module: "NodeNext"`
- `moduleResolution: "NodeNext"`
- `lib: ["DOM", "ES2020"]`
- `types: ["node", "vitest/globals"]`
- `allowImportingTsExtensions: true`

---

## 21. `README.md` を変更

### 目的

開発コマンド説明を現状の scripts と一致させる。

### 必須変更点

README の「標準コマンド」「個別コマンド」説明に、次を反映すること。

- `npm run test:integration` を追加
- `npm run test` が **unit → integration → e2e** を実行する説明へ更新
- `npm run test:unit` の説明は unit のみ
- `npm run test:integration` の説明は integration のみ

### 注意

README のアプリ説明や一般説明は今回は主目的ではない。
**コマンド説明だけ最小限更新**でよい。

---

## 22. 変更しない設定ファイル

以下のファイルは **今回の作業では変更しない**。

- `apps/random-picker/build/build.ts`
- `playwright.config.ts`
- `tsconfig.browser.json`
- `tsconfig.playwright.json`
- `tsconfig.node.json`

### 理由

- build の entry は引き続き `src/script.ts`
- E2E ファイルは `tests/e2e.spec.ts` のまま
- browser / playwright / node の include 範囲は今回の構成変更で不足しない

---

## import / export の厳密ルール

## 23. ソース import ルール

### `script.ts`

次以外を import しないこと。

- `type.ts`
- `state.ts`
- `processor-registry.ts`
- `dom.ts`
- `event.ts`

### `event.ts`

`state.ts` と `processor-registry.ts` を import しないこと。
`deps` から受け取ること。

### `pipeline.ts`

`processor-registry.ts` を import しないこと。

### `dom.ts`

`event.ts`, `state.ts`, `script.ts` を import しないこと。

---

## 24. テスト import ルール

### unit

対象モジュールだけを import すること。
`script.ts` からまとめて import しないこと。

### integration

- `script.test.ts` は `script.ts` を import
- `event.test.ts` は `event.ts` とセットアップに必要な周辺だけを import
- `script.test.ts` と `event.test.ts` の責務を混ぜない

### e2e

既存のまま。source import を追加しない。

---

## 実装順序

以下の順番で進めること。これ以外の順だと壊しやすい。

1. `type.ts` を作成
2. `state.ts` を作成
3. `processor.ts` を作成
4. `pipeline.ts` を作成
   ※ `executePipeline` を registry 引数化
5. `processor-registry.ts` を作成
6. `browser.ts` を作成
7. `dom.ts` を作成
8. `event.ts` を作成
9. `script.ts` を薄いエントリーポイントへ置換
10. 既存 unit テストを5ファイルへ分割
11. 既存 integration テストを2ファイルへ分割
12. `package.json` / `vitest.config.ts` / `tsconfig.vitest.json` / `README.md` を更新
13. 旧 `unit.test.ts` と `integration.test.ts` を削除
14. `npm run tscheck`
15. `npm run test:unit`
16. `npm run test:integration`
17. `npm run test:e2e`
18. `npm run precommit`

---

## 絶対にやってはいけないこと

- `index.html` の ID 名変更
- `style.css` の class 名変更
- `build.ts` の entry 変更
- `initApp` 以外を `script.ts` に残すこと
- `PROCESSOR_REGISTRY` を `state.ts` に置くこと
- `event.ts` で `appState` / `PROCESSOR_REGISTRY` を直接 import すること
- `executePipeline` の内部で registry を再 import すること
- テストの大幅削除
- Playwright テストの簡略化
- リファクタついでのバグ修正
- 新しい helper ファイルを勝手に増やすこと

---

## 完了条件

以下を **すべて**満たしたら完了。

### ソース構成

- `script.ts` が初期化専用になっている
- 型定義が `type.ts` に集約されている
- `appState` が `state.ts` にのみ存在する
- `PROCESSOR_REGISTRY` が `processor-registry.ts` にのみ存在する
- `event.ts` が bind\* 方式 + deps 方式になっている
- `pipeline.ts` が registry 非依存になっている

### テスト構成

- `tests/unit/` 配下に5ファイルある
- `tests/integration/` 配下に2ファイルある
- `tests/unit.test.ts` が存在しない
- `tests/integration.test.ts` が存在しない
- `e2e.spec.ts` は残っている

### コマンド

- `npm run tscheck` 成功
- `npm run test:unit` 成功
- `npm run test:integration` 成功
- `npm run test:e2e` 成功
- `npm run precommit` 成功

---

## 最終確認用チェック項目

作業後に以下を目視確認すること。

1. `apps/random-picker/src/script.ts` に `type` 定義・`appState`・`PROCESSOR_REGISTRY`・純粋関数・DOM関数・browser関数が残っていないこと
2. `apps/random-picker/src/event.ts` に `import { appState }` が存在しないこと
3. `apps/random-picker/src/event.ts` に `import { PROCESSOR_REGISTRY }` が存在しないこと
4. `apps/random-picker/src/pipeline.ts` に `import { PROCESSOR_REGISTRY }` が存在しないこと
5. `apps/random-picker/tests/unit/` の各ファイルが `../src/script.ts` を import していないこと
6. `apps/random-picker/tests/integration/script.test.ts` は `initApp` のみを主対象にしていること
7. `apps/random-picker/tests/integration/event.test.ts` は `initApp` を使っていないこと
8. `README.md` に `test:integration` の説明があること

---

## 期待される最終状態の要約

- `script.ts` は細くなる
- `event.ts` はイベント結線専用になる
- `processor.ts` と `pipeline.ts` が分かれ、関心事が明確になる
- unit と integration がディレクトリ単位で分離される
- settings / scripts / typecheck 対象が新構成に追従する
- UI と仕様は変わらない

この指示書どおりに実装し、**余計な変更を一切入れずに**完了させること。
