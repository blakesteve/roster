import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Carousel, type CarouselHandle } from "./Carousel";

/* Everything in this file is styled inline. Tailwind scans all of `src`, so a
   class used only in a story would ship in `roster.css` to every consumer.
   The checks behind the component live in Carousel.checks.stories.tsx. */

/* ── Fixtures ──────────────────────────────────────────────────────────── */

type Album = { title: string; artist: string; tag: string; from: number; to: number };

const albums: Album[] = [
  { title: "Night Swim", artist: "Low Tide", tag: "Dream pop", from: 262, to: 318 },
  { title: "Paper Suns", artist: "Odette Vane", tag: "Indie", from: 28, to: 352 },
  { title: "Glasshouse", artist: "The Meridians", tag: "Rock", from: 188, to: 236 },
  { title: "Slow Static", artist: "Juno Park", tag: "Electronic", from: 292, to: 214 },
  { title: "Lantern Year", artist: "Wren & Ash", tag: "Folk", from: 36, to: 14 },
  { title: "Velvet Hours", artist: "Mara Sol", tag: "Soul", from: 338, to: 280 },
  { title: "Northbound", artist: "Atlas Choir", tag: "Ambient", from: 172, to: 206 },
  { title: "Small Fires", artist: "Kit Holloway", tag: "Singer-songwriter", from: 12, to: 44 },
  { title: "Moonlit Arcade", artist: "Pixel Bloom", tag: "Synthwave", from: 300, to: 190 },
  { title: "Saltwater", artist: "Harbor Lights", tag: "Surf", from: 196, to: 160 },
  { title: "Gold Leaf", artist: "Ines Calder", tag: "Jazz", from: 42, to: 22 },
  { title: "After Hours", artist: "Neon Parade", tag: "House", from: 250, to: 330 },
];

const gradient = (from: number, to: number) =>
  `radial-gradient(120% 90% at 15% 10%, hsl(${from} 90% 72% / 0.95), transparent 60%),
   radial-gradient(90% 90% at 90% 100%, hsl(${to} 85% 55%), transparent 70%),
   linear-gradient(135deg, hsl(${from} 70% 55%), hsl(${to} 75% 40%))`;

const ART: CSSProperties = {
  aspectRatio: "1 / 1",
  borderRadius: 16,
  display: "flex",
  alignItems: "flex-end",
  padding: 12,
  boxShadow: "0 1px 2px rgb(0 0 0 / 0.12), 0 12px 24px -12px rgb(0 0 0 / 0.45)",
};

const CHIP: CSSProperties = {
  font: "600 10px/1 var(--roster-font-ui, ui-sans-serif, system-ui)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "white",
  background: "rgb(0 0 0 / 0.28)",
  backdropFilter: "blur(6px)",
  padding: "6px 8px",
  borderRadius: 999,
};

const TITLE: CSSProperties = { marginTop: 10, fontWeight: 600, fontSize: 15, lineHeight: 1.3 };
const SUBTITLE: CSSProperties = { fontSize: 13, opacity: 0.65, lineHeight: 1.4 };

function AlbumCard({ album }: { album: Album }) {
  return (
    <a
      href={`#${album.title}`}
      onClick={(e) => e.preventDefault()}
      style={{ display: "block", color: "inherit", textDecoration: "none" }}
    >
      <div style={{ ...ART, background: gradient(album.from, album.to) }}>
        <span style={CHIP}>{album.tag}</span>
      </div>
      <div style={TITLE}>{album.title}</div>
      <div style={SUBTITLE}>{album.artist}</div>
    </a>
  );
}

function Stage({ children, width = 880 }: { children: ReactNode; width?: number }) {
  return <div style={{ maxWidth: width, marginInline: "auto", paddingBlock: 8 }}>{children}</div>;
}

function Heading({ id, children, note }: { id?: string; children: ReactNode; note?: ReactNode }) {
  return (
    <div style={{ marginInlineEnd: "auto", minWidth: 0 }}>
      <h3 id={id} style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>
        {children}
      </h3>
      {note && <p style={{ margin: "2px 0 0", fontSize: 13, opacity: 0.65 }}>{note}</p>}
    </div>
  );
}

/* ── Meta ──────────────────────────────────────────────────────────────── */

