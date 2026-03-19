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
// 01. 入力欄／空欄
// 02. 出力欄／空欄
// 03. 入力欄と出力欄のスタイル／一致
//
// パターン一覧
// ○ 01. 入力欄／空欄
// ○ 02. 出力欄／空欄
// ○ 03. 入力欄と出力欄のスタイル／一致
test.describe("初期表示", () => {
  test("01 入力欄／空欄", async ({ page }) => {
    await page.goto(appUrl);

    await expect(page.locator("#input")).toHaveValue("");
  });

  test("02 出力欄／空欄", async ({ page }) => {
    await page.goto(appUrl);

    await expect(page.locator("#output")).toHaveValue("");
  });

  test("03 入力欄と出力欄のスタイル／一致", async ({ page }) => {
    await page.goto(appUrl);

    const input = page.locator("#input");
    const output = page.locator("#output");

    expect(await input.evaluate((el) => getComputedStyle(el).fontSize)).toBe(
      await output.evaluate((el) => getComputedStyle(el).fontSize),
    );
    expect(await input.evaluate((el) => getComputedStyle(el).lineHeight)).toBe(
      await output.evaluate((el) => getComputedStyle(el).lineHeight),
    );
    expect(await input.evaluate((el) => getComputedStyle(el).fontFamily)).toBe(
      await output.evaluate((el) => getComputedStyle(el).fontFamily),
    );
    expect(await input.evaluate((el) => getComputedStyle(el).color)).toBe(
      await output.evaluate((el) => getComputedStyle(el).color),
    );
    expect(await input.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe(
      await output.evaluate((el) => getComputedStyle(el).whiteSpace),
    );
    expect(await input.evaluate((el) => getComputedStyle(el).paddingTop)).toBe(
      await output.evaluate((el) => getComputedStyle(el).paddingTop),
    );
    expect(
      await input.evaluate((el) => getComputedStyle(el).paddingRight),
    ).toBe(await output.evaluate((el) => getComputedStyle(el).paddingRight));
    expect(
      await input.evaluate((el) => getComputedStyle(el).paddingBottom),
    ).toBe(await output.evaluate((el) => getComputedStyle(el).paddingBottom));
    expect(await input.evaluate((el) => getComputedStyle(el).paddingLeft)).toBe(
      await output.evaluate((el) => getComputedStyle(el).paddingLeft),
    );
    expect(
      await input.evaluate((el) => getComputedStyle(el).borderRadius),
    ).toBe(await output.evaluate((el) => getComputedStyle(el).borderRadius));
    expect(
      await input.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe(await output.evaluate((el) => getComputedStyle(el).backgroundColor));
    expect(
      await input.evaluate((el) => getComputedStyle(el).borderTopColor),
    ).toBe(await output.evaluate((el) => getComputedStyle(el).borderTopColor));
  });
});

// パターン整理
// 01. 行数／＝１行／≧２行
// 02. 各行文字数／＝０文字／≧１文字
//
// パターン一覧
// ○ 01 行数＝１行／各行文字数＝０文字
// ○ 02 行数＝１行／各行文字数≧１文字
// ○ 03 行数≧２行／各行文字数＝０文字
// ○ 04 行数≧２行／各行文字数≧１文字
test.describe("入力欄コピーボタンクリック", () => {
  test("01 行数＝１行／各行文字数＝０文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#input").fill("");

    await page.getByRole("button", { name: "入力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual([""]);
  });

  test("02 行数＝１行／各行文字数≧１文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#input").fill("A");

    await page.getByRole("button", { name: "入力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual(["A"]);
  });

  test("03 行数≧２行／各行文字数＝０文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#input").fill("\n");

    await page.getByRole("button", { name: "入力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual(["\n"]);
  });

  test("04 行数≧２行／各行文字数≧１文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#input").fill("A\nB");

    await page.getByRole("button", { name: "入力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual(["A\nB"]);
  });
});

// パターン整理
// 01. 行数／＝１行／≧２行
// 02. 前後空白／なし／あり
// 03. 無効行／なし／あり
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
    await page.locator("#input").fill("https://example.com");

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
    await page.locator("#input").fill("");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect.poll(() => getOpenedUrls(page)).toEqual([]);
  });

  test("03 行数＝１行／前後空白あり／無効行なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#input").fill(" https://example.com ");

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
    await page.locator("#input").fill("  ");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect.poll(() => getOpenedUrls(page)).toEqual([]);
  });

  test("05 行数≧２行／前後空白なし／無効行なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page
      .locator("#input")
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
    await page.locator("#input").fill("https://example.com\n");

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
      .locator("#input")
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
    await page.locator("#input").fill(" https://example.com \n  ");

    await page
      .getByRole("button", { name: "入力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([{ url: "https://example.com", target: "_blank" }]);
  });
});

