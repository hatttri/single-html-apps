# AGENTS.md

このドキュメントは、`single-html-apps` リポジトリで作業する人・エージェント向けの共通規格です。

## 1. 目的
- 単一HTMLアプリを継続的に追加しやすくする
- 実装方針・テスト方針・レビュー観点を統一する
- 変更の再現性を高める

## 2. ディレクトリ規約
- アプリ本体: `apps/*.html`
- ユニットテスト: `tests/unit/*.test.js`
- E2Eテスト: `tests/e2e/*.spec.js`
- 設定ファイル: ルート（`playwright.config.js`, `vitest.config.js` など）

## 3. ファイル命名規約
- アプリ: `<app-name>.html`（例: `random-picker.html`）
- ユニットテスト: `<app-name>.test.js`
- E2Eテスト: `<app-name>.spec.js`
- `<app-name>` は kebab-case を使う

## 4. 実装規約（HTMLアプリ）
- 1アプリ = 1HTMLファイル（HTML/CSS/JSを同梱）
- JSは純粋関数を優先し、副作用（DOM操作）は分離する
- 入力の前処理（trim / 空行除外など）は明示する
- 例外ケース（入力なしなど）の期待動作を明文化する

## 5. テスト規約
### 5.1 ユニットテスト（Vitest）
- ロジック関数の仕様を優先して検証する
- 正常系と境界系（空入力・単一入力・複数入力）を含める
- DOM依存部分は最小限にし、意図をテスト名で明示する

### 5.2 E2Eテスト（Playwright）
- 初期表示、主要操作、回帰しやすい条件を必須とする
- ケース名は入力状態と期待結果が読める名称にする
- 乱択テストは flake を避けるため判定基準を明示する

## 6. 品質ゲート
- 変更前後で次を実行すること:
  - `npm run format`
  - `npm run test`
  - `npm run test:e2e`
- 一括実行は `npm run check:all` を使用する

## 7. 変更・レビュー方針
- 可能な限り `git mv` を使い履歴を維持する
- 大きな変更は「構造変更」と「機能変更」を分ける
- レビューでは次を優先確認:
  - 仕様どおりの挙動
  - テストの説明性
  - 不要な共通化の有無（可読性優先）

## 8. コミット規約
- メッセージは日本語で要点を1行で書く
- 必要に応じて本文で背景や制約を補足する
- Codex を利用した変更では、共同作成者として以下を利用する:
  - `Co-authored-by: Codex <noreply@openai.com>`

## 9. 将来アプリ追加時の最小手順
1. `apps/<app-name>.html` を追加
2. `tests/unit/<app-name>.test.js` を追加
3. `tests/e2e/<app-name>.spec.js` を追加
4. `README.md` のアプリ一覧を更新
5. `npm run check:all` が通ることを確認


