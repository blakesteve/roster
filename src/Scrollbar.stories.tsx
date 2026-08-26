import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./components/atoms/Textarea/Textarea";

/**
 * `custom-scrollbar`, which Textarea asked for long before it existed.
 *
 * The class sat in `textarea-variants.ts` referencing nothing — not defined in
 * this stylesheet, not in Storybook's, not anywhere — so the field got the
 * browser's default scrollbar and the name was aspirational. It is a real
 * utility now, and works on any scrollable surface rather than only Textarea.
 *
 * Roster's default deliberately sits close to the browser's, because a
 * component library should not repaint your scrollbars just for being
 * installed. The first column below is the unstyled control, and on a Mac it
 * looks almost identical to the second — that is the point of the default, not
 * a bug in it. What the utility buys you is the third and fourth columns.
 */

const LINES = Array.from(
  { length: 16 },
  (_, i) => `Line ${i + 1}. Scroll this column to bring its scrollbar out.`,
);

/** A consumer would set these in their own `:root`; inline shows it live. */
type ThumbVars = CSSProperties & { "--roster-scrollbar-thumb"?: string };

function Column({
  label,
  note,
  className,
  style,
}: {
  label: string;
  note: string;
  className: string;
  style?: ThumbVars;
}) {
  return (
    <div className="rst:flex rst:min-w-0 rst:flex-1 rst:flex-col rst:gap-2">
      <h3 className="rst:text-xs rst:font-semibold rst:text-gray-700 rst:dark:text-gray-300">
        {label}
      </h3>
      <p className="rst:font-mono rst:text-[10px] rst:leading-snug rst:text-gray-500 rst:dark:text-gray-400">
        {note}
      </p>
      <div
        className={`rst:h-40 rst:overflow-y-auto rst:rounded-md rst:border rst:border-gray-200 rst:p-3 rst:text-xs rst:leading-relaxed rst:text-gray-700 rst:dark:border-gray-800 rst:dark:text-gray-300 ${className}`.trim()}
        style={style}
      >
        {LINES.map((line) => (
          <p key={line} className="rst:mb-2">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function Panel({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      className={
        (mode === "dark" ? "dark rst:bg-gray-950" : "rst:bg-white") +
        " rst:flex-1 rst:p-6 rst:flex rst:flex-col rst:gap-5"
      }
    >
      <p className="rst:text-[10px] rst:font-bold rst:uppercase rst:tracking-widest rst:text-gray-400 rst:dark:text-gray-500">
        {mode} mode
      </p>

      <div className="rst:flex rst:gap-4">
        <Column label="Unstyled" note="browser default" className="" />
        <Column
          label="Roster default"
          note="gray-300 / gray-700"
          className="rst:custom-scrollbar"
        />
        <Column
          label="Retinted"
          note="--roster-scrollbar-thumb: primary-500"
          className="rst:custom-scrollbar"
          style={{
            "--roster-scrollbar-thumb": "var(--roster-primary-500, #0f6498)",
          }}
        />
        <Column
          label="Retinted"
          note="--roster-scrollbar-thumb: error-500"
          className="rst:custom-scrollbar"
          style={{
            "--roster-scrollbar-thumb": "var(--roster-error-500, #b92020)",
          }}
        />
      </div>

      <div className="rst:flex rst:flex-col rst:gap-2">
        <h3 className="rst:text-xs rst:font-semibold rst:text-gray-700 rst:dark:text-gray-300">
          Textarea, which carries the utility by default
        </h3>
        <Textarea defaultValue={LINES.join("\n")} rows={5} />
      </div>
    </div>
  );
}

const meta = {
  title: "Foundations/Scrollbar",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A themeable scrollbar for `Textarea` and anything else you put `rst:custom-scrollbar` on.\n\n**Scroll each column** — a scrollbar only renders when there is overflow, and on macOS with *Show scroll bars: When scrolling* it appears on scroll and fades away again.\n\nThe first two columns look nearly identical on a Mac, and that is deliberate: the default thumb is `gray-300` (`gray-700` in dark), which is close to what the browser already draws. A component library repainting your scrollbars merely for being installed would be the wrong default. The value is the last two columns — one custom property moves the thumb.\n\n```css\n:root { --roster-scrollbar-thumb: #0f6498; }\n.dark { --roster-scrollbar-thumb: #5ea3de; }\n```\n\nSet it in **both** scopes. Roster's own `.dark` rule has equal specificity and comes later in the stylesheet, so a `:root`-only override is discarded in dark mode.\n\n### Why two mechanisms\n\n`scrollbar-width` and `scrollbar-color` are the standard properties. Firefox has had both for years, Chromium since 121, Safari `scrollbar-width` since **18.2** and `scrollbar-color` later still. A supporting browser drops the WebKit pseudo-elements for any element that sets *either* property to a non-initial value, and this utility sets both — so the two never fight.\n\nThe consequence is that the `::-webkit-scrollbar` block is legacy-only — Safari 18.1 and older, Chromium 120 and older. The 8px width and the `border` + `background-clip` inset-pill thumb live there, so on anything current they never run and `scrollbar-width: thin` is the whole shape control you get. Color is the part that works everywhere, which is the part this story is about.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scrollbar: Story = {
  render: () => (
    <div className="rst:flex rst:w-full rst:flex-col rst:overflow-hidden rst:border rst:border-gray-200 rst:dark:border-gray-800">
      <Panel mode="light" />
      <Panel mode="dark" />
    </div>
  ),
};
