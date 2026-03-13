# AGENTS.md

このドキュメントは、`single-html-apps` リポジトリで作業する人・エージェント向けの共通規格です。

## 1. 目的

- 単一HTMLアプリを継続的に追加しやすくする
- 実装方針・テスト方針・レビュー観点を統一する
- 変更の再現性を高める

## 2. ディレクトリ規約

- アプリ単位のディレクトリ: `apps/<app-name>/`
- 編集元HTML: `apps/<app-name>/src/index.html`
- 編集元CSS: `apps/<app-name>/src/style.css`
- 編集元JS: `apps/<app-name>/src/script.js`
- ユニットテスト: `apps/<app-name>/tests/unit.test.js`
- インテグレーションテスト: `apps/<app-name>/tests/integration.test.js`
- E2Eテスト: `apps/<app-name>/tests/e2e.spec.js`
- アプリ専用ビルドスクリプト: `apps/<app-name>/build/build.ts` または `apps/<app-name>/build/build.js`
- 生成物HTML: `apps/<app-name>/generated/index.html`
- 設定ファイル: ルート（`playwright.config.js`, `vitest.config.js` など）

## 3. ファイル命名規約

- アプリディレクトリ: `<app-name>`（例: `random-picker`）
- 編集元HTML: `src/index.html`
- 編集元CSS: `src/style.css`
- 編集元JS: `src/script.js`
- ユニットテスト: `tests/unit.test.js`
- インテグレーションテスト: `tests/integration.test.js`
- E2Eテスト: `tests/e2e.spec.js`
- ビルドスクリプト: `build/build.ts` または `build/build.js`
- 生成物HTML: `generated/index.html`
- `<app-name>` は kebab-case を使う

## 4. 実装規約（HTMLアプリ）

- 1アプリ = 1ディレクトリ配下の `src/` を編集元、`generated/index.html` を生成物として管理する
- `generated/index.html` は手修正せず、必ず `src/` を更新して `build/build.ts` または `build/build.js` で再生成する
- JSは純粋関数を優先し、副作用（DOM操作）は分離する
- 純粋関数は実装コード内でアルファベット順に並べる
- 純粋関数の命名は画面上の使われ方ではなく、入力と処理内容ベースで行う
- 入力の前処理（trim / 空行除外など）は明示する
- 例外ケース（入力なしなど）の期待動作を明文化する
- `// @ts-check` を付けているファイルでは、既存の JSDoc 型情報を削除・劣化させない
- 新規に追加する関数には、用途に応じた JSDoc の型情報を必ず付与する
- 今回の機能追加に不要な既存コメント・既存構造の変更は行わない
- リファクタリングは機能追加と分離し、依頼がない限り同一変更に混在させない

## 5. テスト規約

### 5.1 ユニットテスト（Vitest）

- ロジック関数の仕様を優先して検証する
- 正常系と境界系（空入力・単一入力・複数入力）を含める
- 配列を受け取る/返す処理は、基本ケースに加えて 0件・1件・2件以上 を境界として確認する
- 文字列を受け取る/返す処理の基本ケースは、原則として 0文字・1文字以上 の2パターンを確認する
- DOM依存部分は最小限にし、意図をテスト名で明示する

### 5.2 E2Eテスト（Playwright）

- 初期表示、主要操作、回帰しやすい条件を必須とする
- ケース名は入力状態と期待結果が読める名称にする
- 乱択テストは flake を避けるため判定基準を明示する
- `// @ts-check` を付けた E2E テストでは、`window` 拡張やスタブ追加時に JSDoc で型を補い、型エラーを残さない

### 5.3 テスト名の命名規約

- 複数条件の組み合わせは `表示あり／入力あり` のように全角スラッシュ `／` で区切る
- `あり` / `なし` の二値ケースは、原則として `なし` → `あり` の順番で並べる
- 直前のテストで確認できる観点は独立ケースに分けず、不要な重複テストを増やさない
- `describe` 名は対象の関数名・変数名をそのまま使い、`検証` のような汎用語を付けない
- パターン列挙型のテストでは、`describe` の直前に `パターン整理` と `パターン一覧` のコメントを置き、一覧は `○ 01 ...` / `× 02 ...` の形式で全件を書く
- パターン列挙型のテスト名は、コメント一覧と同じ番号・同じ文言を使い、`01 要素数０件／空白なし／空行なし` の形式で書く
- パターン列挙型のコメントとテスト名では、日本語に挟まれた件数・文字数などの数字は全角で書く
- パターン列挙型で配列要素数を軸に含める場合は、`要素数＝０件` を単独の1パターンとして切り出し、`要素数＝１件` と `要素数≧２件` は他条件との組み合わせで列挙する
- 網羅パターンに論理的に不可能な組み合わせがある場合は、未実装にせずコメントで理由を残す。このルールはロジック関数のユニットテストにも同様に適用する
- ユニットテストとE2Eテストで同じ観点を検証する場合は、同じ軸・同じ並び順で命名する
- ロジック関数の unit テストは、原則として実装コードと同じアルファベット順で記述する
- イベントハンドラ系の unit テストと E2E テストは、原則として HTML 内の対象要素の出現順で記述する

