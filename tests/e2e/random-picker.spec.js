// @ts-check
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { test, expect } = require("@playwright/test");

const appUrl = pathToFileURL(
  path.resolve(__dirname, "..", "..", "apps", "random-picker.html"),
).href;

test("初期表示: 入力欄と表示欄が空", async ({ page }) => {
  await page.goto(appUrl);

  await expect(page.locator("#itemsInput")).toHaveValue("");
  await expect(page.locator("#result")).toHaveText("");
});

test.describe("完全ランダム: 8パターン", () => {
  // #1 入力なし / 表示なし / 入力文字列内に表示文字列なし（論理的に存在しないため未実装）

  test("#2 入力なし / 表示なし / 入力文字列内に表示文字列あり", async ({
    page,
  }) => {
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator("#fullRandomBtn").click();
    await expect(page.locator("#result")).toHaveText("");
  });

  test("#3 入力なし / 表示あり / 入力文字列内に表示文字列なし", async ({
    page,
  }) => {
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator("#fullRandomBtn").click();
    await expect(page.locator("#result")).toHaveText("");
  });

  // #4 入力なし / 表示あり / 入力文字列内に表示文字列あり（論理的に存在しないため未実装）

  test("#5 入力あり / 表示なし / 入力文字列内に表示文字列なし", async ({
    page,
  }) => {
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator("#fullRandomBtn").click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("#6 入力あり / 表示なし / 入力文字列内に表示文字列あり", async ({
    page,
  }) => {
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\n\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator("#fullRandomBtn").click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("#7 入力あり / 表示あり / 入力文字列内に表示文字列なし", async ({
    page,
  }) => {
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator("#fullRandomBtn").click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("#8 入力あり / 表示あり / 入力文字列内に表示文字列あり", async ({
    page,
  }) => {
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "A";
    });

    await page.locator("#fullRandomBtn").click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });
});

test.describe("排他ランダム: 8パターン", () => {
  // #1 入力なし / 表示なし / 入力文字列内に表示文字列なし（論理的に存在しないため未実装）

  test("#2 入力なし / 表示なし / 入力文字列内に表示文字列あり", async ({
    page,
  }) => {
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator("#exclusiveRandomBtn").click();
    await expect(page.locator("#result")).toHaveText("");
  });

  test("#3 入力なし / 表示あり / 入力文字列内に表示文字列なし", async ({
    page,
  }) => {
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator("#exclusiveRandomBtn").click();
    await expect(page.locator("#result")).toHaveText("");
  });

  // #4 入力なし / 表示あり / 入力文字列内に表示文字列あり（論理的に存在しないため未実装）

  test("#5 入力あり / 表示なし / 入力文字列内に表示文字列なし", async ({
    page,
  }) => {
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator("#exclusiveRandomBtn").click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("#6 入力あり / 表示なし / 入力文字列内に表示文字列あり", async ({
    page,
  }) => {
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\n\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator("#exclusiveRandomBtn").click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("#7 入力あり / 表示あり / 入力文字列内に表示文字列なし", async ({
    page,
  }) => {
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator("#exclusiveRandomBtn").click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("#8 入力あり / 表示あり / 入力文字列内に表示文字列あり", async ({
    page,
  }) => {
    const itemsWithoutCurrent = ["B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "A";
    });

    await page.locator("#exclusiveRandomBtn").click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(itemsWithoutCurrent).toContain(result);
  });
});

test("完全ランダム: 3択を100回で全候補が1回以上出る", async ({ page }) => {
  const items = ["A", "B", "C"];
  const expected = new Set(items);
  const seen = new Set();
  const trials = 100;

  await page.goto(appUrl);
  await page.locator("#itemsInput").fill(items.join("\n"));

  for (let i = 0; i < trials; i += 1) {
    await page.locator("#fullRandomBtn").click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    seen.add(result);
  }

  expect(seen).toEqual(expected);
});

test("排他ランダム1: 3択を100回で全候補が1回以上出る", async ({ page }) => {
  const items = ["A", "B", "C"];
  const expected = new Set(items);
  const seen = new Set();
  const trials = 100;

  await page.goto(appUrl);
  await page.locator("#itemsInput").fill(items.join("\n"));

  for (let i = 0; i < trials; i += 1) {
    await page.locator("#exclusiveRandomBtn").click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    seen.add(result);
  }

  expect(seen).toEqual(expected);
});

test("排他ランダム2: 3択を100回で前回と異なる値になる", async ({ page }) => {
  const items = ["A", "B", "C"];
  const trials = 100;

  await page.goto(appUrl);
  await page.locator("#itemsInput").fill(items.join("\n"));

  await page.locator("#exclusiveRandomBtn").click();
  let previous = ((await page.locator("#result").textContent()) ?? "").trim();

  for (let i = 1; i < trials; i += 1) {
    await page.locator("#exclusiveRandomBtn").click();
    const current = (
      (await page.locator("#result").textContent()) ?? ""
    ).trim();
    expect(current).not.toBe(previous);
    previous = current;
  }
});
