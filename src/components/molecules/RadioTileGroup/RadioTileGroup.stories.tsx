import { useState, type CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { RadioTileGroup, type RadioTileOption } from "./RadioTileGroup";

/* A small drawn scene, standing in for a photo. Decoration: the tile is named
   by its label. */
function Scene({ sky, ground, sun }: { sky: string; ground: string; sun: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", aspectRatio: "1" }}>
      <rect width="100" height="100" fill={sky} />
      <circle cx="70" cy="34" r="12" fill={sun} />
      <path d="M0 70 L28 52 L52 66 L78 48 L100 62 L100 100 L0 100 Z" fill={ground} />
    </svg>
  );
}

const COVERS: RadioTileOption[] = [
  { value: "harbor", label: "Harbor at dawn", description: "Boats under a pink sky", picture: <Scene sky="#f9d5c9" ground="#34557a" sun="#fff3e0" /> },
  { value: "ridge", label: "Pine ridge", description: "Fog in the valley", picture: <Scene sky="#d7e3e8" ground="#2f5d47" sun="#ffffff" /> },
  { value: "flats", label: "Salt flats", description: "Noon, no shadows", picture: <Scene sky="#bfe0f5" ground="#ece6da" sun="#fff8d6" /> },
  { value: "market", label: "Night market", description: "Lanterns and steam", picture: <Scene sky="#1f2440" ground="#5b3a29" sun="#f6c66b" /> },
  { value: "orchard", label: "Orchard in May", picture: <Scene sky="#e8f1d8" ground="#7a9a4a" sun="#fffbe8" /> },
];

const meta = {
  title: "Molecules/RadioTileGroup",
  component: RadioTileGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A radio group whose options are tiles: a picture, a name and an optional description each, with no radio dot. For choosing between photos, avatars, swatches or layouts.",
          "",
          "To a keyboard and a screen reader it's the same radio group as `RadioGroup`: one tab stop, the arrows move and choose (wrapping, and skipping a disabled tile), Space chooses, and Home and End go to the first and last tile. The arrows follow the tiles' order, so Down is the next tile, as Right is. Each tile is named by its `label` alone: the `picture` is hidden from assistive technology, so give an image `alt=\"\"`.",
          "",
          "**Laying it out.** Two tiles to a row, then three from the `sm` breakpoint. `columns` takes one count or a count per breakpoint (`{ base: 2, md: 4 }`); `minTileWidth` instead fits as many tiles to a row as the group's own width holds.",
          "",
          "**Drawing your own chosen look.** Every tile carries `data-checked`, `data-disabled`, `data-hover` and `data-focus-visible`, and takes `tileClassName`. `variant=\"plain\"` drops Roster's edge and fill so nothing needs undoing. Roster's styles sit in a cascade layer below yours, so a rule like `.my-tile[data-checked] .frame { … }` wins without `!important`. The focus ring stays Roster's, outside the tile.",
          "",
          "**Tokens.** `--roster-tile-border`, `--roster-tile-bg`, `--roster-tile-border-checked` and `--roster-tile-bg-checked`, for the `outlined` look.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["outlined", "plain"] },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    label: { control: "text" },
    helperText: { control: "text" },
    errorMessage: { control: "text" },
    minTileWidth: { control: "text" },
    columns: { control: "object" },
    options: { control: false },
    value: { control: false },
    onChange: { control: false },
  },
} satisfies Meta<typeof RadioTileGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/* `value` and `onChange` after the spread, as in RadioGroup's stories: the
   meta's frozen `value` must not win over the state. */
function Stateful({ initial = "", ...props }: Partial<React.ComponentProps<typeof RadioTileGroup>> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <RadioTileGroup label="Cover photo" options={COVERS} {...props} value={value} onChange={setValue} />;
}

const WIDE: CSSProperties = { maxWidth: 560 };

export const Playground: Story = {
  args: { options: COVERS, value: "", onChange: () => {}, label: "Cover photo", helperText: "Shown at the top of your page." },
  render: (args) => (
    <div style={WIDE}>
      <Stateful {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "Salt flats" }));
    await expect(canvas.getByRole("radio", { name: "Salt flats" })).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByRole("radio", { name: "Salt flats" })).toHaveAttribute("data-checked");
  },
};

