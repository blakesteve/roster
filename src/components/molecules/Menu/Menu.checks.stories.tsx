import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Menu,
  MenuButton,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuItems,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSubmenu,
} from "./Menu";
import { Dialog } from "../../organisms/Dialog/Dialog";
import { Sheet } from "../../organisms/Sheet/Sheet";
import { Navbar } from "../../organisms/Navbar/Navbar";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Menu's promises, checked in Chromium: the keyboard, focus, the states a
 * screen reader is handed, the pointer on a submenu, where the panel lands,
 * and the size of every target. Expected values are literals from the
 * pattern, each with a twin that must come out differently.
 *
 * The panels are portaled to the end of the document, outside the story's
 * canvas, so each check reaches its panel through the button's
 * `aria-controls`.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/Menu/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const button = (root: HTMLElement, name: string) => within(root).getByRole("button", { name });
const panelOf = (trigger: HTMLElement) => document.getElementById(trigger.getAttribute("aria-controls") ?? "") as HTMLElement | null;
/** The focused item's label, or the focused element's role when it isn't an item. */
const focused = () => {
  const el = document.activeElement as HTMLElement | null;
  const label = el?.hasAttribute("data-menu-item") ? el.querySelector("[data-menu-label]") : null;
  return label ? (label.firstChild?.textContent ?? "").trim() : `<${el?.getAttribute("role") ?? el?.tagName.toLowerCase()}>`;
};
const opened = async (trigger: HTMLElement) => {
  await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
  await waitFor(() => expect(panelOf(trigger)).not.toBeNull());
  return panelOf(trigger)!;
};
const closed = (trigger: HTMLElement) => waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
/** Its entrance is over: no transition running, and at full size. No
    animation alone can be the frame before the entrance starts, at 95%. */
const settled = (panel: HTMLElement) => waitFor(() => expect([panel.getAnimations().length, getComputedStyle(panel).scale]).toEqual([0, "none"]));

function Actions({ onSelect = () => {} }: { onSelect?: (name: string) => void }) {
  return (
    <Menu>
      <MenuButton variant="outline" colorScheme="neutral">
        Actions
      </MenuButton>
      <MenuItems>
        <MenuItem onSelect={() => onSelect("Edit")}>Edit</MenuItem>
        <MenuItem onSelect={() => onSelect("Duplicate")}>Duplicate</MenuItem>
        <MenuItem disabled onSelect={() => onSelect("Archive")}>
          Archive
        </MenuItem>
        <MenuItem onSelect={() => onSelect("Share")}>Share</MenuItem>
        <MenuSeparator />
        <MenuItem destructive onSelect={() => onSelect("Delete")}>
          Delete
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}

/* ── Keyboard ─────────────────────────────────────────────────────────────── */

export const TheKeyboardOpensMovesAndJumps: Story = {
  render: () => <Actions />,
  play: async ({ canvasElement }) => {
    const trigger = button(canvasElement, "Actions");
    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    trigger.focus();

    await userEvent.keyboard("{Enter}");
    await opened(trigger);
    await waitFor(() => expect(focused()).toBe("Edit"));
    const walk: string[] = [];
    for (const key of ["{ArrowDown}", "{ArrowDown}", "{End}", "{ArrowDown}", "{ArrowUp}", "{Home}"]) {
      await userEvent.keyboard(key);
      walk.push(focused());
    }
    /* Down twice reaches the disabled item: reachable, so it can be read. End
       is the last; Down from there wraps to the first, Up wraps back. */
    await expect(walk).toEqual(["Duplicate", "Archive", "Delete", "Edit", "Delete", "Edit"]);

    /* Typeahead: a letter jumps to the next item starting with it; the same
       letter again cycles. The twin: a letter nothing starts with stays put. */
    await userEvent.keyboard("d");
    await expect(focused()).toBe("Duplicate");
    await userEvent.keyboard("d");
    await expect(focused()).toBe("Delete");
    await userEvent.keyboard("z");
    await expect(focused()).toBe("Delete");

    /* Escape closes it and puts focus back on the button. */
    await userEvent.keyboard("{Escape}");
    await closed(trigger);
    await expect(document.activeElement).toBe(trigger);

    /* Up on the button opens it on the last item; the twin, a click, opens it
       on the panel itself, with no item chosen yet. */
    await userEvent.keyboard("{ArrowUp}");
    await opened(trigger);
    await waitFor(() => expect(focused()).toBe("Delete"));
    await userEvent.keyboard("{Escape}");
    await closed(trigger);
    trigger.click();
    await opened(trigger);
    await waitFor(() => expect(focused()).toBe("<menu>"));
    await userEvent.keyboard("{ArrowDown}");
    await expect(focused()).toBe("Edit");
    await userEvent.keyboard("{Escape}");
    await closed(trigger);
  },
};

export const TabClosesItAndMovesOn: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <button type="button">Before</button>
      <Actions />
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = button(canvasElement, "Actions");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await opened(trigger);
    await userEvent.tab();
    await closed(trigger);
    /* On from the button, not from the panel at the end of the document. */
    await expect(document.activeElement).toBe(button(canvasElement, "After"));

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await opened(trigger);
    await userEvent.tab({ shift: true });
    await closed(trigger);
    await expect(document.activeElement).toBe(button(canvasElement, "Before"));
  },
};

export const TabGoesWhereTheBrowsersWould: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Actions />
      {/* What the browser's own Tab passes over: an inert region, a button
          taken out of the order, a field in a disabled fieldset, a hidden
          button, and the unchecked radios of a group. */}
      <div inert>
        <button type="button">Behind</button>
      </div>
      <button type="button" tabIndex={-1}>
        Roving
      </button>
      <fieldset disabled style={{ border: 0, margin: 0, padding: 0 }}>
        <input aria-label="Locked" />
      </fieldset>
      <span style={{ visibility: "hidden" }}>
        <button type="button">Hidden</button>
      </span>
      <input type="radio" name="tab-size" aria-label="Small" />
      <input type="radio" name="tab-size" aria-label="Large" defaultChecked />
      <button type="button">After</button>
      {/* Going back into a group with nothing checked, the stop is its last radio. */}
      <input type="radio" name="tab-tone" aria-label="Warm" />
      <input type="radio" name="tab-tone" aria-label="Cool" />
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          More
        </MenuButton>
        <MenuItems>
          <MenuItem>Pin</MenuItem>
        </MenuItems>
      </Menu>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = button(canvasElement, "Actions");
    const tabFromMenu = async () => {
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      await opened(trigger);
      await userEvent.tab();
      await closed(trigger);
      return (document.activeElement as HTMLElement).getAttribute("aria-label") ?? document.activeElement?.textContent;
    };
    /* On to the group's checked radio. The twin: check the other, and Tab
       goes to that one instead. */
    await expect(await tabFromMenu()).toBe("Large");
    within(canvasElement).getByRole("radio", { name: "Small" }).click();
    await expect(await tabFromMenu()).toBe("Small");
    /* Back from the last menu into a group with nothing checked: its last radio. */
    const more = button(canvasElement, "More");
    more.focus();
    await userEvent.keyboard("{Enter}");
    await opened(more);
    await userEvent.tab({ shift: true });
    await closed(more);
    await expect((document.activeElement as HTMLElement).getAttribute("aria-label")).toBe("Cool");
  },
};

