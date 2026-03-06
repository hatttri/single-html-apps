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
      
      // 変数宣言を window へのプロパティ追加に変換して、テストからアクセス可能にする
      scriptContent = scriptContent.replace(
        'let inputArea, fullRandomBtn, exclusiveRandomBtn, resultDisplay, resultContainer;',
        'window.inputArea; window.fullRandomBtn; window.exclusiveRandomBtn; window.resultDisplay; window.resultContainer;'
      );

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

  test('getItems(): テキストエリアの内容が正しく配列化される（トリミング・空行除外済み）', () => {
    const textarea = document.getElementById('itemsInput');
    textarea.value = "Apple\n  Banana  \n\nOrange";
    
    const items = window.getItems();
    expect(items).toEqual(["Apple", "Banana", "Orange"]);
  });

  test('getExclusiveItems(): 現在表示されている結果が除外された集合が返る', () => {
    const textarea = document.getElementById('itemsInput');
    const resultDisp = document.getElementById('result');
    
    textarea.value = "Apple\nBanana\nOrange";
    resultDisp.textContent = "Banana";
    
    const candidates = window.getExclusiveItems();
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

  test('showResult(text): 指定した文字列が結果表示エリアに反映される', () => {
    const resultDisp = document.getElementById('result');
    window.showResult("テスト結果");
    expect(resultDisp.textContent).toBe("テスト結果");
  });

  test('初期化処理: DOMContentLoaded後に各変数がDOM要素を正しく参照しているか', () => {
    expect(window.inputArea.id).toBe('itemsInput');
    expect(window.resultDisplay.id).toBe('result');
    expect(window.fullRandomBtn.id).toBe('fullRandomBtn');
    expect(window.exclusiveRandomBtn.id).toBe('exclusiveRandomBtn');
  });
});
