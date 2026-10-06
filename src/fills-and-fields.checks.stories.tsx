import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Input } from "./components/atoms/Input/Input";
import { Textarea } from "./components/atoms/Textarea/Textarea";
import { Card } from "./components/atoms/Card/Card";
import { Dialog } from "./components/organisms/Dialog/Dialog";

/**
 * Two readability rules, checked rendered in Chromium.
 *
 * Text on Card's and Dialog's primary fill is that fill's ink token, as on
 * every other solid fill, so an app with a light primary can make it dark. And every
 * placeholder reaches 4.5:1 against the field it sits in, in both schemes,
 * measured from the colors Chromium actually paints, layers composited.
 *
 * Each has a failing twin: the old white text where the ink must not apply,
 * and the old placeholder steps through the same measurement, which must
 * fail it.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Fills and fields/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};
const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";
const WHITE = "rgb(255, 255, 255)";

/** Sets each token on <html> for the length of `run`, optionally in dark. */
async function withTokens(tokens: Record<string, string>, run: () => Promise<void>, dark = false) {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
  if (dark) root.classList.add("dark");
  try {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await run();
  } finally {
    for (const name of Object.keys(tokens)) root.style.removeProperty(name);
    if (dark && !wasDark) root.classList.remove("dark");
  }
}

function at(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`no element for ${selector}`);
  return found;
}

/* ── Ink ─────────────────────────────────────────────────────────────── */

const INK = { "--roster-primary-600-ink": "rgb(1, 2, 3)", "--roster-primary-700-ink": "rgb(4, 5, 6)" };

export const PrimaryInkCard: Story = {
  render: () => (
    <div style={{ padding: 16 }}>
      <style>{STILL}</style>
      <div data-site="card"><Card variant="primary">Body</Card></div>
    </div>
  ),
  play: async () => {
    /* The body text a reader sees inherits the card's color. */
    const card = () => getComputedStyle(at("[data-site=card] > *")).color;
    /* Unset, white, as before. */
    await expect(card(), "Card, unset").toBe(WHITE);
    await withTokens(INK, async () => {
      await expect(card(), "Card reads primary-600's ink").toBe("rgb(1, 2, 3)");
    });
    /* Twin: the dark fill is primary-900, which this ink doesn't describe,
       so dark keeps its primary-50. */
    await withTokens(INK, async () => {
      await expect(card(), "Card, dark").not.toBe("rgb(1, 2, 3)");
    }, true);
  },
};

export const PrimaryInkDialog: Story = {
  render: () => (
    <>
      <style>{STILL}</style>
      <Dialog isOpen onClose={noop} title="Rename" variant="primary">
        Body
      </Dialog>
    </>
  ),
  play: async () => {
    /* The title inherits the panel's color: it is the text a reader sees. */
    const title = () => getComputedStyle(at("[role=dialog] h2")).color;
    const close = () => getComputedStyle(at('[role=dialog] button[aria-label="Close dialog"]')).color;
    await expect(title(), "unset").toBe(WHITE);
    await withTokens(INK, async () => {
      await expect(title()).toBe("rgb(4, 5, 6)");
      await expect(close(), "the close button").toBe("rgb(4, 5, 6)");
    });
    await withTokens(INK, async () => {
      await expect(title(), "dark keeps white").toBe(WHITE);
    }, true);
  },
};

/* ── Placeholders ────────────────────────────────────────────────────── */

/* The requirement: WCAG 1.4.3 for text, which a placeholder is. */
const MINIMUM = 4.5;

/* What 5.2.1 painted: gray-400 in light, gray-500 in dark. */
const OLD = { light: "#a8a29e", dark: "#65635f" };

/** Paints `layers` bottom to top on one pixel and reads it back, so any CSS
    color Chromium can compute, with any alpha, composites as the page does. */
function paint(layers: string[]): number[] {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  for (const color of layers) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
  }
  return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
}

/** Background colors from `el` up to the first opaque one, bottom first. */
function backgroundOf(el: Element): string[] {
  const layers: string[] = [];
  for (let node: Element | null = el; node; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor;
    layers.unshift(color);
    if (paint(["rgb(0, 0, 0)", color]).join() === paint(["rgb(255, 255, 255)", color]).join()) break;
  }
  return layers;
}

