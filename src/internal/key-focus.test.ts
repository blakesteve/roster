import { describe, expect, it } from "vitest";
import * as roster from "../index";
import { KEY_FOCUS, useKeyFocus } from "./key-focus";

/* The tracker's behavior is checked with real keys in Chromium and WebKit
   (key-focus.checks.stories.tsx, key-focus-consumer.checks.stories.tsx).
   Here, only that a consumer can reach it. */
describe("the keyboard-mode tracker", () => {
  it("is exported from the package's entry, as the same hook and attribute", () => {
    expect([roster.useKeyFocus === useKeyFocus, roster.KEY_FOCUS, KEY_FOCUS]).toEqual([true, "data-key-focus", "data-key-focus"]);
  });
});
