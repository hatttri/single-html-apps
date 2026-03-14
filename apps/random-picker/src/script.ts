// 純粋ロジック
export type StringArrayProcessor = (values: string[]) => string[];

/**
 * 文字列配列に処理関数を順番に適用する
 */
export function applyStringArrayProcessors(
  values: string[],
  processors: StringArrayProcessor[],
): string[] {
  return processors.reduce(
    (currentValues, processor) => processor(currentValues),
    values,
  );
}

/**
 * 指定件数ぶんランダム選択する処理関数を返す。既定では pickRandomItems を使う。
 */
export function createPickRandomItemsProcessor(
  count: number,
  pickRandomItemsFn: typeof pickRandomItems = pickRandomItems,
): StringArrayProcessor {
  return (items) => pickRandomItemsFn(items, count);
}

/**
 * 除外リストを適用する処理関数を返す。既定では removeExcludedItems を使う。
 */
export function createRemoveExcludedItemsProcessor(
  excludedItems: string[],
  removeExcludedItemsFn: typeof removeExcludedItems = removeExcludedItems,
): StringArrayProcessor {
  return (items) => removeExcludedItemsFn(items, excludedItems);
}

/**
 * 空文字列を除外する
 */
export function filterEmptyStrings(values: string[]): string[] {
  return values.filter((value) => value !== "");
}

/**
 * 文字列配列を改行文字で結合する
 */
export function joinByNewline(values: string[]): string {
  return values.join("\n");
}

/**
 * 配列からランダムに指定件数ぶん選んだ配列を返す
 */
export function pickRandomItems(items: string[], count: number): string[] {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError("count must be a non-negative safe integer");
  }

  const pickedCount = Math.min(count, items.length);
  const allIndexes = items.map((_, itemIndex) => itemIndex);

  for (let currentIndex = 0; currentIndex < pickedCount; currentIndex += 1) {
    const randomIndex =
      currentIndex +
      Math.floor(Math.random() * (allIndexes.length - currentIndex));
    [allIndexes[currentIndex], allIndexes[randomIndex]] = [
      allIndexes[randomIndex],
      allIndexes[currentIndex],
    ];
  }

  const pickedIndexes = allIndexes.slice(0, pickedCount).sort((left, right) => {
    return left - right;
  });

  return pickedIndexes.map((itemIndex) => items[itemIndex]);
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
export function getElementByIdOrThrow<T extends HTMLElement>(
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
    const inputItems = splitByNewline(ui.inputArea.value);
    const itemProcessors = [trimStrings, filterEmptyStrings];
    const urls = applyStringArrayProcessors(inputItems, itemProcessors);

    openUrls(urls);
  };

  ui.fullRandomBtn.onclick = () => {
    const inputItems = splitByNewline(ui.inputArea.value);
    const itemProcessors = [
      trimStrings,
      filterEmptyStrings,
      createPickRandomItemsProcessor(1),
    ];
    const items = applyStringArrayProcessors(inputItems, itemProcessors);

    renderResult(ui.resultDisplay, joinByNewline(items));
  };

  ui.exclusiveRandomBtn.onclick = () => {
    const inputItems = splitByNewline(ui.inputArea.value);
    const resultItems = splitByNewline(ui.resultDisplay.textContent ?? "");
    const itemProcessors = [trimStrings, filterEmptyStrings];
    const items = applyStringArrayProcessors(inputItems, itemProcessors);
    const currentItems = applyStringArrayProcessors(
      resultItems,
      itemProcessors,
    );
    const pickedItems = applyStringArrayProcessors(items, [
      createRemoveExcludedItemsProcessor(currentItems),
      createPickRandomItemsProcessor(1),
    ]);

    renderResult(ui.resultDisplay, joinByNewline(pickedItems));
  };

  ui.resultCopyBtn.onclick = async () => {
    await copyTextToClipboard(ui.resultDisplay.textContent ?? "");
  };

  ui.resultOpenBtn.onclick = () => {
    const resultItems = splitByNewline(ui.resultDisplay.textContent ?? "");
    const itemProcessors = [trimStrings, filterEmptyStrings];
    const urls = applyStringArrayProcessors(resultItems, itemProcessors);

    openUrls(urls);
  };

  return ui;
}

/**
 * 画面に表示する
 */
export function renderResult(element: HTMLDivElement, value: string): void {
  element.textContent = value;
}
