import { render, screen, act, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { Toaster } from "./Toaster";
import { toast } from "./toast-api";
import "@testing-library/jest-dom";

/* react-hot-toast keeps its queue in a module-level store, so a toast fired in
   one test survives into the next unless it is cleared. */
afterEach(() => {
  act(() => {
    toast.remove();
  });
  cleanup();
});

const fire = (fn: () => void) => act(() => void fn());

describe("Toaster", () => {
  it("renders a fired toast through Roster's own body", async () => {
    render(<Toaster />);
    fire(() => toast.success("Saved"));

    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("gives info and warning real tones instead of falling back to neutral", async () => {
    /* This is the bug that shipped in a consumer. react-hot-toast has no
       `info`, so mega-squad's wrapper called `toast.error` and every
       informational message in that app rendered as an error. `toast.info`
       marks the tone and `Toaster` reads it back, so it is a real tone rather
       than a red toast wearing a different word. */
    render(<Toaster />);
    fire(() => toast.info("Heads up"));

    const body = (await screen.findByText("Heads up")).closest("div[class*='rst:border']");
    expect(body?.className).toContain("rst:bg-info-50");
    expect(body?.className).not.toContain("rst:bg-error-50");

    fire(() => toast.warning("Careful"));
    const warned = (await screen.findByText("Careful")).closest("div[class*='rst:border']");
    expect(warned?.className).toContain("rst:bg-amber-50");
  });

  it("maps error to the error scheme and a blank toast to neutral", async () => {
    render(<Toaster />);
    fire(() => toast.error("Failed"));
    fire(() => toast("Just saying"));

    const failed = (await screen.findByText("Failed")).closest("div[class*='rst:border']");
    const plain = (await screen.findByText("Just saying")).closest("div[class*='rst:border']");
    expect(failed?.className).toContain("rst:bg-error-50");
    expect(plain?.className).toContain("rst:bg-[var(--roster-popover-bg)]");
  });

  it("announces errors assertively and everything else politely", async () => {
    /* react-hot-toast marks every toast `status` / `polite`, errors included.
       A polite live region is read when the user next pauses, which for a
       message that disappears in four seconds can mean never. This assertion
       started life claiming the library already made the distinction; it
       does not, and finding that out is why Roster makes it here. */
    render(<Toaster />);
    fire(() => toast.error("Failed"));
    fire(() => toast.success("Saved"));

    const failed = (await screen.findByText("Failed")).closest("[aria-live]");
    const saved = (await screen.findByText("Saved")).closest("[aria-live]");
    expect(failed).toHaveAttribute("aria-live", "assertive");
    expect(failed).toHaveAttribute("role", "alert");
    expect(saved).toHaveAttribute("aria-live", "polite");
  });

  it("applies the chosen variant to the whole queue", async () => {
    render(<Toaster variant="solid" />);
    fire(() => toast.success("Saved"));

    const body = (await screen.findByText("Saved")).closest("div[class*='rst:border']");
    expect(body?.className).toContain("rst:bg-success-500");
  });

  it("dismisses through the queue, not just visually", async () => {
    /* Nothing covered this wiring: replacing the handler with a no-op kept
       every test green while the button did nothing. */
    render(<Toaster />);
    fire(() => toast.success("Saved"));
    const button = await screen.findByRole("button", { name: "Dismiss" });

    await act(async () => {
      button.click();
      await new Promise((r) => setTimeout(r, 1200));
    });
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("leaves a loading toast up instead of timing it out", async () => {
    /* A blanket `duration` beat react-hot-toast's `Infinity` default for
       `loading`, so an upload's "Uploading…" vanished after four seconds and
       `toast.promise` lost its loading state before the promise settled. */
    render(<Toaster duration={50} />);
    fire(() => toast.loading("Uploading..."));
    await screen.findByText("Uploading...");

    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(screen.getByText("Uploading...")).toBeInTheDocument();
  });

  it("does not let a stale tone survive a same-id update", async () => {
    /* Updating a toast merges the old options, so an info marker outlived the
       call that set it: `toast.info(msg, {id})` then `toast.error(msg, {id})`
       rendered blue and announced politely — the failure shown as neither. */
    render(<Toaster />);
    fire(() => toast.info("Saving...", { id: "job" }));
    await screen.findByText("Saving...");
    fire(() => toast.error("Save failed", { id: "job" }));

    const body = (await screen.findByText("Save failed")).closest("div[class*='rst:border']");
    expect(body?.className).toContain("rst:bg-error-50");
    expect(body?.className).not.toContain("rst:bg-info-50");
    expect(body?.closest("[aria-live]")).toHaveAttribute("aria-live", "assertive");
  });

  it("does not let a consumer class hijack the tone", async () => {
    /* The marker was matched with `includes`, so any class containing it won. */
    render(<Toaster />);
    fire(() => toast.success("Ok", { className: "rst-toast-tone-info-ish" }));

    const body = (await screen.findByText("Ok")).closest("div[class*='rst:border']");
    expect(body?.className).toContain("rst:bg-success-50");
  });

  it("forwards a per-toast icon instead of dropping it", async () => {
    /* The `children` render prop replaces `ToastBar`, which is where
       react-hot-toast would have applied this. */
    render(<Toaster />);
    fire(() => toast.success("Done", { icon: <span>PARTY</span> }));

    expect(await screen.findByText("PARTY")).toBeInTheDocument();
  });

  it("can be told not to offer dismiss controls", async () => {
    render(<Toaster dismissible={false} />);
    fire(() => toast.success("Saved"));
    await screen.findByText("Saved");

    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });
});
