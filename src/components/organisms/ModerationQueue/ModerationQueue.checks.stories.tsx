import { useLayoutEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { Input } from "../../atoms/Input/Input";
import { MediaPreview } from "../../molecules/MediaPreview/MediaPreview";
import { ModerationQueue, type ModerationQueueProps } from "./ModerationQueue";
import { QueueEditDialog } from "./QueueEditDialog";
import { QueueEditSheet } from "./QueueEditSheet";
import type { QueueFormProps, QueueRunResult } from "./queue-actions";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Every promise ModerationQueue makes, checked in Chromium. Expected values
 * are literals written from the requirement, each paired with a twin that
 * must come out differently, so a pass means the queue did it rather than
 * that the check couldn't tell.
 *
 * The harness holds the items and hands each `run` a promise the play
 * settles by hand, the way an app's request would, so busy, landed and
 * failed states can be read one at a time. As an app does, it removes the
 * item when a decision lands, unless told to keep it.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/ModerationQueue/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Recipe = { id: string; title: string; by: string; body: string };
const RECIPES: Recipe[] = [
  { id: "a", title: "Lentil soup", by: "Dana", body: "Red lentils, cumin, lemon." },
  { id: "b", title: "Rye crackers", by: "Ollie", body: "Rye flour, seeds, salt." },
  { id: "c", title: "Plum cake", by: "Mei", body: "Plums, butter, almond flour." },
];

type Call = {
  actionId: string;
  key: string;
  /** The item as `run` was handed it. */
  item: Recipe;
  input: unknown;
  resolve: (r?: QueueRunResult) => void;
  reject: (m: string) => void;
  /** Removes the item in one render and resolves in a later one, as an app that reloads before returning would. */
  resolveLate: () => Promise<void>;
};
const harness = {
  calls: [] as Call[],
  setItems: (() => {}) as (update: (items: Recipe[]) => Recipe[]) => void,
  keep: false,
};

/** A `run` the play settles by hand. */
const deferred =
  (actionId: string) =>
  (item: Recipe, input: unknown): Promise<QueueRunResult> =>
    new Promise((resolve, reject) => {
      harness.calls.push({
        actionId,
        key: item.id,
        item,
        input,
        resolve: (r) => {
          if (!harness.keep) harness.setItems((xs) => xs.filter((x) => x.id !== item.id));
          resolve(r);
        },
        reject: (m) => reject(new Error(m)),
        resolveLate: async () => {
          harness.setItems((xs) => xs.filter((x) => x.id !== item.id));
          await new Promise((r) => setTimeout(r, 50));
          resolve();
        },
      });
    });

type Draft = { title: string };
function TitleForm({ value, onChange }: QueueFormProps<Recipe, Draft>) {
  return <Input label="Title" value={value.title} onChange={(e) => onChange({ title: e.target.value })} />;
}

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";

function Harness({
  initial = RECIPES,
  keep = false,
  still = true,
  ...props
}: Partial<ModerationQueueProps<Recipe>> & { initial?: Recipe[]; keep?: boolean; still?: boolean }) {
  const [items, setItems] = useState(initial);
  useLayoutEffect(() => {
    harness.setItems = setItems;
    harness.keep = keep;
  }, [keep]);
  return (
    <div style={{ maxWidth: 560, padding: 16 }}>
      {still && <style>{STILL}</style>}
      <ModerationQueue<Recipe>
        label="Recipes to check"
        items={items}
        getKey={(r) => r.id}
        itemLabel={(r) => `${r.title} from ${r.by}`}
        renderContent={(r) => <p>{r.body}</p>}
        empty={{ title: "Nothing to check" }}
        actions={(a) => [
          { id: "approve", label: "Approve", done: "Approved", tone: "success", run: deferred("approve") },
          { id: "decline", label: "Decline", done: "Declined", tone: "danger", confirm: { prompt: "Decline this recipe?" }, run: deferred("decline") },
          {
            id: "reject",
            label: "Send back",
            done: "Sent back",
            reason: {
              prompt: "Why is it going back?",
              required: true,
              options: [
                { value: "duplicate", label: "Already listed" },
                { value: "incomplete", label: "Missing steps" },
              ],
            },
            run: deferred("reject"),
          },
          a.edit({
            id: "edit",
            label: "Edit",
            done: "Listed with edits",
            edit: {
              title: "Edit before listing",
              submitLabel: "List it",
              initial: (r) => ({ title: r.title }),
              Form: TitleForm,
              validate: (d) => (d.title.trim() ? undefined : "Give it a title."),
            },
            run: deferred("edit"),
          }),
          a.edit({
            id: "edit-dialog",
            label: "Edit in a dialog",
            done: "Listed with edits",
            edit: { title: "Edit before listing", submitLabel: "List it", surface: QueueEditDialog, initial: (r) => ({ title: r.title }), Form: TitleForm },
            run: deferred("edit-dialog"),
          }),
          a.edit({
            id: "edit-sheet",
            label: "Edit in a sheet",
            done: "Listed with edits",
            edit: { title: "Edit before listing", submitLabel: "List it", surface: QueueEditSheet, initial: (r) => ({ title: r.title }), Form: TitleForm },
            run: deferred("edit-sheet"),
          }),
        ]}
        {...props}
      />
    </div>
  );
}

/* ── Reading the page ──────────────────────────────────────────────────── */
const q = <E extends Element = HTMLElement>(sel: string) => document.querySelector<E & HTMLElement>(sel);
const itemEl = (key: string) => q(`[data-queue-item="${key}"]`);
const button = (key: string, id: string) => q<HTMLButtonElement>(`[data-queue-item="${key}"] [data-queue-action="${id}"]`);
const inert = (el: Element | null) => el?.getAttribute("aria-disabled") === "true";
const liveCount = () => Number(q("[data-queue-live]")?.getAttribute("data-queue-live-n") ?? 0);
const liveText = () => (q("[data-queue-live]")?.textContent ?? "").replace(/\u00a0/g, "").trim();
const active = () => document.activeElement;
const nextCall = async () => {
  await waitFor(() => expect(harness.calls.length).toBeGreaterThan(0));
  return harness.calls.shift()!;
};
const reset = () => {
  harness.calls = [];
};
/**
 * What the live region says from here on: every distinct sentence, and how
 * many times it was set, read off its counter, so a sentence set twice in one
 * task still counts twice.
 */
const watchLive = () => {
  const start = liveCount();
  const changes: string[] = [];
  const observer = new MutationObserver(() => {
    const text = liveText();
    if (changes.at(-1) !== text) changes.push(text);
  });
  observer.observe(q("[data-queue-live]")!, { childList: true, characterData: true, subtree: true, attributes: true });
  return { changes, sets: () => liveCount() - start, stop: () => observer.disconnect() };
};

/* ── Busy, landed, failed ──────────────────────────────────────────────── */

export const OnlyTheClickedActionIsBusy: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    /* Twin: before anything is clicked, nothing waits. */
    await expect(inert(button("a", "decline"))).toBe(false);
    await userEvent.click(button("a", "approve")!);
    const call = await nextCall();
    await expect(call).toMatchObject({ actionId: "approve", key: "a" });
    await expect(button("a", "approve")!.querySelector('[role="status"]'), "the clicked button spins").not.toBeNull();
    await expect(button("a", "approve")!.getAttribute("aria-busy")).toBe("true");
    await expect(active(), "and keeps focus while it does").toBe(button("a", "approve"));
    await expect(inert(button("a", "decline")), "the item's other actions wait").toBe(true);
    await expect(button("a", "decline")!.querySelector('[role="status"]'), "and don't spin").toBeNull();
    await expect(inert(button("b", "approve")), "every other item stays live").toBe(false);
    /* Pressing it again while it works does nothing. */
    await userEvent.click(button("a", "approve")!);
    await expect(harness.calls).toEqual([]);
    call.resolve();
  },
};

