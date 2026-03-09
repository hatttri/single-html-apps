# single-html-apps

ブラウザ上で動作する単一ファイルのHTMLアプリケーション（ゲーム、ツールなど）をまとめたリポジトリです。
HTML/CSS/JavaScriptが1つのファイルに完結しているため、サーバー環境なしでローカルですぐに実行・確認できます。

## 特徴

- **単一ファイル完結**: 1つのHTMLファイルにすべてのコード（HTML/CSS/JS）が含まれています。
- **環境構築不要**: WebサーバーやNode.jsなどの環境構築は一切不要です。
- **簡単実行**: ブラウザにドラッグ＆ドロップするだけで動かせます。

## アプリ一覧

| アプリ名                                                                        | 説明                                                      |
| ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Random Picker](https://hatttri.github.io/single-html-apps/apps/random-picker/) | 改行区切りで入力したテキストからランダムで1つを選ぶツール |

## 使い方

1. このリポジトリをクローンまたはダウンロードします。
2. `apps/<app-name>/index.html` をブラウザ（Chrome, Edge, Safari, Firefoxなど）で開いてください。

## 開発とテスト

リポジトリ内のロジックの健全性を保つため、Vitestを使用した自動テストを導入しています。

### テストの実行手順

1. **Node.jsの準備**: 安定版の Node.js が必要です。（[fnm](https://github.com/Schniz/fnm) 等のバージョン管理ツールの利用を推奨します）
2. **依存関係のインストール**:
   ```powershell
   npm install
   ```
3. **テストの実行**:
   ```powershell
   npm test
   ```

自動テストは JSDOM を使用し、ブラウザ環境をシミュレートして HTML 内のロジックや初期化処理を検証します。

## E2Eテスト (Playwright)

1. 依存関係を追加します。
   ```powershell
   npm install -D @playwright/test
   ```
2. ブラウザをインストールします。
   ```powershell
   npx playwright install chromium
   ```
3. E2Eテストを実行します。
   ```powershell
   npm run test:e2e
   ```

ヘッドありで確認したい場合:

```powershell
npm run test:e2e:headed
```