/* ── Choosing ─────────────────────────────────────────────────────────────── */

const chosen = fn();

export const ChoosingAnItem: Story = {
  render: () => <Actions onSelect={chosen} />,
  play: async ({ canvasElement }) => {
    chosen.mockClear();
    const trigger = button(canvasElement, "Actions");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await opened(trigger);
    /* Enter chooses, closes, and returns focus to the button. */
    await userEvent.keyboard("{Enter}");
    await closed(trigger);
    await expect(chosen.mock.calls).toEqual([["Edit"]]);
    await expect(document.activeElement).toBe(trigger);

    /* A click does the same. Every item that can be chosen shows the
       pointer; the twin, the disabled one, shows that it can't. */
    trigger.click();
    const panel = await opened(trigger);
    const cursor = (name: string) => getComputedStyle(within(panel).getByRole("menuitem", { name })).cursor;
    await expect([cursor("Edit"), cursor("Share"), cursor("Delete"), cursor("Archive")]).toEqual(["pointer", "pointer", "pointer", "not-allowed"]);
    within(panel).getByRole("menuitem", { name: "Share" }).click();
    await closed(trigger);
    await expect(chosen.mock.calls).toEqual([["Edit"], ["Share"]]);

    /* The twin: the disabled item is reached and not chosen, and the menu
       stays open. */
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await opened(trigger);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect(focused()).toBe("Archive");
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(chosen.mock.calls).toEqual([["Edit"], ["Share"]]);
    await userEvent.keyboard("{Escape}");
    await closed(trigger);
  },
};

function ViewMenu() {
  const [archived, setArchived] = useState(false);
  const [sort, setSort] = useState("newest");
  return (
    <Menu>
      <MenuButton variant="outline" colorScheme="neutral">
        View
      </MenuButton>
      <MenuItems>
        <MenuCheckboxItem checked={archived} onCheckedChange={setArchived}>
          Archived
        </MenuCheckboxItem>
        <MenuSeparator />
        <MenuRadioGroup label="Sort by" value={sort} onValueChange={setSort}>
          <MenuRadioItem value="newest">Newest</MenuRadioItem>
          <MenuRadioItem value="oldest">Oldest</MenuRadioItem>
        </MenuRadioGroup>
      </MenuItems>
    </Menu>
  );
}

export const CheckedItems: Story = {
  render: () => <ViewMenu />,
  play: async ({ canvasElement }) => {
    const trigger = button(canvasElement, "View");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    let panel = await opened(trigger);
    const archived = () => within(panelOf(trigger)!).getByRole("menuitemcheckbox", { name: "Archived" });
    const radios = () => within(panelOf(trigger)!).getAllByRole("menuitemradio").map((r) => r.getAttribute("aria-checked"));
    await expect(archived()).toHaveAttribute("aria-checked", "false");

    /* Space sets it and keeps the menu open, as the pattern asks. */
    await userEvent.keyboard(" ");
    await waitFor(() => expect(archived()).toHaveAttribute("aria-checked", "true"));
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    /* Space on a radio item moves the choice, still open. */
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect(focused()).toBe("Oldest");
    await userEvent.keyboard(" ");
    await waitFor(() => expect(radios()).toEqual(["false", "true"]));
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    /* The radios are a group named by its label. */
    await expect(within(panel).getByRole("group", { name: "Sort by" })).toBeTruthy();

    /* The twin: Enter sets it and closes. */
    await userEvent.keyboard("{Home}{Enter}");
    await closed(trigger);
    trigger.click();
    panel = await opened(trigger);
    await expect(archived()).toHaveAttribute("aria-checked", "false");
    await userEvent.keyboard("{Escape}");
    await closed(trigger);
  },
};

/* ── Submenus ─────────────────────────────────────────────────────────────── */

function MoveMenu({ onSelect = () => {} }: { onSelect?: (name: string) => void }) {
  return (
    <Menu>
      <MenuButton variant="outline" colorScheme="neutral">
        Move
      </MenuButton>
      <MenuItems>
        <MenuItem onSelect={() => onSelect("Rename")}>Rename</MenuItem>
        <MenuSubmenu label="Move to">
          <MenuItem onSelect={() => onSelect("Agates")}>Agates</MenuItem>
          <MenuSubmenu label="Fossils">
            <MenuItem onSelect={() => onSelect("Ammonites")}>Ammonites</MenuItem>
          </MenuSubmenu>
        </MenuSubmenu>
        <MenuItem onSelect={() => onSelect("Delete")}>Delete</MenuItem>
      </MenuItems>
    </Menu>
  );
}

export const ASubmenuByKeyboard: Story = {
  render: () => <MoveMenu />,
  play: async ({ canvasElement }) => {
    const trigger = button(canvasElement, "Move");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const root = await opened(trigger);
    const moveTo = within(root).getByRole("menuitem", { name: "Move to" });
    await expect([moveTo.getAttribute("aria-haspopup"), moveTo.getAttribute("aria-expanded")]).toEqual(["menu", "false"]);

    /* The twin first: the arrow away from the parent on a plain item opens nothing. */
    await userEvent.keyboard("{ArrowRight}");
    await expect(focused()).toBe("Rename");
    await expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1);

    /* On the submenu's item it opens it, on its first item. */
    await userEvent.keyboard("{ArrowDown}{ArrowRight}");
    await waitFor(() => expect(moveTo).toHaveAttribute("aria-expanded", "true"));
    await waitFor(() => expect(focused()).toBe("Agates"));
    const sub = document.getElementById(moveTo.getAttribute("aria-controls")!)!;
    await expect(sub).toHaveAttribute("role", "menu");
    await expect(sub).toHaveAttribute("aria-labelledby", moveTo.id);

    /* Submenus nest. */
    await userEvent.keyboard("{ArrowDown}{ArrowRight}");
    await waitFor(() => expect(focused()).toBe("Ammonites"));
    await expect(document.querySelectorAll('[role="menu"]')).toHaveLength(3);
    /* Each is its own menu, reached through its item's aria-controls and drawn
       beside its parent, not inside it: a menu owns only its items, groups
       and separators. */
    await expect([root.querySelector('[role="menu"]'), sub.querySelector('[role="menu"]')]).toEqual([null, null]);

    /* The arrow back closes one level and returns to its item; Escape does the
       same; the menu itself stays open. */
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(focused()).toBe("Fossils"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(focused()).toBe("Move to"));
    await expect(moveTo).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    /* Enter opens it too, and choosing inside closes everything. */
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(focused()).toBe("Agates"));
    await userEvent.keyboard("{Enter}");
    await closed(trigger);
    await expect(document.activeElement).toBe(trigger);
  },
};

