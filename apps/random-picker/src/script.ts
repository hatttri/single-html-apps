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
  input: HTMLTextAreaElement;
  inputCopyBtn: HTMLButtonElement;
  inputOpenBtn: HTMLButtonElement;
  fullRandomBtn: HTMLButtonElement;
  exclusiveRandomBtn: HTMLButtonElement;
  output: HTMLTextAreaElement;
  outputCopyBtn: HTMLButtonElement;
  outputOpenBtn: HTMLButtonElement;
};

/**
 * UI 要素を取得する
 */
export function createUi(root: Document = document): UI {
  return {
    input: getElementByIdOrThrow<HTMLTextAreaElement>(root, "input"),
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
    output: getElementByIdOrThrow<HTMLTextAreaElement>(root, "output"),
    outputCopyBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "outputCopyBtn",
    ),
    outputOpenBtn: getElementByIdOrThrow<HTMLButtonElement>(
      root,
      "outputOpenBtn",
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
    // 入力文字列を取得する
    const inputText = ui.input.value;

    // 入力文字列をコピーする
    await copyTextToClipboard(inputText);
  };

  ui.inputOpenBtn.onclick = () => {
    // 入力文字列を取得する
    const inputText = ui.input.value;

    // 入力文字列を入力文字列配列に分割する
    const inputLines = splitByNewline(inputText);

    // 入力文字列配列を URL 配列に変換する
    const urls = applyStringArrayProcessors(inputLines, [
      trimStrings,
      filterEmptyStrings,
    ]);

    // URL 配列を開く
    openUrls(urls);
  };

  ui.fullRandomBtn.onclick = () => {
    // 入力文字列を取得する
    const inputText = ui.input.value;

    // 入力文字列を入力文字列配列に分割する
    const inputLines = splitByNewline(inputText);

    // 入力文字列配列を出力文字列配列に変換する
    const outputLines = applyStringArrayProcessors(inputLines, [
      trimStrings,
      filterEmptyStrings,
      createPickRandomItemsProcessor(1),
    ]);

    // 出力文字列配列を出力文字列に結合する
    const outputText = joinByNewline(outputLines);

    // 出力文字列を出力欄に設定する
    renderOutput(ui.output, outputText);
  };

  ui.exclusiveRandomBtn.onclick = () => {
    // 入力文字列を取得する
    const inputText = ui.input.value;

    // 入力文字列を入力文字列配列に分割する
    const inputLines = splitByNewline(inputText);

    // 入力文字列配列を出力文字列配列に変換する
    const outputLines = applyStringArrayProcessors(inputLines, [
      trimStrings,
      filterEmptyStrings,
      createRemoveExcludedItemsProcessor(splitByNewline(ui.output.value ?? "")),
      createPickRandomItemsProcessor(1),
    ]);

    // 出力文字列配列を出力文字列に結合する
    const outputText = joinByNewline(outputLines);

    // 出力文字列を出力欄に設定する
    renderOutput(ui.output, outputText);
  };

  ui.outputCopyBtn.onclick = async () => {
    // 出力文字列を取得する
    const outputText = ui.output.value ?? "";

    // 出力文字列をコピーする
    await copyTextToClipboard(outputText);
  };

  ui.outputOpenBtn.onclick = () => {
    // 出力文字列を取得する
    const outputText = ui.output.value ?? "";

    // 出力文字列を出力文字列配列に分割する
    const outputLines = splitByNewline(outputText);

    // 出力文字列配列を URL 配列に変換する
    const urls = applyStringArrayProcessors(outputLines, [
      trimStrings,
      filterEmptyStrings,
    ]);

    // URL 配列を開く
    openUrls(urls);
  };

  return ui;
}

/**
 * 画面に出力する
 */
export function renderOutput(
  element: HTMLTextAreaElement,
  value: string,
): void {
  element.value = value;
}
