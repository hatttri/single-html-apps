import { expect, test, type Page } from "@playwright/test";

const appUrl = new URL("../../generated/index.html", import.meta.url).href;

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
