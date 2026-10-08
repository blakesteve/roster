import { describe, expect, it } from "vitest";
import { acceptList, formatBytes, matchesType, sameFile, typeOf } from "./file-rules";

const file = (name: string, type: string, size = 10, lastModified = 1) =>
  new File([new Uint8Array(size)], name, { type, lastModified });

describe("file rules", () => {
  it("reads a missing type from the extension, and trusts a reported one", () => {
    expect(typeOf(file("IMG_0412.JPG", ""))).toBe("image/jpeg");
    expect(typeOf(file("scan.png", ""))).toBe("image/png");
    expect(typeOf(file("notes", ""))).toBe("");
    /* The twin: a reported type wins over the extension. */
    expect(typeOf(file("scan.png", "image/webp"))).toBe("image/webp");
  });

  it("matches a type, a family and an extension, as accept does", () => {
    const jpeg = file("pier.jpg", "image/jpeg");
    expect(matchesType(jpeg, ["image/jpeg"])).toBe(true);
    expect(matchesType(jpeg, ["image/png"])).toBe(false);
    expect(matchesType(jpeg, ["image/*"])).toBe(true);
    expect(matchesType(jpeg, ["video/*"])).toBe(false);
    expect(matchesType(jpeg, [".JPG"])).toBe(true);
    expect(matchesType(jpeg, [".png"])).toBe(false);
    expect(matchesType(jpeg, [])).toBe(true);
  });

  it("judges a file with no type by its extension", () => {
    expect(matchesType(file("pier.jpeg", ""), ["image/jpeg", "image/png"])).toBe(true);
    expect(matchesType(file("pier.txt", ""), ["image/jpeg", "image/png"])).toBe(false);
    expect(matchesType(file("pier.heic", ""), ["image/*"])).toBe(true);
  });

  it("splits an accept attribute", () => {
    expect(acceptList("image/jpeg, image/png,.webp")).toEqual(["image/jpeg", "image/png", ".webp"]);
    expect(acceptList("")).toEqual([]);
  });

  it("knows the same file picked twice", () => {
    expect(sameFile(file("a.jpg", "image/jpeg", 10, 5), file("a.jpg", "image/jpeg", 10, 5))).toBe(true);
    expect(sameFile(file("a.jpg", "image/jpeg", 10, 5), file("a.jpg", "image/jpeg", 10, 6))).toBe(false);
    expect(sameFile(file("a.jpg", "image/jpeg", 10, 5), file("a.jpg", "image/jpeg", 11, 5))).toBe(false);
  });

  it("writes sizes the way a limit is written", () => {
    expect(formatBytes(15 * 1024 * 1024)).toBe("15 MB");
    expect(formatBytes(2.4 * 1024 * 1024)).toBe("2.4 MB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2 MB");
    expect(formatBytes(820 * 1024)).toBe("820 KB");
    expect(formatBytes(999)).toBe("999 B");
  });
});