function luminance([r, g, b]: number[]) {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: number[], b: number[]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The placeholder's contrast against its own field, as painted. */
function placeholderContrast(field: Element, color = getComputedStyle(field, "::placeholder").color) {
  const ground = backgroundOf(field);
  return contrast(paint([...ground, color]), paint(ground));
}

const INPUT_VARIANTS = ["outline", "white", "soft", "slate", "ghost"] as const;
const TEXTAREA_VARIANTS = ["outline", "white", "soft", "ghost"] as const;

function Fields() {
  return (
    <>
      {INPUT_VARIANTS.map((variant) => (
        <Input key={`i-${variant}`} label={`Input ${variant}`} placeholder="Placeholder" variant={variant} />
      ))}
      <Input label="Input outline, error" placeholder="Placeholder" errorMessage="Required" />
      {TEXTAREA_VARIANTS.map((variant) => (
        <Textarea key={`t-${variant}`} label={`Textarea ${variant}`} placeholder="Placeholder" variant={variant} />
      ))}
      <Textarea label="Textarea outline, error" placeholder="Placeholder" errorMessage="Required" />
    </>
  );
}

/* An explicit page color, because Roster sets none on <body>. */
function Page({ children }: { children: ReactNode }) {
  return (
    <div data-page style={{ display: "grid", gap: 12, maxWidth: 360, padding: 16, background: "var(--page)" }}>
      <style>{`${STILL} [data-page]{--page:#ffffff} .dark [data-page]{--page:#0c0a09}`}</style>
      {children}
    </div>
  );
}

async function checkPlaceholders(scheme: "light" | "dark") {
  const fields = Array.from(document.querySelectorAll("input[placeholder], textarea[placeholder]"));
  await expect(fields.length, "fields found").toBe(11);
  for (const field of fields) {
    const name = field.getAttribute("aria-label") ?? document.querySelector(`label[for="${field.id}"]`)?.textContent ?? field.id;
    await expect(placeholderContrast(field), `${name}, ${scheme}`).toBeGreaterThanOrEqual(MINIMUM);
  }
  /* Twin: the step this field used before, through the same measurement. */
  const first = fields[0];
  await expect(placeholderContrast(first, OLD[scheme]), `the old ${scheme} step`).toBeLessThan(MINIMUM);
}

export const PlaceholdersLight: Story = {
  render: () => <Page><Fields /></Page>,
  play: () => checkPlaceholders("light"),
};

export const PlaceholdersDark: Story = {
  render: () => <Page><Fields /></Page>,
  play: () => withTokens({}, () => checkPlaceholders("dark"), true),
};

/* The token-reading fields inside the two Dialogs that invert: the text token
   flips to a light gray there, and the placeholder has to follow it. */
function InDialog({ variant }: { variant: "slate" | "primary" }) {
  return (
    <>
      <style>{STILL}</style>
      <Dialog isOpen onClose={noop} title="Rename" variant={variant}>
        <Input label="Name" placeholder="Placeholder" />
        <Textarea label="Note" placeholder="Placeholder" />
      </Dialog>
    </>
  );
}

async function checkInDialog() {
  for (const dark of [false, true]) {
    await withTokens({}, async () => {
      const fields = Array.from(document.querySelectorAll("[role=dialog] input, [role=dialog] textarea"));
      await expect(fields.length).toBe(2);
      for (const field of fields) {
        await expect(placeholderContrast(field), `${field.tagName} ${dark ? "dark" : "light"}`).toBeGreaterThanOrEqual(MINIMUM);
      }
      /* Twin: a fixed gray-500 here, which a single light-mode step would be. */
      await expect(placeholderContrast(fields[0], OLD.dark)).toBeLessThan(MINIMUM);
    }, dark);
  }
}

export const PlaceholdersInSlateDialog: Story = {
  render: () => <InDialog variant="slate" />,
  play: checkInDialog,
};

export const PlaceholdersInPrimaryDialog: Story = {
  render: () => <InDialog variant="primary" />,
  play: checkInDialog,
};
