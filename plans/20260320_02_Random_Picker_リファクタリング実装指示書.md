# Random Picker リファクタリング実装指示書（段階実行版）

## 目的

`apps/random-picker/src/script.ts` に集中している責務を、型定義・状態・プロセッサ・パイプライン・ブラウザ副作用・DOM・イベント・初期化に分割する。
同時に、`apps/random-picker/tests/unit.test.ts` と `apps/random-picker/tests/integration.test.ts` を廃止し、`unit` / `integration` をディレクトリ単位で明確に分離する。

**これは挙動維持のためのリファクタリングである。仕様変更・UI変更・文言変更・バグ修正を同時に入れてはいけない。**

---

## この指示書の使い方

この作業は **必ず 1 ステップずつ** 実施すること。

- 1 回の依頼で実行してよいのは **現在指定された 1 ステップだけ**。
- **次のステップを先回りしてはいけない。**
- **関係ありそうに見えても、そのステップに書かれていない変更はしてはいけない。**
- 変更後は、そのステップの完了条件だけ確認して停止すること。
- 中間段階では未使用ファイルや旧テストとの一時的不整合が残ってよい。**それを理由に別ステップの変更へ勝手に踏み込んではいけない。**

---

## AI エージェントへの共通強制ルール

1. **今回実行してよいのは指定された Step のみ。** それ以外の変更は禁止。
2. **未指示の最適化・cleanup・命名変更・文言変更・コメント整理・テスト改善は禁止。**
3. **挙動変更は禁止。** UI、仕様、HTML ID、CSS class、文言は変えない。
4. **`apps/random-picker/build/build.ts` の entry は変更禁止。**
5. **`apps/random-picker/src/index.html` と `apps/random-picker/src/style.css` は変更禁止。**
6. **`event.ts` で `appState` と `PROCESSOR_REGISTRY` を直接 import してはいけない。**
7. **`pipeline.ts` で `PROCESSOR_REGISTRY` を直接 import してはいけない。**
8. **旧テストファイルは、新テスト移植前に削除してはいけない。**
9. **新しい helper ファイルを勝手に増やしてはいけない。** この指示書にあるファイルだけを扱うこと。
10. 作業報告では、次だけを書け。
    - 変更したファイル
    - 実施した内容
    - 完了条件を満たしたか
    - 残課題（あれば）

---

## 毎回の依頼文テンプレート

各ステップを依頼するときは、毎回このテンプレートを先頭に付けること。

```md
あなたが今回実行してよいのは **Step X のみ** です。

- Step X に書かれていることだけ実施してください。
- Step X に書かれていないファイル変更は禁止です。
- 次の Step を先回りして実施することは禁止です。
- 仕様変更・UI変更・文言変更・テストケース改変は禁止です。
- 必要最小限の差分だけ作って、完了したら停止してください。
- 作業後は「変更ファイル」「実施内容」「完了条件チェック結果」だけ報告してください。
```

---

## 最終到達構成

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

## Step 1: `type.ts` を新規作成する

### 変更してよいファイル

- `apps/random-picker/src/type.ts`

### このステップでやること

現在の `script.ts` から、以下の型定義を **新規作成する `type.ts` に移す前提で** 定義する。

- `AppState`
- `ParamFieldSchema`
- `PipelineContext`
- `PipelineStep`
- `ProcessorDef`
- `ProcessorParams`
- `StringArrayProcessor`
- `UI`
- `ProcessorRegistry = Record<string, ProcessorDef>`
- `EventDeps`

`EventDeps` は次の形にする。

```ts
export type EventDeps = {
  ui: UI;
  appState: AppState;
  processorRegistry: ProcessorRegistry;
};
```

### やってはいけないこと

- `script.ts` をまだ書き換えない
- 関数を置かない
- `const` / `let` を置かない

### 完了条件

- `type.ts` が存在する
- 型定義だけが入っている
- 関数・状態・registry 実体がない

---

## Step 2: `state.ts` を新規作成する

### 変更してよいファイル

- `apps/random-picker/src/state.ts`

### このステップでやること

`appState` を `state.ts` に定義する。
責務は **`appState` の定義だけ** に限定する。

初期値は現状維持。

```ts
pipeline: [];
```

### やってはいけないこと

- `PROCESSOR_REGISTRY` を置かない
- 関数を追加しない
- `script.ts` はまだ書き換えない

### 完了条件

- `state.ts` が存在する
- `appState` だけが定義されている

---

## Step 3: `processor.ts` を新規作成する

### 変更してよいファイル

- `apps/random-picker/src/processor.ts`

### このステップでやること

以下の関数を `processor.ts` に移す前提で新規作成する。

- `filterEmptyStrings`
- `pickRandomItems`
- `removeExcludedItems`
- `trimStrings`

### やってはいけないこと

