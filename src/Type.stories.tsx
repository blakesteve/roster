import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Button } from "./components/atoms/Button/Button";
import { Eyebrow } from "./components/atoms/Eyebrow/Eyebrow";
import { InlineCode } from "./components/atoms/InlineCode/InlineCode";

/**
 * Roster has three type roles, and until this story existed the only way to
 * learn that was to read the README.
 *
 * Two of them were also unreachable in practice. `font-mono` resolved through
 * `--rst-font-mono`, a Tailwind internal, so the components that opt into
 * monospace could only be retyped through a name Roster does not promise to
 * keep. `font-display` did not exist at all.
 */

/** A consumer sets these in their own `:root`; inline shows it live. */
type FontVars = CSSProperties & {
  "--roster-font-ui"?: string;
  "--roster-font-mono"?: string;
  "--roster-font-display"?: string;
};

/* Deliberately system faces rather than a webfont: the point is to SEE the
   role change, and a story that depends on a network fetch shows nothing when
   the fetch fails. */
const THEMED: FontVars = {
  "--roster-font-ui": "Georgia, serif",
  "--roster-font-mono": '"Courier New", monospace',
  "--roster-font-display": '"Trebuchet MS", sans-serif',
};

const ROLES = [
  {
    role: "UI",
    token: "--roster-font-ui",
    used: "Buttons, inputs, labels, table cells — every control.",
  },
  {
    role: "Mono",
    token: "--roster-font-mono",
    used: "Eyebrow, InlineCode, Stat, Pullquote, DescriptionList, MatchupCard, Countdown.",
  },
  {
    role: "Display",
    token: "--roster-font-display",
    used: "Nothing in Roster. Yours, via rst:font-display.",
  },
];

function Specimen({ label, style }: { label: string; style?: FontVars }) {
  return (
    <div className="rst:flex rst:min-w-0 rst:flex-1 rst:flex-col rst:gap-3" style={style}>
      <h3 className="rst:text-xs rst:font-semibold rst:text-gray-700 rst:dark:text-gray-300">
        {label}
      </h3>

      <div className="rst:flex rst:flex-col rst:gap-1">
        <span className="rst:text-[10px] rst:uppercase rst:tracking-widest rst:text-gray-400 rst:dark:text-gray-500">
          Display
        </span>
        <p className="rst:font-display rst:text-xl rst:font-bold rst:text-gray-900 rst:dark:text-gray-100">
          Week 1 Schedule
        </p>
      </div>

      <div className="rst:flex rst:flex-col rst:gap-1">
        <span className="rst:text-[10px] rst:uppercase rst:tracking-widest rst:text-gray-400 rst:dark:text-gray-500">
          UI
        </span>
        <div className="rst:flex rst:items-center rst:gap-2">
          <Button size="sm">Make Picks</Button>
          <span className="rst:font-ui rst:text-sm rst:text-gray-700 rst:dark:text-gray-300">
            Picks lock at kickoff
          </span>
        </div>
      </div>

      <div className="rst:flex rst:flex-col rst:gap-1">
        <span className="rst:text-[10px] rst:uppercase rst:tracking-widest rst:text-gray-400 rst:dark:text-gray-500">
          Mono
        </span>
        <Eyebrow>Standings</Eyebrow>
        <p className="rst:font-mono rst:text-2xl rst:font-bold rst:tabular-nums rst:text-gray-900 rst:dark:text-gray-100">
          11&ndash;3 &middot; .786
        </p>
        <p className="rst:text-sm rst:text-gray-700 rst:dark:text-gray-300">
          Set it with <InlineCode>--roster-font-mono</InlineCode>.
        </p>
      </div>
    </div>
  );
}

function Panel({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      className={
        (mode === "dark" ? "dark rst:bg-gray-950" : "rst:bg-white") +
        " rst:flex-1 rst:p-6 rst:flex rst:flex-col rst:gap-6"
      }
    >
      <p className="rst:text-[10px] rst:font-bold rst:uppercase rst:tracking-widest rst:text-gray-400 rst:dark:text-gray-500">
        {mode} mode
      </p>

      <div className="rst:flex rst:flex-wrap rst:gap-8">
        <Specimen label="Roster defaults" />
        <Specimen label="Three tokens set" style={THEMED} />
      </div>

      <div className="rst:flex rst:flex-col rst:gap-2 rst:border-t rst:border-gray-200 rst:pt-4 rst:dark:border-gray-800">
        {ROLES.map((role) => (
          <div key={role.role} className="rst:flex rst:flex-wrap rst:items-baseline rst:gap-x-3 rst:gap-y-1">
            <span className="rst:w-16 rst:text-xs rst:font-bold rst:text-gray-900 rst:dark:text-gray-100">
              {role.role}
            </span>
            <InlineCode>{role.token}</InlineCode>
            <span className="rst:text-xs rst:text-gray-600 rst:dark:text-gray-400">
              {role.used}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: "Foundations/Type",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Three type roles, each settable with one custom property.\n\n```css\n:root {\n  --roster-font-display: \"Space Grotesk\", ui-sans-serif, sans-serif;\n  --roster-font-ui: \"Public Sans\", ui-sans-serif, sans-serif;\n  --roster-font-mono: \"JetBrains Mono\", ui-monospace, monospace;\n}\n```\n\nThe right-hand column sets all three to system faces so the change is visible without a webfont. Set none and nothing moves: UI and display fall back to a system sans, mono to Tailwind's own default stack, byte for byte.\n\n**Display is deliberately unused by the library.** No component asks for it — it exists so an app can put headings and figures in a face distinct from its body text, reached with `rst:font-display`. Roster force-emits that one utility, because Tailwind generates only what it finds in the source it scans and your build has never heard of the token.\n\n**Mono changed namespace.** It used to resolve through `--rst-font-mono`, a Tailwind internal. That worked if you found it, and it was Roster's to rename. Nothing reads it now; move to `--roster-font-mono`.\n\nThe display fallback is a copy of the UI stack rather than a reference to it, because theme values are inlined and `var(--font-ui)` would not resolve. Setting only `--roster-font-ui` does not change `rst:font-display`.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Roles: Story = {
  render: () => (
    <div className="rst:flex rst:min-h-screen rst:flex-col rst:md:flex-row">
      <Panel mode="light" />
      <Panel mode="dark" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    /* The assertion no unit test can make: jsdom has no real CSS, so whether a
       token actually reaches a component is only answerable in a browser. Each
       of these was verified by hand during review, which is exactly the kind of
       check that stops being run. */
    const themed = canvas.getAllByText("Standings")[1];
    await expect(getComputedStyle(themed).fontFamily).toContain("Courier New");

    const button = canvas.getAllByRole("button", { name: "Make Picks" })[1];
    await expect(getComputedStyle(button).fontFamily).toContain("Georgia");

    const display = canvas.getAllByText("Week 1 Schedule")[1];
    await expect(getComputedStyle(display).fontFamily).toContain("Trebuchet");

    /* And the defaults are untouched, which is what makes this non-breaking. */
    const plainMono = canvas.getAllByText("Standings")[0];
    await expect(getComputedStyle(plainMono).fontFamily).toContain("ui-monospace");
  },
};
