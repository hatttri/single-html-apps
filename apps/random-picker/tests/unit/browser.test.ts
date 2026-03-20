import { describe, expect, test, vi } from "vitest";
import { copyTextToClipboard, openUrls } from "../../src/browser.ts";

describe("copyTextToClipboard", () => {
  describe("正常系", () => {
    test("文字列をコピーする", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      await copyTextToClipboard("ランダムピッカー");

      expect(writeText).toHaveBeenCalledWith("ランダムピッカー");
    });
  });

  describe("異常系", () => {
    test("文字数が0文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      await copyTextToClipboard("");

      expect(writeText).toHaveBeenCalledWith("");
    });

    test("文字数が1文字", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      await copyTextToClipboard("A");

      expect(writeText).toHaveBeenCalledWith("A");
    });
  });
});

describe("openUrls", () => {
  describe("正常系", () => {
    test("URLを開く", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls(["https://example.com", "https://openai.com"]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://openai.com", "_blank");
    });
  });

  describe("境界系", () => {
    test("URLが0件", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls([]);

      expect(open).not.toHaveBeenCalled();
    });

    test("URLが1件", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls(["https://example.com"]);

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
    });
  });

  describe("異常系", () => {
    test("URLが空文字列", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls(["", ""]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "", "_blank");
    });

    test("URLが異常", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls(["abc", "xyz"]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "abc", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "xyz", "_blank");
    });
  });
});
