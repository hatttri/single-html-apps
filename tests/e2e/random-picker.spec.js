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
  // 入力なし／表示なし／入力文字列内に表示文字列なし（論理的に存在しないため未実装）

  test("入力なし／表示なし／入力文字列内に表示文字列あり", async ({ page }) => {
    const buttonId = "#fullRandomBtn";

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    await expect(page.locator("#result")).toHaveText("");
  });

  test("入力なし／表示あり／入力文字列内に表示文字列なし", async ({ page }) => {
    const buttonId = "#fullRandomBtn";

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator(buttonId).click();
    await expect(page.locator("#result")).toHaveText("");
  });

  // 入力なし／表示あり／入力文字列内に表示文字列あり（論理的に存在しないため未実装）

  test("入力あり／表示なし／入力文字列内に表示文字列なし", async ({ page }) => {
    const buttonId = "#fullRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("入力あり／表示なし／入力文字列内に表示文字列あり", async ({ page }) => {
    const buttonId = "#fullRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\n\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("入力あり／表示あり／入力文字列内に表示文字列なし", async ({ page }) => {
    const buttonId = "#fullRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator(buttonId).click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("入力あり／表示あり／入力文字列内に表示文字列あり", async ({ page }) => {
    const buttonId = "#fullRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "A";
    });

    await page.locator(buttonId).click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });
});

test.describe("排他ランダム: 8パターン", () => {
  // 入力なし／表示なし／入力文字列内に表示文字列なし（論理的に存在しないため未実装）

  test("入力なし／表示なし／入力文字列内に表示文字列あり", async ({ page }) => {
    const buttonId = "#exclusiveRandomBtn";

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    await expect(page.locator("#result")).toHaveText("");
  });

  test("入力なし／表示あり／入力文字列内に表示文字列なし", async ({ page }) => {
    const buttonId = "#exclusiveRandomBtn";

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator(buttonId).click();
    await expect(page.locator("#result")).toHaveText("");
  });

  // 入力なし／表示あり／入力文字列内に表示文字列あり（論理的に存在しないため未実装）

  test("入力あり／表示なし／入力文字列内に表示文字列なし", async ({ page }) => {
    const buttonId = "#exclusiveRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("入力あり／表示なし／入力文字列内に表示文字列あり", async ({ page }) => {
    const buttonId = "#exclusiveRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\n\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("入力あり／表示あり／入力文字列内に表示文字列なし", async ({ page }) => {
    const buttonId = "#exclusiveRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator(buttonId).click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(items).toContain(result);
  });

  test("入力あり／表示あり／入力文字列内に表示文字列あり", async ({ page }) => {
    const buttonId = "#exclusiveRandomBtn";
    const items = ["A", "B", "C"];
    const expectedItems = items.filter((item) => item !== "A");

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#result").evaluate((el) => {
      el.textContent = "A";
    });

    await page.locator(buttonId).click();
    const result = ((await page.locator("#result").textContent()) ?? "").trim();
    expect(expectedItems).toContain(result);
  });
});

test.describe("ランダムボタン: 3択／試行100回", () => {
  test("完全ランダムで全候補が1回以上出る", async ({ page }) => {
    const buttonId = "#fullRandomBtn";
    const items = ["A", "B", "C"];
    const expected = new Set(items);
    const seen = new Set();
    const trials = 100;

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill(items.join("\n"));

    for (let i = 0; i < trials; i += 1) {
      await page.locator(buttonId).click();
      const result = (
        (await page.locator("#result").textContent()) ?? ""
      ).trim();
      seen.add(result);
    }

    expect(seen).toEqual(expected);
  });

  test("排他ランダムで全候補が1回以上出る／前回と異なる値になる", async ({
    page,
  }) => {
    const buttonId = "#exclusiveRandomBtn";
    const items = ["A", "B", "C"];
    const expected = new Set(items);
    const seen = new Set();
    const trials = 100;

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill(items.join("\n"));

    for (let i = 0; i < trials; i += 1) {
      const previous = (
        (await page.locator("#result").textContent()) ?? ""
      ).trim();
      await page.locator(buttonId).click();
      const result = (
        (await page.locator("#result").textContent()) ?? ""
      ).trim();
      seen.add(result);

      if (previous !== "") {
        expect(result).not.toBe(previous);
      }
    }

    expect(seen).toEqual(expected);
  });
});