export const LandingMovesFocusToTheNextItem: Story = {
  /* The middle item, so "next" and "previous" are different answers. */
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("b", "approve")!);
    (await nextCall()).resolve();
    await waitFor(() => expect(liveText()).toBe("Approved: Rye crackers from Ollie. 2 left."));
    await waitFor(() => expect(itemEl("b")).toBeNull());
    await expect(active()).toBe(itemEl("c"));
  },
};

export const LandingOnTheLastItemMovesFocusBack: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("c", "approve")!);
    (await nextCall()).resolve();
    await waitFor(() => expect(active()).toBe(itemEl("b")));
    await waitFor(() => expect(liveText()).toBe("Approved: Plum cake from Mei. 2 left."));
  },
};

export const LandingOnTheOnlyItemFocusesTheEmptyState: Story = {
  render: () => <Harness initial={[RECIPES[0]]} />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "approve")!);
    (await nextCall()).resolve();
    await waitFor(() => expect(liveText()).toBe("Approved: Lentil soup from Dana. None left."));
    await waitFor(() => expect(active()).toBe(q("[data-queue-empty]")));
    await expect(active()).not.toBe(document.body);
  },
};

export const FailureLeavesTheItem: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "approve")!);
    (await nextCall()).reject("The server is busy.");
    await waitFor(() => expect(liveText()).toBe("Approve didn't go through for Lentil soup from Dana. The server is busy."));
    await expect(itemEl("a"), "still listed").not.toBeNull();
    await expect(itemEl("a")!.textContent).toContain("The server is busy.");
    /* One announcement, not two: the inline error is no live region. */
    await expect(itemEl("a")!.querySelector('[role="alert"], [aria-live="assertive"]')).toBeNull();
    await expect(active(), "focus never left the button").toBe(button("a", "approve"));
    /* Twin: the error belongs to the item that failed. */
    await expect(itemEl("b")!.textContent).not.toContain("The server is busy.");
  },
};

