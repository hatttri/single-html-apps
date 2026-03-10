// @ts-check

/**
 * @typedef {Object} UI
 * @property {HTMLTextAreaElement} inputArea
 * @property {HTMLButtonElement} inputCopyBtn
 * @property {HTMLButtonElement} inputOpenBtn
 * @property {HTMLButtonElement} fullRandomBtn
 * @property {HTMLButtonElement} exclusiveRandomBtn
 * @property {HTMLDivElement} resultDisplay
 * @property {HTMLButtonElement} resultCopyBtn
 * @property {HTMLButtonElement} resultOpenBtn
 */

/**
 * UI 要素を取得する
 * @param {Document} [root] - 取得元の document
 * @returns {UI}
 */
export function createUi(root = document) {
  return {
    inputArea: /** @type {HTMLTextAreaElement} */ (
      root.getElementById("itemsInput")
    ),
    inputCopyBtn: /** @type {HTMLButtonElement} */ (
      root.getElementById("inputCopyBtn")
    ),
    inputOpenBtn: /** @type {HTMLButtonElement} */ (
      root.getElementById("inputOpenBtn")
    ),
    fullRandomBtn: /** @type {HTMLButtonElement} */ (
      root.getElementById("fullRandomBtn")
    ),
    exclusiveRandomBtn: /** @type {HTMLButtonElement} */ (
      root.getElementById("exclusiveRandomBtn")
    ),
    resultDisplay: /** @type {HTMLDivElement} */ (
      root.getElementById("result")
    ),
    resultCopyBtn: /** @type {HTMLButtonElement} */ (
      root.getElementById("resultCopyBtn")
    ),
    resultOpenBtn: /** @type {HTMLButtonElement} */ (
      root.getElementById("resultOpenBtn")
    ),
  };
}

/**
 * テキストをクリップボードにコピーする
 * @param {string} value - コピー対象のテキスト
 * @returns {Promise<void>} コピー完了を表す Promise
 */
export async function copyTextToClipboard(value) {
  await navigator.clipboard.writeText(value);
}

/**
 * 文字列配列を整形する
 * @param {string[]} values - 整形前の文字列配列
 * @returns {string[]} 有効な項目の配列
 */
export function normalizeItems(values) {
  return values.map((value) => value.trim()).filter((value) => value !== "");
}

/**
 * URL 配列を新しいタブで順に開く
 * @param {string[]} urls - 開く URL 配列
 * @returns {void}
 */
export function openUrls(urls) {
  urls.forEach((url) => {
    window.open(url, "_blank");
  });
}

/**
 * 行テキストを配列化する
 * @param {string} sourceText - 行区切りテキスト
 * @returns {string[]} 有効な項目の配列
 */
export function parseItems(sourceText) {
  return normalizeItems(sourceText.split("\n"));
}

/**
 * 配列からランダムに1つ選ぶ
 * @param {string[]} items - アイテムの配列
 * @returns {string} 選ばられたアイテム（空の場合は空文字）
 */
export function pickRandomItem(items) {
  return items.length ? items[Math.floor(Math.random() * items.length)] : "";
}

/**
 * 除外リストを適用した配列を返す
 * @param {string[]} items - 全アイテムの配列
 * @param {string[]} excludedItems - 除外するアイテムの配列
 * @returns {string[]} 除外後の配列
 */
export function removeExcludedItems(items, excludedItems) {
  const excludedItemSet = new Set(excludedItems);
  return items.filter((item) => !excludedItemSet.has(item));
}

/**
 * 画面に表示する
 * @param {HTMLDivElement} element - 表示先の要素
 * @param {string} value - 表示する値
 * @returns {void}
 */
export function renderResult(element, value) {
  element.textContent = value;
}

/**
 * アプリを初期化してイベントを結線する
 * @param {UI} [ui] - 画面要素の参照
 * @returns {UI} 初期化した UI 参照
 */
export function initApp(ui = createUi()) {
  ui.inputCopyBtn.onclick = async () => {
    await copyTextToClipboard(ui.inputArea.value);
  };

  ui.inputOpenBtn.onclick = () => {
    openUrls(parseItems(ui.inputArea.value));
  };

  ui.fullRandomBtn.onclick = () => {
    const items = parseItems(ui.inputArea.value);
    renderResult(ui.resultDisplay, pickRandomItem(items));
  };

  ui.exclusiveRandomBtn.onclick = () => {
    const items = parseItems(ui.inputArea.value);
    const currentItems = parseItems(ui.resultDisplay.textContent ?? "");
    const candidates = removeExcludedItems(items, currentItems);
    renderResult(ui.resultDisplay, pickRandomItem(candidates));
  };

  ui.resultCopyBtn.onclick = async () => {
    await copyTextToClipboard(ui.resultDisplay.textContent ?? "");
  };

  ui.resultOpenBtn.onclick = () => {
    openUrls(parseItems(ui.resultDisplay.textContent ?? ""));
  };

  return ui;
}
