# single-html-apps

ブラウザ上で動作する単一ファイルのHTMLアプリケーション（ゲーム、ツールなど）をまとめたリポジトリです。
HTML/CSS/JavaScript が 1 つのファイルに完結しているため、サーバー環境なしでローカルですぐに実行・確認できます。

## 特徴

- **単一ファイル完結**: 1 つの HTML ファイルにすべてのコード（HTML/CSS/JS）が含まれています。
- **環境構築不要**: Web サーバーや Node.js などの環境構築は一切不要です。
- **簡単実行**: ブラウザにドラッグ＆ドロップするだけで動かせます。

## アプリ一覧

| アプリ名                                                                                  | 説明                                                      |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Random Picker](https://hatttri.github.io/single-html-apps/apps/random-picker/generated/) | 改行区切りで入力したテキストからランダムで1つを選ぶツール |

## 使い方

1. このリポジトリをクローンまたはダウンロードします。
2. `apps/<app-name>/generated/index.html` をブラウザ（Chrome, Edge, Safari, Firefox など）で開いてください。

## 開発とテスト

リポジトリ内のロジックと生成物の健全性を保つため、TypeScript・Vitest・Playwright を使った検証を導入しています。

### 標準コマンド

1. **Node.js の準備**: 安定版の Node.js が必要です。（[fnm](https://github.com/Schniz/fnm) 等のバージョン管理ツールの利用を推奨します）
2. **依存関係のインストール**:
   ```powershell
   npm install
   ```
3. **アプリ生成**:
   ```powershell
   npm run build
   ```
4. **一括検証**:
   ```powershell
   npm run check:all
   ```

`npm run build` は `scripts/build-all.ts` に並べた `node .../build.ts` を順番に実行します。
`npm run check:all` は整形、型チェック、Vitest、build、Playwright をまとめて実行する標準コマンドです。

### 個別コマンド

```powershell
npm run typecheck
npm run test
npm run test:e2e
```

`npm run typecheck` は `scripts/typecheck-all.ts` に並べた `tsc --noEmit -p ...` を順番に実行します。
自動テストは JSDOM を使用し、`src/` のロジックと `generated/index.html` の挙動を検証します。

## E2Eテスト (Playwright)

1. ブラウザをインストールします。
   ```powershell
   npx playwright install chromium
   ```
2. E2E テストを実行します。
   ```powershell
   npm run test:e2e
   ```

`npm run test:e2e` と `npm run test:e2e:headed` は、Playwright 実行前に build ランナーで最新の `generated/index.html` を再生成します。

ヘッドありで確認したい場合:

```powershell
npm run test:e2e:headed
```
