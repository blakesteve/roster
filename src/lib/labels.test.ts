import { describe, expect, it } from "vitest";
import { withLabels } from "./labels";

type Words = { close: string; more: (n: number) => string };
const DEFAULTS: Words = { close: "Close", more: (n) => `${n} more` };

describe("withLabels", () => {
  it("replaces what an app passes and keeps the rest", () => {
    const l = withLabels(DEFAULTS, { close: "Cerrar" });
    expect([l.close, l.more(2)]).toEqual(["Cerrar", "2 more"]);
  });

  it("keeps a default an app passes as undefined, as a catalog missing a key would", () => {
    const l = withLabels(DEFAULTS, { close: undefined, more: undefined });
    expect([l.close, l.more(2)]).toEqual(["Close", "2 more"]);
    /* The twin: a plain spread lets the undefined through. */
    const spread = { ...DEFAULTS, ...{ close: undefined, more: undefined } };
    expect([spread.close, spread.more]).toEqual([undefined, undefined]);
  });

  it("leaves the defaults themselves alone", () => {
    withLabels(DEFAULTS, { close: "Cerrar" });
    expect(DEFAULTS.close).toBe("Close");
  });
});