- ロジック変更禁止
- 例外条件変更禁止
- `Math.random` の扱い変更禁止
- `splitByNewline` をここに置かない

### 完了条件

- 上記 4 関数だけが `processor.ts` にある
- DOM / state / registry 依存がない

---

## Step 4: `pipeline.ts` を新規作成する

### 変更してよいファイル

- `apps/random-picker/src/pipeline.ts`

### このステップでやること

以下の関数を `pipeline.ts` に移す前提で新規作成する。

- `addPipelineStep`
- `applyStringArrayProcessors`
- `executePipeline`
- `joinByNewline`
- `movePipelineStep`
- `removePipelineStep`
- `resolveParams`
- `splitByNewline`
- `updatePipelineStepParam`

`executePipeline` は **registry を第 4 引数で受け取る形** にする。

```ts
executePipeline(
  inputText: string,
  steps: PipelineStep[],
  context: PipelineContext,
  processorRegistry: ProcessorRegistry,
): string
```

### やってはいけないこと

- `pipeline.ts` から `processor-registry.ts` を import しない
- `state.ts` を import しない
- DOM 操作を書かない

### 完了条件

- 上記関数が `pipeline.ts` にある
- `executePipeline` が registry 引数化されている
- `PROCESSOR_REGISTRY` 直接参照がない

---

## Step 5: `processor-registry.ts` を新規作成する

### 変更してよいファイル

- `apps/random-picker/src/processor-registry.ts`

### このステップでやること

`PROCESSOR_REGISTRY` を新規作成する。

このファイルでは次を import して使う。

- 型 (`type.ts`)
- `filterEmptyStrings`
- `pickRandomItems`
- `removeExcludedItems`
- `trimStrings`
- `splitByNewline`

`excludePrevious` の挙動は現状維持とし、`context.previousOutput` を `splitByNewline` して `removeExcludedItems` に渡す。

### やってはいけないこと

- `appState` を import しない
- DOM 関数を import しない
- registry 以外の責務を書かない

### 完了条件

- `PROCESSOR_REGISTRY` が `processor-registry.ts` にある
- `excludePrevious` の挙動が現状維持

---

## Step 6: `browser.ts` を新規作成する

### 変更してよいファイル

- `apps/random-picker/src/browser.ts`

### このステップでやること

以下を `browser.ts` に移す前提で新規作成する。

- `copyTextToClipboard`
- `openUrls`

### やってはいけないこと

- シグネチャ変更禁止
- `window.open(url, "_blank")` の変更禁止
- 追加バリデーション禁止

### 完了条件

- `browser.ts` が存在する
- 上記 2 関数だけがある

---

## Step 7: `dom.ts` を新規作成する

### 変更してよいファイル

- `apps/random-picker/src/dom.ts`

### このステップでやること

以下を `dom.ts` に移す前提で新規作成する。

- `buildProcessorSelectOptions`
- `createUi`
- `getElementByIdOrThrow`
- `renderOutput`
- `renderPipelineStepList`

### やってはいけないこと

- `appState` を直接読まない
- HTML ID を変えない
- class 名を変えない
- `renderPipelineStepList` の DOM 構造・属性・文言を変えない

### 完了条件

- 上記 5 関数が `dom.ts` にある
- DOM 取得と描画だけを担当している

---

## Step 8: `event.ts` を新規作成する

### 変更してよいファイル

- `apps/random-picker/src/event.ts`

### このステップでやること

`initApp` 内のイベントリスナーを分離する前提で、`event.ts` を作る。

export するのは **次の 3 つだけ**。

- `bindInputEvent`
- `bindPipelineEvent`
- `bindOutputEvent`

内部 private handler として以下を持つ。

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

`draggingIndex` は **`bindPipelineEvent` のローカル変数** に閉じ込める。

### やってはいけないこと

- `import { appState } from "./state.ts"` を書かない
- `import { PROCESSOR_REGISTRY } from "./processor-registry.ts"` を書かない
- `draggingIndex` をモジュールスコープに置かない

### 並び順ルール

このファイルだけはアルファベット順ではなく **DOM の出現順** を優先する。

### 完了条件

- `bindInputEvent` / `bindPipelineEvent` / `bindOutputEvent` が export されている
- `appState` / `PROCESSOR_REGISTRY` を direct import していない

---

## Step 9: `script.ts` を初期化専用へ置き換える

### 変更してよいファイル

- `apps/random-picker/src/script.ts`

### このステップでやること

`script.ts` を **`initApp` だけを export する薄いエントリーポイント** に置き換える。

`initApp` の処理順は必ず次の順にする。