export const KeptItemIsAnnouncedWithoutACount: Story = {
  render: () => <Harness keep />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "approve")!);
    (await nextCall()).resolve();
    await waitFor(() => expect(liveText()).toBe("Approved: Lentil soup from Dana."));
    await waitFor(() => expect(active()).toBe(button("a", "approve")));
  },
};

export const RunCanReplaceTheAnnouncement: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "approve")!);
    (await nextCall()).resolve({ announce: "Already decided by someone else." });
    await waitFor(() => expect(liveText()).toBe("Already decided by someone else. 2 left."));
  },
};

/* ── Steps ─────────────────────────────────────────────────────────────── */

const step = () => q("[data-queue-step]");
const submitButton = () => q<HTMLButtonElement>("[data-queue-submit]");

export const ConfirmAsksInPlaceAndEscapeGivesFocusBack: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "decline")!);
    await waitFor(() => expect(active()).toBe(step()));
    await expect(step()!.textContent).toContain("Decline this recipe?");
    await expect(submitButton()!.textContent).toBe("Decline");
    await expect(button("a", "approve"), "the action bar gives way to the step").toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(active()).toBe(button("a", "decline")));
    await expect(harness.calls, "canceling decides nothing").toEqual([]);
    /* Twin: confirming does decide. */
    await userEvent.click(button("a", "decline")!);
    await userEvent.click(submitButton()!);
    const call = await nextCall();
    await expect(call).toMatchObject({ actionId: "decline", key: "a" });
    call.resolve();
    await waitFor(() => expect(liveText()).toBe("Declined: Lentil soup from Dana. 2 left."));
  },
};

export const ReasonIsRequiredThenHandedToRun: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "reject")!);
    await expect(inert(submitButton()), "no reason picked yet").toBe(true);
    await expect(q("[data-queue-validation]")?.textContent, "and it says why").toBe("Pick a reason.");
    await expect(submitButton()!.getAttribute("aria-describedby")).toBe(q("[data-queue-validation]")!.id);
    await userEvent.click(q('[data-queue-step] [role="radio"]')!);
    await expect(inert(submitButton())).toBe(false);
    await userEvent.type(q("[data-queue-step] textarea")!, "  Same as last week's.  ");
    await userEvent.click(submitButton()!);
    const call = await nextCall();
    await expect(call.input).toEqual({ reason: { value: "duplicate", note: "Same as last week's." } });
    call.resolve();
  },
};

