import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Card } from "./components/atoms/Card/Card";
import { InlineCode } from "./components/atoms/InlineCode/InlineCode";

/**
 * Three levels, because there are three relationships a surface can have to
 * the page. Before this, sixteen call sites used four Tailwind shadow steps
 * with no rule connecting them.
 */

type ElevationVars = CSSProperties & {
  "--roster-elevation-raised"?: string;
  "--roster-elevation-anchored"?: string;
  "--roster-elevation-overlay"?: string;
};

const LEVELS = [
  {
    level: "raised",
    when: "Rests on the page and scrolls with it.",
    used: "Card (filled variants), Table (primary), CallToAction",
  },
  {
    level: "anchored",
    when: "Anchored to something, and temporary.",
    used: "Select / Combobox / MultiSelect panels, Tooltip, Avatar popover, ActionBar, Navbar's menus",
  },
  {
    level: "overlay",
    when: "Detached from the page entirely.",
    used: "Dialog, Toast",
  },
];

function Ladder({ label, style }: { label: string; style?: ElevationVars }) {
  return (
    <div className="rst:flex rst:min-w-0 rst:flex-1 rst:flex-col rst:gap-4" style={style}>
      <h3 className="rst:text-xs rst:font-semibold rst:text-gray-700 rst:dark:text-gray-300">
        {label}
      </h3>

      {LEVELS.map((entry) => (
        <div
          key={entry.level}
          data-level={entry.level}
          className={`rst:elevation-${entry.level} rst:rounded-lg rst:border rst:border-gray-200 rst:bg-white rst:p-4 rst:dark:border-gray-800 rst:dark:bg-gray-900`}
        >
          <p className="rst:font-mono rst:text-xs rst:font-bold rst:text-gray-900 rst:dark:text-gray-100">
            {entry.level}
          </p>
          <p className="rst:mt-1 rst:text-xs rst:text-gray-600 rst:dark:text-gray-400">
            {entry.when}
          </p>
          <p className="rst:mt-2 rst:text-[11px] rst:text-gray-500 rst:dark:text-gray-500">
            {entry.used}
          </p>
        </div>
      ))}
    </div>
  );
}

function Panel({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      className={
        (mode === "dark" ? "dark rst:bg-gray-950" : "rst:bg-gray-50") +
        " rst:flex-1 rst:p-6 rst:flex rst:flex-col rst:gap-6"
      }
    >
      <p className="rst:text-[10px] rst:font-bold rst:uppercase rst:tracking-widest rst:text-gray-400 rst:dark:text-gray-500">
        {mode} mode
      </p>

      <div className="rst:flex rst:gap-6">
        <Ladder label="Roster defaults" />
        {/* Inline `style` beats Roster's `.dark` block by specificity, which is
            why it works here — a consumer writing the same thing in a `:root`
            rule would NOT see it in dark mode, because Roster re-declares all
            three under `.dark`, a closer ancestor. The README says to set both
            scopes; this ladder is showing the values, not the mechanism. */}
        <Ladder
          label="Retuned"
          style={{
            "--roster-elevation-raised": "0 2px 0 0 rgb(20 17 13 / 0.9)",
            "--roster-elevation-anchored": "0 4px 0 0 rgb(20 17 13 / 0.9)",
            "--roster-elevation-overlay": "0 8px 0 0 rgb(20 17 13 / 0.9)",
          }}
        />
      </div>

      <div className="rst:flex rst:flex-col rst:gap-2">
        <h3 className="rst:text-xs rst:font-semibold rst:text-gray-700 rst:dark:text-gray-300">
          On a real component
        </h3>
        <Card variant="white" padding="sm">
          <p className="rst:text-sm rst:text-gray-700 rst:dark:text-gray-300">
            <InlineCode>Card</InlineCode> takes <InlineCode>raised</InlineCode>.
            Its fill still comes from <InlineCode>--roster-card-bg</InlineCode> —
            elevation is depth only.
          </p>
        </Card>
      </div>
    </div>
  );
}

const meta = {
  title: "Foundations/Elevation",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Three levels, each a themeable box-shadow.\n\n```css\n:root {\n  --roster-elevation-raised: 0 2px 0 0 rgb(20 17 13 / 0.9);\n  --roster-elevation-anchored: 0 4px 0 0 rgb(20 17 13 / 0.9);\n  --roster-elevation-overlay: 0 8px 0 0 rgb(20 17 13 / 0.9);\n}\n.dark {\n  /* Set BOTH scopes. Roster re-declares all three under `.dark`, a closer\n     ancestor than `:root`, so a `:root`-only override is inherited past. */\n}\n```\n\nThe right-hand ladder replaces all three with hard offset shadows, to show that the levels are a consumer's to retune and not a fixed look.\n\n**Depth only — never fill.** `Card`'s `slate`, `primary` and `glass` each *name* a surface, so a token that also set a background would mean something different inside each name, which is the same reason the popover family stays separate. Fill stays with `--roster-card-*`, `--roster-popover-*` and `--roster-control-*`.\n\n**Controls are not surfaces.** `Button`, the `Select` trigger and the `Avatar` ring keep their own `shadow-sm` and stay out of the scale — a button and a card do not have the same relationship to the page, and giving a 32px control the depth of a card is how a scale stops meaning anything.\n\n**Dark is not light with more alpha.** A shadow implies light from above, and a dark ground gives it far less range to fall into, so the dark values lean heavier and tighter. Bumping the alpha alone reads as smudge rather than lift.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Levels: Story = {
  render: () => (
    <div className="rst:flex rst:min-h-screen rst:flex-col rst:md:flex-row">
      <Panel mode="light" />
      <Panel mode="dark" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* jsdom has no CSS, so whether the three levels actually resolve to three
       different shadows — and whether a consumer's override reaches them — is
       only answerable in a browser. */
    const shadowOf = (level: string, index: number) =>
      getComputedStyle(
        canvasElement.querySelectorAll(`[data-level="${level}"]`)[index],
      ).boxShadow;

    const [raised, anchored, overlay] = LEVELS.map((entry) =>
      shadowOf(entry.level, 0),
    );

    for (const shadow of [raised, anchored, overlay]) {
      await expect(shadow).not.toBe("none");
    }
    await expect(new Set([raised, anchored, overlay]).size).toBe(3);

    /* The retuned ladder is the second of each pair. */
    await expect(shadowOf("raised", 1)).not.toBe(raised);

    await expect(canvas.getAllByText("raised").length).toBeGreaterThan(0);
  },
};
