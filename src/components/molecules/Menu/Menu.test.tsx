import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
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
  type MenuLinkProps,
} from "./Menu";
import { nextByTypeahead } from "./menu-typeahead";

/**
 * Menu's structure and wiring, in jsdom. Focus movement, placement and the
 * pointer are checked in Chromium (Menu.checks.stories.tsx).
 */

describe("nextByTypeahead", () => {
  const labels = ["Edit", "Duplicate", "Archive", "Delete", " delta "];

  it("finds the next item starting with a letter, after the current one", () => {
    expect(nextByTypeahead(labels, 0, "d")).toBe(1);
    expect(nextByTypeahead(labels, 1, "d")).toBe(3);
  });

  it("cycles on the same letter typed again, and wraps", () => {
    expect(nextByTypeahead(labels, 3, "dd")).toBe(4);
    expect(nextByTypeahead(labels, 4, "ddd")).toBe(1);
  });

  it("matches more than one letter from the current item, ignoring case and spaces", () => {
    expect(nextByTypeahead(labels, 3, "DEL")).toBe(3);
    expect(nextByTypeahead(labels, 3, "delt")).toBe(4);
  });

  it("starts from the top when nothing is focused, and returns -1 when nothing matches", () => {
    expect(nextByTypeahead(labels, -1, "e")).toBe(0);
    expect(nextByTypeahead(labels, 0, "z")).toBe(-1);
    expect(nextByTypeahead([], 0, "e")).toBe(-1);
  });
});