export const EditDraftIsValidatedThenHandedToRun: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "edit")!);
    const field = q<HTMLInputElement>("[data-queue-step] input")!;
    await expect(field.value, "the draft starts from the item").toBe("Lentil soup");
    await userEvent.clear(field);
    await expect(q("[data-queue-validation]")?.textContent).toBe("Give it a title.");
    await expect(inert(submitButton())).toBe(true);
    await userEvent.click(submitButton()!);
    await expect(harness.calls, "a blocked submit decides nothing").toEqual([]);
    await userEvent.type(field, "Red lentil soup");
    await expect(q("[data-queue-validation]"), "valid again").toBeNull();
    await userEvent.click(submitButton()!);
    const call = await nextCall();
    await expect(call.input).toEqual({ draft: { title: "Red lentil soup" } });
    call.resolve();
    await waitFor(() => expect(liveText()).toBe("Listed with edits: Lentil soup from Dana. 2 left."));
  },
};

export const StepFailureKeepsTheDraft: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "edit")!);
    const field = q<HTMLInputElement>("[data-queue-step] input")!;
    await userEvent.type(field, " with lemon");
    await userEvent.click(submitButton()!);
    (await nextCall()).reject("Couldn't save.");
    await waitFor(() => expect(step()!.textContent).toContain("Couldn't save."));
    await expect(q<HTMLInputElement>("[data-queue-step] input")!.value).toBe("Lentil soup with lemon");
    await expect(active(), "focus stays on the button that tried").toBe(submitButton());
  },
};

export const EditInADialogLandsFocusOnTheNextItem: Story = {
  render: () => <Harness still={false} />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "edit-dialog")!);
    await waitFor(() => expect(q('[role="dialog"]')).not.toBeNull());
    await userEvent.click(submitButton()!);
    (await nextCall()).resolve();
    /* With the Dialog's real exit, so Headless UI's own focus restore has run
       and lost to the queue's. */
    await waitFor(() => expect(q('[role="dialog"]')).toBeNull(), { timeout: 3000 });
    await waitFor(() => expect(active()).toBe(itemEl("b")), { timeout: 3000 });
  },
};

export const CancelingADialogGivesFocusBack: Story = {
  render: () => <Harness still={false} />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "edit-dialog")!);
    await waitFor(() => expect(q('[role="dialog"]')).not.toBeNull());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(q('[role="dialog"]')).toBeNull(), { timeout: 3000 });
    await waitFor(() => expect(active()).toBe(button("a", "edit-dialog")), { timeout: 3000 });
    await expect(harness.calls).toEqual([]);
  },
};

/* ── Decided elsewhere ─────────────────────────────────────────────────── */

const removeElsewhere = (key: string) => harness.setItems((xs) => xs.filter((x) => x.id !== key));

export const DecidedElsewhereWithAStepOpen: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "decline")!);
    await waitFor(() => expect(active()).toBe(step()));
    const live = watchLive();
    removeElsewhere("a");
    await waitFor(() => expect(active()).toBe(itemEl("b")));
    await expect(step(), "the step closes").toBeNull();
    await expect(harness.calls, "and decides nothing").toEqual([]);
    await waitFor(() => expect(liveText()).not.toBe(""));
    await new Promise((r) => setTimeout(r, 50));
    live.stop();
    await expect(live.changes, "said once").toEqual(["Lentil soup from Dana was decided elsewhere. 2 left."]);
    await expect(live.sets()).toBe(1);
  },
};

export const DecidedElsewhereWithADialogOpen: Story = {
  render: () => <Harness still={false} />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "edit-dialog")!);
    await waitFor(() => expect(q('[role="dialog"]')).not.toBeNull());
    const live = watchLive();
    removeElsewhere("a");
    await waitFor(() => expect(q('[role="dialog"]')).toBeNull(), { timeout: 3000 });
    await waitFor(() => expect(active()).toBe(itemEl("b")), { timeout: 3000 });
    await expect(harness.calls).toEqual([]);
    await waitFor(() => expect(liveText()).not.toBe(""));
    await new Promise((r) => setTimeout(r, 50));
    live.stop();
    await expect(live.changes).toEqual(["Lentil soup from Dana was decided elsewhere. 2 left."]);
    await expect(live.sets()).toBe(1);
  },
};