const pointerChosen = fn();

export const ASubmenuByPointer: Story = {
  tags: ["real-input"],
  render: () => <MoveMenu onSelect={pointerChosen} />,
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    pointerChosen.mockClear();
    const trigger = button(canvasElement, "Move");
    trigger.setAttribute("data-check", "move-trigger");
    await real.commands.realClick('[data-check="move-trigger"]');
    const root = await opened(trigger);
    const moveTo = within(root).getByRole("menuitem", { name: "Move to" });
    moveTo.setAttribute("data-check", "move-to");
    within(root).getByRole("menuitem", { name: "Rename" }).setAttribute("data-check", "rename");

    /* Resting on it opens it, and focus follows the pointer. */
    await real.commands.realHover('[data-check="move-to"]');
    await waitFor(() => expect(moveTo).toHaveAttribute("aria-expanded", "true"));
    await expect(focused()).toBe("Move to");
    /* Its items aren't its parent's: Down, with it open, goes on to Delete,
       not into it, and Up comes back. */
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(focused()).toBe("Delete"));
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(focused()).toBe("Move to"));
    /* The keyboard can still go in, though the pointer opened it… */
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(focused()).toBe("Agates"));
    /* …and back out, to its item. */
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(focused()).toBe("Move to"));
    await real.commands.realHover('[data-check="move-to"]', { fx: 0.3 });
    await waitFor(() => expect(moveTo).toHaveAttribute("aria-expanded", "true"));
    /* A click on it now, opened by resting there, leaves it open. */
    await real.commands.realClick('[data-check="move-to"]');
    await new Promise((r) => setTimeout(r, 150));
    await expect(moveTo).toHaveAttribute("aria-expanded", "true");

    /* Into the submenu, it stays open. */
    const sub = document.getElementById(moveTo.getAttribute("aria-controls")!)!;
    within(sub).getByRole("menuitem", { name: "Agates" }).setAttribute("data-check", "agates");
    await real.commands.realHover('[data-check="agates"]');
    await new Promise((r) => setTimeout(r, 250));
    await expect(moveTo).toHaveAttribute("aria-expanded", "true");
    await expect(focused()).toBe("Agates");

    /* The twin: resting on another item of the parent closes it. */
    await real.commands.realHover('[data-check="rename"]');
    await waitFor(() => expect(moveTo).toHaveAttribute("aria-expanded", "false"));

    /* A click on a submenu's item chooses it and closes the whole menu. */
    await real.commands.realHover('[data-check="move-to"]');
    await waitFor(() => expect(moveTo).toHaveAttribute("aria-expanded", "true"));
    const agates = within(document.getElementById(moveTo.getAttribute("aria-controls")!)!).getByRole("menuitem", { name: "Agates" });
    agates.setAttribute("data-check", "agates");
    await real.commands.realClick('[data-check="agates"]');
    await closed(trigger);
    await expect(pointerChosen.mock.calls).toEqual([["Agates"]]);
  },
};

export const ASubmenuByTouch: Story = {
  render: () => <MoveMenu />,
  play: async ({ canvasElement }) => {
    const trigger = button(canvasElement, "Move");
    trigger.click();
    const root = await opened(trigger);
    const moveTo = within(root).getByRole("menuitem", { name: "Move to" });
    const tap = (pointerType: string) => {
      moveTo.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType }));
      moveTo.click();
    };
    /* A tap opens it, and with no pointer resting on it to close it, a second
       tap does. */
    tap("touch");
    await waitFor(() => expect(moveTo).toHaveAttribute("aria-expanded", "true"));
    tap("touch");
    await waitFor(() => expect(moveTo).toHaveAttribute("aria-expanded", "false"));
    /* The twin: a second mouse click leaves it open. */
    tap("mouse");
    await waitFor(() => expect(moveTo).toHaveAttribute("aria-expanded", "true"));
    tap("mouse");
    await new Promise((r) => setTimeout(r, 150));
    await expect(moveTo).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}{Escape}");
    await closed(trigger);
  },
};

/* ── Leaving ──────────────────────────────────────────────────────────────── */

export const APressOutsideClosesIt: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ display: "flex", gap: 280, alignItems: "flex-start" }}>
      <Actions />
      <p data-check="outside" style={{ margin: 0, padding: 8 }}>
        Somewhere else on the page
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const trigger = button(canvasElement, "Actions");
    trigger.setAttribute("data-check", "actions");
    await real.commands.realClick('[data-check="actions"]');
    await opened(trigger);
    await real.commands.realClick('[data-check="outside"]');
    await closed(trigger);
    /* A press on nothing focusable leaves focus nowhere; it goes back to the button. */
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    /* The twin: a press on the button itself closes it as a toggle, not as outside. */
    await real.commands.realClick('[data-check="actions"]');
    await opened(trigger);
    await real.commands.realClick('[data-check="actions"]');
    await closed(trigger);
  },
};

