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
    test("除外対象なし", () => {
      expect(window.getExclusiveItems(["A", "B"], "C")).toEqual(["A", "B"]);
    });

    test("除外対象あり", () => {
      expect(window.getExclusiveItems(["A", "B", "C"], "B")).toEqual([
        "A",
        "C",
      ]);
    });
  });

  describe("pick 検証", () => {
    test("候補なし", () => {
      expect(window.pick([])).toBe("");
    });

    test("候補あり", () => {
      const pool = ["A", "B", "C"];
      const result = window.pick(pool);
      expect(pool).toContain(result);
    });
  });

  describe("showResult 検証", () => {
    test("指定した要素にテキストが反映される", () => {
      const dummyDiv = document.createElement("div");
      window.showResult(dummyDiv, "テスト結果");
      expect(dummyDiv.textContent).toBe("テスト結果");
    });
  });

  describe("初期化 検証", () => {
    test("window.ui の各プロパティがDOM要素を正しく参照しているか", () => {
      expect(window.ui.inputArea.id).toBe("itemsInput");
      expect(window.ui.fullRandomBtn.id).toBe("fullRandomBtn");
      expect(window.ui.exclusiveRandomBtn.id).toBe("exclusiveRandomBtn");
      expect(window.ui.resultDisplay.id).toBe("result");
    });
  });

  describe("完全ランダムボタン 検証", () => {
    test("候補なし・表示なし", () => {
      window.ui.inputArea.value = "";
      window.ui.resultDisplay.textContent = "";
      window.ui.fullRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    test("候補なし・表示あり", () => {
      window.ui.inputArea.value = "";
      window.ui.resultDisplay.textContent = "A";
      window.ui.fullRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    test("候補あり・表示なし", () => {
      window.ui.inputArea.value = "A";
      window.ui.resultDisplay.textContent = "";
      window.ui.fullRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("A");
    });

    test("候補あり・表示あり", () => {
      window.ui.inputArea.value = "A";
      window.ui.resultDisplay.textContent = "B";
      window.ui.fullRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("A");
    });
  });

  describe("排他ランダムボタン 検証", () => {
    test("候補なし・表示なし", () => {
      window.ui.inputArea.value = "";
      window.ui.resultDisplay.textContent = "";
      window.ui.exclusiveRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    test("候補なし・表示あり", () => {
      window.ui.inputArea.value = "A";
      window.ui.resultDisplay.textContent = "A";
      window.ui.exclusiveRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("");
    });

    test("候補あり・表示なし", () => {
      window.ui.inputArea.value = "A";
      window.ui.resultDisplay.textContent = "";
      window.ui.exclusiveRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("A");
    });

    test("候補あり・表示あり", () => {
      window.ui.inputArea.value = "A\nB";
      window.ui.resultDisplay.textContent = "A";
      window.ui.exclusiveRandomBtn.click();
      expect(window.ui.resultDisplay.textContent).toBe("B");
    });
  });
});
