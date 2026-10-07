import { useLayoutEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { MediaPreview } from "./MediaPreview";

/**
 * What MediaPreview promises, checked in Chromium with real image loads.
 * Expected values are literals written from the requirement, each with a
 * twin that must come out differently.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/MediaPreview/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAACAkQBADs=";
const MISSING = "/does-not-exist.heic";

const q = <E extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<E>(sel);
const size = (el: Element) => {
  const box = el.getBoundingClientRect();
  return [Math.round(box.width), Math.round(box.height)];
};

export const FallsBackWhenItCantRender: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, padding: 16 }}>
      <div data-preview="ok">
        <MediaPreview src={PIXEL} href="https://example.com/a.jpg" alt="A fern on a windowsill" />
      </div>
      <div data-preview="broken">
        <MediaPreview src={MISSING} href="https://example.com/b.heic" alt="A teapot, side on" />
      </div>
      <div data-preview="none">
        <MediaPreview src={null} alt="A brass desk lamp" />
      </div>
    </div>
  ),
  play: async () => {
    /* Twin: a preview that loads stays an image. */
    await expect(q('[data-preview="ok"] img')?.getAttribute("alt")).toBe("A fern on a windowsill");
    await waitFor(() => expect(q('[data-preview="broken"] a')).not.toBeNull());
    const link = q<HTMLAnchorElement>('[data-preview="broken"] a')!;
    await expect(link.getAttribute("href")).toBe("https://example.com/b.heic");
    await expect(link.getAttribute("target")).toBe("_blank");
    await expect(link.getAttribute("aria-label")).toBe("Preview unavailable. Open original, in a new tab: A teapot, side on");
    await expect(q('[data-preview="broken"] img'), "no broken image left behind").toBeNull();
    await expect(q('[data-preview="none"] [role="img"]')?.getAttribute("aria-label")).toBe(
      "Preview unavailable: A brass desk lamp",
    );
    await expect(q('[data-preview="none"] a'), "nothing to open, so no link").toBeNull();
  },
};

export const KeepsItsFootprint: Story = {
  /* A row of previews doesn't jump when one fails: the image, the fallback
     link and the fallback card are all 144 by 112. */
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: 16 }}>
      <div data-preview="ok">
        <MediaPreview src={PIXEL} alt="A fern" />
      </div>
      <div data-preview="link">
        <MediaPreview src={MISSING} href="https://example.com/b.heic" alt="A teapot" />
      </div>
      <div data-preview="card">
        <MediaPreview src={null} alt="A lamp" />
      </div>
      {/* Twin: a plain image at its own size, which the check must not pass. */}
      <img data-preview="raw" src={PIXEL} alt="" style={{ width: 120, height: 90 }} />
    </div>
  ),
  play: async () => {
    await waitFor(() => expect(q('[data-preview="link"] a')).not.toBeNull());
    await expect(size(q('[data-preview="ok"] img')!)).toEqual([144, 112]);
    await expect(size(q('[data-preview="link"] a')!)).toEqual([144, 112]);
    await expect(size(q('[data-preview="card"] [role="img"]')!)).toEqual([144, 112]);
    await expect(size(q('[data-preview="raw"]')!)).not.toEqual([144, 112]);
  },
};

/* Lets a play swap the preview's source, as an app would on a new signed link. */
const control = { setSrc: (() => {}) as (src: string | null) => void, failures: 0 };

function Swappable() {
  const [src, setSrc] = useState<string | null>(MISSING);
  useLayoutEffect(() => {
    control.setSrc = setSrc;
  }, []);
  return (
    <div style={{ padding: 16 }} data-preview="swap">
      <MediaPreview
        src={src}
        href="https://example.com/original.jpg"
        alt="A fern"
        onUnavailable={() => {
          control.failures += 1;
        }}
      />
    </div>
  );
}

export const ANewSourceGetsItsOwnTry: Story = {
  render: () => <Swappable />,
  play: async () => {
    control.failures = 0;
    await waitFor(() => expect(q('[data-preview="swap"] a')).not.toBeNull());
    await expect(control.failures, "reported once").toBe(1);
    /* A fresh link replaces the expired one: the image comes back. */
    control.setSrc(PIXEL);
    await waitFor(() => expect(q('[data-preview="swap"] img')).not.toBeNull());
    await expect(q('[data-preview="swap"] a')).toBeNull();
    /* And a second failure is a second report. */
    control.setSrc("/also-missing.heic");
    await waitFor(() => expect(q('[data-preview="swap"] a')).not.toBeNull());
    await expect(control.failures).toBe(2);
  },
};

export const PassesImageAttributesThrough: Story = {
  render: () => (
    <div style={{ padding: 16 }} data-preview="attrs">
      <MediaPreview src={PIXEL} alt="A fern" loading="lazy" decoding="async" title="Sent today" />
    </div>
  ),
  play: async () => {
    const img = q<HTMLImageElement>('[data-preview="attrs"] img')!;
    await expect([img.getAttribute("loading"), img.getAttribute("decoding"), img.getAttribute("title")]).toEqual([
      "lazy",
      "async",
      "Sent today",
    ]);
  },
};

export const TheFallbackLinkTakesFocus: Story = {
  render: () => (
    <div style={{ padding: 16 }} data-preview="focus">
      <MediaPreview src={MISSING} href="https://example.com/b.heic" alt="A teapot" />
      <MediaPreview src={null} alt="A lamp" />
    </div>
  ),
  play: async () => {
    await waitFor(() => expect(q('[data-preview="focus"] a')).not.toBeNull());
    const link = q('[data-preview="focus"] a')!;
    link.focus();
    await expect(document.activeElement).toBe(link);
    /* Twin: the card with nothing to open isn't a stop on the way. */
    const card = q('[data-preview="focus"] [role="img"]')!;
    await expect(card.tabIndex).toBe(-1);
  },
};