test.describe("完全ランダムボタンクリック", () => {
  // パターン整理
  // 01. 入力行数／＝１行／＝２行／≧３行
  // 02. 前後空白／なし／あり
  // 03. 無効行／なし／あり
  //
  // パターン一覧
  // ○ 01 入力行数＝１行／前後空白なし／無効行なし
  // ○ 02 入力行数＝１行／前後空白なし／無効行あり
  // ○ 03 入力行数＝１行／前後空白あり／無効行なし
  // ○ 04 入力行数＝１行／前後空白あり／無効行あり
  // ○ 05 入力行数＝２行／前後空白なし／無効行なし
  // ○ 06 入力行数＝２行／前後空白なし／無効行あり
  // ○ 07 入力行数＝２行／前後空白あり／無効行なし
  // ○ 08 入力行数＝２行／前後空白あり／無効行あり
  // ○ 09 入力行数≧３行／前後空白なし／無効行なし
  // ○ 10 入力行数≧３行／前後空白なし／無効行あり
  // ○ 11 入力行数≧３行／前後空白あり／無効行なし
  // ○ 12 入力行数≧３行／前後空白あり／無効行あり
  test.describe("試行回数１回", () => {
    test("01 入力行数＝１行／前後空白なし／無効行なし", async ({ page }) => {
      const buttonId = "#fullRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("02 入力行数＝１行／前後空白なし／無効行あり", async ({ page }) => {
      const buttonId = "#fullRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("03 入力行数＝１行／前後空白あり／無効行なし", async ({ page }) => {
      const buttonId = "#fullRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("04 入力行数＝１行／前後空白あり／無効行あり", async ({ page }) => {
      const buttonId = "#fullRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("  ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("05 入力行数＝２行／前後空白なし／無効行なし", async ({ page }) => {
      const buttonId = "#fullRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("06 入力行数＝２行／前後空白なし／無効行あり", async ({ page }) => {
      const buttonId = "#fullRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("07 入力行数＝２行／前後空白あり／無効行なし", async ({ page }) => {
      const buttonId = "#fullRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("08 入力行数＝２行／前後空白あり／無効行あり", async ({ page }) => {
      const buttonId = "#fullRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("09 入力行数≧３行／前後空白なし／無効行なし", async ({ page }) => {
      const buttonId = "#fullRandomBtn";
      const items = ["A", "B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB\nC");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("10 入力行数≧３行／前後空白なし／無効行あり", async ({ page }) => {
      const buttonId = "#fullRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("11 入力行数≧３行／前後空白あり／無効行なし", async ({ page }) => {
      const buttonId = "#fullRandomBtn";
      const items = ["A", "B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B \n C ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("12 入力行数≧３行／前後空白あり／無効行あり", async ({ page }) => {
      const buttonId = "#fullRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "OLD";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });
  });

  // パターン整理
  // 01. 試行回数／＝１００回
  // 02. 各候補の出現回数／≧１回
  //
  // パターン一覧
  // ○ 01 試行回数＝１００回／各候補の出現回数≧１回
  test.describe("試行回数１００回", () => {
    test("01 試行回数＝１００回／各候補の出現回数≧１回", async ({ page }) => {
      const buttonId = "#fullRandomBtn";
      const items = ["A", "B", "C"];
      const expected = new Set(items);
      const seen = new Set();
      const trials = 100;

      await page.goto(appUrl);
      await page.locator("#input").fill(items.join("\n"));

      for (let i = 0; i < trials; i += 1) {
        await page.locator(buttonId).click();
        const output = (
          (await page.locator("#output").inputValue()) ?? ""
        ).trim();
        seen.add(output);
      }

      expect(seen).toEqual(expected);
    });
  });
});

test.describe("排他ランダムボタンクリック", () => {
  // パターン整理
  // 01. 入力行数／＝１行／＝２行／≧３行
  // 02. 出力行数／＝１行／＝２行／≧３行
  // 03. 入力の前後空白／なし／あり
  // 04. 入力の無効行／なし／あり
  // 05. 入力・出力の共通行／なし／あり
  //
  // パターン一覧
  // ○ 01 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
  // ○ 02 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
  // ○ 03 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
  // × 04 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
  // ○ 05 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
  // ○ 06 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
  // ○ 07 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
  // × 08 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
  // ○ 09 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
  // ○ 10 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
  // ○ 11 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
  // × 12 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
  // ○ 13 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
  // ○ 14 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
  // ○ 15 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
  // × 16 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
  // ○ 17 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
  // ○ 18 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
  // ○ 19 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
  // × 20 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
  // ○ 21 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
  // ○ 22 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
  // ○ 23 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
  // × 24 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり／入力前処理後の有効行が０件になり、共通行ありを成立させられないため
  // ○ 25 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
  // ○ 26 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
  // ○ 27 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
  // ○ 28 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
  // ○ 29 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
  // ○ 30 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
  // ○ 31 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
  // ○ 32 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
  // ○ 33 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
  // ○ 34 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
  // ○ 35 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
  // ○ 36 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
  // ○ 37 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
  // ○ 38 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
  // ○ 39 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
  // ○ 40 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
  // ○ 41 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
  // ○ 42 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
  // ○ 43 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
  // ○ 44 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
  // ○ 45 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
  // ○ 46 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
  // ○ 47 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
  // ○ 48 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
  // ○ 49 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
  // ○ 50 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
  // ○ 51 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
  // ○ 52 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
  // ○ 53 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
  // ○ 54 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
  // ○ 55 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
  // ○ 56 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
  // ○ 57 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
  // ○ 58 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
  // ○ 59 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
  // ○ 60 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
  // ○ 61 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
  // ○ 62 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
  // ○ 63 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
  // ○ 64 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
  // ○ 65 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし
  // ○ 66 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり
  // ○ 67 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし
  // ○ 68 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり
  // ○ 69 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし
  // ○ 70 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり
  // ○ 71 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし
  // ○ 72 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり
  test.describe("試行回数１回", () => {
    test("01 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("02 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("03 入力行数＝１行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("05 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("06 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("07 入力行数＝１行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("  ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("09 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("10 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("11 入力行数＝１行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("13 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("14 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("15 入力行数＝１行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("  ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("17 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("18 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("19 入力行数＝１行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("21 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("22 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("23 入力行数＝１行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("  ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("25 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("26 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });

    test("27 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("28 入力行数＝２行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("29 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("30 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });

    test("31 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("32 入力行数＝２行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("33 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("34 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });

    test("35 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("36 入力行数＝２行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("37 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("38 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });

    test("39 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("40 入力行数＝２行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("41 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("42 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });

    test("43 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("44 入力行数＝２行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("45 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("46 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });

    test("47 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("A");
    });

    test("48 入力行数＝２行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("");
    });

    test("49 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB\nC");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("50 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB\nC");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("51 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("52 入力行数≧３行／出力行数＝１行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });

    test("53 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B \n C ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("54 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B \n C ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("55 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("56 入力行数≧３行／出力行数＝１行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });

    test("57 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB\nC");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("58 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB\nC");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("59 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("60 入力行数≧３行／出力行数＝２行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });

    test("61 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B \n C ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("62 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B \n C ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("63 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("64 入力行数≧３行／出力行数＝２行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });

    test("65 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB\nC");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("66 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\nB\nC");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX\nY";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("67 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("68 入力行数≧３行／出力行数≧３行／入力の前後空白なし／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill("A\n\nB");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });

    test("69 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B \n C ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("70 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行なし／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["B", "C"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n B \n C ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX\nY";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("71 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B"];

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "X\nY\nZ";
      });

      await page.locator(buttonId).click();
      const output = (
        (await page.locator("#output").inputValue()) ?? ""
      ).trim();
      expect(items).toContain(output);
    });

    test("72 入力行数≧３行／出力行数≧３行／入力の前後空白あり／入力の無効行あり／入力・出力の共通行あり", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";

      await page.goto(appUrl);
      await page.locator("#input").fill(" A \n  \n B ");
      await page.locator("#output").evaluate((el) => {
        (el as HTMLTextAreaElement).value = "A\nX\nY";
      });

      await page.locator(buttonId).click();
      await expect(page.locator("#output")).toHaveValue("B");
    });
  });

  // パターン整理
  // 01. 試行回数／＝１００回
  // 02. 各候補の出現回数／≧１回
  // 03. 前回と同じ値の許容／なし
  //
  // パターン一覧
  // ○ 01 試行回数＝１００回／各候補の出現回数≧１回／前回と同じ値の許容＝なし
  test.describe("試行回数１００回", () => {
    test("01 試行回数＝１００回／各候補の出現回数≧１回／前回と同じ値の許容＝なし", async ({
      page,
    }) => {
      const buttonId = "#exclusiveRandomBtn";
      const items = ["A", "B", "C"];
      const expected = new Set(items);
      const seen = new Set();
      const trials = 100;

      await page.goto(appUrl);
      await page.locator("#input").fill(items.join("\n"));

      for (let i = 0; i < trials; i += 1) {
        const previous = (
          (await page.locator("#output").inputValue()) ?? ""
        ).trim();
        await page.locator(buttonId).click();
        const output = (
          (await page.locator("#output").inputValue()) ?? ""
        ).trim();
        seen.add(output);

        if (previous !== "") {
          expect(output).not.toBe(previous);
        }
      }

      expect(seen).toEqual(expected);
    });
  });
});

// パターン整理
// 01. 行数／＝１行／≧２行
// 02. 各行文字数／＝０文字／≧１文字
//
// パターン一覧
// ○ 01 行数＝１行／各行文字数＝０文字
// ○ 02 行数＝１行／各行文字数≧１文字
// ○ 03 行数≧２行／各行文字数＝０文字
// ○ 04 行数≧２行／各行文字数≧１文字
test.describe("出力欄コピーボタンクリック", () => {
  test("01 行数＝１行／各行文字数＝０文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value = "";
    });

    await page.getByRole("button", { name: "出力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual([""]);
  });

  test("02 行数＝１行／各行文字数≧１文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value = "A";
    });

    await page.getByRole("button", { name: "出力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual(["A"]);
  });

  test("03 行数≧２行／各行文字数＝０文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value = "\n";
    });

    await page.getByRole("button", { name: "出力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual(["\n"]);
  });

  test("04 行数≧２行／各行文字数≧１文字", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value = "A\nB";
    });

    await page.getByRole("button", { name: "出力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual(["A\nB"]);
  });
});

// パターン整理
// 01. 行数／＝１行／≧２行
// 02. 前後空白／なし／あり
// 03. 無効行／なし／あり
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
test.describe("出力欄リンク起動ボタンクリック", () => {
  test("01 行数＝１行／前後空白なし／無効行なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value = "https://example.com/output";
    });

    await page
      .getByRole("button", { name: "出力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([{ url: "https://example.com/output", target: "_blank" }]);
  });

  test("02 行数＝１行／前後空白なし／無効行あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value = "";
    });

    await page
      .getByRole("button", { name: "出力欄のリンクを新しいタブで開く" })
      .click();

    await expect.poll(() => getOpenedUrls(page)).toEqual([]);
  });

  test("03 行数＝１行／前後空白あり／無効行なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value = " https://example.com/output ";
    });

    await page
      .getByRole("button", { name: "出力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([{ url: "https://example.com/output", target: "_blank" }]);
  });

  test("04 行数＝１行／前後空白あり／無効行あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value = "  ";
    });

    await page
      .getByRole("button", { name: "出力欄のリンクを新しいタブで開く" })
      .click();

    await expect.poll(() => getOpenedUrls(page)).toEqual([]);
  });

  test("05 行数≧２行／前後空白なし／無効行なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value =
        "https://example.com/output\nhttps://example.org/output";
    });

    await page
      .getByRole("button", { name: "出力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([
        { url: "https://example.com/output", target: "_blank" },
        { url: "https://example.org/output", target: "_blank" },
      ]);
  });

  test("06 行数≧２行／前後空白なし／無効行あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value = "https://example.com/output\n";
    });

    await page
      .getByRole("button", { name: "出力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([{ url: "https://example.com/output", target: "_blank" }]);
  });

  test("07 行数≧２行／前後空白あり／無効行なし", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value =
        " https://example.com/output \n https://example.org/output ";
    });

    await page
      .getByRole("button", { name: "出力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([
        { url: "https://example.com/output", target: "_blank" },
        { url: "https://example.org/output", target: "_blank" },
      ]);
  });

  test("08 行数≧２行／前後空白あり／無効行あり", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);
    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value = " https://example.com/output \n  ";
    });

    await page
      .getByRole("button", { name: "出力欄のリンクを新しいタブで開く" })
      .click();

    await expect
      .poll(() => getOpenedUrls(page))
      .toEqual([{ url: "https://example.com/output", target: "_blank" }]);
  });
});

