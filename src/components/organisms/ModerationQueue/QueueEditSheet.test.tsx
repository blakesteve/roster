import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueueEditSheet } from "./QueueEditSheet";
import "@testing-library/jest-dom";

/* What QueueEditSheet is handed and what it renders. Escape, busy and the
   close report run with real transitions in QueueEditSheet.checks.stories.tsx. */
const props = (over: Partial<Parameters<typeof QueueEditSheet>[0]> = {}) => ({
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

describe("QueueEditSheet", () => {
  it("names itself with the step's title", async () => {
    render(<QueueEditSheet {...props()} />);
    expect(await screen.findByRole("dialog", { name: "Tidy it up" })).toBeInTheDocument();
    expect(screen.getByText("Keep the cook's own words.")).toBeInTheDocument();
  });

  it("renders the form it's handed", async () => {
    render(<QueueEditSheet {...props()} />);
    expect(await screen.findByText("The form")).toBeInTheDocument();
  });

  it("renders nothing while closed", () => {
    render(<QueueEditSheet {...props({ open: false })} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("The form")).not.toBeInTheDocument();
  });

  it("renders the submit and leaves Cancel to its own close button", async () => {
    render(<QueueEditSheet {...props()} />);
    expect(await screen.findByRole("button", { name: "List it" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
