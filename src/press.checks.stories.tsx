import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Button } from "./components/atoms/Button/Button";
import { AvatarStrip } from "./components/atoms/AvatarStrip/AvatarStrip";
import { Disclosure } from "./components/atoms/Disclosure/Disclosure";
import { PasswordInput } from "./components/atoms/PasswordInput/PasswordInput";
import { Alert } from "./components/molecules/Alert/Alert";
import { CallToAction } from "./components/molecules/CallToAction/CallToAction";
import { MatchupCard } from "./components/molecules/MatchupCard/MatchupCard";
import { Menu, MenuButton, MenuItem, MenuItems } from "./components/molecules/Menu/Menu";
import { Pagination } from "./components/molecules/Pagination/Pagination";
import { Toast } from "./components/molecules/Toast/Toast";
import { Dialog } from "./components/organisms/Dialog/Dialog";
import { realInputOrSkip } from "./test/real-input";

/**
 * A press on a button's label or icon counts as the mouse's, so what a script
 * focuses next draws no ring. A real mouse, in Chromium and WebKit.
 *
 * In WebKit a press whose target is an element inside a button isn't the
 * button's, and a script that then moves focus gets `:focus-visible`, as if
 * the keyboard had moved it. With no Roster at all, `<button><span>` does it
 * and `<button>text` doesn't. A press that lands on a button clears it for the
 * ones after, so each press here follows a real Tab.
 *
 * - **Each control** is pressed on a child of its own (its label, an icon), and
 *   the press must land on the button. Then a script focuses something, which
 *   must not match `:focus-visible`.
 * - **The twin** is the same control with its children taking presses again,
 *   as 5.24.0's did (`data-press-twin`). The press lands on the child, and the
 *   ring is whatever this engine draws for a plain `<button><span>`: in WebKit
 *   on a Mac, a ring.
 * - **A Dialog closed with the mouse** gives focus back to what opened it with
 *   no ring, from its close button and from a Button in it.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Internal/Press checks",
  tags: ["!dev", "!autodocs", "real-input"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};
const chromium = () => navigator.userAgent.includes("Chrome");
const frame = () => new Promise((r) => requestAnimationFrame(r));
const TWIN = "[data-press-twin] button * { pointer-events: auto !important }";
const Icon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" style={{ display: "block" }}>
    <rect width="16" height="16" />
  </svg>
);
/* 1px, transparent. */
const LOGO = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

type Control = { id: string; node: ReactNode; /** The button, if it isn't the only one. */ button?: string; /** The child pressed. */ on: string };