test.describe("パイプラインビルダー", () => {
  test("ステップの追加、パラメータ変更、実行、削除", async ({ page }) => {
    await page.goto(appUrl);

    // 1. 空白削除ステップを追加
    await page.locator("#processorSelect").selectOption("trim");
    await page.locator("#addStepBtn").click();
    await expect(page.locator(".pipeline-step-item")).toHaveCount(1);
    await expect(page.locator(".pipeline-step-name")).toHaveText("空白削除");

    // 2. 空行除外ステップを追加
    await page.locator("#processorSelect").selectOption("filterEmpty");
    await page.locator("#addStepBtn").click();
    await expect(page.locator(".pipeline-step-item")).toHaveCount(2);

    // 3. ランダム抽出ステップを追加
    await page.locator("#processorSelect").selectOption("pickRandom");
    await page.locator("#addStepBtn").click();
    await expect(page.locator(".pipeline-step-item")).toHaveCount(3);

    // 4. パラメータ変更 (抽出件数を 2 に)
    const pickRandomItem = page.locator(".pipeline-step-item").nth(2);
    const countInput = pickRandomItem.locator('input[type="number"]');
    await countInput.fill("2");

    // 5. 実行
    await page.locator("#input").fill("  A  \n\n  B  \n  C  \n  D  ");
    await page.locator("#pipelineRunBtn").click();

    // 結果の検証 (A,B,C,D から 2 つ選ばれるはず)
    const result = await page.locator("#output").inputValue();
    const resultLines = result.split("\n").filter((l) => l.trim() !== "");
    expect(resultLines).toHaveLength(2);
    for (const line of resultLines) {
      expect(["A", "B", "C", "D"]).toContain(line);
    }

    // 6. 削除 (2番目のステップを削除)
    const secondItem = page.locator(".pipeline-step-item").nth(1);
    await secondItem.locator(".pipeline-delete-btn").click();
    await expect(page.locator(".pipeline-step-item")).toHaveCount(2);
  });
});
