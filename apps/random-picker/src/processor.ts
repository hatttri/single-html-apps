/**
 * 空文字列を除外する
 */
export function filterEmptyStrings(items: string[]): string[] {
  return items.filter((item) => item !== "");
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
 * 文字列配列の各要素を trim する
 */
export function trimStrings(items: string[]): string[] {
  return items.map((item) => item.trim());
}