const LOOKS = ["solid", "soft", "outline", "ghost", "link", "tint", "tint-subtle", "plain"] as const;
const BUTTONS: Control[] = [
  ...LOOKS.map((variant) => ({ id: variant, node: <Button variant={variant}>Press me</Button>, on: "span" })),
  { id: "start icon", node: <Button startIcon={<Icon />}>Press me</Button>, on: "rect" },
  { id: "icon", node: <Button size="icon" aria-label="Press me"><Icon /></Button>, on: "rect" },
  { id: "compact", node: <Button size="compact">Press me</Button>, on: "span" },
  { id: "singleLine", node: <Button singleLine>Press me</Button>, on: "span span" },
  { id: "tile", node: <Button layout="tile" startIcon={<Icon />}>Press me</Button>, on: "rect" },
  { id: "element child", node: <Button><em>Press me</em></Button>, on: "em" },
];
const OTHERS: Control[] = [
  { id: "MenuButton", node: <Menu><MenuButton>Actions</MenuButton><MenuItems><MenuItem onSelect={noop}>One</MenuItem></MenuItems></Menu>, on: "span" },
  { id: "MenuButton plain", node: <Menu><MenuButton plain aria-label="Account"><span style={{ display: "block", padding: 12 }}><Icon /></span></MenuButton><MenuItems><MenuItem onSelect={noop}>One</MenuItem></MenuItems></Menu>, on: "rect" },
  { id: "Pagination page", node: <Pagination layout="pages" page={2} pageCount={4} onPageChange={noop} />, button: 'button[aria-label="Page 3"]', on: "span" },
  { id: "Pagination arrow", node: <Pagination layout="pages" page={2} pageCount={4} onPageChange={noop} />, button: 'button[aria-label^="Next"]', on: "svg" },
  { id: "CallToAction dismiss", node: <CallToAction title="Title" description="Words" onDismiss={noop} />, button: "button[aria-label]", on: "svg" },
  { id: "Disclosure title", node: <Disclosure title="More about it">Words</Disclosure>, on: "span" },
  { id: "Disclosure icon", node: <Disclosure title="More about it">Words</Disclosure>, on: "svg" },
  { id: "Alert dismiss", node: <Alert onDismiss={noop}>Saved</Alert>, on: "svg" },
  { id: "Toast dismiss", node: <Toast onDismiss={noop}>Saved</Toast>, on: "svg" },
  { id: "PasswordInput reveal", node: <PasswordInput label="Password" />, on: "svg" },
  { id: "AvatarStrip dismiss", node: <AvatarStrip items={[{ key: "a", label: "Ann" }]} onDismiss={noop} />, button: '[data-testid="avatar-strip-dismiss"]', on: "svg" },
  { id: "MatchupCard logo", node: <MatchupCard homeTeam={{ id: 1, name: "Home", logoSrc: LOGO }} awayTeam={{ id: 2, name: "Away", logoSrc: LOGO }} />, on: "img" },
  { id: "MatchupCard words", node: <MatchupCard homeTeam={{ id: 1, name: "Home", logoSrc: LOGO }} awayTeam={{ id: 2, name: "Away", logoSrc: LOGO }} />, on: "span" },
];
/* The measure itself, with none of Roster in it. */
const NATIVE: Control = { id: "native", node: <button type="button" style={{ padding: 12 }}><span>Press me</span></button>, on: "span" };

function Page({ controls }: { controls: Control[] }) {
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start", padding: 16, width: 480 }}>
      <style>{TWIN}</style>
      <button type="button" data-press-before="">Before</button>
      <button type="button" data-press-tab="">Tab lands here</button>
      <div tabIndex={-1} data-press-to="">Focused by the script</div>
      {controls.map((c) => (
        <div key={c.id} data-press={c.id} style={{ width: "100%" }}>
          {c.node}
        </div>
      ))}
    </div>
  );
}

type Read = { landed: boolean; ring: boolean };

/** Where a child's middle is, as fractions of its button's box. */
function middleOf(child: Element, button: Element) {
  const c = child.getBoundingClientRect();
  const b = button.getBoundingClientRect();
  return { fx: (c.left + c.width / 2 - b.left) / b.width, fy: (c.top + c.height / 2 - b.top) / b.height };
}

/** One real press on the control's child, after a real Tab: where it landed, and whether what a script focused then rings. */
async function press(real: NonNullable<ReturnType<typeof realInputOrSkip>>, c: Control): Promise<Read> {
  const scope = `[data-press="${c.id}"]`;
  const selector = `${scope} ${c.button ?? "button"}`;
  const button = document.querySelector(selector)!;
  const child = button.querySelector(c.on)!;
  document.querySelector<HTMLElement>("[data-press-before]")!.focus();
  await real.commands.realPress([chromium() ? "Tab" : "Alt+Tab"]);
  await waitFor(() => expect(document.activeElement).toBe(document.querySelector("[data-press-tab]")));
  const read = new Promise<Read>((done) => {
    document.addEventListener(
      "click",
      (e) => {
        const to = document.querySelector<HTMLElement>("[data-press-to]")!;
        to.focus({ preventScroll: true });
        done({ landed: e.target === button, ring: to.matches(":focus-visible") });
      },
      { capture: true, once: true },
    );
  });
  await real.commands.realClick(selector, middleOf(child, button));
  const out = await read;
  /* What a press opened is closed again. */
  if (button.getAttribute("aria-expanded") === "true") {
    (button as HTMLElement).click();
    await waitFor(() => expect(button.getAttribute("aria-expanded")).toBe("false"));
  }
  return out;
}