export const DecidedElsewhereWithASheetOpen: Story = {
  render: () => <Harness still={false} />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "edit-sheet")!);
    await waitFor(() => expect(q('[role="dialog"]')).not.toBeNull());
    const live = watchLive();
    removeElsewhere("a");
    await waitFor(() => expect(q('[role="dialog"]')).toBeNull(), { timeout: 3000 });
    await waitFor(() => expect(active()).toBe(itemEl("b")), { timeout: 3000 });
    await expect(harness.calls).toEqual([]);
    await waitFor(() => expect(liveText()).not.toBe(""));
    await new Promise((r) => setTimeout(r, 50));
    live.stop();
    await expect(live.changes).toEqual(["Lentil soup from Dana was decided elsewhere. 2 left."]);
    await expect(live.sets()).toBe(1);
  },
};

export const RemovedBeforeRunResolvesIsStillTheDecision: Story = {
  /* The app removes the item, renders, and only then lets run resolve. That
     is still this reviewer's decision, not one made elsewhere, even though
     the item left with its step open. */
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "decline")!);
    await userEvent.click(submitButton()!);
    const live = watchLive();
    await (await nextCall()).resolveLate();
    await waitFor(() => expect(liveText()).toBe("Declined: Lentil soup from Dana. 2 left."));
    await waitFor(() => expect(active()).toBe(itemEl("b")));
    live.stop();
    await expect(live.changes.some((t) => t.includes("decided elsewhere")), "never called elsewhere").toBe(false);
  },
};

export const LeavingWithoutAStepTouchesNothingElsewhere: Story = {
  /* The twin of the three above: an item that leaves while nothing of it is
     open and focus is somewhere else moves no focus and says nothing. */
  render: () => <Harness />,
  play: async () => {
    reset();
    button("b", "approve")!.focus();
    const live = watchLive();
    removeElsewhere("a");
    await waitFor(() => expect(itemEl("a")).toBeNull());
    await new Promise((r) => setTimeout(r, 100));
    await expect(active()).toBe(button("b", "approve"));
    live.stop();
    await expect(live.changes).toEqual([]);
    await expect(live.sets()).toBe(0);
  },
};

export const LeavingWithFocusInsideMovesIt: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    button("a", "approve")!.focus();
    removeElsewhere("a");
    await waitFor(() => expect(active()).toBe(itemEl("b")));
  },
};

export const ReviewerWhoMovedOnKeepsTheirPlace: Story = {
  /* A decision lands after the reviewer has moved to another item. */
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "approve")!);
    const call = await nextCall();
    button("c", "approve")!.focus();
    call.resolve();
    await waitFor(() => expect(liveText()).toBe("Approved: Lentil soup from Dana. 2 left."));
    await new Promise((r) => setTimeout(r, 100));
    await expect(active()).toBe(button("c", "approve"));
  },
};

export const FailureAfterMovingOnLeavesFocusAlone: Story = {
  /* The twin of ReviewerWhoMovedOnKeepsTheirPlace, for a decision that fails. */
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "approve")!);
    const call = await nextCall();
    await userEvent.click(button("c", "reject")!);
    const field = q<HTMLTextAreaElement>('[data-queue-item="c"] textarea')!;
    field.focus();
    call.reject("The server is busy.");
    await waitFor(() => expect(itemEl("a")!.textContent).toContain("The server is busy."));
    await expect(active(), "still typing in the other item").toBe(field);
    await userEvent.keyboard(" ");
    await expect(harness.calls, "and nothing was pressed by it").toEqual([]);
  },
};

export const StepsAreKeptPerItem: Story = {
  /* A reason half-chosen on one item survives another item's decision. */
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "reject")!);
    await userEvent.click(q('[data-queue-item="a"] [data-queue-step] [role="radio"]')!);
    await userEvent.click(button("b", "approve")!);
    (await nextCall()).resolve();
    await waitFor(() => expect(itemEl("b")).toBeNull());
    await expect(q('[data-queue-item="a"] [data-queue-step]'), "a's step is still open").not.toBeNull();
    await expect(q('[data-queue-item="a"] [role="radio"]')!.getAttribute("aria-checked")).toBe("true");
  },
};

export const TwoLandingAtOnceAreBothSaid: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "approve")!);
    await userEvent.click(button("b", "approve")!);
    await waitFor(() => expect(harness.calls.length).toBe(2));
    const [first, second] = harness.calls.splice(0);
    const live = watchLive();
    first.resolve();
    second.resolve();
    await waitFor(() => expect(itemEl("b")).toBeNull());
    await waitFor(() => expect(liveText()).toBe("Approved: Lentil soup from Dana. Approved: Rye crackers from Ollie. 1 left."));
    live.stop();
    /* Twin: one landing alone is one sentence, as LandingMovesFocusToTheNextItem shows. */
    await expect(live.sets()).toBe(1);
  },
};