export const APressFurtherDownLeavesThePageWhereItIs: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ height: 2400 }}>
      <Actions />
      <div style={{ marginTop: 1500, display: "flex", gap: 24, alignItems: "center" }}>
        <button type="button" data-check="far-button">
          Further down
        </button>
        <span data-check="far-text">Plain words</span>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const trigger = button(canvasElement, "Actions");
    const openThenScroll = async () => {
      window.scrollTo(0, 0);
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      await opened(trigger);
      /* The twin of each press below: the page did scroll, with the menu open. */
      window.scrollTo(0, 1300);
      await waitFor(() => expect(Math.round(window.scrollY)).toBe(1300));
    };
    const settle = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      /* Whether a press on a button focuses it, in this browser: Chromium's
         does on every platform; WebKit's doesn't on macOS, like Safari, and
         does on Linux, where CI runs. Pressed with no menu open. */
      const far = canvasElement.querySelector<HTMLElement>('[data-check="far-button"]')!;
      window.scrollTo(0, 1300);
      await waitFor(() => expect(Math.round(window.scrollY)).toBe(1300));
      (document.activeElement as HTMLElement | null)?.blur();
      await real.commands.realClick('[data-check="far-button"]');
      const pressFocuses = document.activeElement === far;
      /* Chromium has one answer; pinned, so the branch below can't hide a
         Chromium that stopped focusing a pressed button. */
      if (/Chrome/.test(navigator.userAgent)) await expect(pressFocuses).toBe(true);
      /* A press on a button down there: the menu closes, the page stays put,
         and focus is on what was pressed, or, in a browser where a press
         focuses no button, back on the menu's button. */
      await openThenScroll();
      await real.commands.realClick('[data-check="far-button"]');
      await closed(trigger);
      await settle();
      await expect([Math.round(window.scrollY), document.activeElement === (pressFocuses ? far : trigger)]).toEqual([1300, true]);
      /* A press on plain words, which takes focus nowhere: focus goes back to
         the button, still without moving the page. */
      await openThenScroll();
      await real.commands.realClick('[data-check="far-text"]');
      await closed(trigger);
      await settle();
      await expect([Math.round(window.scrollY), document.activeElement === trigger]).toEqual([1300, true]);
      /* Escape is different: focus goes back to the button, and a keyboard
         user has to see where it went, so the page comes back to it. */
      await openThenScroll();
      await userEvent.keyboard("{Escape}");
      await closed(trigger);
      await settle();
      const box = trigger.getBoundingClientRect();
      await expect([document.activeElement === trigger, box.top >= 0 && box.bottom <= window.innerHeight]).toEqual([true, true]);
    } finally {
      window.scrollTo(0, 0);
    }
  },
};

function RenameFromAMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Rock
        </MenuButton>
        <MenuItems>
          <MenuItem onSelect={() => setOpen(true)}>Rename…</MenuItem>
        </MenuItems>
      </Menu>
      <Dialog isOpen={open} onClose={() => setOpen(false)} title="Rename">
        <input aria-label="Name" defaultValue="Banded agate" />
      </Dialog>
    </>
  );
}

export const AnItemThatOpensADialog: Story = {
  render: () => <RenameFromAMenu />,
  play: async ({ canvasElement }) => {
    const trigger = button(canvasElement, "Rock");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await opened(trigger);
    await userEvent.keyboard("{Enter}");
    await closed(trigger);
    /* Focus goes into the dialog, not left on the button under it… */
    const dialog = await within(document.body).findByRole("dialog", { name: "Rename" });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    /* …and comes back to the button when the dialog closes. */
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/* ── Placement ────────────────────────────────────────────────────────────── */

const Edge = ({ corner }: { corner: "top-left" | "bottom-right" | "middle" }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      justifyContent: corner === "top-left" ? "flex-start" : corner === "middle" ? "center" : "flex-end",
      alignItems: corner === "top-left" ? "flex-start" : corner === "middle" ? "center" : "flex-end",
      padding: 8,
      pointerEvents: "none",
    }}
  >
    <div style={{ pointerEvents: "auto" }}>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          {corner}
        </MenuButton>
        <MenuItems>
          <MenuItem>A longer item, so the panel is wider than the button and than half a phone</MenuItem>
          <MenuItem>Second</MenuItem>
          <MenuItem>Third</MenuItem>
        </MenuItems>
      </Menu>
    </div>
  </div>
);

export const ItStaysOnScreen: Story = {
  tags: ["real-input"],
  render: () => (
    <>
      <Edge corner="top-left" />
      <Edge corner="bottom-right" />
      <Edge corner="middle" />
    </>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const place = async (name: string) => {
      const trigger = button(canvasElement, name);
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      const panel = await opened(trigger);
      /* Read once it has stopped moving. */
      await waitFor(() => expect(getComputedStyle(panel).opacity).toBe("1"));
      const p = panel.getBoundingClientRect();
      const t = trigger.getBoundingClientRect();
      await userEvent.keyboard("{Escape}");
      await closed(trigger);
      return { below: p.top >= t.bottom, above: p.bottom <= t.top, inside: p.left >= 0 && p.right <= innerWidth && p.top >= 0 && p.bottom <= innerHeight };
    };
    /* A panel whose width followed the room where it landed resized as it
       moved, and the browser reported a ResizeObserver loop on every open. */
    const loops: string[] = [];
    const onError = (event: ErrorEvent) => {
      if (/ResizeObserver loop/.test(event.message)) loops.push(event.message);
    };
    window.addEventListener("error", onError);
    try {
      for (const [width, height] of [
        [900, 600],
        [320, 640],
      ]) {
        await real.page.viewport(width, height);
        await waitFor(() => expect(innerWidth).toBe(width));
        /* At the top left it opens below; the twin, at the bottom right, it
           flips above and shifts in. Both whole on screen. */
        await expect([width, await place("top-left")]).toEqual([width, { below: true, above: false, inside: true }]);
        await expect([width, await place("bottom-right")]).toEqual([width, { below: false, above: true, inside: true }]);
        /* In the middle of a phone, a panel wider than half the screen
           overflows whichever edge it lines up with; it's shifted in. */
        if (width === 320) await expect(await place("middle")).toEqual({ below: true, above: false, inside: true });
      }
      await expect(loops, "ResizeObserver loops while opening").toEqual([]);
    } finally {
      window.removeEventListener("error", onError);
      await real.page.viewport(1280, 720);
    }
  },
};