/** Names alone, or names over a line of description each. */
export const NamesOnly: Story = {
  args: { options: COVERS.map((o) => ({ ...o, description: undefined })), value: "ridge", onChange: () => {} },
  render: (args) => (
    <div style={WIDE}>
      <Stateful {...args} initial="ridge" />
    </div>
  ),
};

const SWATCHES: RadioTileOption[] = [
  ["slate", "Slate", "#475569"],
  ["moss", "Moss", "#4d7c0f"],
  ["clay", "Clay", "#b45309"],
  ["ink", "Ink", "#1e3a8a"],
  ["plum", "Plum", "#7e22ce"],
  ["rose", "Rose", "#be123c"],
].map(([value, label, color]) => ({
  value,
  label,
  picture: <span style={{ display: "block", height: 48, borderRadius: 6, background: color }} />,
}));

/** `minTileWidth`: as many tiles to a row as the width holds, here 7rem each. */
export const AMinimumWidth: Story = {
  args: { options: SWATCHES, value: "", onChange: () => {}, minTileWidth: "7rem" },
  render: (args) => (
    <div style={WIDE}>
      <Stateful {...args} label="Accent color" initial="moss" />
    </div>
  ),
};

/* Built once, here, rather than in the story's render: an element made during
   a render carries the component that made it, and Storybook's code snippet
   walks a prop's elements as plain objects, through that component and
   everything it's attached to, until the string runs out of room. */
const FRAMED: RadioTileOption[] = COVERS.slice(0, 4).map((o) => ({
  ...o,
  picture: (
    <span className="frame">
      {o.picture}
      <span className="stamp">3</span>
    </span>
  ),
}));

/**
 * `variant="plain"` and a chosen look the consumer draws itself: a dark frame
 * round the picture and a stamp on its corner, from `data-checked`. Plain CSS
 * in the consumer's own stylesheet, which outranks Roster's layer.
 */
export const YourOwnChosenLook: Story = {
  args: { options: FRAMED, value: "", onChange: () => {}, variant: "plain" },
  render: (args) => (
    <div style={WIDE} className="own-look">
      <style>{`
        .own-look .frame { position: relative; display: block; padding: 6px; }
        .own-look .stamp { position: absolute; top: -6px; right: -6px; width: 26px; height: 26px; border-radius: 50%; background: #b91c1c; color: #fff; font: 700 13px/26px system-ui; text-align: center; opacity: 0; }
        .own-look [data-checked] .frame { box-shadow: inset 0 0 0 3px #1c1917; }
        .own-look [data-checked] .stamp { opacity: 1; }
      `}</style>
      <Stateful {...args} />
    </div>
  ),
};

/** A tile that can't be chosen, and a group that can't be changed. */
export const Disabled: Story = {
  args: { options: COVERS.map((o) => (o.value === "flats" ? { ...o, disabled: true } : o)), value: "", onChange: () => {} },
  render: (args) => (
    <div style={{ ...WIDE, display: "grid", gap: 32 }}>
      <Stateful {...args} initial="harbor" />
      <Stateful label="Locked by your organization" initial="ridge" disabled />
    </div>
  ),
};

/** The message says why the answer is wrong; `required` says one is needed. */
export const Invalid: Story = {
  args: { options: COVERS, value: "", onChange: () => {}, required: true, errorMessage: "Choose a cover photo." },
  render: (args) => (
    <div style={WIDE}>
      <Stateful {...args} />
    </div>
  ),
};

/** On a dark page, with the tile tokens' dark values. */
export const Dark: Story = {
  args: { options: COVERS, value: "", onChange: () => {} },
  render: (args) => (
    <div className="dark" style={{ ...WIDE, padding: 24, borderRadius: 12, background: "#0c0a09" }}>
      <Stateful {...args} initial="market" helperText="Shown at the top of your page." />
    </div>
  ),
};
