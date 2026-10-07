import { useLayoutEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { QueueEditSheet } from "./QueueEditSheet";

/**
 * QueueEditSheet on its own: what it renders and where, that Escape cancels
 * unless a decision is in flight, and that it reports closing exactly once.
 * How the queue uses it (focus after it closes, an item decided elsewhere)
 * is checked in ModerationQueue.checks.stories.tsx.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/ModerationQueue/QueueEditSheet/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const control = {
  setOpen: (() => {}) as (open: boolean) => void,
  cancels: 0,
  closes: 0,
};

function Harness({ busy = false }: { busy?: boolean }) {
  const [open, setOpen] = useState(true);
  useLayoutEffect(() => {
    control.setOpen = setOpen;
  }, []);
  return (
    <QueueEditSheet
      open={open}
      title="Tidy it up"
      description="Keep the cook's own words."
      busy={busy}
      onCancel={() => {
        control.cancels += 1;
        setOpen(false);
      }}
      onAfterClose={() => {
        control.closes += 1;
      }}
      cancelButton={<button data-part="cancel">Cancel</button>}
      submitButton={<button data-part="submit">List it</button>}
    >
      <p data-part="form">The form goes here.</p>
    </QueueEditSheet>
  );
}

const reset = () => {
  control.cancels = 0;
  control.closes = 0;
};
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const part = (name: string) => dialog()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;

export const RendersTheSubmitInTheHeaderAndNoCancel: Story = {
  render: () => <Harness />,
  play: async () => {
    await waitFor(() => expect(dialog()).not.toBeNull());
    await expect(dialog()!.textContent).toContain("Tidy it up");
    await expect(dialog()!.textContent).toContain("Keep the cook's own words.");
    const submit = part("submit")!;
    /* The submit is in the header, ahead of the form. */
    await expect(submit.compareDocumentPosition(part("form")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    /* Cancel is the Sheet's own close button, so the queue's isn't drawn. */
    await expect(part("cancel")).toBeNull();
    await expect(dialog()!.querySelector('button[aria-label="Close"]')).not.toBeNull();
  },
};

export const EscapeCancels: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await waitFor(() => expect(dialog()).not.toBeNull());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(control.cancels).toBe(1));
  },
};

export const EscapeWaitsWhileBusy: Story = {
  /* Twin of EscapeCancels: a decision is in flight. */
  render: () => <Harness busy />,
  play: async () => {
    reset();
    await waitFor(() => expect(dialog()).not.toBeNull());
    await userEvent.keyboard("{Escape}");
    await new Promise((r) => setTimeout(r, 400));
    await expect(control.cancels).toBe(0);
    await expect(dialog()).not.toBeNull();
  },
};

export const ReportsClosingOnce: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    await waitFor(() => expect(dialog()).not.toBeNull());
    await new Promise((r) => setTimeout(r, 400));
    await expect(control.closes, "not while open").toBe(0);
    control.setOpen(false);
    await waitFor(() => expect(control.closes).toBe(1), { timeout: 3000 });
    await new Promise((r) => setTimeout(r, 400));
    await expect(control.closes, "and only once").toBe(1);
  },
};