export const ATallMenuScrolls: Story = {
  tags: ["real-input"],
  render: () => (
    <Menu>
      <MenuButton variant="outline" colorScheme="neutral">
        States
      </MenuButton>
      <MenuItems>
        {Array.from({ length: 30 }, (_, i) => (
          <MenuItem key={i}>{`State ${i + 1}`}</MenuItem>
        ))}
      </MenuItems>
    </Menu>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    try {
      await real.page.viewport(400, 500);
      await waitFor(() => expect(innerHeight).toBe(500));
      const trigger = button(canvasElement, "States");
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      const panel = await opened(trigger);
      await waitFor(() => expect(getComputedStyle(panel).opacity).toBe("1"));
      const box = panel.getBoundingClientRect();
      /* Capped at the room below, and scrolling, with Roster's scrollbar. */
      await expect(box.bottom).toBeLessThanOrEqual(innerHeight - 8 + 0.5);
      await expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
      await expect([getComputedStyle(panel).overflowY, getComputedStyle(panel).scrollbarWidth]).toEqual(["auto", "thin"]);
      /* The affordance: a shadow along the edge with more to scroll to. At the
         top that's the bottom edge only; scrolled to the end, the top only. */
      const edges = () => [panel.hasAttribute("data-more-above"), panel.hasAttribute("data-more-below"), getComputedStyle(panel).backgroundImage.match(/gradient/g)?.length ?? 0];
      await expect(edges()).toEqual([false, true, 1]);
      /* End reaches the last item by scrolling the panel to it. */
      await userEvent.keyboard("{End}");
      await waitFor(() => expect(focused()).toBe("State 30"));
      const last = (document.activeElement as HTMLElement).getBoundingClientRect();
      await expect(last.bottom).toBeLessThanOrEqual(panel.getBoundingClientRect().bottom + 0.5);
      await waitFor(() => expect(edges()).toEqual([true, false, 1]));
      await userEvent.keyboard("{Escape}");
      await closed(trigger);
      /* Opened with Up, the last item is in view too, once the panel has its
         height. A fresh panel: reopened while this one is still leaving, the
         menu would keep it, already capped and scrolled. */
      await waitFor(() => expect(panel.isConnected).toBe(false));
      await userEvent.keyboard("{ArrowUp}");
      const fromUp = await opened(trigger);
      await waitFor(() => expect(focused()).toBe("State 30"));
      await waitFor(() => {
        const item = (document.activeElement as HTMLElement).getBoundingClientRect();
        const box = fromUp.getBoundingClientRect();
        expect([item.top >= box.top - 0.5, item.bottom <= box.bottom + 0.5]).toEqual([true, true]);
      });
      await userEvent.keyboard("{Escape}");
      await closed(trigger);
      /* `--anchor-max-height` caps it shorter, as on the other popups. The
         twin is the uncapped panel above, which ran to the room there was. */
      await expect(box.height).toBeGreaterThan(300);
      document.documentElement.style.setProperty("--anchor-max-height", "160px");
      try {
        trigger.focus();
        await userEvent.keyboard("{Enter}");
        const capped = await opened(trigger);
        await waitFor(() => expect(getComputedStyle(capped).opacity).toBe("1"));
        await expect(capped.getBoundingClientRect().height).toBeLessThanOrEqual(160);
        await userEvent.keyboard("{Escape}");
        await closed(trigger);
      } finally {
        document.documentElement.style.removeProperty("--anchor-max-height");
      }
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};

export const APointerAtRestDoesNotSteer: Story = {
  tags: ["real-input"],
  render: () => (
    <Menu>
      <MenuButton variant="outline" colorScheme="neutral">
        Places
      </MenuButton>
      <MenuItems>
        {Array.from({ length: 30 }, (_, i) => (
          <MenuItem key={i}>{`Place ${i + 1}`}</MenuItem>
        ))}
      </MenuItems>
    </Menu>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const trigger = button(canvasElement, "Places");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const panel = await opened(trigger);
    await settled(panel);
    /* The pointer comes to rest on the third item: a real move, so focus
       follows it. */
    within(panel).getByRole("menuitem", { name: "Place 3" }).setAttribute("data-check", "place-3");
    await real.commands.realHover('[data-check="place-3"]');
    await waitFor(() => expect(focused()).toBe("Place 3"));
    /* End scrolls the panel under the resting pointer. WebKit then sends a
       pointermove at the same spot, over whichever item has scrolled under
       it; Chromium sends none. The pointer hasn't moved, so focus stays on
       the last item. The moves heard are kept in the message. */
    const moves: number[][] = [];
    const onMove = (event: PointerEvent) => moves.push([event.clientX, event.clientY]);
    window.addEventListener("pointermove", onMove, true);
    try {
      await userEvent.keyboard("{End}");
      await new Promise((r) => setTimeout(r, 500));
      await expect(focused(), `pointermoves after the scroll: ${JSON.stringify(moves)}`).toBe("Place 30");
    } finally {
      window.removeEventListener("pointermove", onMove, true);
    }
    /* The twin: a real move onto an item takes focus there. */
    within(panel).getByRole("menuitem", { name: "Place 28" }).setAttribute("data-check", "place-28");
    await real.commands.realHover('[data-check="place-28"]');
    await waitFor(() => expect(focused()).toBe("Place 28"));
    await userEvent.keyboard("{Escape}");
    await closed(trigger);
  },
};

function WideMenuWithASubmenu() {
  return (
    <div style={{ position: "fixed", top: 8, left: 8 }}>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Wide
        </MenuButton>
        <MenuItems>
          <MenuItem>An item long enough to make the panel wide</MenuItem>
          <MenuSubmenu label="More">
            <MenuItem>Another long item in the submenu</MenuItem>
          </MenuSubmenu>
        </MenuItems>
      </Menu>
    </div>
  );
}

export const ASubmenuStaysOnScreen: Story = {
  tags: ["real-input"],
  render: () => <WideMenuWithASubmenu />,
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const place = async () => {
      const trigger = button(canvasElement, "Wide");
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      const root = await opened(trigger);
      await userEvent.keyboard("{ArrowDown}{ArrowRight}");
      await waitFor(() => expect(focused()).toBe("Another long item in the submenu"));
      const item = within(root).getByRole("menuitem", { name: "More" });
      const sub = document.getElementById(item.getAttribute("aria-controls")!)!;
      await waitFor(() => expect(getComputedStyle(sub).opacity).toBe("1"));
      const r = root.getBoundingClientRect();
      const b = sub.getBoundingClientRect();
      await userEvent.keyboard("{Escape}{Escape}");
      await closed(trigger);
      return { beside: b.left >= r.right - 1, inside: b.left >= 0 && b.right <= innerWidth };
    };
    try {
      /* With room, beside its parent; the twin, on a phone, there's none on
         either side, so it's moved onto the screen over its parent. */
      await real.page.viewport(900, 600);
      await waitFor(() => expect(innerWidth).toBe(900));
      await expect(await place()).toEqual({ beside: true, inside: true });
      await real.page.viewport(320, 640);
      await waitFor(() => expect(innerWidth).toBe(320));
      await expect(await place()).toEqual({ beside: false, inside: true });
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};

export const ItOpensWhereItLands: Story = {
  render: () => (
    <div style={{ paddingLeft: 240, paddingTop: 120 }}>
      <Actions />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = button(canvasElement, "Actions");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const panel = await opened(trigger);
    /* Only its opacity and size change as it opens, never what places it. */
    await expect(getComputedStyle(panel).transitionProperty).toBe("opacity, scale");
    await settled(panel);
    const landed = panel.getBoundingClientRect();
    /* The entrance's first frame, held still. At 95% it grows from its top
       left, so that corner is already where it ends. Placed by a transform,
       the 95% would scale the placement too, and start it short of the
       button. The width says the 95% took; the twin, the corner of the screen
       a transition on its place would fly it in from, is far off. */
    panel.style.transition = "none";
    panel.style.scale = "0.95";
    const start = panel.getBoundingClientRect();
    panel.style.removeProperty("scale");
    panel.style.removeProperty("transition");
    await expect([Math.round(start.left - landed.left), Math.round(start.top - landed.top), Math.round(start.width)]).toEqual([0, 0, Math.round(landed.width * 0.95)]);
    await expect(start.left).toBeGreaterThan(200);
    await userEvent.keyboard("{Escape}");
    await closed(trigger);
  },
};

export const ItIsNotClippedByWhatItSitsIn: Story = {
  render: () => (
    <div style={{ minHeight: 300 }}>
      {/* A card that clips what spills out of it, with a transform, which also
          holds anything fixed inside it. */}
      <div style={{ overflow: "hidden", transform: "translateZ(0)", height: 60, width: 320, padding: 8, border: "1px solid rgb(0 0 0 / 0.12)", borderRadius: 8 }}>
        <Actions />
        <div data-check="spill" style={{ height: 100, width: 40, marginLeft: 260 }} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const at = (r: DOMRect) => document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    /* The twin first: the card does clip. What spills out of it below can't
       be pressed there. */
    const spill = canvasElement.querySelector<HTMLElement>('[data-check="spill"]')!;
    const spillBox = spill.getBoundingClientRect();
    await expect([spillBox.bottom > 100, at(new DOMRect(spillBox.left, 90, spillBox.width, 20)) === spill]).toEqual([true, false]);
    /* The panel opens outside it, so its last item, well below the card, is
       what a press there reaches. */
    const trigger = button(canvasElement, "Actions");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const panel = await opened(trigger);
    await settled(panel);
    const last = within(panel).getByRole("menuitem", { name: "Delete" });
    await expect([last.getBoundingClientRect().top > 100, at(last.getBoundingClientRect())?.closest("[data-menu-item]") === last]).toEqual([true, true]);
    await userEvent.keyboard("{Escape}");
    await closed(trigger);
  },
};

const insideChosen = fn();
const insideDismissed = fn();

function InADialog() {
  return (
    <Dialog isOpen onClose={() => insideDismissed("dialog")} title="Edit rock">
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Rock actions
        </MenuButton>
        <MenuItems>
          <MenuItem onSelect={() => insideChosen("dialog")}>Rename</MenuItem>
        </MenuItems>
      </Menu>
    </Dialog>
  );
}

function InASheet() {
  return (
    <Sheet isOpen onClose={() => insideDismissed("sheet")} title="Edit rock">
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Rock actions
        </MenuButton>
        <MenuItems>
          <MenuItem onSelect={() => insideChosen("sheet")}>Rename</MenuItem>
        </MenuItems>
      </Menu>
    </Sheet>
  );
}

const choosesInside = async (surface: string) => {
  insideChosen.mockClear();
  insideDismissed.mockClear();
  const host = await within(document.body).findByRole("dialog", { name: "Edit rock" });
  /* Once it has settled: both move focus to their close button as they open,
     a frame or so in, which would close a menu opened sooner. */
  await waitFor(() => expect([host.contains(document.activeElement), host.getAnimations({ subtree: true }).length]).toEqual([true, 0]));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const trigger = within(host).getByRole("button", { name: "Rock actions" });
  trigger.focus();
  await userEvent.keyboard("{Enter}");
  const panel = await opened(trigger);
  /* Not made inert behind the dialog it opened in, and focus is in it. */
  await expect([panel.closest("[inert]"), panel.closest("[aria-hidden='true']")]).toEqual([null, null]);
  await waitFor(() => expect(focused()).toBe("Rename"));
  await userEvent.keyboard("{Enter}");
  await closed(trigger);
  /* Chosen, and the dialog is still open. */
  await expect(insideChosen.mock.calls).toEqual([[surface]]);
  await expect(within(document.body).getByRole("dialog", { name: "Edit rock" })).toBeTruthy();
  /* The twin: a press on the menu's panel isn't a press outside the dialog. */
  trigger.click();
  const again = await opened(trigger);
  within(again).getByRole("menuitem", { name: "Rename" }).click();
  await closed(trigger);
  await expect(insideChosen.mock.calls).toEqual([[surface], [surface]]);
  await expect(within(document.body).getByRole("dialog", { name: "Edit rock" })).toBeTruthy();
  /* Escape closes the menu and not the layer it opened in. The twin: a
     second Escape, from the button, reaches the layer. */
  trigger.focus();
  await userEvent.keyboard("{Enter}");
  await opened(trigger);
  await userEvent.keyboard("{Escape}");
  await closed(trigger);
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  await expect(insideDismissed.mock.calls).toEqual([]);
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(insideDismissed.mock.calls).toEqual([[surface]]));
};

export const InsideADialog: Story = {
  render: () => <InADialog />,
  play: () => choosesInside("dialog"),
};

export const InsideASheet: Story = {
  render: () => <InASheet />,
  play: () => choosesInside("sheet"),
};

export const InsideNavbarsMenuPanel: Story = {
  tags: ["real-input"],
  render: () => (
    <Navbar
      logoSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E"
      brandName="Tidewater"
      position="static"
      items={[{ label: "Charts", path: "/charts" }]}
      actions={
        <Menu>
          <MenuButton variant="outline" colorScheme="neutral">
            Account
          </MenuButton>
          <MenuItems>
            <MenuItem onSelect={() => insideChosen("popover")}>Sign out</MenuItem>
          </MenuItems>
        </Menu>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    insideChosen.mockClear();
    try {
      await real.page.viewport(414, 800);
      await waitFor(() => expect(innerWidth).toBe(414));
      const hamburger = within(canvasElement).getByRole("button", { name: "Open main menu" });
      hamburger.setAttribute("data-check", "hamburger");
      await real.commands.realClick('[data-check="hamburger"]');
      await waitFor(() => expect(hamburger).toHaveAttribute("aria-expanded", "true"));
      const panelButtons = await waitFor(() => {
        const found = [...document.querySelectorAll<HTMLButtonElement>("[data-roster-mobile-panel] button[aria-haspopup='menu']")];
        expect(found).toHaveLength(1);
        return found;
      });
      panelButtons[0].setAttribute("data-check", "account");
      await real.commands.realClick('[data-check="account"]');
      const menu = await opened(panelButtons[0]);
      /* The Navbar's panel stays open under the menu, and the choice lands. */
      await expect(hamburger).toHaveAttribute("aria-expanded", "true");
      within(menu).getByRole("menuitem", { name: "Sign out" }).setAttribute("data-check", "sign-out");
      await real.commands.realClick('[data-check="sign-out"]');
      await expect(insideChosen.mock.calls).toEqual([["popover"]]);
      await expect(hamburger).toHaveAttribute("aria-expanded", "true");
      /* The twin: focus leaving for the bar behind the panel closes it. */
      canvasElement.querySelector<HTMLAnchorElement>('nav a[href="/"]')!.focus();
      await waitFor(() => expect(hamburger).toHaveAttribute("aria-expanded", "false"));
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};

function MoveMenuIn({ dir }: { dir: "ltr" | "rtl" }) {
  return (
    <div dir={dir} style={{ display: "flex", justifyContent: "center", padding: 16 }}>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          {dir}
        </MenuButton>
        <MenuItems>
          <MenuItem>Rename</MenuItem>
          <MenuSubmenu label="Move to">
            <MenuItem>Agates</MenuItem>
          </MenuSubmenu>
        </MenuItems>
      </Menu>
    </div>
  );
}

export const RightToLeft: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 120 }}>
      <MoveMenuIn dir="ltr" />
      <MoveMenuIn dir="rtl" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const measure = async (dir: "ltr" | "rtl") => {
      const trigger = button(canvasElement, dir);
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      const root = await opened(trigger);
      await waitFor(() => expect(getComputedStyle(root).opacity).toBe("1"));
      const t = trigger.getBoundingClientRect();
      const r = root.getBoundingClientRect();
      /* The arrow away from the parent is Left in a right-to-left menu. */
      await userEvent.keyboard(`{ArrowDown}{${dir === "rtl" ? "ArrowLeft" : "ArrowRight"}}`);
      await waitFor(() => expect(focused()).toBe("Agates"));
      const item = within(root).getByRole("menuitem", { name: "Move to" });
      const sub = document.getElementById(item.getAttribute("aria-controls")!)!;
      await waitFor(() => expect(getComputedStyle(sub).opacity).toBe("1"));
      const b = sub.getBoundingClientRect();
      const result = {
        direction: getComputedStyle(root).direction,
        startEdge: Math.abs(Math.round(dir === "rtl" ? r.right - t.right : r.left - t.left)),
        opensAway: dir === "rtl" ? b.right <= r.left + 1 : b.left >= r.right - 1,
      };
      await userEvent.keyboard("{Escape}{Escape}");
      await closed(trigger);
      return result;
    };
    /* In a right-to-left page it lines up with the button's right edge, reads
       right to left, and its submenu opens leftward; the twin, left to right,
       is the mirror. */
    await expect(await measure("rtl")).toEqual({ direction: "rtl", startEdge: 0, opensAway: true });
    await expect(await measure("ltr")).toEqual({ direction: "ltr", startEdge: 0, opensAway: true });
    /* A left-to-right menu on a right-to-left page stays left to right: its
       panel is drawn at the end of the page, and takes its button's direction,
       not the page's. */
    document.documentElement.dir = "rtl";
    try {
      await expect(await measure("ltr")).toEqual({ direction: "ltr", startEdge: 0, opensAway: true });
    } finally {
      document.documentElement.removeAttribute("dir");
    }
  },
};

export const ForcedColorsOutlineFocusOnly: Story = {
  tags: ["real-input"],
  render: () => <Actions />,
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    try {
      await real.commands.realEmulateMedia({ forcedColors: "active" });
      await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
      const trigger = button(canvasElement, "Actions");
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      const panel = await opened(trigger);
      await waitFor(() => expect(focused()).toBe("Edit"));
      /* An outline whose style is none draws nothing, whatever its width
         reads: WebKit reports the default 3px there, Chromium 0px. */
      const outline = (name: string) => {
        const style = getComputedStyle(within(panel).getByRole("menuitem", { name }));
        return [style.outlineStyle, style.outlineStyle === "none" ? "0px" : style.outlineWidth];
      };
      /* Fills are dropped in forced colors (in Chromium; WebKit's emulation
         turns on only the media query): focus is an outline, on the focused
         item only. The twin is the item beside it, with none. */
      await expect([outline("Edit"), outline("Duplicate")]).toEqual([
        ["solid", "2px"],
        ["none", "0px"],
      ]);
      await userEvent.keyboard("{Escape}");
      await closed(trigger);
    } finally {
      await real.commands.realEmulateMedia({ forcedColors: null });
    }
  },
};