export const AFailureAndALandingTogetherAreBothSaid: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "approve")!);
    await userEvent.click(button("b", "approve")!);
    await waitFor(() => expect(harness.calls.length).toBe(2));
    const [first, second] = harness.calls.splice(0);
    first.reject("The server is busy.");
    second.resolve();
    await waitFor(() => expect(itemEl("b")).toBeNull());
    await waitFor(() =>
      expect(liveText()).toBe(
        "Approve didn't go through for Lentil soup from Dana. The server is busy. Approved: Rye crackers from Ollie. 2 left.",
      ),
    );
  },
};

export const CanceledDialogWhoseItemLeavesDuringItsExit: Story = {
  /* Escape first, then the item goes while the Dialog is still leaving. It
     was canceled, not decided elsewhere, and its button is gone. */
  render: () => <Harness still={false} />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "edit-dialog")!);
    await waitFor(() => expect(q('[role="dialog"]')).not.toBeNull());
    const live = watchLive();
    await userEvent.keyboard("{Escape}");
    removeElsewhere("a");
    await waitFor(() => expect(q('[role="dialog"]')).toBeNull(), { timeout: 3000 });
    await waitFor(() => expect(active()).toBe(itemEl("b")), { timeout: 3000 });
    await new Promise((r) => setTimeout(r, 50));
    live.stop();
    await expect(live.sets(), "nothing is announced").toBe(0);
  },
};

export const FocusNeverFallsToThePage: Story = {
  /* A pending item goes, then the item focus moved to goes too, then the
     first decision fails. Every step leaves focus somewhere in the queue. */
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "approve")!);
    const call = await nextCall();
    removeElsewhere("a");
    await waitFor(() => expect(active()).toBe(itemEl("b")));
    removeElsewhere("b");
    await waitFor(() => expect(active()).toBe(itemEl("c")));
    call.reject("Conflict.");
    await waitFor(() => expect(liveText()).toContain("Conflict."));
    await expect(active()).toBe(itemEl("c"));
  },
};

export const DialogFailureKeepsFocusInTheDialog: Story = {
  render: () => <Harness still={false} />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "edit-dialog")!);
    await waitFor(() => expect(q('[role="dialog"]')).not.toBeNull());
    await userEvent.click(submitButton()!);
    await expect(active(), "while it works").toBe(submitButton());
    (await nextCall()).reject("Couldn't save.");
    await waitFor(() => expect(q('[role="dialog"]')!.textContent).toContain("Couldn't save."));
    await expect(active(), "and after it fails").toBe(submitButton());
    await expect(q('[role="dialog"]')!.contains(active())).toBe(true);
  },
};

export const RunGetsTheCurrentItem: Story = {
  /* The app updates an item while its step is open; the decision runs on
     what's listed now, not on what the step opened with. */
  render: () => <Harness />,
  play: async () => {
    reset();
    await userEvent.click(button("a", "decline")!);
    harness.setItems((xs) => xs.map((x) => (x.id === "a" ? { ...x, title: "Lentil soup, revised" } : x)));
    await waitFor(() => expect(itemEl("a")!.textContent).toContain("Lentil soup, revised"));
    await userEvent.click(submitButton()!);
    const call = await nextCall();
    await expect(call.item.title).toBe("Lentil soup, revised");
    call.resolve();
  },
};

/* ── Headings, states ──────────────────────────────────────────────────── */

export const HeadingLevelsFollowTheApp: Story = {
  render: () => (
    <>
      <div data-levels="set">
        <Harness headingLevel={3} />
      </div>
    </>
  ),
  play: async () => {
    const queue = q('[data-levels="set"] section')!;
    await expect(queue.querySelector("h3")?.textContent).toBe("Recipes to check");
    await expect([...queue.querySelectorAll("article h4")].map((h) => h.textContent)).toEqual([
      "Lentil soup from Dana",
      "Rye crackers from Ollie",
      "Plum cake from Mei",
    ]);
    await expect(queue.querySelector("h2"), "twin: not the default level").toBeNull();
  },
};