1. `ui` を作る（引数がなければ `createUi()`）
2. `appState.pipeline = []`
3. `buildProcessorSelectOptions(ui.processorSelect, PROCESSOR_REGISTRY)`
4. `renderPipelineStepList(ui.pipelineStepList, appState.pipeline, PROCESSOR_REGISTRY)`
5. `deps` を作る
6. `bindInputEvent(deps)`
7. `bindPipelineEvent(deps)`
8. `bindOutputEvent(deps)`
9. `ui` を返す

### やってはいけないこと

- `initApp` 以外を残さない
- 型定義を残さない
- `appState` を残さない
- `PROCESSOR_REGISTRY` を残さない
- 純粋関数・DOM関数・browser関数・イベントハンドラーを残さない
- 初期化時に `renderOutput` を追加で呼ばない

### 完了条件

- `script.ts` が `initApp` 専用になっている
- build entry は変えていない

---

## Step 10: `unit/processor.test.ts` を作成する

### 変更してよいファイル

- `apps/random-picker/tests/unit/processor.test.ts`

### このステップでやること

旧 `unit.test.ts` から以下の describe を移植する。

- `describe("filterEmptyStrings", ...)`
- `describe("pickRandomItems", ...)`
- `describe("removeExcludedItems", ...)`
- `describe("trimStrings", ...)`

### やってはいけないこと

- 他モジュール連携テストを書かない
- DOM を使わない
- `initApp` を import しない
- 旧 `unit.test.ts` をまだ削除しない

### 完了条件

- `processor.test.ts` が存在する
- 上記 4 関数の unit テストだけがある

---

## Step 11: `unit/pipeline.test.ts` を作成する

### 変更してよいファイル

- `apps/random-picker/tests/unit/pipeline.test.ts`

### このステップでやること

旧 `unit.test.ts` から以下を移植する。

- `describe("addPipelineStep", ...)`
- `describe("applyStringArrayProcessors", ...)`
- `describe("executePipeline", ...)`
- `describe("joinByNewline", ...)`
- `describe("movePipelineStep", ...)`
- `describe("removePipelineStep", ...)`
- `describe("resolveParams", ...)`
- `describe("splitByNewline", ...)`
- `describe("updatePipelineStepParam", ...)`

`executePipeline` のテストは **すべて registry を第 4 引数で渡す形** に書き換える。

### やってはいけないこと

- 旧 `unit.test.ts` をまだ削除しない
- `script.ts` からまとめて import しない

### 完了条件

- `pipeline.test.ts` が存在する
- `executePipeline` テストが新シグネチャに追従している

---

## Step 12: `unit/processor-registry.test.ts` を作成する

### 変更してよいファイル

- `apps/random-picker/tests/unit/processor-registry.test.ts`

### このステップでやること

旧 `unit.test.ts` から `describe("PROCESSOR_REGISTRY", ...)` を移植する。

### やってはいけないこと

- DOM を使わない
- 旧 `unit.test.ts` をまだ削除しない

### 完了条件

- `processor-registry.test.ts` が存在する
- registry 定義と execute の単体動作だけをテストしている

---

## Step 13: `unit/browser.test.ts` と `unit/dom.test.ts` を作成する

### 変更してよいファイル

- `apps/random-picker/tests/unit/browser.test.ts`
- `apps/random-picker/tests/unit/dom.test.ts`

### このステップでやること

旧 `unit.test.ts` から以下を移植する。

`browser.test.ts`

- `describe("copyTextToClipboard", ...)`
- `describe("openUrls", ...)`

`dom.test.ts`

- `describe("buildProcessorSelectOptions", ...)`
- `describe("createUi", ...)`
- `describe("getElementByIdOrThrow", ...)`
- `describe("renderOutput", ...)`
- `describe("renderPipelineStepList", ...)`

### やってはいけないこと

- `initApp` のテストを `dom.test.ts` に入れない
- 旧 `unit.test.ts` をまだ削除しない

### 完了条件

- `browser.test.ts` が存在する
- `dom.test.ts` が存在する
- `initApp` テストが混ざっていない

---

## Step 14: `integration/script.test.ts` を作成する

### 変更してよいファイル

- `apps/random-picker/tests/integration/script.test.ts`

### このステップでやること

旧 `integration.test.ts` から **`describe("initApp", ...)` のみ** を移植する。

セットアップは現行と同様に、`src/index.html` から `<body>` 内 HTML を取り出して `document.body.innerHTML` に入れる方式を使う。

### やってはいけないこと

- `bindInputEvent` などを直接テストしない
- イベント個別挙動を書かない
- 旧 `integration.test.ts` をまだ削除しない

### 完了条件

- `script.test.ts` が存在する
- `initApp` だけを直接テストしている

---

## Step 15: `integration/event.test.ts` を作成する

### 変更してよいファイル

- `apps/random-picker/tests/integration/event.test.ts`

### このステップでやること

旧 `integration.test.ts` から、イベント系 describe を移植する。

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

