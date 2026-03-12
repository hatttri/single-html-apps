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
 * テキストをクリップボードにコピーする
 */
export async function copyTextToClipboard(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

/**
 * 文字列配列を整形する
 */
export function normalizeItems(values: string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value !== "");
}

/**
 * URL 配列を新しいタブで順に開く
 */
export function openUrls(urls: string[]): void {
  urls.forEach((url) => {
    window.open(url, "_blank");
  });
}

/**
 * 行テキストを配列化する
 */
export function parseItems(sourceText: string): string[] {
  return normalizeItems(sourceText.split("\n"));
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
 * 画面に表示する
 */
export function renderResult(element: HTMLDivElement, value: string): void {
  element.textContent = value;
}

/**
 * アプリを初期化してイベントを結線する
 */
export function initApp(ui: UI = createUi()): UI {
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
