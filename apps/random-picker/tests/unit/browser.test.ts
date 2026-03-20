import { describe, expect, test, vi } from "vitest";
import { copyTextToClipboard, openUrls } from "../../src/browser.ts";

// パターン整理
// 01. 文字数／＝０文字／≧１文字
//
// パターン一覧
// ○ 01 文字数＝０文字
// ○ 02 文字数≧１文字
describe("copyTextToClipboard", () => {
  test("01 文字数＝０文字", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await copyTextToClipboard("");

    expect(writeText).toHaveBeenCalledWith("");
  });

  test("02 文字数≧１文字", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await copyTextToClipboard("A");

    expect(writeText).toHaveBeenCalledWith("A");
  });
});

// パターン整理
// 01. 要素数／＝０件／≧１件
// 02. 文字数／＝０文字／≧１文字
//
// パターン一覧
// ○ 01 要素数＝０件
// ○ 02 要素数≧１件／文字数＝０文字
// ○ 03 要素数≧１件／文字数≧１文字
describe("openUrls", () => {
  test("01 要素数＝０件", () => {
    const open = vi.fn<typeof window.open>(() => null);
    window.open = open;

    openUrls([]);

    expect(open).not.toHaveBeenCalled();
  });

  test("02 要素数≧１件／文字数＝０文字", () => {
    const open = vi.fn<typeof window.open>(() => null);
    window.open = open;

    openUrls(["", ""]);

    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenNthCalledWith(1, "", "_blank");
    expect(open).toHaveBeenNthCalledWith(2, "", "_blank");
  });

  test("03 要素数≧１件／文字数≧１文字", () => {
    const open = vi.fn<typeof window.open>(() => null);
    window.open = open;

    openUrls(["a", "b"]);

    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenNthCalledWith(1, "a", "_blank");
    expect(open).toHaveBeenNthCalledWith(2, "b", "_blank");
  });
});
