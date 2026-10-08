import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { Button } from "./Button";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Button's promises, checked in Chromium, where focus and the cascade are
 * real. Expected values are literals from the requirement, each with a twin
 * that must come out differently.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Atoms/Button/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const presses = { save: 0, submit: 0 };

/* Pressed, it works for as long as the play says, the way a request would. */
const release = { current: () => {} };
function Saver({ busyAs }: { busyAs: "isLoading" | "disabled" }) {
  const [busy, setBusy] = useState(false);
  const busyProps = busyAs === "isLoading" ? { isLoading: busy } : { disabled: busy };
  return (
    <>
      <Button
        {...busyProps}
        data-saver=""
        onClick={() => {
          presses.save++;
          setBusy(true);
          release.current = () => setBusy(false);
        }}
      >
        Save
      </Button>
      <Button data-plain="">Plain</Button>
    </>
  );
}

const saver = () => document.querySelector<HTMLButtonElement>("[data-saver]")!;

export const FocusStaysOnALoadingButton: Story = {
  render: () => <Saver busyAs="isLoading" />,
  play: async () => {
    presses.save = 0;
    saver().focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(saver().getAttribute("aria-busy")).toBe("true"));
    await expect(document.activeElement).toBe(saver());
    release.current();
    await waitFor(() => expect(saver().hasAttribute("aria-busy")).toBe(false));
    await expect(document.activeElement).toBe(saver());
  },
};

/* The twin, and the reason for the change: a native `disabled` drops focus. */
export const FocusLeavesADisabledButton: Story = {
  render: () => <Saver busyAs="disabled" />,
  play: async () => {
    saver().focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(saver().disabled).toBe(true));
    await expect(document.activeElement).toBe(document.body);
    release.current();
  },
};

export const ALoadingButtonIgnoresPresses: Story = {
  render: () => <Saver busyAs="isLoading" />,
  play: async () => {
    presses.save = 0;
    await userEvent.click(saver());
    await waitFor(() => expect(saver().getAttribute("aria-busy")).toBe("true"));
    await userEvent.click(saver());
    saver().focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(presses.save).toBe(1);
    /* The twin: done loading, a press counts again. */
    release.current();
    await waitFor(() => expect(saver().hasAttribute("aria-busy")).toBe(false));
    await userEvent.click(saver());
    await expect(presses.save).toBe(2);
    release.current();
  },
};

/* An app's own key handler must not trap focus on a loading button: Headless
   UI swaps such handlers for one that cancels every key, Tab included. */
export const TabLeavesALoadingButtonWithItsOwnKeyHandler: Story = {
  render: () => (
    <>
      <Button isLoading onKeyDown={() => {}} data-saver="">
        Save
      </Button>
      <Button data-plain="">Next</Button>
    </>
  ),
  play: async () => {
    saver().focus();
    await userEvent.tab();
    await expect(document.activeElement).toBe(document.querySelector("[data-plain]"));
  },
};

/* The twin: the same handler on a button that's only `aria-disabled` is
   swapped by Headless UI for one that cancels every key, and Tab stays put. */
export const TabStaysOnAnAriaDisabledButtonWithItsOwnKeyHandler: Story = {
  render: () => (
    <>
      <Button aria-disabled onKeyDown={() => {}} data-saver="">
        Save
      </Button>
      <Button data-plain="">Next</Button>
    </>
  ),
  play: async () => {
    saver().focus();
    await userEvent.tab();
    await expect(document.activeElement).toBe(saver());
  },
};

function Form() {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        presses.submit++;
        setBusy(true);
        release.current = () => setBusy(false);
      }}
    >
      <input aria-label="Title" defaultValue="Kelp forest" data-title="" />
      <Button type="submit" isLoading={busy} data-submit="">
        Send
      </Button>
    </form>
  );
}

export const ALoadingSubmitSendsItsFormOnce: Story = {
  render: () => <Form />,
  play: async () => {
    presses.submit = 0;
    const submit = document.querySelector<HTMLButtonElement>("[data-submit]")!;
    await userEvent.click(submit);
    await waitFor(() => expect(submit.getAttribute("aria-busy")).toBe("true"));
    await userEvent.click(submit);
    /* Enter in a field submits through the form's submit button too. */
    await userEvent.type(document.querySelector<HTMLInputElement>("[data-title]")!, "{Enter}");
    await expect(presses.submit).toBe(1);
    /* The twin: once it's done, the form sends again. */
    release.current();
    await waitFor(() => expect(submit.hasAttribute("aria-busy")).toBe(false));
    await userEvent.click(submit);
    await expect(presses.submit).toBe(2);
    release.current();
  },
};

export const LoadingIsBusyAndUnavailableToAScreenReader: Story = {
  tags: ["ax-tree"],
  render: () => (
    <>
      <Button isLoading data-probe="loading">
        Save
      </Button>
      <Button data-probe="plain">Save</Button>
      <Button disabled isLoading data-probe="both">
        Save
      </Button>
    </>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const states = await real.commands.axStates(['[data-probe="loading"]', '[data-probe="plain"]', '[data-probe="both"]']);
    await expect(states.map((s) => [s.role, s.name, s.disabled, s.busy])).toEqual([
      ["button", "loading Save", true, true],
      ["button", "Save", false, false],
      ["button", "loading Save", true, false],
    ]);
  },
};

/* An app with no reset: the browser's own button border comes back. Restored
   inside Roster's lowest layer here, so only what Roster itself sets can
   remove it, which is what an app without a preflight sees. */
const NO_RESET = `@layer roster-preflight { [data-no-reset] button { border: revert; } }`;

export const ALinkButtonDrawsNoBorderWithoutAReset: Story = {
  render: () => (
    <div data-no-reset="">
      <style>{NO_RESET}</style>
      <Button variant="link" data-link="">
        Read the guide
      </Button>
      <button type="button" data-native="">
        Native
      </button>
    </div>
  ),
  play: async () => {
    const width = (s: string) => getComputedStyle(document.querySelector(s)!).borderTopWidth;
    await expect(width("[data-link]")).toBe("0px");
    /* The twin: a plain button in the same place draws the browser's border. */
    await expect(width("[data-native]")).toBe("2px");
  },
};
