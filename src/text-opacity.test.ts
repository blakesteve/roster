import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Every `opacity-*` class and every alpha text color in the library's source,
 * each with the reason it's there. A check that reads `color` alone scores
 * text at opacity 0.6 as if it were solid: SegmentBar's legend percent read
 * 7.63:1 that way and painted 2.88:1. So any new one fails here until it's
 * classed below, and if it's on text or an icon, measured as painted in
 * `src/text-opacity.checks.stories.tsx` first.
 *
 * - `measured`: text or an icon, measured there and held to its bar.
 * - `inactive`: a disabled, blocked or rejected state, which WCAG's contrast
 *   rules exempt.
 * - `motion`: an enter or leave transition, or a mark shown and hidden.
 * - `decorative`: nothing to read: loading dots, a ping, a skeleton block, a
 *   sheet's drag grabber beside its close button.
 * - `mark`: a logo's fade. A logo is exempt from contrast as a mark (WCAG
 *   1.4.11's logotype and incidental exceptions), and its name is in its alt.
 * - `open`: measured below its bar, with a ruling to fix it. Its figure goes on
 *   the ledger in the checks story, and it stays `open` here until the fix
 *   lands. None is open: the five 5.20.0 left open were fixed in 5.21.0.
 */
type Why = "measured" | "inactive" | "motion" | "decorative" | "mark" | "open";

const KNOWN: Record<string, Record<string, Why>> = {
  "components/atoms/Avatar/Avatar.tsx": { "rst:data-closed:opacity-0": "motion" },
  "components/atoms/Badge/Badge.tsx": { "rst:opacity-70": "measured" },
  "components/atoms/Button/button-variants.ts": { "rst:disabled:opacity-50": "inactive" },
  "components/atoms/Checkbox/Checkbox.tsx": { "rst:opacity-0": "motion", "rst:opacity-100": "motion", "rst:opacity-50": "inactive" },
  "components/atoms/Chip/Chip.tsx": { "rst:opacity-70": "measured", "rst:hover:opacity-100": "measured", "rst:disabled:hover:opacity-70": "inactive" },
  "components/atoms/Chip/chip-variants.ts": { "rst:opacity-50": "inactive" },
  "components/atoms/Combobox/Combobox.tsx": { "rst:opacity-0": "motion", "rst:opacity-100": "motion", "rst:opacity-70": "measured" },
  "components/atoms/Disclosure/Disclosure.tsx": { "rst:data-closed:opacity-0": "motion", "rst:opacity-60": "measured" },
  "components/atoms/Input/Input.tsx": { "rst:peer-disabled:opacity-70": "inactive" },
  "components/atoms/Input/input-variants.ts": { "rst:disabled:opacity-50": "inactive" },
  "components/atoms/Link/Link.tsx": { "rst:opacity-70": "measured" },
  "components/atoms/LoadingDots/LoadingDots.tsx": { "rst:opacity-100": "decorative", "rst:opacity-60": "decorative", "rst:opacity-30": "decorative" },
  "components/atoms/MultiSelect/MultiSelect.tsx": {
    "rst:opacity-70": "measured",
    "rst:hover:opacity-100": "measured",
    "rst:disabled:opacity-40": "inactive",
    "rst:opacity-50": "inactive",
    "rst:opacity-0": "motion",
    "rst:opacity-100": "motion",
  },
  "components/atoms/PasswordInput/PasswordInput.tsx": { "rst:opacity-40": "inactive" },
  "components/atoms/Pill/Pill.tsx": { "rst:opacity-75": "decorative" },
  "components/atoms/Select/Select.tsx": { "rst:opacity-0": "motion", "rst:opacity-100": "motion" },
  "components/atoms/Select/select-variants.ts": { "rst:data-disabled:opacity-50": "inactive", "rst:disabled:opacity-50": "inactive" },
  "components/atoms/Switch/Switch.tsx": { "rst:opacity-50": "inactive" },
  "components/atoms/Switch/switch-variants.ts": { "rst:disabled:opacity-50": "inactive" },
  "components/atoms/Textarea/Textarea.tsx": { "rst:peer-disabled:opacity-70": "inactive" },
  "components/atoms/Textarea/textarea-variants.ts": { "rst:disabled:opacity-50": "inactive" },
  "components/molecules/Alert/Alert.tsx": { "rst:opacity-90": "measured", "rst:opacity-70": "measured", "rst:hover:opacity-100": "measured" },
  "components/molecules/CallToAction/CallToAction.tsx": {
    "rst:opacity-90": "measured",
    "rst:dark:opacity-80": "measured",
    "rst:opacity-70": "measured",
    "rst:hover:opacity-100": "measured",
  },
  "components/molecules/Carousel/Carousel.tsx": { "rst:opacity-75": "measured" },
  "components/molecules/CheckboxGroup/CheckboxGroup.tsx": { "rst:data-disabled:opacity-50": "inactive", "rst:opacity-50": "inactive" },
  "components/molecules/ErrorState/ErrorState.tsx": { "rst:text-error-800/80": "measured", "rst:dark:text-error-200/80": "measured" },
  "components/molecules/FileUpload/FileUpload.tsx": { "rst:opacity-50": "inactive", "rst:opacity-70": "inactive" },
  "components/molecules/MatchupCard/MatchupCard.tsx": { "rst:opacity-50": "mark" },
  "components/molecules/Menu/Menu.tsx": {
    "rst:opacity-75": "measured",
    "rst:opacity-70": "measured",
    "rst:aria-disabled:opacity-50": "inactive",
    "rst:data-closed:opacity-0": "motion",
  },
  "components/molecules/Pagination/Pagination.tsx": { "rst:opacity-50": "inactive" },
  "components/molecules/RadioGroup/RadioGroup.tsx": {
    "rst:data-disabled:opacity-50": "inactive",
    "rst:opacity-50": "inactive",
    "rst:opacity-0": "motion",
    "rst:opacity-100": "motion",
  },
  "components/molecules/RadioTileGroup/RadioTileGroup.tsx": { "rst:opacity-50": "inactive" },
  "components/molecules/RadioTileGroup/radio-tile-group-variants.ts": { "rst:data-disabled:opacity-50": "inactive" },
  "components/molecules/SkeletonPresets/SkeletonPresets.tsx": { "rst:opacity-75": "decorative" },
  "components/molecules/Slider/track-parts.tsx": { "rst:opacity-50": "inactive" },
  "components/molecules/Slider/track.ts": { "rst:opacity-50": "inactive" },
  "components/molecules/Toast/Toast.tsx": { "rst:opacity-70": "measured", "rst:hover:opacity-100": "measured" },
  "components/molecules/Toast/Toaster.tsx": { "rst:opacity-0": "motion" },
  "components/organisms/DataTable/DataTable.tsx": { "rst:opacity-80": "measured", "rst:hover:opacity-100": "measured" },
  "components/organisms/Dialog/Dialog.tsx": {
    "rst:opacity-75": "measured",
    "rst:opacity-50": "measured",
    "rst:hover:opacity-100": "measured",
    "rst:opacity-0": "motion",
    "rst:opacity-100": "motion",
  },
  "components/organisms/ModerationQueue/ModerationQueue.tsx": { "rst:opacity-50": "inactive" },
  "components/organisms/Navbar/Navbar.tsx": { "rst:opacity-0": "motion", "rst:opacity-100": "motion" },
  "components/organisms/Sheet/Sheet.tsx": {
    "rst:opacity-75": "measured",
    "rst:opacity-60": "measured",
    "rst:hover:opacity-100": "measured",
    "rst:focus-visible:opacity-100": "measured",
    "rst:data-closed:opacity-0": "motion",
    "rst:opacity-30": "decorative",
  },
};

