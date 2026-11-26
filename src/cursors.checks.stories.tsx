import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { readCursors } from "./test/cursors";
import { realInput } from "./test/real-input";
import { Alert } from "./components/molecules/Alert/Alert";
import { CallToAction } from "./components/molecules/CallToAction/CallToAction";
import { MatchupCard } from "./components/molecules/MatchupCard/MatchupCard";

/**
 * The cursor sweep (`src/test/cursors.ts`), which runs after every story in
 * the docs: what it reads, what it leaves out, and what it calls wrong. Each
 * fault it must find is drawn here on purpose, as a twin, since the stories it
 * guards have none left.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page, so the
 * sweep itself skips this file. Story-only styling is inline, so none of it
 * ships in roster.css.
 */
const meta = {
  title: "Internal/Cursors/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const POINTER = { cursor: "pointer" } as const;
const LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'/%3E";
const TEAMS = {
  awayTeam: { id: 1, name: "Harbor", logoSrc: LOGO },
  homeTeam: { id: 2, name: "Ridge", logoSrc: LOGO },
};

const names = (els: Element[]) => els.map((el) => el.getAttribute("data-kind"));

/* One of each kind of control the sweep reads, each showing the pointer. */
export const ItReadsEveryKind: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <button type="button" data-kind="button" style={POINTER}>Button</button>
      <a href="#a" data-kind="link" style={POINTER}>Link</a>
      <details><summary data-kind="summary" style={POINTER}>Summary</summary></details>
      <select data-kind="select" aria-label="Select" style={POINTER}><option>One</option></select>
      <input type="checkbox" data-kind="checkbox input" aria-label="Checkbox" style={POINTER} />
      <input type="range" data-kind="range input" aria-label="Range" style={POINTER} />
      <input type="radio" id="cursor-radio" style={POINTER} aria-label="Radio" data-kind="radio input" />
      <label htmlFor="cursor-radio" data-kind="label of a toggle" style={POINTER}>Radio's label</label>
      <label data-kind="label around a toggle" style={POINTER}>
        <input type="checkbox" data-kind="checkbox in a label" style={POINTER} /> Wrapped
      </label>
      {["button", "link", "tab", "menuitem", "menuitemcheckbox", "menuitemradio", "option", "switch", "checkbox", "radio", "slider"].map((role) => (
        <span key={role} role={role} tabIndex={0} aria-label={role} data-kind={`role ${role}`} style={POINTER}>{role}</span>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { read, faults } = readCursors(canvasElement);
    await expect(faults).toEqual([]);
    await expect(names(read)).toEqual([
      "button", "link", "summary", "select", "checkbox input", "range input", "radio input", "label of a toggle",
      "label around a toggle", "checkbox in a label",
      "role button", "role link", "role tab", "role menuitem", "role menuitemcheckbox", "role menuitemradio", "role option",
      "role switch", "role checkbox", "role radio", "role slider",
    ]);
    console.info(`CURSORS READ ${read.length} kinds`);
  },
};

/* What it leaves out, each showing the arrow, which would be a fault if read. */
export const ItLeavesOutFieldsAndWhatCantBePointedAt: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <input aria-label="Text" />
      <input type="email" aria-label="Email" />
      <textarea aria-label="Words" />
      <div contentEditable suppressContentEditableWarning aria-label="Editable" style={{ minWidth: 40 }}>Edit</div>
      <label htmlFor="cursor-text">A field's label</label>
      <input id="cursor-text" />
      <input type="hidden" value="x" />
      <button type="button" style={{ display: "none" }}>None</button>
      <button type="button" style={{ visibility: "hidden" }}>Hidden</button>
      <div inert><button type="button">Inert</button></div>
      <button type="button" style={{ pointerEvents: "none" }}>Passed through</button>
      <input type="checkbox" aria-label="Visually hidden" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { read, faults } = readCursors(canvasElement);
    await expect(read).toEqual([]);
    await expect(faults).toEqual([]);
  },
};

/* Every fault it names, and the twins of the three it was written for:
   Alert's dismiss and MatchupCard's button as 5.24 drew them. */
export const ItFindsEachFault: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <button type="button">Bare</button>
      <button type="button" disabled style={POINTER}>Disabled</button>
      <button type="button" aria-disabled="true" style={POINTER}>Unavailable</button>
      <input type="checkbox" id="cursor-check" style={POINTER} />
      <label htmlFor="cursor-check">A toggle's label</label>
      <input type="checkbox" id="cursor-off" disabled />
      <label htmlFor="cursor-off" style={POINTER}>An off toggle's label</label>
      <button type="button" style={POINTER}>
        Part <span style={{ cursor: "default" }}>arrow</span>
      </button>
      <button
        type="button"
        aria-label="Dismiss 5.24"
        className="rst:-m-1 rst:shrink-0 rst:rounded-sm rst:p-1 rst:opacity-70 rst:transition-opacity rst:hover:opacity-100 rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring"
      >
        x
      </button>
      <button
        type="button"
        aria-label="Matchup 5.24"
        className="rst:*:pointer-events-none rst:flex rst:items-center rst:gap-3 rst:rounded-lg rst:p-2 rst:text-left rst:transition rst:hover:bg-gray-100 rst:dark:hover:bg-gray-800 rst:focus:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring"
      >
        <span>Harbor</span> @ <span>Ridge</span>
      </button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { faults } = readCursors(canvasElement);
    await expect(faults).toEqual([
      '<button> "Bare" shows default',
      '<button> "Disabled" is disabled and shows the pointer',
      '<button> "Unavailable" is disabled and shows the pointer',
      `<label> "A toggle's label" shows default`,
      `<label> "An off toggle's label" is disabled and shows the pointer`,
      '<button> "Part arrow": a part of it, <span> "arrow", shows default',
      '<button> "Dismiss 5.24" shows default',
      '<button> "Matchup 5.24" shows default',
    ]);
  },
};

/* The three as Roster draws them now, and a MatchupCard that's disabled. */
export const TheThreeShowThePointer: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <Alert title="Saved" onDismiss={() => {}}>Your picks are in.</Alert>
      <CallToAction title="Shared logs" description="Keep one log together." onDismiss={() => {}} />
      <MatchupCard {...TEAMS} />
      <MatchupCard {...TEAMS} disabled data-off="" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { read, faults } = readCursors(canvasElement);
    await expect(faults).toEqual([]);
    const shown = (el: Element) => getComputedStyle(el).cursor;
    const dismissals = read.filter((el) => el.getAttribute("aria-label") === "Dismiss");
    await expect(dismissals.map(shown)).toEqual(["pointer", "pointer"]);
    const cards = [...canvasElement.querySelectorAll("button")].filter((el) => el.textContent?.includes("@"));
    await expect(cards.map(shown)).toEqual(["pointer", "not-allowed"]);
  },
};

/* The sweep is set up for every story, and fails one in the docs with a
   fault: run here, by hand, on this story's bare button. Only the test runner
   sets it up. */
type Sweep = (context: { tags: string[]; id: string }) => void;
export const TheSweepRunsAfterEveryStoryInTheDocs: Story = {
  render: () => <button type="button">Bare</button>,
  play: async () => {
    if (!realInput()) return;
    const sweep = (globalThis as { __rosterCursorSweep?: Sweep }).__rosterCursorSweep;
    await expect(typeof sweep).toBe("function");
    await expect(() => sweep!({ tags: ["dev"], id: "a-story" })).toThrow('a-story, the cursor:\n<button> "Bare" shows default');
    await expect(() => sweep!({ tags: ["!dev"], id: "a-check" })).not.toThrow();
  },
};