const meta = {
  title: "Molecules/Carousel",
  component: Carousel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
A sideways row: a shelf of cards, a gallery of one photo at a time, or a strip of choices.

It is a real scroll container with CSS scroll snap, so it already works the way people expect: swipe on a phone, two-finger swipe on a trackpad, Tab through the items. Every item is in the server render, and nothing moves on its own.

What it adds is the mouse:

- **Drag** the row, and it settles on the nearest item.
- **Arrows** page by as many items as are in view, and go quiet at either end.
- **Keyboard focus** brings its item into place.

A vertical wheel over the row scrolls the page, like any sideways row on the web; Shift with the wheel, or a sideways swipe, moves the row.

\`\`\`tsx
<Carousel aria-label="Recently played" itemWidth={176} gap={16}>
  {albums.map((album) => <AlbumCard key={album.id} album={album} />)}
</Carousel>
\`\`\`

Each child is one item. Size them with \`itemWidth\` (fixed) or \`perView\` (fluid, by breakpoint). Put the arrows on their own line (the default), over the ends (\`arrowPlacement="overlay"\`), or anywhere you like with \`renderArrows\`.
`,
      },
    },
  },
  argTypes: {
    arrows: { control: "inline-radio", options: ["hover", "always", "none"] },
    arrowPlacement: { control: "inline-radio", options: ["controls", "overlay"] },
    snap: { control: "inline-radio", options: ["start", "center"] },
    snapStrictness: { control: "inline-radio", options: ["mandatory", "proximity"] },
    itemWidth: { control: { type: "range", min: 120, max: 320, step: 8 } },
    gap: { control: { type: "range", min: 0, max: 40, step: 2 } },
    gutter: { control: { type: "range", min: 0, max: 48, step: 2 } },
    fade: { control: "boolean" },
    scrollbar: { control: "boolean" },
    bleed: { control: "boolean" },
    children: { control: false },
    renderArrows: { control: false },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Stories ───────────────────────────────────────────────────────────── */

/**
 * A shelf of cards. Drag it with the mouse, page with the arrows, or Tab
 * through the albums. Every control on the right is live.
 */
export const Default: Story = {
  args: {
    "aria-label": "Recently played",
    itemWidth: 176,
    gap: 16,
    gutter: 0,
    arrows: "always",
    arrowPlacement: "controls",
    snap: "start",
    snapStrictness: "mandatory",
    fade: false,
    scrollbar: false,
    bleed: false,
    children: null,
  },
  render: (args) => (
    <Stage>
      <Carousel {...args}>
        {albums.map((album) => (
          <AlbumCard key={album.title} album={album} />
        ))}
      </Carousel>
    </Stage>
  ),
};

/**
 * The arrows in the section's own heading line, beside a "See all" link, with
 * `renderArrows`. The row is named by the heading, and the arrows are named
 * after it: "Previous New this week", "Next New this week".
 */
export const InAHeadingLine: Story = {
  args: { children: null },
  parameters: { controls: { disable: true } },
  render: () => (
    <Stage>
      <Carousel
        aria-labelledby="new-this-week"
        itemWidth={176}
        gap={16}
        gutter={0}
        arrows="always"
        renderArrows={({ prev, next }) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Heading id="new-this-week" note="Twelve records we can't stop playing">
              New this week
            </Heading>
            <a href="#all" onClick={(e) => e.preventDefault()} style={{ fontSize: 14, fontWeight: 600, marginInlineEnd: 8 }}>
              See all
            </a>
            {prev}
            {next}
          </div>
        )}
      >
        {[...albums].reverse().map((album) => (
          <AlbumCard key={album.title} album={album} />
        ))}
      </Carousel>
    </Stage>
  ),
};

/**
 * Overlay arrows sit over the ends and take no space; the fade shows only on
 * a side with more to see. Here the items are buttons that choose what's
 * shown above. `scrollToIndex` brings the row back to the start.
 */
