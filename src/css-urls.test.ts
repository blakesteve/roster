import { describe, expect, it } from "vitest";
import { absoluteUrls } from "../scripts/check-css-urls.mjs";

/**
 * The matcher behind scripts/check-css-urls.mjs, which fails the build when a
 * shipped stylesheet loads anything from another host. The build runs it on
 * the real roster.css; this pins what it counts as another host, each case
 * with a twin that must come out the other way.
 */
describe("absolute urls in shipped CSS", () => {
  it("catches the texture 5.4.0 shipped, and passes it written relative", () => {
    const shipped = ".x{background-image:url(https://www.transparenttextures.com/patterns/cubes.png)}";
    expect(absoluteUrls(shipped)).toEqual(["https://www.transparenttextures.com/patterns/cubes.png"]);
    expect(absoluteUrls(".x{background-image:url(/patterns/cubes.png)}")).toEqual([]);
  });

  it("catches quoted, spaced and protocol-relative urls", () => {
    expect(
      absoluteUrls(`a{b:url("http://a.example/x.png")}c{d:url( 'https://b.example/y.woff2' )}e{f:url(//c.example/z.svg)}`),
    ).toEqual(["http://a.example/x.png", "https://b.example/y.woff2", "//c.example/z.svg"]);
    expect(absoluteUrls(`a{b:url("x.png")}c{d:url( './y.woff2' )}e{f:url(../z.svg)}`)).toEqual([]);
  });

  it("catches an address CSS reads from a bare string", () => {
    expect(absoluteUrls(`@import "https://fonts.example/a.css";`)).toEqual(["https://fonts.example/a.css"]);
    expect(absoluteUrls(`a{background:image-set("https://img.example/x.png" 1x, 'y.png' 2x)}`)).toEqual(["https://img.example/x.png"]);
    expect(absoluteUrls(`a{b:url("https://a.example/x\\"y.png")}`)).toEqual(['https://a.example/x\\"y.png']);
    expect(absoluteUrls(`@import "local.css";`)).toEqual([]);
  });

  it("passes a data: url, which loads nothing", () => {
    expect(absoluteUrls(`a{mask:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'/%3e")}`)).toEqual([]);
    expect(absoluteUrls(`a{mask:url(data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'/%3e)}`)).toEqual([]);
    expect(absoluteUrls(`a{mask:url("ftp://d.example/m.svg")}`)).toEqual(["ftp://d.example/m.svg"]);
  });
});
