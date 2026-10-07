import type { Meta, StoryObj } from "@storybook/react-vite";
import { MediaPreview } from "./MediaPreview";

/* Flat illustrations drawn inline, so the stories need no network. */
const art = (bg: string, shape: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 144 112'><rect width='144' height='112' fill='${bg}'/>${shape}</svg>`,
  )}`;
const FERN = art("#e6efe2", "<path d='M72 100 C72 70 70 40 76 12' stroke='#4f7942' stroke-width='4' fill='none'/><path d='M74 30 l-20 -8 M75 44 l-24 -6 M74 58 l-24 -4 M75 34 l18 -10 M75 48 l22 -8 M74 62 l22 -4' stroke='#6a994e' stroke-width='5' stroke-linecap='round'/>");
const TEAPOT = art("#f3ead8", "<ellipse cx='70' cy='68' rx='34' ry='26' fill='#3d6b8c'/><rect x='58' y='34' width='24' height='10' rx='4' fill='#3d6b8c'/><path d='M104 62 q20 -6 22 -22' stroke='#3d6b8c' stroke-width='7' fill='none' stroke-linecap='round'/><path d='M38 58 q-16 4 -14 20' stroke='#3d6b8c' stroke-width='6' fill='none'/>");
const LAMP = art("#ece6f2", "<path d='M52 30 h40 l12 34 h-64 z' fill='#d9a441'/><rect x='69' y='64' width='6' height='26' fill='#5b4a3a'/><rect x='54' y='90' width='36' height='6' rx='3' fill='#5b4a3a'/>");

const meta = {
  title: "Molecules/MediaPreview",
  component: MediaPreview,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A thumbnail that admits when it can't render. Previews fail in ordinary ways: a short-lived signed link that has expired, or a format the browser can't draw, such as a photo straight off a phone. Instead of a broken-image glyph, MediaPreview shows a card that says the preview is unavailable and links to the original, in the same 144 by 112 footprint, so a row of previews doesn't jump when one fails.\n\n`alt` is required, and it names the link too, so a screen reader hears what each \"Open original\" opens. `onUnavailable` is called when a preview fails, for an app that keeps a count.",
      },
    },
  },
  args: {
    alt: "A potted fern on a windowsill",
    src: FERN,
    href: "https://example.com/originals/fern.jpg",
  },
} satisfies Meta<typeof MediaPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: "A preview that loads is just the image, cropped to fill its frame." } },
  },
};

export const Unavailable: Story = {
  args: {
    src: "/originals/teapot.heic",
    href: "https://example.com/originals/teapot.heic",
    alt: "A blue teapot, side on",
  },
  parameters: {
    docs: {
      description: {
        story: "The browser can't draw this one, so it falls back to a link to the original, which opens in a new tab.",
      },
    },
  },
};

export const NothingToOpen: Story = {
  args: { src: null, href: null, alt: "A brass desk lamp" },
  parameters: {
    docs: {
      description: {
        story: "With no preview and no original to link to, the card says so and is named for what it would have shown.",
      },
    },
  },
};

export const ARowOfPreviews: Story = {
  name: "A row of previews",
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      <MediaPreview src={FERN} href="https://example.com/originals/fern.jpg" alt="A potted fern on a windowsill" />
      <MediaPreview src="/originals/teapot.heic" href="https://example.com/originals/teapot.heic" alt="A blue teapot, side on" />
      <MediaPreview src={LAMP} href="https://example.com/originals/lamp.jpg" alt="A brass desk lamp" />
      <MediaPreview src={TEAPOT} href="https://example.com/originals/teapot-front.jpg" alt="The blue teapot, from the front" />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: "One preview failing in a row of four. Every card keeps the same footprint, so nothing shifts." },
    },
  },
};

export const OwnWords: Story = {
  name: "In your own words",
  args: {
    src: null,
    href: "https://example.com/originals/fern.jpg",
    unavailableLabel: "Vista previa no disponible",
    openLabel: "Abrir el original",
  },
  parameters: {
    docs: { description: { story: "Both phrases can be replaced, for another language or another tone." } },
  },
};
