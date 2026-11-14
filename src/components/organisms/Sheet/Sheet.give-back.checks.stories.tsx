import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Sheet } from "./Sheet";
import { Dialog } from "../Dialog/Dialog";
import { PageRegions } from "../../../test/PageRegions";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Focus the page moves while a Sheet or a Dialog closes stays where it was
 * put, checked with a real mouse and real keys in Chromium and WebKit.
 *
 * Headless UI gives focus back to what opened a dialog as the dialog leaves
 * the page, wherever focus is by then. On 5.19.3 that took focus from where
 * the page had put it, as the close started or in `onAfterClose`, back to the
 * opener: in nearly every close, Sheet and Dialog alike.
 *
 * - **Put somewhere once the close has rendered, it stays there:** the page
 *   focuses another control in an effect once `isOpen` is false, as a page
 *   that knows where focus belongs after a Remove does. (In `onClose` itself
 *   the page is still held and can't take focus.)
 * - **Put somewhere in `onAfterClose`, it stays there.** Over a Sheet's
 *   `returnFocus` too: that is where focus goes when nothing else was chosen.
 * - **With nothing put anywhere, focus goes back to the opener**, as it
 *   always has, or to a Sheet's `returnFocus`.
 * - **The full-screen layout too**, whose panel is a different element.
 *
 * Each closed by its own Remove button and by Escape, with frames running
 * freely and with every frame holding the page for 50ms, as on a busy
 * machine. Where focus ends is read 400ms after the dialog has left the
 * page, from the page itself, not from frames. Focus still stops at the
 * opener for a microtask on the way, as Headless UI gives it back, before
 * it's put back where it was put: logged as "by way of more", not required.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Sheet/Give-back checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Kind = "sheet" | "dialog" | "full-screen dialog";
/** When the page puts focus elsewhere: as the close starts, in `onAfterClose`, or not at all. */
type Put = "as it closes" | "after it closes" | "nowhere";

function Page({ kind, put, returnFocus = false }: { kind: Kind; put: Put; returnFocus?: boolean }) {
  const [open, setOpen] = useState(false);
  const add = useRef<HTMLButtonElement>(null);
  const [elsewhere, setElsewhere] = useState<HTMLButtonElement | null>(null);
  const was = useRef(false);
  /* As the close starts: after the render that closed it, once the page is
     no longer held behind it and can take focus. */
  useEffect(() => {
    if (was.current && !open && put === "as it closes") add.current?.focus();
    was.current = open;
  }, [open, put]);
  const props = {
    isOpen: open,
    onClose: () => setOpen(false),
    onAfterClose: put === "after it closes" ? () => add.current?.focus() : undefined,
    title: "Remove a friend",
  };
  const body = (
    <button type="button" data-check="remove" onClick={() => setOpen(false)}>
      Remove
    </button>
  );
  return (
    <PageRegions>
      <button type="button" data-check="more" onClick={() => setOpen(true)}>
        More
      </button>
      <button type="button" data-check="add" ref={add}>
        Add as a friend
      </button>
      <button type="button" data-check="elsewhere" ref={setElsewhere}>
        Chosen by the page
      </button>
      {kind === "sheet" ? (
        <Sheet {...props} returnFocus={returnFocus ? elsewhere : undefined}>
          {body}
        </Sheet>
      ) : (
        <Dialog {...props} layout={kind === "dialog" ? "default" : "fullscreen"}>
          {body}
        </Dialog>
      )}
    </PageRegions>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const dialog = () => document.querySelector('[role="dialog"]');
const focused = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return "body";
  if (dialog()?.contains(el)) return "in the dialog";
  return (el as HTMLElement).dataset.check ?? el.tagName.toLowerCase();
};

/* Every frame holds the page for `ms`, for `forMs`: a busy machine. */
function busyFrames(ms: number, forMs: number) {
  if (!ms) return;
  const until = performance.now() + forMs;
  const tick = () => {
    const from = performance.now();
    while (performance.now() - from < ms) {
      /* held */
    }
    if (performance.now() < until) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

type Way = "Remove" | "Escape";

/**
 * Opens with a real click on More, closes `way` under `busyMs` frames, and
 * says where focus ended, and whether it was on More on the way after
 * landing where it was put (Headless UI's give-back, put right a microtask
 * later: logged, not required).
 */
async function closeOnce(real: NonNullable<ReturnType<typeof realInputOrSkip>>, way: Way, busyMs: number) {
  await real.commands.realClick('[data-check="more"]');
  await waitFor(() => expect(dialog()?.contains(document.activeElement)).toBe(true));
  await waitFor(() => expect(document.querySelector("#headlessui-portal-root [data-enter], #headlessui-portal-root [data-transition]")).toBeNull());
  await wait(60);
  const seen: string[] = [];
  const onFocus = (e: FocusEvent) => seen.push((e.target as HTMLElement).dataset?.check ?? "other");
  document.addEventListener("focusin", onFocus, true);
  busyFrames(busyMs, 700);
  if (way === "Remove") await real.commands.realClick('[data-check="remove"]');
  else await real.commands.realPress(["Escape"]);
  await waitFor(() => expect(dialog()).toBeNull(), { timeout: 3000 });
  await wait(400);
  document.removeEventListener("focusin", onFocus, true);
  const end = focused();
  const putAt = seen.indexOf("add");
  const hop = putAt >= 0 && seen.slice(putAt).includes("more") ? " (by way of more)" : "";
  (document.activeElement as HTMLElement | null)?.blur();
  return `${end}${hop}`;
}

function check(kind: Kind, put: Put, expected: string, returnFocus = false): Story {
  return {
    render: () => <Page kind={kind} put={put} returnFocus={returnFocus} />,
    play: async () => {
      const real = realInputOrSkip();
      if (!real) return;
      const ends: string[] = [];
      for (const way of ["Remove", "Escape"] as Way[]) {
        for (const busyMs of [0, 50]) {
          ends.push(`${way}, ${busyMs ? "busy" : "free"}: ${await closeOnce(real, way, busyMs)}`);
        }
      }
      console.info(`GIVE BACK ${kind}, put ${put}${returnFocus ? ", with returnFocus" : ""}: ${JSON.stringify(ends)}`);
      await expect(ends.filter((e) => !e.replace(" (by way of more)", "").endsWith(`: ${expected}`))).toEqual([]);
    },
  };
}

export const ASheetKeepsFocusPutAsItCloses = check("sheet", "as it closes", "add");
export const ASheetKeepsFocusPutAfterItCloses = check("sheet", "after it closes", "add");
export const ASheetKeepsFocusPutOverItsReturnFocus = check("sheet", "after it closes", "add", true);
export const ASheetWithNothingPutGivesFocusToItsOpener = check("sheet", "nowhere", "more");
export const ASheetWithNothingPutGivesFocusToItsReturnFocus = check("sheet", "nowhere", "elsewhere", true);
export const ADialogKeepsFocusPutAsItCloses = check("dialog", "as it closes", "add");
export const ADialogKeepsFocusPutAfterItCloses = check("dialog", "after it closes", "add");
export const ADialogWithNothingPutGivesFocusToItsOpener = check("dialog", "nowhere", "more");
export const AFullScreenDialogKeepsFocusPutAsItCloses = check("full-screen dialog", "as it closes", "add");