## 6. 品質ゲート

- コード変更時は、コミット前を待たずに `npm run precommit` を直ちに実行する
- コミット時は、最新の変更に対して `npm run precommit` 実行済みであることと、その結果を確認したうえでコミットすることを必須とする
- 検証コマンドは原則 `npm run precommit` のみを使い、`npm test` 単体実行を通常運用に持ち込まない
- 一括実行の標準は `npm run precommit` とする
- `// @ts-check` を付けた JS を変更した場合は、テスト通過だけで終えず型エラーが出ていないことも確認する
- TypeScript ファイルを追加・変更した場合は、`scripts/typecheck-all.ts` のコマンド列から型チェック対象が漏れない状態を保つ
- `package.json` の scripts は、生コマンドを葉 script に集約し、合成 script から `npm run` で再利用して重複を避ける
- `package.json` の scripts は、キー名のアルファベット順で並べる
- `package.json` の `test:unit` には unit テストの実コマンドを置き、`test` は `test:unit` と `test:e2e` を束ねる

### 6.1 実行環境（npm / node）

- このリポジトリでは `npm run precommit` を標準コマンドとする
- `npm` / `node` が未解決でも、未インストールとは限らない（実行環境の制約で見えない場合がある）

### 6.2 実行環境でコマンド未解決になる時の扱い

- 事象:
  - 手元環境では `node` / `npm` が使えるが、作業環境では未解決になる場合がある
- 対処:
  - PATH をむやみに恒久変更する前に、実行権限や環境差分を確認する
  - サンドボックス環境で `npm` / `node` が未解決のときは、まず権限昇格で同じコマンドを再実行して確認する
  - 必要に応じて権限付き実行でコマンドを実行する
  - 実行後に `npm run precommit` で動作確認する
- 運用ルール:
  - 未解決のまま作業を進めない
  - 何を原因と判断し、どう解決したかを作業ログに残す

### 6.3 TypeScript 設定ファイルの運用

- ルート `tsconfig.json` は共有設定兼 solution-style 用とし、`files: []` と `references` を持つ構成を維持する
- ルート `tsconfig.json` は VSCode の project 認識用であり、`tsc --noEmit -p tsconfig.json` を全体型チェックの入口として扱わない
- 新しい TypeScript ファイルを追加した場合は、対応する `tsconfig.browser.json` `tsconfig.node.json` `tsconfig.vitest.json` `tsconfig.playwright.json` の `include` を更新する
- 日常の `npm run precommit` で不要な `.tsbuildinfo` を増やさないことを優先し、型チェック専用の `tsconfig.*.json` を build キャッシュ前提の運用へ寄せない
- 新しい TypeScript 用 `tsconfig` を増やした場合は、`scripts/typecheck-all.ts` のコマンド列を更新する

### 6.4 ルート運用スクリプトの運用

- `package.json` の `build` / `tscheck` には対象列挙を直書きせず、ルート `scripts/build-all.ts` / `scripts/typecheck-all.ts` に集約する
- build 対象アプリを追加した場合は、`apps/<app-name>/build/build.ts` または `apps/<app-name>/build/build.js` を配置し、`scripts/build-all.ts` のコマンド列に追加する
- build コマンド列を更新したときは、アプリ一覧と同じ順番で並べる

## 7. 変更・レビュー方針

- 可能な限り `git mv` を使い履歴を維持する
- 大きな変更は「構造変更」と「機能変更」を分ける
- レビューでは次を優先確認:
  - 仕様どおりの挙動
  - テストの説明性
  - 不要な共通化の有無（可読性優先）
- 依頼された機能に直接関係しない差分を持ち込まない
- 既存コードの整形・命名変更・コメント整理は、必要性があっても別タスクとして扱う

## 8. コミット規約

- メッセージは日本語で要点を1行で書く
- コミット前に `npm run precommit` の成功を確認し、その実行結果を確認した変更だけをコミット対象にする
- 必要に応じて本文で背景や制約を補足する
- Codex を利用した変更では、共同作成者として以下を利用する:
  - `Co-authored-by: Codex <noreply@openai.com>`

## 9. 将来アプリ追加時の最小手順

1. `apps/<app-name>/src/` を追加
2. `apps/<app-name>/src/index.html` を追加
3. `apps/<app-name>/src/style.css` を追加
4. `apps/<app-name>/src/script.js` を追加
5. `apps/<app-name>/tests/` と `apps/<app-name>/build/build.ts` または `build/build.js` を追加
6. `apps/<app-name>/generated/index.html` を生成
7. `README.md` のアプリ一覧を更新
8. `npm run precommit` が通ることを確認

## 10. 運用改善の自動反映

- 作業中に再発防止に有効な運用ルール（手順、前提チェック、命名規約、検証順序など）を追加すべきと判断した場合は、ユーザーから明示指示がなくても `AGENTS.md` に追記・更新する
- 追記時は、原因・判断理由・具体的な対策が読み取れる形で簡潔に記載する
- 既存ルールと矛盾する場合は、差分の意図が分かるように該当節を更新する
