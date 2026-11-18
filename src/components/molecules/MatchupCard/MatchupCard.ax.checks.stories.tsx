import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { MatchupCard } from "./MatchupCard";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * MatchupCard as Chromium's accessibility tree hands it to a screen reader
 * (.storybook/ax-tree.ts). A result is shown by a ring and a fade, so each
 * team's is also said, after its name: "won", "lost" or "tied", replaceable
 * through `labels`. The twin is a game not yet played, which says none. The
 * expected names are literals, written from the requirement, not read from
 * the component.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/MatchupCard/Accessibility tree",
  /* `ax-tree` runs these in their own project (vite.config.ts). */
  tags: ["!dev", "!autodocs", "ax-tree"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'/%3E";
const away = { id: 1, logoSrc: LOGO, name: "Away", score: 10, accessory: "(5)" };
const home = { id: 2, logoSrc: LOGO, name: "Home", score: 20, accessory: "(8)" };

export const TheResultIsSaid: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      <div data-case="won">
        <MatchupCard isCompleted awayTeam={{ ...away, isWinner: false }} homeTeam={{ ...home, isWinner: true }} />
      </div>
      <div data-case="tied">
        <MatchupCard isCompleted isTie awayTeam={{ ...away, score: 14 }} homeTeam={{ ...home, score: 14 }} />
      </div>
      <div data-case="labels">
        <MatchupCard isCompleted awayTeam={{ ...away, isWinner: true }} homeTeam={{ ...home, isWinner: false }} labels={{ won: "ganó", lost: "perdió" }} />
      </div>
      <div data-case="upcoming">
        <MatchupCard awayTeam={away} homeTeam={home} />
      </div>
    </div>
  ),
  play: async () => {
    const input = realInputOrSkip();
    if (!input) return;
    const cases = ["won", "tied", "labels", "upcoming"];
    const selectors = cases.map((c) => {
      const probe = `${c}-${Math.random().toString(36).slice(2)}`;
      document.querySelector(`[data-case="${c}"] button`)!.setAttribute("data-ax-probe", probe);
      return `[data-ax-probe="${probe}"]`;
    });
    const states = await input.commands.axStates(selectors);
    for (const selector of selectors) document.querySelector(selector)?.removeAttribute("data-ax-probe");
    const read = states.map((s) => `${s.role} "${s.name}"`);
    console.info(`MATCHUPCARD TREE ${JSON.stringify(read)}`);
    /* The space before each comma is Chromium's: the hidden word is out of
       flow, and the tree spaces it off. A screen reader speaks the pause. */
    await expect(read).toEqual([
      'button "Away , lost (5) 10 - (8) 20 Home , won"',
      'button "Away , tied (5) 14 - (8) 14 Home , tied"',
      'button "Away , ganó (5) 10 - (8) 20 Home , perdió"',
      'button "Away (5) @ (8) Home"',
    ]);
  },
};
