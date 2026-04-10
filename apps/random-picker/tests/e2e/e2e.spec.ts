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

test.describe("初期表示", () => {
  test("01 主要要素と初期状態を表示する", async ({ page }) => {
    await page.goto(appUrl);

    // 主要要素の存在確認
    await expect(page.locator("#input")).toBeVisible();
    await expect(page.locator("#output")).toBeVisible();
    await expect(page.locator("#processorSelect")).toBeVisible();
    await expect(page.locator("#addStepBtn")).toBeVisible();
    await expect(page.locator("#pipelineRunBtn")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "入力欄をコピー" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "入力欄のリンクを新しいタブで開く" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "出力欄をコピー" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "出力欄のリンクを新しいタブで開く" }),
    ).toBeVisible();

    // 初期値の確認
    await expect(page.locator("#input")).toHaveValue("");
    await expect(page.locator("#output")).toHaveValue("");
    await expect(
      page.getByText("ステップがありません。追加してください。"),
    ).toBeVisible();
  });
});

test.describe("入力欄", () => {
  test("01 コピーボタン／入力内容をコピーできる", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);

    await page.locator("#input").fill("A\nB");
    await page.getByRole("button", { name: "入力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual(["A\nB"]);
  });

  test("02 オープンボタン／入力内容のURLを開ける", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);

    await page
      .locator("#input")
      .fill(" https://example.com \n\nhttps://example.org ");
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
});

test.describe("パイプライン", () => {
  test("01 追加・削除／ステップを追加して削除できる", async ({ page }) => {
    await page.goto(appUrl);

    // trim を追加して確認
    await page.locator("#processorSelect").selectOption("trim");
    await page.locator("#addStepBtn").click();
    await expect(page.locator(".pipeline-step-item")).toHaveCount(1);
    await expect(page.locator(".pipeline-step-name")).toHaveText("空白削除");

    // filterEmpty を追加して確認
    await page.locator("#processorSelect").selectOption("filterEmpty");
    await page.locator("#addStepBtn").click();
    await expect(page.locator(".pipeline-step-item")).toHaveCount(2);
    await expect(page.locator(".pipeline-step-name")).toHaveText([
      "空白削除",
      "空行除外",
    ]);

    // 2件目を削除して確認
    await page
      .locator(".pipeline-step-item")
      .nth(1)
      .locator(".pipeline-delete-btn")
      .click();
    await expect(page.locator(".pipeline-step-item")).toHaveCount(1);
    await expect(page.locator(".pipeline-step-name")).toHaveText(["空白削除"]);
  });

  test("02 並び替え／ステップ順の変更を実行結果に反映できる", async ({
    page,
  }) => {
    await page.goto(appUrl);

    // trim → filterEmpty の順で追加
    await page.locator("#processorSelect").selectOption("trim");
    await page.locator("#addStepBtn").click();
    await page.locator("#processorSelect").selectOption("filterEmpty");
    await page.locator("#addStepBtn").click();
    await expect(page.locator(".pipeline-step-name")).toHaveText([
      "空白削除",
      "空行除外",
    ]);

    // dragstart / dragover で1件目を2件目の位置へ移動
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    await page
      .locator(".pipeline-step-item")
      .nth(0)
      .dispatchEvent("dragstart", { dataTransfer });
    await page
      .locator(".pipeline-step-item")
      .nth(1)
      .dispatchEvent("dragover", { dataTransfer });

    // 並び替え後の順序を確認
    await expect(page.locator(".pipeline-step-name")).toHaveText([
      "空行除外",
      "空白削除",
    ]);

    // dragend を並び替え後2件目（空白削除）に dispatch
    await page
      .locator(".pipeline-step-item")
      .nth(1)
      .dispatchEvent("dragend", { dataTransfer });

    // 空行除外 → 空白削除 の順で実行すると " \n A " → "\nA" になる
    await page.locator("#input").fill(" \n A ");
    await page.locator("#pipelineRunBtn").click();
    await expect(page.locator("#output")).toHaveValue("\nA");
  });

  test("03 実行／追加の入力欄がなく、出力欄の内容を使わない処理を実行できる", async ({
    page,
  }) => {
    await page.goto(appUrl);

    // trim → filterEmpty を追加して実行
    await page.locator("#processorSelect").selectOption("trim");
    await page.locator("#addStepBtn").click();
    await page.locator("#processorSelect").selectOption("filterEmpty");
    await page.locator("#addStepBtn").click();

    await page.locator("#input").fill("  A  \n\n  B  \n  C  ");
    await page.locator("#pipelineRunBtn").click();

    await expect(page.locator("#output")).toHaveValue("A\nB\nC");
  });

  test("04 実行／追加の入力欄がある処理を実行できる", async ({ page }) => {
    await page.goto(appUrl);

    // pickRandom を追加
    await page.locator("#processorSelect").selectOption("pickRandom");
    await page.locator("#addStepBtn").click();
    await expect(page.locator(".pipeline-step-item")).toHaveCount(1);

    // 追加入力欄（抽出件数）の存在と初期値を確認
    const countInput = page
      .locator(".pipeline-step-item")
      .nth(0)
      .locator('input[type="number"]');
    await expect(countInput).toHaveCount(1);
    await expect(countInput).toHaveValue("1");

    // 抽出件数を 2 に変更して実行
    await countInput.fill("2");
    await page.locator("#input").fill("A\nB\nC\nD");
    await page.locator("#pipelineRunBtn").click();

    // 結果は A/B/C/D から重複なし 2 件
    const result = await page.locator("#output").inputValue();
    const resultLines = result.split("\n").filter((l) => l.trim() !== "");
    expect(resultLines.length).toBe(2);
    for (const line of resultLines) {
      expect(["A", "B", "C", "D"]).toContain(line);
    }
    expect(new Set(resultLines).size).toBe(2);
  });

  test("05 実行／出力欄の内容を使う処理を実行できる", async ({ page }) => {
    await page.goto(appUrl);

    // ステップなしで実行して前回出力を作る
    await page.locator("#input").fill("A\nB\nC");
    await page.locator("#pipelineRunBtn").click();
    await expect(page.locator("#output")).toHaveValue("A\nB\nC");

    // excludePrevious を追加して再実行
    await page.locator("#processorSelect").selectOption("excludePrevious");
    await page.locator("#addStepBtn").click();
    await page.locator("#input").fill("A\nB\nC\nD");
    await page.locator("#pipelineRunBtn").click();

    // 前回出力（A/B/C）を除外した D だけが残る
    await expect(page.locator("#output")).toHaveValue("D");
  });
});

test.describe("出力欄", () => {
  test("01 コピーボタン／出力内容をコピーできる", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);

    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value = "X\nY";
    });
    await page.getByRole("button", { name: "出力欄をコピー" }).click();

    await expect.poll(() => getCopiedTexts(page)).toEqual(["X\nY"]);
  });

  test("02 オープンボタン／出力内容のURLを開ける", async ({ page }) => {
    await installBrowserApiStubs(page);
    await page.goto(appUrl);

    await page.locator("#output").evaluate((el) => {
      (el as HTMLTextAreaElement).value =
        " https://example.com/output \n\nhttps://example.org/output ";
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
});