function Actions(props: { onEdit?: () => void; onArchive?: () => void; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  return (
    <Menu open={props.open} onOpenChange={props.onOpenChange}>
      <MenuButton>Actions</MenuButton>
      <MenuItems>
        <MenuItem onSelect={props.onEdit} shortcut="⌘E" keyshortcuts="Meta+E" description="Its name and notes" badge={<span>3</span>}>
          Edit
        </MenuItem>
        <MenuItem disabled onSelect={props.onArchive}>
          Archive
        </MenuItem>
        <MenuSeparator />
        <MenuItem destructive>Delete</MenuItem>
      </MenuItems>
    </Menu>
  );
}

describe("Menu", () => {
  it("wires the button to the menu it opens", async () => {
    render(<Actions />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("aria-controls");

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-controls", menu.id);
    expect(menu).toHaveAttribute("aria-labelledby", trigger.id);
  });

  it("gives each item its role, and keeps the shortcut out of its name", async () => {
    render(<Actions />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    const menu = screen.getByRole("menu");
    const edit = within(menu).getByRole("menuitem", { name: /Edit/ });
    expect(edit).toHaveAttribute("aria-keyshortcuts", "Meta+E");
    expect(edit.querySelector("[data-menu-shortcut]")).toHaveAttribute("aria-hidden", "true");
    expect(edit).toHaveAccessibleDescription("Its name and notes");
    expect(edit.querySelector("[data-menu-badge]")).toHaveTextContent("3");
    expect(within(menu).getByRole("menuitem", { name: "Archive" })).toHaveAttribute("aria-disabled", "true");
    expect(within(menu).getByRole("menuitem", { name: "Delete" })).toHaveAttribute("data-destructive");
    expect(within(menu).getAllByRole("separator")).toHaveLength(1);
    /* Items take focus from the menu, not from Tab. */
    expect(within(menu).getAllByRole("menuitem").map((i) => i.getAttribute("tabindex"))).toEqual(["-1", "-1", "-1"]);
  });

  it("chooses an item on a click, closes, and returns focus to the button", async () => {
    const onEdit = vi.fn();
    render(<Actions onEdit={onEdit} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: /Edit/ }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("doesn't choose a disabled item, and stays open", async () => {
    const onArchive = vi.fn();
    render(<Actions onArchive={onArchive} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Archive" }));
    expect(onArchive).not.toHaveBeenCalled();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("opens on the first item with Enter, and closes with Escape", async () => {
    const onOpenChange = vi.fn();
    render(<Actions onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByRole("menuitem", { name: /Edit/ })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it("can be controlled", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Actions open={false} onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    await userEvent.click(trigger);
    /* Asked to open, but the owner hasn't said yes. */
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    rerender(<Actions open onOpenChange={onOpenChange} />);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("lets the keyboard into a menu its owner holds open", async () => {
    render(<Actions open />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /Edit/ })).toHaveFocus();
    trigger.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
  });

  it("returns focus to the button when its owner closes it with focus inside", async () => {
    const { rerender } = render(<Actions open onOpenChange={() => {}} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    await waitFor(() => expect(screen.getByRole("menu")).toHaveFocus());
    rerender(<Actions open={false} onOpenChange={() => {}} />);
    expect(trigger).toHaveFocus();
  });

  it("keeps its keys from the components around it, and lets its clicks through to the page", async () => {
    /* A row with its own keys and click, as a list with an overflow menu has.
       The panel is portaled, and React would carry its events up to the row. */
    const rowKeys = vi.fn();
    const rowClicks = vi.fn();
    const pageClicks = vi.fn();
    const onEdit = vi.fn();
    document.addEventListener("click", pageClicks);
    try {
      render(
        <div onKeyDown={(event) => rowKeys(event.key)} onClick={() => rowClicks()}>
          <span>Banded agate</span>
          <Actions onEdit={onEdit} />
        </div>,
      );
      const trigger = screen.getByRole("button", { name: "Actions" });
      await userEvent.click(trigger);
      rowClicks.mockClear();
      pageClicks.mockClear();
      /* Keys on the items, Enter choosing one among them: none reach the row. */
      screen.getByRole("menu").focus();
      await userEvent.keyboard("{ArrowDown}{End}{Home}q{Enter}");
      expect([onEdit.mock.calls.length, rowKeys.mock.calls]).toEqual([1, []]);
      /* A combination is the app's: it goes on. The twin: a key on the row's
         own words reaches it too. */
      await userEvent.click(trigger);
      screen.getByRole("menu").focus();
      await userEvent.keyboard("{Meta>}k{/Meta}");
      await userEvent.keyboard("{Escape}");
      expect(rowKeys.mock.calls.flat()).toEqual(["Meta", "k"]);
      /* A click on an item reaches the page, where analytics listen. It also
         reaches the row through the portal, as React's events do: the row
         checks where the click landed. */
      await userEvent.click(trigger);
      pageClicks.mockClear();
      rowClicks.mockClear();
      await userEvent.click(screen.getByRole("menuitem", { name: /Edit/ }));
      expect([onEdit.mock.calls.length, pageClicks.mock.calls.length, rowClicks.mock.calls.length]).toEqual([2, 1, 1]);
    } finally {
      document.removeEventListener("click", pageClicks);
    }
  });

  it("never lets a space typed mid-search choose, follow a link or press an item", async () => {
    const onSelect = vi.fn();
    render(
      <Menu>
        <MenuButton>Go</MenuButton>
        <MenuItems>
          <MenuItem href="#settings" onSelect={() => onSelect("Settings")}>
            Settings
          </MenuItem>
          <MenuItem onSelect={() => onSelect("Sign out")}>Sign out</MenuItem>
        </MenuItems>
      </Menu>,
    );
    screen.getByRole("button", { name: "Go" }).focus();
    await userEvent.keyboard("{Enter}");
    /* On a link: "se " stays on Settings and follows nothing. */
    await userEvent.keyboard("se ");
    expect([onSelect.mock.calls, document.activeElement?.textContent]).toEqual([[], "Settings"]);
    /* A search that matches nothing: "si" reaches Sign out, "six " matches
       nothing, and the space still isn't a press. */
    await new Promise((resolve) => setTimeout(resolve, 600));
    await userEvent.keyboard("six ");
    expect([onSelect.mock.calls, document.activeElement?.textContent]).toEqual([[], "Sign out"]);
    /* The twin: once the search has lapsed, Space presses it. */
    await new Promise((resolve) => setTimeout(resolve, 600));
    await userEvent.keyboard(" ");
    expect(onSelect.mock.calls).toEqual([["Sign out"]]);
  });

  it("takes a space typed mid-search as part of the search, not a choice", async () => {
    const onSelect = vi.fn();
    render(
      <Menu>
        <MenuButton>File</MenuButton>
        <MenuItems>
          <MenuItem onSelect={() => onSelect("Open")}>Open</MenuItem>
          <MenuItem onSelect={() => onSelect("Save draft")}>Save draft</MenuItem>
          <MenuItem onSelect={() => onSelect("Save as copy")}>Save as copy</MenuItem>
          <MenuSubmenu label="Move to">
            <MenuItem>Archive</MenuItem>
          </MenuSubmenu>
          <MenuItem onSelect={() => onSelect("Move up")}>Move up</MenuItem>
        </MenuItems>
      </Menu>,
    );
    screen.getByRole("button", { name: "File" }).focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("save a");
    expect([onSelect.mock.calls, screen.getByRole("menuitem", { name: "Save as copy" }) === document.activeElement]).toEqual([[], true]);
    /* On a submenu's item too: the space doesn't open it. */
    await new Promise((resolve) => setTimeout(resolve, 600));
    await userEvent.keyboard("move u");
    const moveTo = screen.getByRole("menuitem", { name: "Move to" });
    expect([moveTo.getAttribute("aria-expanded"), screen.getByRole("menuitem", { name: "Move up" }) === document.activeElement]).toEqual(["false", true]);
    /* The twin: once the search has lapsed, Space chooses. */
    await new Promise((resolve) => setTimeout(resolve, 600));
    await userEvent.keyboard(" ");
    expect(onSelect.mock.calls).toEqual([["Move up"]]);
  });

  it("keeps a checkbox or radio item open on Space, and closes it on Enter", async () => {
    function View() {
      return (
        <Menu>
          <MenuButton>View</MenuButton>
          <MenuItems>
            <MenuCheckboxItem checked={false} onCheckedChange={onPinned}>
              Pinned
            </MenuCheckboxItem>
            <MenuRadioGroup label="Sort" value="new" onValueChange={onSort}>
              <MenuRadioItem value="new">Newest</MenuRadioItem>
              <MenuRadioItem value="old">Oldest</MenuRadioItem>
            </MenuRadioGroup>
          </MenuItems>
        </Menu>
      );
    }
    const onPinned = vi.fn();
    const onSort = vi.fn();
    render(<View />);
    const trigger = screen.getByRole("button", { name: "View" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const pinned = await screen.findByRole("menuitemcheckbox", { name: "Pinned" });
    expect(pinned).toHaveAttribute("aria-checked", "false");
    await waitFor(() => expect(pinned).toHaveFocus());
    await userEvent.keyboard(" ");
    expect(onPinned).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Sort" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitemradio").map((r) => r.getAttribute("aria-checked"))).toEqual(["true", "false"]);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onSort).toHaveBeenCalledWith("old");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the menu open after an item with closeOnSelect off", async () => {
    render(
      <Menu>
        <MenuButton>Theme</MenuButton>
        <MenuItems>
          <MenuCheckboxItem checked onCheckedChange={() => {}} closeOnSelect={false} indicator={<span data-testid="track" />}>
            Dark mode
          </MenuCheckboxItem>
        </MenuItems>
      </Menu>,
    );
    const trigger = screen.getByRole("button", { name: "Theme" });
    await userEvent.click(trigger);
    const row = screen.getByRole("menuitemcheckbox", { name: "Dark mode" });
    /* Its own indicator replaces the check mark. */
    expect(within(row).getByTestId("track")).toBeInTheDocument();
    expect(row.querySelector("[data-menu-check]")).toBeNull();
    await userEvent.click(row);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("renders a link item through linkComponent, with both href and to", async () => {
    const seen: MenuLinkProps[] = [];
    function RouterLink(props: MenuLinkProps) {
      seen.push(props);
      const { to, ...rest } = props;
      return <a {...rest} data-to={to} />;
    }
    render(
      <Menu linkComponent={RouterLink}>
        <MenuButton>Account</MenuButton>
        <MenuItems>
          <MenuItem href="/settings">Settings</MenuItem>
        </MenuItems>
      </Menu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Account" }));
    const link = screen.getByRole("menuitem", { name: "Settings" });
    expect([link.tagName, link.getAttribute("href"), link.getAttribute("data-to")]).toEqual(["A", "/settings", "/settings"]);
    expect(seen.at(-1)).toMatchObject({ href: "/settings", to: "/settings", role: "menuitem", tabIndex: -1 });
  });

  it("keeps Button's own props off a plain button", () => {
    render(
      <Menu>
        <MenuButton plain variant="ghost" colorScheme="neutral" size="icon" surface="dark" className="avatar" aria-label="Account">
          A
        </MenuButton>
        <MenuItems>
          <MenuItem>Profile</MenuItem>
        </MenuItems>
      </Menu>,
    );
    const button = screen.getByRole("button", { name: "Account" });
    expect(button.getAttributeNames().sort()).toEqual(["aria-expanded", "aria-haspopup", "aria-label", "class", "data-menu-tree", "id", "type"]);
    /* The twin: only the class it was given, none of Button's. */
    expect(button).toHaveAttribute("class", "avatar");
  });

  it("renders a plain link by default, without a to attribute", async () => {
    render(
      <Menu>
        <MenuButton>Account</MenuButton>
        <MenuItems>
          <MenuItem href="/help">Help</MenuItem>
        </MenuItems>
      </Menu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Account" }));
    const link = screen.getByRole("menuitem", { name: "Help" });
    expect([link.tagName, link.getAttribute("href"), link.hasAttribute("to")]).toEqual(["A", "/help", false]);
  });

  it("names a group by its label, and leaves an unlabeled one unnamed", async () => {
    render(
      <Menu>
        <MenuButton>Rock</MenuButton>
        <MenuItems>
          <MenuGroup label="Share">
            <MenuItem>Copy link</MenuItem>
          </MenuGroup>
          <MenuGroup>
            <MenuItem>Delete</MenuItem>
          </MenuGroup>
        </MenuItems>
      </Menu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Rock" }));
    const groups = screen.getAllByRole("group");
    expect(groups.map((g) => g.getAttribute("aria-labelledby") !== null)).toEqual([true, false]);
    expect(screen.getByRole("group", { name: "Share" })).toBeInTheDocument();
  });

  it("says where it must be used", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<MenuButton>Lost</MenuButton>)).toThrow("<MenuButton> must be inside a <Menu>.");
    quiet.mockRestore();
  });
});
