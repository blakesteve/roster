import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { RadioGroup, type RadioGroupProps } from "./RadioGroup";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * The text `RadioGroup`, pinned to 5.17.0's build (87c7ae6), in Chromium and
 * WebKit: tiles came beside it as their own component, and it stays as it was.
 *
 * Five groups: a column at `md` with helper text and a description; a row at
 * `sm` in teal; `lg` with an error and a disabled option; a disabled group;
 * and a column on a dark page. Each is read at rest, under a real pointer on
 * an option's label, after a real click on another, and along a real Tab walk
 * with the arrows through all five. What's pinned, as SHA-256 digests: each
 * group's HTML, and the computed styles of every element in it (colors,
 * borders, corners, type, padding, outline, rings, cursor, opacity, sizes).
 * Also pinned: where focus is and which option is checked at each step.
 *
 * Pinned the same on macOS and on Linux, as Dialog's pin is: React's and
 * Headless UI's generated ids are masked, an outline's width, color and offset
 * aren't read when its style is `none` or `auto` (the platform's own ring), and
 * nothing is opened by a click whose focus the engines choose differently. A
 * mismatch logs everything it read.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/RadioGroup/Unchanged checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { value: "public", label: "Public", description: "Anyone with the link" },
  { value: "unlisted", label: "Unlisted" },
  { value: "private", label: "Private" },
];
type Case = { pin: string; dark?: boolean; props: Partial<RadioGroupProps> };
const CASES: Case[] = [
  { pin: "column", props: { label: "Who can see this", helperText: "You can change this later." } },
  { pin: "row", props: { label: "Size", size: "sm", orientation: "horizontal", colorScheme: "teal" } },
  { pin: "error", props: { label: "Plan", size: "lg", errorMessage: "Choose a plan.", options: OPTIONS.map((o, i) => (i === 1 ? { ...o, disabled: true } : o)) } },
  { pin: "disabled", props: { label: "Locked", disabled: true } },
  { pin: "dark", dark: true, props: { label: "On a dark page" } },
];

function Group({ c }: { c: Case }) {
  const [value, setValue] = useState(c.pin === "disabled" ? "private" : "");
  return <RadioGroup options={OPTIONS} {...c.props} value={value} onChange={setValue} />;
}

function Groups() {
  return (
    <div style={{ width: 520, display: "grid", gap: 20 }}>
      <button type="button" data-pin="before">
        Before
      </button>
      {CASES.map((c) => (
        <div key={c.pin} data-pin={c.pin} className={c.dark ? "dark" : undefined} style={c.dark ? { background: "#0c0a09", padding: 12 } : undefined}>
          <Group c={c} />
        </div>
      ))}
    </div>
  );
}

const html = (key: string) =>
  document
    .querySelector(`[data-pin="${key}"]`)!
    .innerHTML.replace(/-?\d+(\.\d+)?px/g, "#px")
    .replace(/_r_[0-9a-z]+_|[«:]r[0-9a-z]+[»:]/g, "ID");

const PROPS = [
  "display", "position", "box-sizing", "color", "background-color",
  "border-top-style", "border-top-width", "border-top-color", "border-left-width",
  "border-top-left-radius", "font-family", "font-size", "font-weight", "line-height",
  "text-align", "padding-top", "padding-right", "padding-bottom", "padding-left",
  "gap", "flex-direction", "align-items", "align-self", "flex-grow",
  "outline-style", "outline-width", "outline-color", "outline-offset", "box-shadow",
  "cursor", "opacity", "transform", "visibility", "height", "min-height", "min-width",
  "transition-property", "transition-duration",
];
const look = (el: Element) => {
  const s = getComputedStyle(el);
  const platform = s.outlineStyle === "none" || s.outlineStyle === "auto";
  return PROPS.map((p) => (platform && p.startsWith("outline-") && p !== "outline-style" ? "-" : s.getPropertyValue(p))).join(";");
};
const styles = (key: string) =>
  [...document.querySelectorAll(`[data-pin="${key}"] *`)].map((el) => `${el.tagName.toLowerCase()} ${look(el)}`).join("\n");

