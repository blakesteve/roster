import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueueEditDialog } from "./QueueEditDialog";
import "@testing-library/jest-dom";

/* What QueueEditDialog is handed and what it renders. Escape, busy and the
   close report run with real transitions in QueueEditDialog.checks.stories.tsx. */
const props = (over: Partial<Parameters<typeof QueueEditDialog>[0]> = {}) => ({
  open: true,
  title: "Tidy it up",
  description: "Keep the cook's own words.",
  busy: false,
  onCancel: vi.fn(),
  onAfterClose: vi.fn(),
  cancelButton: <button>Cancel</button>,
  submitButton: <button>List it</button>,
  children: <p>The form</p>,
  ...over,
});

describe("QueueEditDialog", () => {
  it("names itself with the step's title", async () => {
    render(<QueueEditDialog {...props()} />);
    expect(await screen.findByRole("dialog", { name: "Tidy it up" })).toBeInTheDocument();
    expect(screen.getByText("Keep the cook's own words.")).toBeInTheDocument();
  });

  it("renders the form it's handed", async () => {
    render(<QueueEditDialog {...props()} />);
    expect(await screen.findByText("The form")).toBeInTheDocument();
  });

  it("renders nothing while closed", () => {
    render(<QueueEditDialog {...props({ open: false })} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("The form")).not.toBeInTheDocument();
  });

  it("renders both buttons, Cancel first", async () => {
    render(<QueueEditDialog {...props()} />);
    const cancel = await screen.findByRole("button", { name: "Cancel" });
    const submit = screen.getByRole("button", { name: "List it" });
    expect(cancel.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