export const SelectionStrip: Story = {
  args: { children: null },
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [chosen, setChosen] = useState(0);
    const ref = useRef<CarouselHandle>(null);
    const album = albums[chosen];
    return (
      <Stage>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            gap: 20,
            alignItems: "center",
            padding: 20,
            marginBottom: 20,
            borderRadius: 24,
            background: `linear-gradient(120deg, hsl(${album.from} 80% 60% / 0.18), hsl(${album.to} 80% 50% / 0.1))`,
            transition: "background 300ms",
          }}
        >
          <div style={{ ...ART, padding: 0, background: gradient(album.from, album.to) }} />
          <div>
            <div style={{ ...SUBTITLE, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11 }}>Now featuring</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{album.title}</div>
            <div style={SUBTITLE}>
              {album.artist} · {album.tag}
            </div>
            <button
              type="button"
              onClick={() => ref.current?.scrollToIndex(0)}
              style={{ marginTop: 10, font: "inherit", fontSize: 13, fontWeight: 600, background: "none", border: 0, padding: 0, cursor: "pointer", textDecoration: "underline" }}
            >
              Back to the start
            </button>
          </div>
        </div>
        <Carousel
          ref={ref}
          aria-label="Choose a record"
          itemWidth={150}
          gap={12}
          gutter={0}
          arrowPlacement="overlay"
          arrows="always"
          fade
        >
          {albums.map((a, i) => (
            <button
              key={a.title}
              type="button"
              aria-pressed={chosen === i}
              onClick={() => setChosen(i)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 8,
                font: "inherit",
                textAlign: "start",
                color: "inherit",
                cursor: "pointer",
                borderRadius: 14,
                background: chosen === i ? `hsl(${a.from} 80% 60% / 0.16)` : "transparent",
                border: `1.5px solid ${chosen === i ? `hsl(${a.from} 70% 50%)` : "rgb(0 0 0 / 0.1)"}`,
              }}
            >
              <span style={{ width: 36, height: 36, flex: "none", borderRadius: 10, background: gradient(a.from, a.to) }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.title}
                </span>
                <span style={{ display: "block", fontSize: 12, opacity: 0.6, whiteSpace: "nowrap" }}>{a.artist}</span>
              </span>
            </button>
          ))}
        </Carousel>
      </Stage>
    );
  },
};

type Scene = { caption: string; sky: [string, string]; sun: string; far: string; near: string; sunAt: [number, number] };

const scenes: Scene[] = [
  { caption: "First light over the ridge", sky: ["#fde7c8", "#f59e8b"], sun: "#fff4d6", far: "#c06c84", near: "#6c3b5e", sunAt: [72, 58] },
  { caption: "The long road north", sky: ["#bfe3ff", "#6aa8e8"], sun: "#ffffff", far: "#5c87b8", near: "#2f4f77", sunAt: [24, 30] },
  { caption: "Harbor at blue hour", sky: ["#2b3a67", "#7a5c9e"], sun: "#ffd6a5", far: "#3e3a6d", near: "#1c1b3a", sunAt: [64, 62] },
  { caption: "Fields after the rain", sky: ["#e3f6d8", "#9fd3b0"], sun: "#fffbe6", far: "#6fae8a", near: "#2f6b4f", sunAt: [36, 40] },
  { caption: "Last of the sun", sky: ["#ffd29d", "#e2557b"], sun: "#ffefc2", far: "#a2406b", near: "#4b1d3f", sunAt: [50, 66] },
];