async function digest(text: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return [...bytes.slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const read = async () => {
  const out: Record<string, string> = {};
  for (const c of CASES) out[c.pin] = `${await digest(html(c.pin))} ${await digest(styles(c.pin))}`;
  return out;
};
const where = () => {
  const el = document.activeElement as HTMLElement | null;
  const name =
    !el || el === document.body
      ? "body"
      : el.getAttribute("role") === "radio"
        ? document.getElementById(el.getAttribute("aria-labelledby") ?? "")?.textContent
        : el.textContent?.trim();
  const group = el?.closest("[data-pin]")?.getAttribute("data-pin") ?? "page";
  const checked = [...document.querySelectorAll('[role="radio"][aria-checked="true"]')]
    .map((r) => `${r.closest("[data-pin]")!.getAttribute("data-pin")}:${document.getElementById(r.getAttribute("aria-labelledby") ?? "")?.textContent}`)
    .join(",");
  return `${group} ${name ?? "body"} | ${checked}`;
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chromium = () => /Chrome/.test(navigator.userAgent);

type Pinned = { rest: Record<string, string>; hovered: Record<string, string>; clicked: Record<string, string>; walked: Record<string, string>; walk: string[] };

/* Read from 87c7ae6's build (5.17.0), 1 Nov 2026. */
const OLD_BUILD: Record<"chromium" | "webkit", Pinned> = {
  chromium: {
    rest: { column: "b978ab86dd206542 a141617d5e49edf0", row: "a5e85fece6b1bb63 963028635fb6bc3b", error: "e2ca54b59e572ed0 691b22f2935af38b", disabled: "0c68769f3179644c f0b42faeba9cc00d", dark: "8e196dbc01221f57 4196ecfda1ac574f" },
    hovered: { column: "103b67e9d4f2cfe3 a141617d5e49edf0", row: "a5e85fece6b1bb63 963028635fb6bc3b", error: "e2ca54b59e572ed0 691b22f2935af38b", disabled: "0c68769f3179644c f0b42faeba9cc00d", dark: "8e196dbc01221f57 4196ecfda1ac574f" },
    clicked: { column: "b978ab86dd206542 a141617d5e49edf0", row: "430245defa7e5f3f 12c1fa77dacd997d", error: "e2ca54b59e572ed0 691b22f2935af38b", disabled: "0c68769f3179644c f0b42faeba9cc00d", dark: "8e196dbc01221f57 4196ecfda1ac574f" },
    walked: { column: "0e2c29fc34ea41a4 e8f4ead2c4ae89c7", row: "ed52c8ee8b91277b a471d2f56138f140", error: "e92b84fa9e8727bd 4389af297acb1f4e", disabled: "0c68769f3179644c f0b42faeba9cc00d", dark: "88d68d6431f88201 c816ad8d0172fb3d" },
    walk: [
      "clicked: row:Private,disabled:Private",
      "Tab: column Public | row:Private,disabled:Private",
      "ArrowDown: column Unlisted | column:Unlisted,row:Private,disabled:Private",
      "ArrowDown: column Private | column:Private,row:Private,disabled:Private",
      "Tab: row Private | column:Private,row:Private,disabled:Private",
      "ArrowRight: row Public | column:Private,row:Public,disabled:Private",
      "Tab: error Public | column:Private,row:Public,disabled:Private",
      "ArrowDown: error Private | column:Private,row:Public,error:Private,disabled:Private",
      "ArrowDown: error Public | column:Private,row:Public,error:Public,disabled:Private",
      "Tab: dark Public | column:Private,row:Public,error:Public,disabled:Private",
      "ArrowDown: dark Unlisted | column:Private,row:Public,error:Public,disabled:Private,dark:Unlisted",
    ],
  },
  webkit: {
    rest: { column: "b978ab86dd206542 b5ebee94fc841288", row: "a5e85fece6b1bb63 92e09c5aee819b06", error: "e2ca54b59e572ed0 152c6c772e3a3706", disabled: "0c68769f3179644c 2d6a5f03d0065ed4", dark: "8e196dbc01221f57 78f5fc112194478e" },
    hovered: { column: "103b67e9d4f2cfe3 b5ebee94fc841288", row: "a5e85fece6b1bb63 92e09c5aee819b06", error: "e2ca54b59e572ed0 152c6c772e3a3706", disabled: "0c68769f3179644c 2d6a5f03d0065ed4", dark: "8e196dbc01221f57 78f5fc112194478e" },
    clicked: { column: "b978ab86dd206542 b5ebee94fc841288", row: "430245defa7e5f3f e81b9518d2df5b6d", error: "e2ca54b59e572ed0 152c6c772e3a3706", disabled: "0c68769f3179644c 2d6a5f03d0065ed4", dark: "8e196dbc01221f57 78f5fc112194478e" },
    walked: { column: "0e2c29fc34ea41a4 36d7420c9473666b", row: "ed52c8ee8b91277b 7ccd29c9f8f003c0", error: "e92b84fa9e8727bd 7fe3c4cc203369f9", disabled: "0c68769f3179644c 2d6a5f03d0065ed4", dark: "88d68d6431f88201 46ae8d3cc3d86ac1" },
    walk: [
      "clicked: row:Private,disabled:Private",
      "Tab: column Public | row:Private,disabled:Private",
      "ArrowDown: column Unlisted | column:Unlisted,row:Private,disabled:Private",
      "ArrowDown: column Private | column:Private,row:Private,disabled:Private",
      "Tab: row Private | column:Private,row:Private,disabled:Private",
      "ArrowRight: row Public | column:Private,row:Public,disabled:Private",
      "Tab: error Public | column:Private,row:Public,disabled:Private",
      "ArrowDown: error Private | column:Private,row:Public,error:Private,disabled:Private",
      "ArrowDown: error Public | column:Private,row:Public,error:Public,disabled:Private",
      "Tab: dark Public | column:Private,row:Public,error:Public,disabled:Private",
      "ArrowDown: dark Unlisted | column:Private,row:Public,error:Public,disabled:Private,dark:Unlisted",
    ],
  },
};

export const WithNoNewOptionNothingChanged: Story = {
  tags: ["real-input"],
  render: () => <Groups />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const engine = chromium() ? "chromium" : "webkit";
    await document.fonts.ready;
    await wait(300);
    /* Tagged before the first read, for the real mouse to aim at. */
    for (const c of CASES) {
      const radios = document.querySelectorAll(`[data-pin="${c.pin}"] [role="radio"]`);
      radios.forEach((r, i) => r.setAttribute("data-pin-radio", `${c.pin}-${i}`));
    }
    const now: Pinned = { rest: await read(), hovered: {}, clicked: {}, walked: {}, walk: [] };
    await real.commands.realHover('[data-pin="column"] [data-pin-radio="column-1"]');
    await wait(200);
    now.hovered = await read();
    await real.commands.realClick('[data-pin="row"] [data-pin-radio="row-2"]');
    await wait(300);
    now.clicked = await read();
    now.walk.push(`clicked: ${where().split(" | ")[1]}`);
    /* The pointer off every group, on the button above them, and each step
       read once the dot's fade (200ms) has settled. */
    await real.commands.realHover('[data-pin="before"]');
    document.querySelector<HTMLElement>('[data-pin="before"]')!.focus();
    const tab = chromium() ? "Tab" : "Alt+Tab";
    for (const key of [tab, "ArrowDown", "ArrowDown", tab, "ArrowRight", tab, "ArrowDown", "ArrowDown", tab, "ArrowDown"]) {
      await real.commands.realPress([key]);
      await wait(350);
      now.walk.push(`${key.replace("Alt+", "")}: ${where()}`);
    }
    now.walked = await read();
    console.info(`RADIOGROUP UNCHANGED ${engine} ${JSON.stringify(now)}`);
    const pinned = OLD_BUILD[engine];
    if (JSON.stringify(now) !== JSON.stringify(pinned)) {
      for (const c of CASES) console.info(`RADIOGROUP UNCHANGED ${engine} ${c.pin} html: ${html(c.pin)}\nstyles:\n${styles(c.pin)}`);
    }
    await expect(now).toEqual(pinned);
  },
};
