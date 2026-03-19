# AGENTS.md

## リポジトリ概要

- 単一HTML・オフライン動作・軽量依存のアプリ群

## ディレクトリ構成

- `apps/<app-name>/` - アプリ
- `apps/<app-name>/build/build.ts` - ビルド
- `apps/<app-name>/generated/` - ビルド出力先
- `apps/<app-name>/src/` - ソースコード
- `apps/<app-name>/tests/` - テスト

## 開発用スクリプト

- `npm run precommit` - フォーマット & 型チェック & ユニットテスト & インテグレーションテスト & ビルド & E2Eテスト

## 共通規約

- パスが通っていない場合は権限昇格で実行
- 事前計画に含まれない関数の変更は絶対に行わない

## ソースコード共通規約

- 日本語でコメント記述
- DOM に対応するコードは DOM 順に、他はすべてアルファベット順に並べる

## TypeScript

- 全関数の説明を JSDoc で記述
- 並び順の独自ルール
  1. 純粋ロジック / ブラウザ副作用（非DOM） / DOM/UI の順にグループ化
  2. type / const / function の順にグループ化
  3. 共通の並び順に並べる

## テストコード共通規約

- テストできない関数は空実装でコメントアウトする

  ```typescript
  // describe("untestableFunction", () => {
  // });
  ```

## ユニットテスト規約 (Vitest)

- 全関数をテスト
- モックできる関数はモックする
- 基本のテスト方法は 正常系 / 境界系 / 異常系
  ```typescript
  describe("targetFunction", () => {
    describe("正常系", () => {});
    describe("境界系", () => {});
    describe("異常系", () => {});
  });
  ```

## インテグレーションテスト規約 (Vitest)

- 全イベントハンドラーをテスト
- 基本のテスト方法は 正常系 / 異常系
  ```typescript
  describe("targetElement.onEvent", () => {
    describe("正常系", () => {});
    describe("異常系", () => {});
  });
  ```

## E2Eテスト（Playwright）

- 主要ユーザーインタラクションをテスト
- 基本のテスト方法は 正常系
  ```typescript
  test.describe("XX要素をクリック", () => {
    test.describe("正常系", () => {});
  });
  ```

## コード修正

- コード修正と同時にドキュメント修正
- コード修正後は常に `npm run precommit` を実行

## Git

- ファイル名変更は `git mv` を使用
- コミットメッセージは日本語
- コミットの共同作成者
  - Antigravity
    - `Co-authored-by: gemini-code-assist[bot] <176961590+gemini-code-assist[bot]@users.noreply.github.com>`
  - Codex
    - `Co-authored-by: Codex <noreply@openai.com>`