export const ItsBackgroundIsYours: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Painted
        </MenuButton>
        <MenuItems className="rst:bg-gray-100">
          <MenuItem>Item</MenuItem>
        </MenuItems>
      </Menu>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Plain
        </MenuButton>
        <MenuItems>
          <MenuItem>Item</MenuItem>
        </MenuItems>
      </Menu>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fill = async (name: string) => {
      const trigger = button(canvasElement, name);
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      const panel = await opened(trigger);
      const color = getComputedStyle(panel).backgroundColor;
      await userEvent.keyboard("{Escape}");
      await closed(trigger);
      return color;
    };
    /* A background class on the panel takes, with the scroll shadows in the
       panel's images; the twin, unpainted, is the popover's white. */
    await expect([await fill("Painted"), await fill("Plain")]).toEqual(["rgb(245, 245, 244)", "rgb(255, 255, 255)"]);
  },
};

export const ItsEdgesFollowTheBorderWidth: Story = {
  render: () => <Actions />,
  play: async ({ canvasElement }) => {
    const trigger = button(canvasElement, "Actions");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const panel = await opened(trigger);
    await settled(panel);
    /* The rule's height, and the ring: the one spread-only shadow that isn't 0. */
    const edges = () => [
      getComputedStyle(panel.querySelector('[role="separator"]')!).height,
      ...[...getComputedStyle(panel).boxShadow.matchAll(/0px 0px 0px (\d+px)/g)].map((m) => m[1]).filter((w) => w !== "0px"),
    ];
    /* The twin: unset, the rule and the ring are 1px. */
    await expect(edges()).toEqual(["1px", "1px"]);
    document.documentElement.style.setProperty("--roster-border-width", "3px");
    try {
      await expect(edges()).toEqual(["3px", "3px"]);
    } finally {
      document.documentElement.style.removeProperty("--roster-border-width");
    }
    await userEvent.keyboard("{Escape}");
    await closed(trigger);
  },
};

