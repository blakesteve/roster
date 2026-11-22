import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Dialog } from "./Dialog";
import { Toaster } from "../../molecules/Toast/Toaster";
import { toast } from "../../molecules/Toast/toast-api";
import { PageRegions } from "../../../test/PageRegions";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * A Dialog opened from a button in a toast, in Roster's own `Toaster`, which
 * stays live while a dialog holds the page so a toast fired from the dialog is
 * still announced. As the dialog, A, closes, the page opens another, B, as an
 * app's "discard your changes?" does. Checked with real keys and a real mouse
 * in Chromium and WebKit, A closed by Escape, by its Close button, by a click
 * on the backdrop, and by a button in it that closes it and opens B.
 *
 * - **Focus ends in B** once A has left, past its give-back. Through 5.19.3
 *   A's give-back found its opener live in the toast and moved focus out of B
 *   onto it.
 * - **Every focus move is recorded** from A's close to 300ms past its unmount,
 *   so a move through the opener on the way shows even when focus ends in B:
 *   a `focusin` listener sees what a person doesn't. **It does move through
 *   it, pinned as it is:** once focus is in B, Headless UI's give-back puts
 *   it on the opener as A unmounts, and Roster's puts it back in B a
 *   microtask later, before anything paints. Nothing a person sees; a
 *   `focusin`, `focus` or `blur` listener sees both moves. Ending that means
 *   Roster owning the give-back outright, and this pin changes with it.
 *   (Chromium's click on a button in A focuses it first, so a move to A may
 *   come before.)
 *
 * Three tries a way.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Dialog/Toast opener checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/* Set as the story renders, so the toast's button can reach it. */
const page = { openA: () => {}, closeA: () => {} };

const named = (name: string) => [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].find((d) => d.querySelector("h2")?.textContent === name) ?? null;
const opener = () => document.querySelector<HTMLElement>('[data-check="toast-opener"]');
const where = (el: EventTarget | Element | null) => {
  if (!(el instanceof Element) || el === document.body) return "body";
  if (el === opener()) return "the opener";
  for (const name of ["A", "B"]) if (named(name)?.contains(el)) return `in ${name}`;
  return (el as HTMLElement).dataset.check ?? el.tagName.toLowerCase();
};

function FromAToast() {
  const [openA, setA] = useState(false);
  const [openB, setB] = useState(false);
  useEffect(() => {
    /* The app closes A and opens B in one handler, however A was closed. */
    page.openA = () => setA(true);
    page.closeA = () => {
      setA(false);
      setB(true);
    };
    toast(
      <span>
        Saved.{" "}
        <button type="button" data-check="toast-opener" onClick={() => page.openA()}>
          Review
        </button>
      </span>,
      { id: "toast-opener", duration: Infinity },
    );
    return () => toast.remove("toast-opener");
  }, []);
  return (
    <PageRegions>
      <Toaster />
      <Dialog isOpen={openA} onClose={() => page.closeA()} title="A">
        <button type="button" data-check="go" onClick={() => page.closeA()}>
          On to B
        </button>
      </Dialog>
      <Dialog isOpen={openB} onClose={() => setB(false)} title="B">
        <button type="button" data-check="in-b">
          In B
        </button>
      </Dialog>
    </PageRegions>
  );
}

type Way = "Escape" | "its Close button" | "the backdrop" | "a button in it";

function check(way: Way): Story {
  return {
    render: () => <FromAToast />,
    play: async () => {
      const real = realInputOrSkip();
      if (!real) return;
      await waitFor(() => expect(opener()).not.toBeNull());
      const tries: { moves: string[]; ends: string }[] = [];
      for (let i = 0; i < 3; i += 1) {
        await real.commands.realClick('[data-check="toast-opener"]');
        await waitFor(() => expect(named("A")?.contains(document.activeElement)).toBe(true));
        await waitFor(() => expect(document.querySelector("#headlessui-portal-root [data-enter], #headlessui-portal-root [data-transition]")).toBeNull());
        await wait(60);

        const moves: string[] = [];
        const record = (event: FocusEvent) => moves.push(where(event.target));
        document.addEventListener("focusin", record, true);
        try {
          const a = named("A")!;
          a.setAttribute("data-probe", "a");
          if (way === "Escape") await real.commands.realPress(["Escape"]);
          else if (way === "its Close button") await real.commands.realClick('[data-probe="a"] button[aria-label^="Close"]');
          /* The corner of the viewport, outside the panel. */
          else if (way === "the backdrop") await real.commands.realClick('[data-probe="a"]', { fx: 0.03, fy: 0.03 });
          else await real.commands.realClick('[data-probe="a"] [data-check="go"]');
          await waitFor(() => expect(named("A")).toBeNull(), { timeout: 3000 });
          /* Past A's give-back, a microtask after its unmount. */
          await wait(300);
        } finally {
          document.removeEventListener("focusin", record, true);
        }
        tries.push({ moves, ends: where(document.activeElement) });

        await real.commands.realPress(["Escape"]);
        await waitFor(() => expect(named("B")).toBeNull(), { timeout: 3000 });
        for (let f = 0; f < 3; f += 1) await frame();
        await wait(150);
      }
      console.info(`DIALOG TOAST OPENER ${way}: ${JSON.stringify(tries)}`);
      await expect([...new Set(tries.map((t) => t.ends))]).toEqual(["in B"]);
      /* From B's open on: into B, through the opener, back into B. */
      const fromB = tries.map((t) => t.moves.slice(t.moves.indexOf("in B")));
      await expect([...new Set(fromB.map((m) => m.join(" > ")))]).toEqual(["in B > the opener > in B"]);
    },
  };
}

export const ClosedByEscapeAsAnotherOpens = check("Escape");
export const ClosedByItsCloseButtonAsAnotherOpens = check("its Close button");
export const ClosedByTheBackdropAsAnotherOpens = check("the backdrop");
export const ClosedByAButtonThatOpensAnother = check("a button in it");