export const HeadingLevelsDefault: Story = {
  render: () => <Harness initial={[RECIPES[0]]} />,
  play: async () => {
    const queue = q("section")!;
    await expect(queue.querySelector("h2")?.textContent).toBe("Recipes to check");
    await expect(queue.querySelector("article h3")?.textContent).toBe("Lentil soup from Dana");
  },
};

export const ItemHeadingLevelOverride: Story = {
  render: () => <Harness itemHeadingLevel={5} initial={[RECIPES[0]]} />,
  play: async () => {
    const queue = q("section")!;
    await expect(queue.querySelector("h2")?.textContent).toBe("Recipes to check");
    await expect(queue.querySelector("article h5")?.textContent).toBe("Lentil soup from Dana");
    await expect(queue.querySelector("article h3"), "twin: not the default").toBeNull();
  },
};

export const EmptyStateTakesTheItemLevel: Story = {
  render: () => <Harness initial={[]} headingLevel={4} />,
  play: async () => {
    await expect(q("[data-queue-empty] h5")?.textContent).toBe("Nothing to check");
  },
};

export const LoadingAndError: Story = {
  render: () => {
    const retried: string[] = [];
    (globalThis as { __retried?: string[] }).__retried = retried;
    return (
      <>
        <div data-state="loading">
          <Harness status="loading" />
        </div>
        <div data-state="error">
          <Harness status="error" error="The queue couldn't load." onRetry={() => retried.push("retry")} />
        </div>
      </>
    );
  },
  play: async () => {
    const loading = q('[data-state="loading"]')!;
    await expect(loading.querySelector('[role="status"][aria-label="Loading Recipes to check"]')).not.toBeNull();
    await expect(loading.querySelector("[aria-busy='true']")).not.toBeNull();
    await expect(loading.querySelector("[data-queue-item]"), "no items while loading").toBeNull();
    const error = q('[data-state="error"]')!;
    await expect(error.textContent).toContain("The queue couldn't load.");
    await userEvent.click([...error.querySelectorAll("button")].find((b) => b.textContent === "Retry")!);
    await expect((globalThis as { __retried?: string[] }).__retried).toEqual(["retry"]);
  },
};

/* ── Motion ────────────────────────────────────────────────────────────── */

export const NothingAnimatesAsAnItemLeaves: Story = {
  tags: ["reduced-motion"],
  render: () => (
    <>
      <Harness still={false} />
      <div data-probe style={{ width: 10, height: 10, animation: "rst-enter 5s linear" }} />
    </>
  ),
  play: async () => {
    reset();
    /* Twin: the probe animates, so getAnimations can see one when there is. */
    const probe = q("[data-probe]")!;
    await expect(probe.getAnimations().length).toBe(1);
    await userEvent.click(button("a", "approve")!);
    (await nextCall()).resolve();
    /* Read in the next frame, while an exit would still be playing, not
       after the item has gone, by which time one would have finished. */
    await new Promise((r) => requestAnimationFrame(r));
    const root = q("section")!;
    const moving = document.getAnimations().filter((a) => {
      const target = (a.effect as KeyframeEffect | null)?.target;
      return target instanceof Element && root.contains(target) && a.playState === "running";
    });
    await expect(moving).toEqual([]);
    await waitFor(() => expect(itemEl("a")).toBeNull());
  },
};

/* ── Previews ──────────────────────────────────────────────────────────── */

const PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAACAkQBADs=";

export const PreviewFallsBackWhenItCantRender: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, padding: 16 }}>
      <div data-preview="ok">
        <MediaPreview src={PIXEL} href="https://example.com/a.jpg" alt="Lentil soup in a bowl" />
      </div>
      <div data-preview="broken">
        <MediaPreview src="/does-not-exist.heic" href="https://example.com/b.heic" alt="Plum cake, sliced" />
      </div>
      <div data-preview="none">
        <MediaPreview src={null} alt="Rye crackers on a board" />
      </div>
    </div>
  ),
  play: async () => {
    /* Twin: a preview that loads stays an image. */
    await expect(q('[data-preview="ok"] img')?.getAttribute("alt")).toBe("Lentil soup in a bowl");
    await waitFor(() => expect(q('[data-preview="broken"] a')).not.toBeNull());
    const link = q<HTMLAnchorElement>('[data-preview="broken"] a')!;
    await expect(link.getAttribute("href")).toBe("https://example.com/b.heic");
    await expect(link.getAttribute("aria-label")).toBe("Preview unavailable. Open original, in a new tab: Plum cake, sliced");
    await expect(q('[data-preview="broken"] img'), "no broken image left behind").toBeNull();
    await expect(q('[data-preview="none"] [role="img"]')?.getAttribute("aria-label")).toBe(
      "Preview unavailable: Rye crackers on a board",
    );
  },
};