/* ── Targets ──────────────────────────────────────────────────────────────── */

export const EveryTargetIs44: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral" size="sm">
          Small
        </MenuButton>
        <MenuItems>
          <MenuItem>One</MenuItem>
          <MenuCheckboxItem checked onCheckedChange={() => {}}>
            Two
          </MenuCheckboxItem>
          <MenuSubmenu label="Three">
            <MenuItem>Four</MenuItem>
          </MenuSubmenu>
          <MenuItem href="#five">Five</MenuItem>
        </MenuItems>
      </Menu>
      <Menu>
        <MenuButton variant="ghost" colorScheme="neutral" size="icon" aria-label="More">
          …
        </MenuButton>
        <MenuItems>
          <MenuItem>Six</MenuItem>
        </MenuItems>
      </Menu>
      {/* The twin: a row as a menu item is usually drawn, 0.5rem above and below 14px text. */}
      <div data-check="twin-row" style={{ padding: "8px 16px", fontSize: 14, lineHeight: "20px" }}>
        Usual row
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const size = (el: Element) => {
      const r = el.getBoundingClientRect();
      return [r.width >= 44, r.height >= 44];
    };
    const small = button(canvasElement, "Small");
    const more = button(canvasElement, "More");
    await expect([size(small), size(more)]).toEqual([
      [true, true],
      [true, true],
    ]);
    small.focus();
    await userEvent.keyboard("{Enter}");
    const panel = await opened(small);
    const items = [...panel.querySelectorAll("[data-menu-item]")];
    await expect(items).toHaveLength(4);
    /* Measured once the entrance has finished growing the panel. */
    await settled(panel);
    await expect(items.map(size)).toEqual(items.map(() => [true, true]));
    await userEvent.keyboard("{Escape}");
    await closed(small);
    await expect(canvasElement.querySelector("[data-check='twin-row']")!.getBoundingClientRect().height).toBe(36);
  },
};