`beforeEach` のセットアップ手順は必ず次の順にする。

1. `document.body.innerHTML = bodyHtml`
2. `appState.pipeline = []`
3. `const ui = createUi()`
4. `buildProcessorSelectOptions(ui.processorSelect, PROCESSOR_REGISTRY)`
5. `renderPipelineStepList(ui.pipelineStepList, appState.pipeline, PROCESSOR_REGISTRY)`
6. `const deps = { ui, appState, processorRegistry: PROCESSOR_REGISTRY }`
7. `bindInputEvent(deps)`
8. `bindPipelineEvent(deps)`
9. `bindOutputEvent(deps)`

### やってはいけないこと

- `initApp` を使わない
- Playwright を使わない
- ブラウザ外部副作用以外をモックしない
- 旧 `integration.test.ts` をまだ削除しない

### 完了条件

- `event.test.ts` が存在する
- `initApp` を使わずにイベント連携を検証している

---

## Step 16: 設定ファイルと README を更新する

### 変更してよいファイル

- `package.json`
- `vitest.config.ts`
- `tsconfig.vitest.json`
- `README.md`

### このステップでやること

#### `package.json`

`scripts` を次の意味になるよう更新する。

- `test = test:unit -> test:integration -> test:e2e`
- `test:integration` を追加
- `precommit` は引き続き `npm run test` を呼ぶ

期待する形:

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

#### `vitest.config.ts`

`include` を次にする。

- `apps/**/tests/unit/**/*.test.ts`
- `apps/**/tests/integration/**/*.test.ts`

`exclude` には `apps/**/tests/e2e.spec.ts` を残す。

#### `tsconfig.vitest.json`

`include` を次にする。

```json
["apps/**/tests/unit/**/*.test.ts", "apps/**/tests/integration/**/*.test.ts"]
```

#### `README.md`

コマンド説明だけ最小限更新する。

- `npm run test:integration` を追加
- `npm run test` が `unit -> integration -> e2e` を実行する説明に更新
- `npm run test:unit` は unit のみ
- `npm run test:integration` は integration のみ

### やってはいけないこと

- `README.md` のアプリ説明を広範囲に書き換えない
- `build.ts` / `playwright.config.ts` / 他 tsconfig を触らない

### 完了条件

- 4 ファイルだけが更新されている
- 新テスト構成に設定が追従している

---

## Step 17: 旧テストファイルを削除する

### 変更してよいファイル

- `apps/random-picker/tests/unit.test.ts`
- `apps/random-picker/tests/integration.test.ts`

### このステップでやること

上記 2 ファイルを削除する。

### 削除前の前提

- 新しい unit テスト 5 ファイルがある
- 新しい integration テスト 2 ファイルがある

### やってはいけないこと

- 他のファイルをついでに消さない
- `e2e.spec.ts` を触らない

### 完了条件

- `unit.test.ts` が存在しない
- `integration.test.ts` が存在しない
- `e2e.spec.ts` は残っている

---

## Step 18: 最終検証だけを行う

### 変更してよいファイル

- 原則なし

### このステップでやること

次の順にコマンドを実行して結果を報告する。

1. `npm run tscheck`
2. `npm run test:unit`
3. `npm run test:integration`
4. `npm run test:e2e`
5. `npm run precommit`

### やってはいけないこと

- このステップを理由に仕様変更しない
- テストを弱めない
- 通すためだけの暫定修正を入れない

### 完了条件

- 上記 5 コマンドの成否が報告されている
- 失敗した場合は、失敗箇所だけをそのまま報告して停止する

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

## 最終確認チェックリスト

1. `apps/random-picker/src/script.ts` に型定義・`appState`・`PROCESSOR_REGISTRY`・純粋関数・DOM関数・browser関数が残っていない
2. `apps/random-picker/src/event.ts` に `import { appState }` が存在しない
3. `apps/random-picker/src/event.ts` に `import { PROCESSOR_REGISTRY }` が存在しない
4. `apps/random-picker/src/pipeline.ts` に `import { PROCESSOR_REGISTRY }` が存在しない
5. `apps/random-picker/tests/unit/` の各ファイルが `../src/script.ts` を import していない
6. `apps/random-picker/tests/integration/script.test.ts` は `initApp` のみを主対象にしている
7. `apps/random-picker/tests/integration/event.test.ts` は `initApp` を使っていない
8. `README.md` に `test:integration` の説明がある

---

## 期待される最終状態

- `script.ts` は初期化専用で細い
- `event.ts` はイベント結線専用
- `processor.ts` と `pipeline.ts` が分離されている
- unit と integration がディレクトリ単位で分離されている
- 設定ファイルが新構成に追従している
- UI と仕様は変わらない

この指示書どおりに、**1 ステップずつ、余計な変更を一切入れずに** 実施すること。
