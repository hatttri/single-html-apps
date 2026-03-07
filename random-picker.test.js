import { beforeEach, describe, expect, test } from "vitest";
import fs from "fs";
import path from "path";

const html = fs.readFileSync(
  path.resolve(__dirname, "./random-picker.html"),
  "utf8",
);

describe("Random Picker Unit Tests", () => {
  beforeEach(() => {
    // DOMのセットアップ
    document.body.innerHTML = html;

    // scriptタグの中身を抽出して実行
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      let scriptContent = scriptMatch[1];

      // 前のテストの残骸を掃除
      delete window.ui;

      // uiオブジェクトをwindowに紐付けて、テストからアクセス可能にする
      // 'const ui = {' を 'window.ui = {' に置換する
      scriptContent = scriptContent.replace("const ui = {", "window.ui = {");

      // 関数を明示的に window に紐付ける
      scriptContent += `
        window.getItems = getItems;
        window.getExclusiveItems = getExclusiveItems;
        window.pick = pick;
        window.showResult = showResult;
        window.initApp = initApp;
      `;

      // 実行環境（window, document）を渡してスクリプトを実行
      try {
        const execute = new Function("window", "document", scriptContent);
        execute(window, document);
      } catch (e) {
        console.error("Script execution error:", e);
      }
    }

    // 初期化関数を直接呼ぶ（リスナーの重複を防ぐため）
    if (window.initApp) {
      window.initApp();
    }
  });

  describe("getItems 検証", () => {
    // 8パターン網羅マトリクス (2^3 = 8)
    // 1. 行数 (split) : 単一 ・ 複数
    // 2. 空白 (trim)  : あり ・ なし
    // 3. 空行 (filter): あり ・ なし

    test("単一行・空白なし・空行なし", () => {
      expect(window.getItems("A")).toEqual(["A"]);
    });

    test("単一行・空白なし・空行あり", () => {
      expect(window.getItems("")).toEqual([]);
    });

    test("単一行・空白あり・空行なし", () => {
      expect(window.getItems(" A ")).toEqual(["A"]);
    });

    test("単一行・空白あり・空行あり", () => {
      expect(window.getItems("  ")).toEqual([]);
    });

    test("複数行・空白なし・空行なし", () => {
      expect(window.getItems("A\nB")).toEqual(["A", "B"]);
    });

    test("複数行・空白なし・空行あり", () => {
      expect(window.getItems("A\n")).toEqual(["A"]);
    });

    test("複数行・空白あり・空行なし", () => {
      expect(window.getItems(" A \nB")).toEqual(["A", "B"]);
    });

    test("複数行・空白あり・空行あり", () => {
      expect(window.getItems(" A \n  ")).toEqual(["A"]);
    });
  });

  describe("getExclusiveItems 検証", () => {
    test("配列なし", () => {
      expect(window.getExclusiveItems([], "A")).toEqual([]);
    });

    test("配列あり・対象なし", () => {
      expect(window.getExclusiveItems(["A"], "B")).toEqual(["A"]);
    });

    test("配列あり・対象あり", () => {
      expect(window.getExclusiveItems(["A", "B"], "A")).toEqual(["B"]);
    });
  });

  describe("共通ロジック検証", () => {
    test("pick(items): 与えられた配列の中からいずれか1つの要素が選ばれる", () => {
      const pool = ["A", "B", "C"];
      const result = window.pick(pool);
      expect(pool).toContain(result);
    });

    test("pick(items): 配列が空の場合は空文字を返す", () => {
      expect(window.pick([])).toBe("");
    });

    test("showResult(element, text): 指定した要素にテキストが反映される", () => {
      const dummyDiv = document.createElement("div");
      window.showResult(dummyDiv, "テスト結果");
      expect(dummyDiv.textContent).toBe("テスト結果");
    });
  });

  describe("UI統合・初期化テスト", () => {
    test("初期化処理: window.ui の各プロパティがDOM要素を正しく参照しているか", () => {
      expect(window.ui.inputArea.id).toBe("itemsInput");
      expect(window.ui.resultDisplay.id).toBe("result");
      expect(window.ui.fullRandomBtn.id).toBe("fullRandomBtn");
      expect(window.ui.exclusiveRandomBtn.id).toBe("exclusiveRandomBtn");
    });

    test("完全ランダムボタンクリックで結果が表示されるか", () => {
      window.ui.inputArea.value = "TestItem";
      window.ui.fullRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("TestItem");
    });

    test("排他ランダムボタンクリックで現在の結果以外のものが選ばれるか", () => {
      window.ui.inputArea.value = "A\nB";
      window.ui.resultDisplay.textContent = "A";

      window.ui.exclusiveRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("B");
    });

    test("排他ランダムボタンクリック（候補が1つの場合）、結果は空になる", () => {
      window.ui.inputArea.value = "A";
      window.ui.resultDisplay.textContent = "A";

      window.ui.exclusiveRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });
  });
});
