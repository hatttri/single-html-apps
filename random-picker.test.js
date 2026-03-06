import { beforeEach, describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.resolve(__dirname, './random-picker.html'), 'utf8');

describe('Random Picker Unit Tests', () => {
  beforeEach(() => {
    // DOMのセットアップ
    document.body.innerHTML = html;

    // scriptタグの中身を抽出して実行
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      let scriptContent = scriptMatch[1];
      
      // uiオブジェクトをwindowに紐付けて、テストからアクセス可能にする
      // 'const ui = {' を 'window.ui = {' に置換する
      scriptContent = scriptContent.replace('const ui = {', 'window.ui = {');

      // 関数を明示的に window に紐付ける
      scriptContent += `
        window.getItems = getItems;
        window.getExclusiveItems = getExclusiveItems;
        window.pick = pick;
        window.showResult = showResult;
      `;

      // 実行環境（window, document）を渡してスクリプトを実行
      try {
        const execute = new Function('window', 'document', scriptContent);
        execute(window, document);
      } catch (e) {
        console.error('Script execution error:', e);
      }
    }

    // DOMContentLoaded を発火させて変数初期化やイベントリスナー登録を行う
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  test('getItems(text): テキストが正しく配列化される（トリミング・空行除外済み）', () => {
    const input = "Apple\n  Banana  \n\nOrange";
    const items = window.getItems(input);
    expect(items).toEqual(["Apple", "Banana", "Orange"]);
  });

  test('getExclusiveItems(items, exclude): 指定した要素が除外された集合が返る', () => {
    const items = ["Apple", "Banana", "Orange"];
    const candidates = window.getExclusiveItems(items, "Banana");
    expect(candidates).toEqual(["Apple", "Orange"]);
  });

  test('pick(items): 与えられた配列の中からいずれか1つの要素が選ばれる', () => {
    const pool = ["A", "B", "C"];
    const result = window.pick(pool);
    expect(pool).toContain(result);
  });

  test('pick(items): 配列が空の場合は空文字を返す', () => {
    expect(window.pick([])).toBe("");
  });

  test('showResult(element, text): 指定した要素にテキストが反映される', () => {
    const dummyDiv = document.createElement('div');
    window.showResult(dummyDiv, "テスト結果");
    expect(dummyDiv.textContent).toBe("テスト結果");
  });

  test('初期化処理: window.ui の各プロパティがDOM要素を正しく参照しているか', () => {
    expect(window.ui.inputArea.id).toBe('itemsInput');
    expect(window.ui.resultDisplay.id).toBe('result');
    expect(window.ui.fullRandomBtn.id).toBe('fullRandomBtn');
    expect(window.ui.exclusiveRandomBtn.id).toBe('exclusiveRandomBtn');
  });

  test('UI統合テスト: フルランダムボタンクリックで結果が表示されるか', () => {
    window.ui.inputArea.value = "TestItem";
    window.ui.fullRandomBtn.click();
    expect(window.ui.resultDisplay.textContent).toBe("TestItem");
  });
});
