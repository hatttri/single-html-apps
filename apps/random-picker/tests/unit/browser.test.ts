import { describe, expect, test, vi } from "vitest";
import { copyTextToClipboard, openUrls } from "../../src/browser.ts";

describe("copyTextToClipboard", () => {
  describe("正常系", () => {
    test("正常 / Clipboard.writeText() が呼ばれる", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      await copyTextToClipboard("ランダムピッカー");

      expect(writeText).toHaveBeenCalledWith("ランダムピッカー");
    });
  });

  describe("境界系", () => {
    test("value.length=0 / Clipboard.writeText() が呼ばれる", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });

      await copyTextToClipboard("");

      expect(writeText).toHaveBeenCalledWith("");
    });

    test("value.length=1 / Clipboard.writeText() が呼ばれる", async () => {
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
    test("有効な URL / Window.open() が呼ばれる", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls(["https://example.com", "https://openai.com"]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "https://openai.com", "_blank");
    });
  });

  describe("境界系", () => {
    test("urls.length=0 / Window.open() が呼ばれない", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls([]);

      expect(open).not.toHaveBeenCalled();
    });

    test("urls.length=1 / Window.open() が呼ばれる", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls(["https://example.com"]);

      expect(open).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenNthCalledWith(1, "https://example.com", "_blank");
    });
  });

  describe("異常系", () => {
    test("urls[i].length=0 / Window.open() が呼ばれる", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls(["", ""]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "", "_blank");
    });

    test("無効な URL / Window.open() が呼ばれる", () => {
      const open = vi.fn<typeof window.open>(() => null);
      window.open = open;

      openUrls(["abc", "xyz"]);

      expect(open).toHaveBeenCalledTimes(2);
      expect(open).toHaveBeenNthCalledWith(1, "abc", "_blank");
      expect(open).toHaveBeenNthCalledWith(2, "xyz", "_blank");
    });
  });
});
