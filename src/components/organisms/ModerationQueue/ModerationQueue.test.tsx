import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { ModerationQueue } from "./ModerationQueue";
import type { QueueAction, QueueReasonStep } from "./queue-actions";

/**
 * The reason step's rules, in jsdom. The queue's timing, focus and
 * announcements are checked in Chromium (ModerationQueue.checks.stories.tsx).
 */

type Recipe = { id: string; title: string };
const RECIPES: Recipe[] = [{ id: "a", title: "Lentil soup" }];

function Queue({ actions }: { actions: QueueAction<Recipe>[] }) {
  return (
    <ModerationQueue<Recipe>
      label="Recipes"
      items={RECIPES}
      getKey={(r) => r.id}
      itemLabel={(r) => r.title}
      renderContent={(r) => <p>{r.title}</p>}
      actions={actions}
    />
  );
}

describe("ModerationQueue", () => {
  it("asks the reason's question when an action has both a reason and a confirm, as its submit does", async () => {
    const run = vi.fn(async () => {});
    render(
      <Queue
        actions={[
          { id: "back", label: "Send back", confirm: { prompt: "Send it back?" }, reason: { prompt: "Why is it going back?", note: "optional" }, run },
          /* The twin: a confirm alone asks its own question. */
          { id: "remove", label: "Remove", confirm: { prompt: "Remove this recipe?" }, run },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Send back" }));
    expect(screen.getByRole("group", { name: "Why is it going back?" })).toBeInTheDocument();
    expect(screen.queryByText("Send it back?")).toBeNull();
    /* And the submit sends the reason, so what was asked is what's answered. */
    await userEvent.type(screen.getByRole("textbox", { name: "Note (optional)" }), "Already listed");
    await userEvent.click(screen.getAllByRole("button", { name: "Send back" }).at(-1)!);
    expect(run).toHaveBeenCalledWith(RECIPES[0], { reason: { note: "Already listed" } });

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("group", { name: "Remove this recipe?" })).toBeInTheDocument();
  });

  it("never leaves a required reason with nothing to pick unsendable", async () => {
    const run = vi.fn(async () => {});
    /* The types refuse this shape; an untyped caller can still pass it. */
    const stuck = { prompt: "Why?", required: true, note: "optional" } as unknown as QueueReasonStep;
    render(<Queue actions={[{ id: "back", label: "Send back", reason: stuck, run }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Send back" }));
    expect(screen.queryByText("Pick a reason.")).toBeNull();
    await userEvent.click(screen.getAllByRole("button", { name: "Send back" }).at(-1)!);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("twin: a required reason with options waits for a pick", async () => {
    const run = vi.fn(async () => {});
    render(
      <Queue
        actions={[
          { id: "back", label: "Send back", reason: { prompt: "Why?", required: true, options: [{ value: "dup", label: "Already listed" }] }, run },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Send back" }));
    expect(screen.getByText("Pick a reason.")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Send back" }).at(-1)!);
    expect(run).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("radio", { name: "Already listed" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Send back" }).at(-1)!);
    expect(run).toHaveBeenCalledWith(RECIPES[0], { reason: { value: "dup" } });
  });
});
