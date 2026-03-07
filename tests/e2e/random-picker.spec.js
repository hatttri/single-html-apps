// @ts-check
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { test, expect } = require("@playwright/test");

const appUrl = pathToFileURL(
  path.resolve(__dirname, "..", "..", "random-picker.html"),
).href;

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
