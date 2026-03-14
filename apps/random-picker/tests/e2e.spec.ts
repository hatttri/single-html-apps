import { expect, test, type Page } from "@playwright/test";

const appUrl = new URL("../generated/index.html", import.meta.url).href;

type OpenedUrl = {
  url: string;
  target: string | undefined;
};

type RandomPickerTestWindow = Window & {
  __copiedTexts: string[];
  __openedUrls: OpenedUrl[];
};

/**
 * ブラウザ API をテスト用スタブに差し替える
 */
async function installBrowserApiStubs(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const testWindow = window as unknown as RandomPickerTestWindow;

    testWindow.__copiedTexts = [];
    testWindow.__openedUrls = [];

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText(text: string): Promise<void> {
          testWindow.__copiedTexts.push(text);
          return Promise.resolve();
        },
      },
    });

    window.open = ((url?: string | URL, target?: string) => {
      testWindow.__openedUrls.push({ url: String(url ?? ""), target });
      return null;
    }) as Window["open"];
  });
}

/**
 * コピー履歴を取得する
 */
function getCopiedTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const testWindow = window as unknown as RandomPickerTestWindow;
    return testWindow.__copiedTexts;
  });
}

/**
 * 新しいタブ起動履歴を取得する
 */
function getOpenedUrls(page: Page): Promise<OpenedUrl[]> {
  return page.evaluate(() => {
    const testWindow = window as unknown as RandomPickerTestWindow;
    return testWindow.__openedUrls;
  });
}

// パターン整理
// 01. 初期表示
//
// パターン一覧
// ○ 初期表示
test("初期表示", async ({ page }) => {
  await page.goto(appUrl);

  await expect(page.locator("#itemsInput")).toHaveValue("");
  await expect(page.locator("#output")).toHaveText("");
});