/* A landscape drawn in CSS: sky, sun, two ranges of hills. */
function Landscape({ scene }: { scene: Scene }) {
  const [x, y] = scene.sunAt;
  return (
    <div
      role="img"
      aria-label={scene.caption}
      style={{
        position: "relative",
        aspectRatio: "16 / 10",
        borderRadius: 20,
        overflow: "hidden",
        background: `linear-gradient(180deg, ${scene.sky[0]}, ${scene.sky[1]})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: "18%",
          aspectRatio: "1 / 1",
          translate: "-50% -50%",
          borderRadius: "50%",
          background: scene.sun,
          boxShadow: `0 0 60px 20px ${scene.sun}`,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: scene.far,
          clipPath: "polygon(0 72%, 14% 58%, 27% 66%, 42% 50%, 58% 63%, 73% 52%, 88% 64%, 100% 56%, 100% 100%, 0 100%)",
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: scene.near,
          clipPath: "polygon(0 84%, 18% 74%, 36% 82%, 55% 70%, 72% 80%, 86% 73%, 100% 80%, 100% 100%, 0 100%)",
        }}
      />
    </div>
  );
}

/**
 * One photo at a time. `perView={1}` and `oneAtATime` make each swipe move
 * exactly one, and `showPosition` adds "2 of 5", which is also each photo's
 * name for a screen reader and is announced after a move.
 */
export const Gallery: Story = {
  args: { children: null },
  parameters: { controls: { disable: true } },
  render: () => (
    <Stage width={560}>
      <Carousel aria-label="Photos" perView={1} oneAtATime showPosition arrows="always" gutter={0} gap={12}>
        {scenes.map((scene) => (
          <figure key={scene.caption} style={{ margin: 0 }}>
            <Landscape scene={scene} />
            <figcaption style={{ ...SUBTITLE, marginTop: 10, fontSize: 14 }}>{scene.caption}</figcaption>
          </figure>
        ))}
      </Carousel>
    </Stage>
  ),
};

/**
 * Sized by how many fit rather than by pixels: one and a bit on a phone, two
 * and a bit from `sm`, three and a bit from `md`. The fraction is the peek of
 * the next card. Resize the window to see it change.
 */
export const ItemsPerView: Story = {
  args: { children: null },
  parameters: { controls: { disable: true } },
  render: () => (
    <Stage>
      <Carousel aria-label="Coming up" perView={{ base: 1.2, sm: 2.2, md: 3.3 }} gap={16} gutter={0}>
        {albums.slice(0, 8).map((album, i) => (
          <a
            key={album.title}
            href={`#${album.title}`}
            onClick={(e) => e.preventDefault()}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 14,
              alignItems: "center",
              padding: 14,
              borderRadius: 18,
              color: "inherit",
              textDecoration: "none",
              border: "1px solid rgb(0 0 0 / 0.08)",
              background: `linear-gradient(160deg, hsl(${album.from} 80% 60% / 0.12), transparent 60%)`,
            }}
          >
            <span style={{ textAlign: "center", minWidth: 44 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", opacity: 0.6 }}>OCT</span>
              <span style={{ display: "block", fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{3 + i * 2}</span>
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 600 }}>{album.artist}</span>
              <span style={{ ...SUBTITLE, display: "block" }}>{album.title} tour</span>
            </span>
          </a>
        ))}
      </Carousel>
    </Stage>
  ),
};

/**
 * On a phone, a row usually runs edge to edge. `bleed` pulls it out by one
 * gutter on each side while the first card still lines up with the text
 * above. Swipe, or drag with the mouse.
 */
export const EdgeToEdgeOnAPhone: Story = {
  args: { children: null },
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: "grid", placeItems: "center", paddingBlock: 12 }}>
      <div
        style={{
          width: 375,
          borderRadius: 44,
          padding: "28px 0 32px",
          border: "10px solid #111",
          boxShadow: "0 30px 60px -30px rgb(0 0 0 / 0.6)",
          overflow: "hidden",
          background: "var(--roster-popover-bg, white)",
        }}
      >
        <div style={{ paddingInline: 20 }}>
          <div style={{ fontSize: 13, opacity: 0.6 }}>Good evening</div>
          <h3 style={{ margin: "2px 0 14px", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Made for you</h3>
          <Carousel aria-label="Made for you" itemWidth={150} gap={12} gutter={20} bleed arrows="none">
            {albums.slice(4, 10).map((album) => (
              <AlbumCard key={album.title} album={album} />
            ))}
          </Carousel>
          <p style={{ ...SUBTITLE, marginTop: 18 }}>The first card starts on the same line as the heading; the row itself runs to both edges.</p>
        </div>
      </div>
    </div>
  ),
};

/**
 * When every item fits, there is nothing to page: no arrows, no drag, no tab
 * stop of its own. It is just a row.
 */
export const WhenEverythingFits: Story = {
  args: { children: null },
  parameters: { controls: { disable: true } },
  render: () => (
    <Stage>
      <Carousel aria-label="Top three" itemWidth={176} gap={16} gutter={0} arrows="always">
        {albums.slice(0, 3).map((album) => (
          <AlbumCard key={album.title} album={album} />
        ))}
      </Carousel>
    </Stage>
  ),
};
