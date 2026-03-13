// 純粋ロジック
/**
 * 空文字列を除外する
 */
export function filterEmptyStrings(values: string[]): string[] {
  return values.filter((value) => value !== "");
}

/**
 * 配列からランダムに1つ選ぶ
 */
export function pickRandomItem(items: string[]): string {
  return items.length ? items[Math.floor(Math.random() * items.length)] : "";
}

/**
 * 除外リストを適用した配列を返す
 */
export function removeExcludedItems(
  items: string[],
  excludedItems: string[],
): string[] {
  const excludedItemSet = new Set(excludedItems);
  return items.filter((item) => !excludedItemSet.has(item));
}

/**
 * 改行で文字列を分割する
 */
export function splitByNewline(sourceText: string): string[] {
  return sourceText.split("\n");
}

/**
 * 文字列配列の各要素を trim する
 */
export function trimStrings(values: string[]): string[] {
  return values.map((value) => value.trim());
}

// ブラウザ副作用（非DOM）
/**
 * テキストをクリップボードにコピーする
 */
export async function copyTextToClipboard(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

/**
 * URL 配列を新しいタブで順に開く
 */
export function openUrls(urls: string[]): void {
  urls.forEach((url) => {
    window.open(url, "_blank");
  });
}

// DOM/UI
type UI = {
  inputArea: HTMLTextAreaElement;
  inputCopyBtn: HTMLButtonElement;
  inputOpenBtn: HTMLButtonElement;
  fullRandomBtn: HTMLButtonElement;
  exclusiveRandomBtn: HTMLButtonElement;
  resultDisplay: HTMLDivElement;
  resultCopyBtn: HTMLButtonElement;
  resultOpenBtn: HTMLButtonElement;
};

/**
 * UI 要素を取得する
 */
export function createUi(root: Document = document): UI {
  return {
    inputArea: getElementByIdOrThrow<HTMLTextAreaElement>(root, "itemsInput"),
    inputCopyBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "inputCopyBtn",
    ),
    inputOpenBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "inputOpenBtn",
    ),
    fullRandomBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "fullRandomBtn",
    ),
    exclusiveRandomBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "exclusiveRandomBtn",
    ),
    resultDisplay: getElementByIdOrThrow<HTMLDivElement>(root, "result"),
    resultCopyBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "resultCopyBtn",
    ),
    resultOpenBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "resultOpenBtn",
    ),
  };
}

/**
 * 指定した ID の要素を取得し、見つからない場合は例外にする
 */
function getElementByIdOrThrow<T extends HTMLElement>(
  root: Document,
  id: string,
): T {
  const element = root.getElementById(id);
  if (!element) {
    throw new Error(`Element not found: #${id}`);
  }

  return element as T;
}

/**
 * アプリを初期化してイベントを結線する
 */
export function initApp(ui: UI = createUi()): UI {
  ui.inputCopyBtn.onclick = async () => {
    await copyTextToClipboard(ui.inputArea.value);
  };

  ui.inputOpenBtn.onclick = () => {
    openUrls(
      filterEmptyStrings(trimStrings(splitByNewline(ui.inputArea.value))),
    );
  };

  ui.fullRandomBtn.onclick = () => {
    const items = filterEmptyStrings(
      trimStrings(splitByNewline(ui.inputArea.value)),
    );
    renderResult(ui.resultDisplay, pickRandomItem(items));
  };

  ui.exclusiveRandomBtn.onclick = () => {
    const items = filterEmptyStrings(
      trimStrings(splitByNewline(ui.inputArea.value)),
    );
    const currentItems = filterEmptyStrings(
      trimStrings(splitByNewline(ui.resultDisplay.textContent ?? "")),
    );
    const candidates = removeExcludedItems(items, currentItems);
    renderResult(ui.resultDisplay, pickRandomItem(candidates));
  };

  ui.resultCopyBtn.onclick = async () => {
    await copyTextToClipboard(ui.resultDisplay.textContent ?? "");
  };

  ui.resultOpenBtn.onclick = () => {
    openUrls(
      filterEmptyStrings(
        trimStrings(splitByNewline(ui.resultDisplay.textContent ?? "")),
      ),
    );
  };

  return ui;
}

/**
 * 画面に表示する
 */
export function renderResult(element: HTMLDivElement, value: string): void {
  element.textContent = value;
}