async function all(controls: Control[]) {
  const real = realInputOrSkip();
  if (!real) return;
  const root = document.documentElement;
  const now: Record<string, Read> = {};
  const then: Record<string, Read> = {};
  try {
    root.dataset.pressTwin = "";
    const native = await press(real, NATIVE);
    await expect(native.landed).toBe(false);
    for (const c of controls) then[c.id] = await press(real, c);
    delete root.dataset.pressTwin;
    for (const c of controls) now[c.id] = await press(real, c);
    console.info(`PRESS ${chromium() ? "chromium" : "webkit"} native span rings ${native.ring} ${JSON.stringify({ now, then })}`);
    await expect(Object.keys(now)).toHaveLength(controls.length);
    await expect(now).toEqual(Object.fromEntries(controls.map((c) => [c.id, { landed: true, ring: false }])));
    /* The twin: the press lands on the child, and rings where a plain
       `<button><span>` does. */
    await expect(then).toEqual(Object.fromEntries(controls.map((c) => [c.id, { landed: false, ring: native.ring }])));
  } finally {
    delete root.dataset.pressTwin;
  }
}

export const APressOnAButtonsContentsIsTheButtons: Story = {
  render: () => <Page controls={[NATIVE, ...BUTTONS]} />,
  play: async () => all(BUTTONS),
};

export const APressOnTheOtherControlsContentsIsTheirs: Story = {
  render: () => <Page controls={[NATIVE, ...OTHERS]} />,
  play: async () => all(OTHERS),
};

/* ── A Dialog closed with the mouse ───────────────────────────────────── */

function Opener() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 16 }}>
      <style>{TWIN}</style>
      <button type="button" data-press-before="">Before</button>
      <button type="button" data-press-opener="" onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog isOpen={open} onClose={() => setOpen(false)} title="A dialog">
        <Button data-press-done="" onClick={() => setOpen(false)}>
          Done
        </Button>
      </Dialog>
    </div>
  );
}

export const ADialogClosedWithTheMouseGivesFocusBackWithNoRing: Story = {
  render: () => <Opener />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const opener = document.querySelector<HTMLElement>("[data-press-opener]")!;
    const closes = async (selector: string, on: string) => {
      document.querySelector<HTMLElement>("[data-press-before]")!.focus();
      await real.commands.realPress([chromium() ? "Tab" : "Alt+Tab"]);
      await waitFor(() => expect(document.activeElement).toBe(opener));
      await real.commands.realPress(["Enter"]);
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeTruthy());
      await waitFor(() => expect(document.querySelector('[role="dialog"]')!.getAnimations({ subtree: true })).toEqual([]));
      await frame();
      const button = document.querySelector(selector)!;
      await real.commands.realClick(selector, middleOf(button.querySelector(on)!, button));
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), { timeout: 3000 });
      await waitFor(() => expect(document.activeElement).toBe(opener));
      return opener.matches(":focus-visible");
    };
    const close = '[role="dialog"] button[aria-label]';
    const done = "[data-press-done]";
    const now = [await closes(close, "svg"), await closes(done, "span")];
    let then: boolean[] = [];
    try {
      document.documentElement.dataset.pressTwin = "";
      then = [await closes(close, "svg"), await closes(done, "span")];
    } finally {
      delete document.documentElement.dataset.pressTwin;
    }
    console.info(`PRESS DIALOG ${chromium() ? "chromium" : "webkit"} ${JSON.stringify({ now, then })}`);
    await expect(now).toEqual([false, false]);
    /* The twin, where a Mac's WebKit drew it. */
    if (!chromium() && navigator.platform.startsWith("Mac")) await expect(then).toEqual([true, true]);
  },
};
