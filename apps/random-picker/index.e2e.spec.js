// @ts-check
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { test, expect } = require("@playwright/test");

const appUrl = pathToFileURL(path.resolve(__dirname, "index.html")).href;

/**
 * @typedef {{ url: string, target: string | undefined }} OpenedUrl
 */

/**
 * @typedef {Window & {
 *   __copiedTexts: string[];
 *   __openedUrls: OpenedUrl[];
 * }} RandomPickerTestWindow
 */

/**
 * ブラウザ API をテスト用スタブに差し替える
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<void>}
 */
async function installBrowserApiStubs(page) {
  await page.addInitScript(() => {
    /** @type {RandomPickerTestWindow} */
    const testWindow = /** @type {RandomPickerTestWindow} */ (
      /** @type {unknown} */ (window)
    );

    testWindow.__copiedTexts = [];
    testWindow.__openedUrls = [];

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        /**
         * @param {string} text
         * @returns {Promise<void>}
         */
        writeText(text) {
          testWindow.__copiedTexts.push(text);
          return Promise.resolve();
        },
      },
    });

    window.open = (url, target) => {
      testWindow.__openedUrls.push({ url: String(url), target });
      return null;
    };
  });
}

/**
 * コピー履歴を取得する
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<string[]>}
 */
function getCopiedTexts(page) {
  return page.evaluate(() => {
    /** @type {RandomPickerTestWindow} */
    const testWindow = /** @type {RandomPickerTestWindow} */ (
      /** @type {unknown} */ (window)
    );
    return testWindow.__copiedTexts;
  });
}

/**
 * 新しいタブ起動履歴を取得する
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<OpenedUrl[]>}
 */
function getOpenedUrls(page) {
  return page.evaluate(() => {
    /** @type {RandomPickerTestWindow} */
    const testWindow = /** @type {RandomPickerTestWindow} */ (
      /** @type {unknown} */ (window)
    );
    return testWindow.__openedUrls;
  });
}

test("初期表示: 入力欄と表示欄が空", async ({ page }) => {
  await page.goto(appUrl);

  await expect(page.locator("#itemsInput")).toHaveValue("");
  await expect(page.locator("#result")).toHaveText("");
});

test.describe("入力欄コピー", () => {
  test("入力あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page
      .locator("#itemsInput")
      .fill("https://example.com\nhttps://example.org");

    await page.getByRole("button", { name: "入力欄をコピー" }).click();

    await expect
      .poll(() => getCopiedTexts(page))
      .toEqual(["https://example.com\nhttps://example.org"]);
  });
});

test.describe("入力欄リンク起動: 8パターン", () => {
  test("単一行／空白なし／空行なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("https://example.com");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([{ url: "https://example.com", target: "_blank" }]);
  });

  test("単一行／空白なし／空行あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect.poll(() => getOpenedUrls(page)).toEqual([]);
  });

  test("単一行／空白あり／空行なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill(" https://example.com ");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([{ url: "https://example.com", target: "_blank" }]);
  });

  test("単一行／空白あり／空行あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("  ");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect.poll(() => getOpenedUrls(page)).toEqual([]);
  });

  test("複数行／空白なし／空行なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page
      .locator("#itemsInput")
      .fill("https://example.com\nhttps://example.org");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([
        { url: "https://example.com", target: "_blank" },
        { url: "https://example.org", target: "_blank" },
      ]);
  });

  test("複数行／空白なし／空行あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("https://example.com\n");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([{ url: "https://example.com", target: "_blank" }]);
  });

  test("複数行／空白あり／空行なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page
      .locator("#itemsInput")
      .fill(" https://example.com \n https://example.org ");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([
        { url: "https://example.com", target: "_blank" },
        { url: "https://example.org", target: "_blank" },
      ]);
  });

  test("複数行／空白あり／空行あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill(" https://example.com \n  ");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([{ url: "https://example.com", target: "_blank" }]);
  });
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

test.describe("表示欄コピー: 2パターン", () => {
  test("表示なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);

    await page.getByRole("button", { name: "表示欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual([""]);
  });

  test("表示あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#result").evaluate((el) => {
      el.textContent = "表示テキスト";
    });

    await page.getByRole("button", { name: "表示欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual(["表示テキスト"]);
  });
});

test.describe("表示欄リンク起動: 2パターン", () => {
  test("表示なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);

    await page
      .getByRole("button", { name: "表示欄のリンクを新しいタブで開く" })
      .click();

    await expect.poll(() => getOpenedUrls(page)).toEqual([]);
  });

  test("表示あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#result").evaluate((el) => {
      el.textContent = "https://example.com/result";
    });

    await page
      .getByRole("button", { name: "表示欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([{ url: "https://example.com/result", target: "_blank" }]);
  });
});