/* An opacity utility, or a text color with an alpha, with any variants. */
const CLASS = /(?:rst:)(?:[a-z0-9[\]&_=*-]+:)*(?:opacity-\d+|text-[a-z]+(?:-\d+)?\/\d+)/g;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.(stories|test)\./.test(name) ? [path] : [];
  });
}

function found(): Record<string, Record<string, true>> {
  const out: Record<string, Record<string, true>> = {};
  for (const path of [...sources(join(__dirname, "components")), ...sources(join(__dirname, "internal"))]) {
    /* Comments can name a class without using it. */
    const code = readFileSync(path, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    const classes = code.match(CLASS);
    if (classes) out[relative(__dirname, path)] = Object.fromEntries(classes.map((c) => [c, true]));
  }
  return out;
}

describe("opacity and alpha text in the library", () => {
  it("every one is known, and none known is gone", () => {
    const seen = found();
    const unknown: string[] = [];
    const gone: string[] = [];
    for (const [file, classes] of Object.entries(seen)) {
      for (const cls of Object.keys(classes)) if (!KNOWN[file]?.[cls]) unknown.push(`${file}: ${cls}`);
    }
    for (const [file, classes] of Object.entries(KNOWN)) {
      for (const cls of Object.keys(classes)) if (!seen[file]?.[cls]) gone.push(`${file}: ${cls}`);
    }
    expect(unknown).toEqual([]);
    expect(gone).toEqual([]);
  });

  it("reaches the whole library, and the ones fixed by an ink carry none", () => {
    const seen = found();
    expect(Object.keys(seen).length).toBe(Object.keys(KNOWN).length);
    expect(Object.keys(seen).length).toBeGreaterThan(40);
    for (const file of [
      /* 5.20.0 */
      "components/atoms/SegmentBar/SegmentBar.tsx",
      "components/atoms/Stat/stat-variants.ts",
      "components/atoms/CollapsibleSection/CollapsibleSection.tsx",
      /* 5.21.0 */
      "components/atoms/AvatarStrip/AvatarStrip.tsx",
      "components/organisms/Footer/Footer.tsx",
      "components/organisms/ActionBar/ActionBar.tsx",
    ]) {
      expect(statSync(join(__dirname, file)).isFile(), file).toBe(true);
      expect(seen[file], file).toBeUndefined();
    }
  });

  it("none is open, and the checks story's ledger is empty", () => {
    const open = Object.entries(KNOWN).flatMap(([file, classes]) =>
      Object.entries(classes)
        .filter(([, why]) => why === "open")
        .map(([cls]) => `${file}: ${cls}`),
    );
    expect(open).toEqual([]);
    const story = readFileSync(join(__dirname, "text-opacity.checks.stories.tsx"), "utf8");
    const from = story.indexOf("const BELOW");
    expect(from).toBeGreaterThan(-1);
    const ledger = story.slice(from, story.indexOf(";", from) + 1);
    expect(ledger.replace(/\s+/g, "")).toBe("constBELOW:Record<string,number>={};");
  });

  it("twin: an opacity on text it hasn't seen is reported", () => {
    /* Assembled, so Tailwind's scan of this file doesn't emit them. */
    const fade = ["rst", "opacity-60"].join(":");
    const alpha = ["rst", "dark", "text-gray-400/70"].join(":");
    const code = `<span className="rst:text-xs ${fade}">60%</span> <p className="${alpha}">x</p>`;
    expect(code.match(CLASS)).toEqual([fade, alpha]);
  });
});
