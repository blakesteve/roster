import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./components/atoms/Button/Button";
import { Input } from "./components/atoms/Input/Input";

/**
 * The focus ring, which until recently did not exist.
 *
 * `Button` asked for `ring-ring` and `ring-offset-background`, and neither
 * `--color-ring` nor `--color-background` was ever defined. Tailwind builds utilities from theme tokens, so an
 * undefined token means the utility is simply never emitted — the classes sat
 * in the components looking correct and produced no CSS at all.
 *
 * What rendered instead was the fallback, `var(--tw-ring-color, currentcolor)`:
 * the ring took the text color. On a solid Button with white text that is a
 * white ring, on a white offset band, on a white page. A 1:1 focus indicator,
 * on the most-used control in the library.
 *
 * This story is a keyboard test, not a visual one — `:focus-visible` only
 * matches when focus arrives from the keyboard, which is the point. Click into
 * a panel and press Tab.
 */

const SCHEMES = ["primary", "error", "success", "teal", "amber", "neutral"] as const;

function Panel({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      className={
        (mode === "dark" ? "dark rst:bg-gray-950" : "rst:bg-white") +
        " rst:flex-1 rst:p-6 rst:flex rst:flex-col rst:gap-5"
      }
    >
      <p className="rst:text-[10px] rst:font-bold rst:uppercase rst:tracking-widest rst:text-gray-400 rst:dark:text-gray-500">
        {mode} mode — press Tab
      </p>

      <div className="rst:flex rst:flex-wrap rst:gap-3">
        {SCHEMES.map((scheme) => (
          <Button key={scheme} colorScheme={scheme} variant="solid" size="sm">
            {scheme}
          </Button>
        ))}
      </div>

      <div className="rst:flex rst:flex-wrap rst:gap-3">
        {(["outline", "ghost"] as const).map((variant) => (
          <Button key={variant} colorScheme="primary" variant={variant} size="sm">
            {variant}
          </Button>
        ))}
      </div>

      <div className="rst:max-w-xs">
        <Input placeholder="Tab into me" />
      </div>
    </div>
  );
}

const meta = {
  title: "Foundations/Focus",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "**Click a panel, then press Tab.** `:focus-visible` only matches keyboard focus, so a click will not show the ring — which is correct, and is why this cannot be a screenshot.\n\nThe ring resolves through `--roster-ring` and its offset through `--roster-ring-offset`, both of which flip under `.dark`: `primary-500` on white in light, `primary-400` on `gray-950` in dark. Measured against the surface either side of it, the indicator is 6.37:1 in light and 7.31:1 in dark, where WCAG **1.4.11 Non-text Contrast** (AA) asks for 3:1. It also clears the area and change-of-contrast clauses in 2.4.13 Focus Appearance, which is AAA.\n\nBefore this, both tokens were undefined, so `ring-ring` and `ring-offset-background` emitted nothing and the ring fell back to `currentColor` — a white ring on a white page, at 1:1. Retint it for your own palette by setting `--roster-ring`; `scripts/check-classes-emit.mjs` now fails the build if a component asks for a utility the theme never defines.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const KeyboardFocus: Story = {
  render: () => (
    <div className="rst:flex rst:w-full rst:overflow-hidden rst:border rst:border-gray-200 rst:dark:border-gray-800">
      <Panel mode="light" />
      <Panel mode="dark" />
    </div>
  ),
};