// パターン整理
// 01. 文字数／＝０文字／≧１文字
//
// パターン一覧
// ○ 01 文字数＝０文字
// ○ 02 文字数≧１文字
test.describe("入力欄コピーボタンクリック", () => {
  test("01 文字数＝０文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");

    await page.getByRole("button", { name: "入力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual([""]);
  });

  test("02 文字数≧１文字", async ({ page }) => {
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

// パターン整理
// 01. 行数／＝１行／≧２行
// 02. 前後空白なし／あり
// 03. 無効行なし／あり
//
// パターン一覧
// ○ 01 行数＝１行／前後空白なし／無効行なし
// ○ 02 行数＝１行／前後空白なし／無効行あり
// ○ 03 行数＝１行／前後空白あり／無効行なし
// ○ 04 行数＝１行／前後空白あり／無効行あり
// ○ 05 行数≧２行／前後空白なし／無効行なし
// ○ 06 行数≧２行／前後空白なし／無効行あり
// ○ 07 行数≧２行／前後空白あり／無効行なし
// ○ 08 行数≧２行／前後空白あり／無効行あり
test.describe("入力欄リンク起動ボタンクリック", () => {
  test("01 行数＝１行／前後空白なし／無効行なし", async ({ page }) => {
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

  test("02 行数＝１行／前後空白なし／無効行あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect.poll(() => getOpenedUrls(page)).toEqual([]);
  });

  test("03 行数＝１行／前後空白あり／無効行なし", async ({ page }) => {
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

  test("04 行数＝１行／前後空白あり／無効行あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("  ");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect.poll(() => getOpenedUrls(page)).toEqual([]);
  });

  test("05 行数≧２行／前後空白なし／無効行なし", async ({ page }) => {
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

  test("06 行数≧２行／前後空白なし／無効行あり", async ({ page }) => {
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

  test("07 行数≧２行／前後空白あり／無効行なし", async ({ page }) => {
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

  test("08 行数≧２行／前後空白あり／無効行あり", async ({ page }) => {
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

// パターン整理
// 01. 入力なし／あり
// 02. 出力なし／あり
// 03. 入力文字列内に出力文字列なし／あり
//
// パターン一覧
// × 01 入力なし／出力なし／入力文字列内に出力文字列なし
// ○ 02 入力なし／出力なし／入力文字列内に出力文字列あり
// ○ 03 入力なし／出力あり／入力文字列内に出力文字列なし
// × 04 入力なし／出力あり／入力文字列内に出力文字列あり
// ○ 05 入力あり／出力なし／入力文字列内に出力文字列なし
// ○ 06 入力あり／出力なし／入力文字列内に出力文字列あり
// ○ 07 入力あり／出力あり／入力文字列内に出力文字列なし
// ○ 08 入力あり／出力あり／入力文字列内に出力文字列あり
test.describe("完全ランダムボタンクリック", () => {
  test("02 入力なし／出力なし／入力文字列内に出力文字列あり", async ({
    page,
  }) => {
    const buttonId = "#fullRandomBtn";

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    await expect(page.locator("#output")).toHaveText("");
  });

  test("03 入力なし／出力あり／入力文字列内に出力文字列なし", async ({
    page,
  }) => {
    const buttonId = "#fullRandomBtn";

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator(buttonId).click();
    await expect(page.locator("#output")).toHaveText("");
  });

  test("05 入力あり／出力なし／入力文字列内に出力文字列なし", async ({
    page,
  }) => {
    const buttonId = "#fullRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    const output = ((await page.locator("#output").textContent()) ?? "").trim();
    expect(items).toContain(output);
  });

  test("06 入力あり／出力なし／入力文字列内に出力文字列あり", async ({
    page,
  }) => {
    const buttonId = "#fullRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\n\nB\nC");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    const output = ((await page.locator("#output").textContent()) ?? "").trim();
    expect(items).toContain(output);
  });

  test("07 入力あり／出力あり／入力文字列内に出力文字列なし", async ({
    page,
  }) => {
    const buttonId = "#fullRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator(buttonId).click();
    const output = ((await page.locator("#output").textContent()) ?? "").trim();
    expect(items).toContain(output);
  });

  test("08 入力あり／出力あり／入力文字列内に出力文字列あり", async ({
    page,
  }) => {
    const buttonId = "#fullRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "A";
    });

    await page.locator(buttonId).click();
    const output = ((await page.locator("#output").textContent()) ?? "").trim();
    expect(items).toContain(output);
  });
});

// パターン整理
// 01. 入力なし／あり
// 02. 出力なし／あり
// 03. 入力文字列内に出力文字列なし／あり
//
// パターン一覧
// × 01 入力なし／出力なし／入力文字列内に出力文字列なし
// ○ 02 入力なし／出力なし／入力文字列内に出力文字列あり
// ○ 03 入力なし／出力あり／入力文字列内に出力文字列なし
// × 04 入力なし／出力あり／入力文字列内に出力文字列あり
// ○ 05 入力あり／出力なし／入力文字列内に出力文字列なし
// ○ 06 入力あり／出力なし／入力文字列内に出力文字列あり
// ○ 07 入力あり／出力あり／入力文字列内に出力文字列なし
// ○ 08 入力あり／出力あり／入力文字列内に出力文字列あり
test.describe("排他ランダムボタンクリック", () => {
  test("02 入力なし／出力なし／入力文字列内に出力文字列あり", async ({
    page,
  }) => {
    const buttonId = "#exclusiveRandomBtn";

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    await expect(page.locator("#output")).toHaveText("");
  });

  test("03 入力なし／出力あり／入力文字列内に出力文字列なし", async ({
    page,
  }) => {
    const buttonId = "#exclusiveRandomBtn";

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator(buttonId).click();
    await expect(page.locator("#output")).toHaveText("");
  });

  test("05 入力あり／出力なし／入力文字列内に出力文字列なし", async ({
    page,
  }) => {
    const buttonId = "#exclusiveRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    const output = ((await page.locator("#output").textContent()) ?? "").trim();
    expect(items).toContain(output);
  });

  test("06 入力あり／出力なし／入力文字列内に出力文字列あり", async ({
    page,
  }) => {
    const buttonId = "#exclusiveRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\n\nB\nC");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "";
    });

    await page.locator(buttonId).click();
    const output = ((await page.locator("#output").textContent()) ?? "").trim();
    expect(items).toContain(output);
  });

  test("07 入力あり／出力あり／入力文字列内に出力文字列なし", async ({
    page,
  }) => {
    const buttonId = "#exclusiveRandomBtn";
    const items = ["A", "B", "C"];

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "Z";
    });

    await page.locator(buttonId).click();
    const output = ((await page.locator("#output").textContent()) ?? "").trim();
    expect(items).toContain(output);
  });

  test("08 入力あり／出力あり／入力文字列内に出力文字列あり", async ({
    page,
  }) => {
    const buttonId = "#exclusiveRandomBtn";
    const items = ["A", "B", "C"];
    const expectedItems = items.filter((item) => item !== "A");

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill("A\nB\nC");
    await page.locator("#output").evaluate((el) => {
      el.textContent = "A";
    });

    await page.locator(buttonId).click();
    const output = ((await page.locator("#output").textContent()) ?? "").trim();
    expect(expectedItems).toContain(output);
  });
});

// パターン整理
// 01. ボタン／＝完全ランダム／排他ランダム
// 02. 全候補が１回以上出る
// 03. 前回と同じ値を許容する／しない
//
// パターン一覧
// ○ 01 ボタン＝完全ランダム／全候補が１回以上出る／前回と同じ値を許容する
// ○ 02 ボタン＝排他ランダム／全候補が１回以上出る／前回と同じ値を許容しない
test.describe("ランダムボタンクリック（３択／試行１００回）", () => {
  test("01 ボタン＝完全ランダム／全候補が１回以上出る／前回と同じ値を許容する", async ({
    page,
  }) => {
    const buttonId = "#fullRandomBtn";
    const items = ["A", "B", "C"];
    const expected = new Set(items);
    const seen = new Set();
    const trials = 100;

    await page.goto(appUrl);
    await page.locator("#itemsInput").fill(items.join("\n"));

    for (let i = 0; i < trials; i += 1) {
      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").textContent()) ?? ""
      ).trim();
      seen.add(output);
    }

    expect(seen).toEqual(expected);
  });

  test("02 ボタン＝排他ランダム／全候補が１回以上出る／前回と同じ値を許容しない", async ({
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
        (await page.locator("#output").textContent()) ?? ""
      ).trim();
      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").textContent()) ?? ""
      ).trim();
      seen.add(output);

      if (previous !== "") {
        expect(output).not.toBe(previous);
      }
    }

    expect(seen).toEqual(expected);
  });
});

// パターン整理
// 01. 文字数／＝０文字／≧１文字
//
// パターン一覧
// ○ 01 文字数＝０文字
// ○ 02 文字数≧１文字
test.describe("出力欄コピーボタンクリック", () => {
  test("01 文字数＝０文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);

    await page.getByRole("button", { name: "出力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual([""]);
  });

  test("02 文字数≧１文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      el.textContent = "出力テキスト";
    });

    await page.getByRole("button", { name: "出力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual(["出力テキスト"]);
  });
});

// パターン整理
// 01. 文字数／＝０文字／≧１文字
//
// パターン一覧
// ○ 01 文字数＝０文字
// ○ 02 文字数≧１文字
test.describe("出力欄リンク起動ボタンクリック", () => {
  test("01 文字数＝０文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);

    await page
      .getByRole("button", { name: "出力欄のリンクを新しいタブで開く" })
      .click();

    await expect.poll(() => getOpenedUrls(page)).toEqual([]);
  });

  test("02 文字数≧１文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      el.textContent = "https://example.com/output";
    });

    await page
      .getByRole("button", { name: "出力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([{ url: "https://example.com/output", target: "_blank" }]);
  });
});