/* ── Phones ────────────────────────────────────────────────────────────── */

export const At320EveryTargetIs44: Story = {
  tags: ["real-input"],
  render: () => <Harness />,
  play: async () => {
    const input = realInputOrSkip();
    if (!input) return;
    await input.page.viewport(320, 720);
    try {
      reset();
      await userEvent.click(button("b", "reject")!);
      const root = q("section")!;
      const targets = [...root.querySelectorAll<HTMLElement>("button, a[href]")].filter((el) => el.offsetParent);
      await expect(targets.length, "buttons on screen").toBeGreaterThan(6);
      for (const el of targets) {
        const box = el.getBoundingClientRect();
        await expect([Math.round(box.width) >= 44, Math.round(box.height) >= 44], el.textContent ?? "").toEqual([true, true]);
        /* All of it on screen inside its item: a card clips what overflows,
           so a target can measure 44 and still be cut off. */
        const item = el.closest("article")!.getBoundingClientRect();
        await expect(
          [box.left >= item.left - 0.5, box.right <= item.right + 0.5],
          `${el.textContent ?? ""} sits inside its item`,
        ).toEqual([true, true]);
      }
      /* A radio's own box is small; its hit area is 44 across. Hit-test it. */
      for (const radio of root.querySelectorAll<HTMLElement>('[role="radio"]')) {
        const box = radio.getBoundingClientRect();
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        for (const [x, y] of [[cx - 21, cy], [cx + 21, cy], [cx, cy - 21], [cx, cy + 21]]) {
          await expect(radio.contains(document.elementFromPoint(x, y))).toBe(true);
        }
      }
      await expect(document.documentElement.scrollWidth, "no sideways scroll").toBeLessThanOrEqual(320);

      /* The surfaces too: their own close, Cancel and submit. */
      await userEvent.keyboard("{Escape}");
      for (const id of ["edit-dialog", "edit-sheet"]) {
        await userEvent.click(button("a", id)!);
        await waitFor(() => expect(q('[role="dialog"]')).not.toBeNull());
        const buttons = [...q('[role="dialog"]')!.querySelectorAll<HTMLElement>("button")].filter((el) => el.offsetParent);
        await expect(buttons.length, `${id}: buttons`).toBeGreaterThan(1);
        for (const el of buttons) {
          const box = el.getBoundingClientRect();
          await expect(
            [Math.round(box.width) >= 44, Math.round(box.height) >= 44, box.left >= 0, box.right <= 320],
            `${id}: ${el.getAttribute("aria-label") ?? el.textContent}`,
          ).toEqual([true, true, true, true]);
        }
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(q('[role="dialog"]')).toBeNull(), { timeout: 3000 });
      }
    } finally {
      await input.page.viewport(1280, 720);
    }
  },
};

/* ── The accessibility tree ────────────────────────────────────────────── */

export const ItemsAreNamedArticles: Story = {
  tags: ["ax-tree"],
  render: () => <Harness />,
  play: async () => {
    const input = realInputOrSkip();
    if (!input) return;
    const probes = [itemEl("a")!, q("section ul")!, q("[data-queue-live]")!];
    const ids = probes.map((el, i) => {
      const id = `mq-${i}-${Math.random().toString(36).slice(2)}`;
      el.setAttribute("data-ax-probe", id);
      return `[data-ax-probe="${id}"]`;
    });
    const states = await input.commands.axStates(ids);
    probes.forEach((el) => el.removeAttribute("data-ax-probe"));
    await expect(states.map((s) => [s.role, s.name])).toEqual([
      ["article", "Lentil soup from Dana"],
      ["list", "Recipes to check"],
      ["status", ""],
    ]);
  },
};
