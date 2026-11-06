import { useState, type CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, type TabItem } from "./components/molecules/Tabs/Tabs";
import { Timeline, type TimelineStep } from "./components/molecules/Timeline/Timeline";

/**
 * `data-roster-scope`: a region with its own palette.
 *
 * The same ramp is set on the region either way. Turn the attribute off and
 * the region's ramp is still there, but the underline and the rail keep the
 * page's color, because those tokens were finished at `:root`.
 *
 * Inline styles throughout: a class named in a story ships in `roster.css`.
 */

const RAMP = {
  "--roster-primary-50": "#f5f3ff",
  "--roster-primary-400": "#a78bfa",
  "--roster-primary-500": "#7c3aed",
  "--roster-primary-600": "#6d28d9",
} as CSSProperties;

const TABS: TabItem[] = [
  { id: "soil", label: "Soil" },
  { id: "water", label: "Water" },
  { id: "light", label: "Light" },
];

const STEPS: TimelineStep[] = [
  { id: "plan", when: "Week 1", title: "Plan the bed" },
  { id: "dig", when: "Week 2", title: "Dig it over" },
  { id: "plant", when: "Week 3", title: "Plant out" },
];

interface RegionArgs {
  /** `data-roster-scope` on the region. */
  scope: boolean;
  /** `.dark` on the region as well. */
  dark: boolean;
}

function Specimen({ label }: { label: string }) {
  const [active, setActive] = useState(TABS[0].id);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Tabs tabs={TABS} activeTab={active} onChange={setActive} aria-label={label} />
      <Timeline steps={STEPS} current={3} nowBefore={3} label={`${label} steps`} />
    </div>
  );
}

function Region({ scope, dark }: RegionArgs) {
  return (
    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", padding: 24 }}>
      <Specimen label="The page" />
      <div
        {...(scope ? { "data-roster-scope": "" } : {})}
        className={dark ? "dark" : undefined}
        style={{ ...RAMP, padding: 16, borderRadius: 8, background: dark ? "#1c1917" : "#faf5ff" }}
      >
        <Specimen label="The region" />
      </div>
    </div>
  );
}

const meta = {
  title: "Foundations/Token scope",
  component: Region,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Give a region its own palette by setting ramps on it and adding `data-roster-scope`.\n\nA custom property resolves where it's declared, so `--roster-tabs-indicator` and the other semantic tokens are finished at `:root` and arrive as values. Override a ramp on a wrapper and they don't move. The attribute derives them again from the ramps in force on that element. **Turn `scope` off below** and the right-hand region keeps its ramp and loses the color.\n\nA scope owns its state, so inside a dark page one with no `.dark` of its own resets to light. Turn `dark` on to set the class beside the attribute. It doesn't cross a portal, and it doesn't stop `dark:` variants firing under an ancestor `.dark`.",
      },
    },
  },
  args: { scope: true, dark: false },
  argTypes: {
    scope: { control: "boolean" },
    dark: { control: "boolean" },
  },
} satisfies Meta<typeof Region>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ARegionWithItsOwnPalette: Story = {};

export const InDarkMode: Story = {
  args: { dark: true },
};