/* ── Surfaces ─────────────────────────────────────────────────────────────── */

export const ItTakesTheDarkScopeItOpensFrom: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      <div className="dark" style={{ padding: 16, background: "#1c1917" }}>
        <Menu>
          <MenuButton variant="outline" colorScheme="neutral">
            Dark
          </MenuButton>
          <MenuItems>
            <MenuItem>Item</MenuItem>
          </MenuItems>
        </Menu>
      </div>
      <div style={{ padding: 16 }}>
        <Menu>
          <MenuButton variant="outline" colorScheme="neutral">
            Light
          </MenuButton>
          <MenuItems>
            <MenuItem>Item</MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fill = async (name: string) => {
      const trigger = button(canvasElement, name);
      trigger.focus();
      await userEvent.keyboard("{Enter}");
      const panel = await opened(trigger);
      const color = getComputedStyle(panel).backgroundColor;
      await userEvent.keyboard("{Escape}");
      await closed(trigger);
      return color;
    };
    /* Portaled to the end of the document, out of the `.dark` it opened from,
       and still dark: gray-800. The twin, outside it, is white. */
    await expect(await fill("Dark")).toBe("rgb(41, 37, 36)");
    await expect(await fill("Light")).toBe("rgb(255, 255, 255)");
  },
};

export const ReducedMotionDoesNotMove: Story = {
  tags: ["reduced-motion"],
  render: () => <Actions />,
  play: async ({ canvasElement }) => {
    const trigger = button(canvasElement, "Actions");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const panel = await opened(trigger);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Under reduced motion the panel neither fades nor grows; otherwise, the twin, it does both. */
    await expect(getComputedStyle(panel).transitionProperty === "none" || getComputedStyle(panel).transitionDuration === "0s").toBe(reduced);
    await userEvent.keyboard("{Escape}");
    await closed(trigger);
  },
};

/* ── What a screen reader is handed ───────────────────────────────────────── */

export const ItSaysWhatItIs: Story = {
  tags: ["ax-tree"],
  render: () => (
    <Menu open>
      <MenuButton variant="outline" colorScheme="neutral">
        Rock actions
      </MenuButton>
      <MenuItems>
        <MenuItem shortcut="⌘E" keyshortcuts="Meta+E" description="Its name and its notes">
          Edit
        </MenuItem>
        <MenuCheckboxItem checked onCheckedChange={() => {}}>
          Pinned
        </MenuCheckboxItem>
        <MenuGroup label="Visible to">
          <MenuRadioGroup value="friends" onValueChange={() => {}}>
            <MenuRadioItem value="friends">Friends</MenuRadioItem>
            <MenuRadioItem value="everyone">Everyone</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuSubmenu label="Move to">
          <MenuItem>Agates</MenuItem>
        </MenuSubmenu>
        <MenuSeparator />
        <MenuItem disabled destructive>
          Delete
        </MenuItem>
      </MenuItems>
    </Menu>
  ),
  play: async ({ canvasElement }) => {
    const real = realInputOrSkip();
    if (!real) return;
    const trigger = button(canvasElement, "Rock actions");
    const panel = await opened(trigger);
    const items = [...panel.querySelectorAll<HTMLElement>("[data-menu-item]")];
    const probes = [trigger, panel, ...items, panel.querySelector('[role="group"]')!, panel.querySelector('[role="separator"]')!];
    const ids = probes.map((el, i) => {
      el.setAttribute("data-ax-probe", `menu-${i}`);
      return `[data-ax-probe="menu-${i}"]`;
    });
    const states = await real.commands.axStates(ids);
    probes.forEach((el) => el.removeAttribute("data-ax-probe"));
    await expect(states.map((s) => [s.role, s.name, s.description, s.checked, s.expanded, s.hasPopup, s.disabled])).toEqual([
      ["button", "Rock actions", "", null, true, "menu", false],
      ["menu", "Rock actions", "", null, null, null, false],
      /* The shortcut is shown, not read with the name; the description is read as one. */
      ["menuitem", "Edit", "Its name and its notes", null, null, null, false],
      ["menuitemcheckbox", "Pinned", "", "true", null, null, false],
      ["menuitemradio", "Friends", "", "true", null, null, false],
      ["menuitemradio", "Everyone", "", "false", null, null, false],
      ["menuitem", "Move to", "", null, false, "menu", false],
      /* The twin of every live item: disabled, and said so. */
      ["menuitem", "Delete", "", null, null, null, true],
      ["group", "Visible to", "", null, null, null, false],
      ["separator", "", "", null, null, null, false],
    ]);
  },
};
