import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
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

/* Icons drawn inline: a story's own classes would ship in roster.css, and the
   menu itself carries no icon set. */
const icon = (d: string) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Edit = () => icon("M10.5 2.5 13.5 5.5 6 13H3v-3l7.5-7.5Z");
const Copy = () => icon("M5.5 5.5h7v8h-7zM3 10.5V2.5h7");
const Share = () => icon("M8 2v8M4.5 5.5 8 2l3.5 3.5M3 9.5V14h10V9.5");
const Trash = () => icon("M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 9h6l.5-9");
const Flag = () => icon("M3.5 14V2.5M3.5 3h8l-1.5 3 1.5 3h-8");
const Folder = () => icon("M2 4.5h4l1.5 1.5H14v7H2z");
const Dots = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <circle cx="3" cy="8" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="13" cy="8" r="1.5" />
  </svg>
);

const meta = {
  title: "Molecules/Menu",
  component: Menu,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A button that opens a panel of actions: the menu button pattern. Compose it from `Menu`, `MenuButton`, `MenuItems` and the items.",
          "",
          "- **Items:** `MenuItem` (an action, or a link with `href`), `MenuCheckboxItem`, `MenuRadioGroup` with `MenuRadioItem`, `MenuSubmenu`, `MenuGroup` with an optional label, and `MenuSeparator`. An item takes a leading `icon`, a `shortcut` to show (display only), `destructive` and `disabled`.",
          "- **Keyboard:** Enter, Space or Down open it on the first item and Up on the last. The arrows move, Home and End jump, and typing jumps to the next item starting with what's typed. Escape closes it and returns focus to the button; Tab closes it and moves on. A submenu opens with the arrow away from its parent, and closes with the arrow back.",
          "- **Events:** keys inside the panel stay there, bar Ctrl, Meta and Alt combinations. Clicks go on to the page, and React carries them to the components around the menu too, so a row with its own `onClick` checks that the click landed inside it.",
          "- **Placement:** below the button, flipped above when there's more room there, shifted to stay on screen, and capped at the room there is. A menu taller than that scrolls, with a shadow at the edge that has more.",
          "- **Targets:** every item is at least 44px tall, and the button at least 44 by 44.",
          "- **Inside other layers:** the panel opens in a portal, so nothing it sits in clips it. A Dialog, a Sheet or Navbar's mobile panel counts it as inside: choosing from it leaves them open.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

const Frame = ({ children, height = 320 }: { children: ReactNode; height?: number }) => <div style={{ minHeight: height }}>{children}</div>;

export const Actions: Story = {
  args: { children: null },
  render: () => (
    <Frame>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Actions
        </MenuButton>
        <MenuItems>
          <MenuItem icon={<Edit />} shortcut="⌘E" keyshortcuts="Meta+E">
            Edit
          </MenuItem>
          <MenuItem icon={<Copy />} shortcut="⌘D" keyshortcuts="Meta+D">
            Duplicate
          </MenuItem>
          <MenuItem icon={<Share />}>Share</MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash />} destructive>
            Delete
          </MenuItem>
        </MenuItems>
      </Menu>
    </Frame>
  ),
  parameters: { docs: { description: { story: "Plain actions with leading icons and shortcuts, a separator, and a destructive item: red, with words that say what it does." } } },
};

function ViewOptions() {
  const [archived, setArchived] = useState(true);
  const [compact, setCompact] = useState(false);
  const [sort, setSort] = useState("newest");
  return (
    <Menu>
      <MenuButton variant="outline" colorScheme="neutral">
        View
      </MenuButton>
      <MenuItems>
        <MenuGroup label="Show">
          <MenuCheckboxItem checked={archived} onCheckedChange={setArchived}>
            Archived rocks
          </MenuCheckboxItem>
          <MenuCheckboxItem checked={compact} onCheckedChange={setCompact}>
            Compact rows
          </MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuRadioGroup label="Sort by" value={sort} onValueChange={setSort}>
          <MenuRadioItem value="newest">Newest first</MenuRadioItem>
          <MenuRadioItem value="oldest">Oldest first</MenuRadioItem>
          <MenuRadioItem value="name">Name</MenuRadioItem>
        </MenuRadioGroup>
      </MenuItems>
    </Menu>
  );
}

export const CheckedItems: Story = {
  args: { children: null },
  render: () => (
    <Frame>
      <ViewOptions />
    </Frame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`MenuCheckboxItem` for on/off choices and `MenuRadioGroup` for one of several, each group under a label. A click or Enter chooses and closes; Space chooses and keeps the menu open, so several can be set in one visit.",
      },
    },
  },
};

export const Submenu: Story = {
  args: { children: null },
  render: () => (
    <Frame>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Move
        </MenuButton>
        <MenuItems>
          <MenuItem icon={<Edit />}>Rename</MenuItem>
          <MenuSubmenu label="Move to" icon={<Folder />}>
            <MenuItem>Agates</MenuItem>
            <MenuItem>Geodes</MenuItem>
            <MenuSubmenu label="Fossils">
              <MenuItem>Ammonites</MenuItem>
              <MenuItem>Trilobites</MenuItem>
            </MenuSubmenu>
          </MenuSubmenu>
          <MenuSeparator />
          <MenuItem icon={<Trash />} destructive>
            Delete
          </MenuItem>
        </MenuItems>
      </Menu>
    </Frame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A `MenuSubmenu` opens beside its item: with the arrow away from the parent, Enter, Space, a click, or the pointer resting on it. The arrow back or Escape closes it and returns to its item. Submenus nest.",
      },
    },
  },
};

export const Links: Story = {
  args: { children: null },
  render: () => (
    <Frame>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Account
        </MenuButton>
        <MenuItems>
          <MenuItem href="#profile">Profile</MenuItem>
          <MenuItem href="#settings">Settings</MenuItem>
          <MenuSeparator />
          <MenuItem href="#help">Help</MenuItem>
        </MenuItems>
      </Menu>
    </Frame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A `MenuItem` with an `href` is a link: it navigates, through the menu's `linkComponent` (a plain `<a>` by default). Pass `next/link` or your router's link from a client component, so a choice doesn't reload the page.",
      },
    },
  },
};

export const RowOverflow: Story = {
  args: { children: null },
  render: () => (
    <Frame>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 420, padding: "4px 4px 4px 12px", border: "1px solid rgb(0 0 0 / 0.12)", borderRadius: 8 }}>
        <span>Banded agate, Lake Superior</span>
        <Menu>
          <MenuButton variant="ghost" colorScheme="neutral" size="icon" aria-label="More for Banded agate">
            <Dots />
          </MenuButton>
          <MenuItems align="end">
            <MenuItem icon={<Edit />}>Edit</MenuItem>
            <MenuItem icon={<Share />}>Share</MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Flag />}>Report</MenuItem>
            <MenuItem destructive>Block the owner</MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </Frame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A row's overflow menu: an icon button named for its row (\"More for Banded agate\"), the panel aligned to its end. The button is at least 44 by 44, whatever its size.",
      },
    },
  },
};

/* A count, drawn inline so the story adds nothing to the stylesheet. */
const Count = ({ n }: { n: number }) => (
  <span style={{ minWidth: 20, padding: "0 6px", borderRadius: 999, background: "rgb(10 79 122)", color: "white", fontSize: 12, lineHeight: "20px", textAlign: "center" }}>{n}</span>
);

export const DescriptionsAndBadges: Story = {
  args: { children: null },
  render: () => (
    <Frame>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Join a group
        </MenuButton>
        <MenuItems>
          <MenuItem description="Meets monthly · 12 members">Book club</MenuItem>
          <MenuItem description="Meets weekly · 8 members" badge={<Count n={3} />}>
            Garden club
          </MenuItem>
          <MenuSeparator />
          <MenuItem description="Sends nothing" disabled>
            Preview the recap
          </MenuItem>
        </MenuItems>
      </Menu>
    </Frame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A `description` is a quieter second line, read as the item's description rather than its name. A `badge` (a count, a status) sits at the end of the row and is read with the name.",
      },
    },
  },
};

export const Disabled: Story = {
  args: { children: null },
  render: () => (
    <Frame>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Publish
        </MenuButton>
        <MenuItems>
          <MenuItem>Save draft</MenuItem>
          <MenuItem disabled>Publish now</MenuItem>
          <MenuItem>Schedule</MenuItem>
        </MenuItems>
      </Menu>
    </Frame>
  ),
  parameters: { docs: { description: { story: "A disabled item can still be reached with the arrows, so it can be read, but not chosen." } } },
};

export const LongMenu: Story = {
  args: { children: null },
  render: () => (
    <Frame height={260}>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Jump to a state
        </MenuButton>
        <MenuItems>
          {["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland"].map((s) => (
            <MenuItem key={s}>{s}</MenuItem>
          ))}
        </MenuItems>
      </Menu>
    </Frame>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Taller than the room below it, the panel is capped there and scrolls, with Roster's scrollbar and a shadow at the edge that has more. Type a letter to jump: \"M\" for Maine, again for Maryland.",
      },
    },
  },
};

export const AtTheEdge: Story = {
  args: { children: null },
  render: () => (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", minHeight: 320 }}>
      <Menu>
        <MenuButton variant="outline" colorScheme="neutral">
          Bottom right
        </MenuButton>
        <MenuItems>
          <MenuItem>Opens above</MenuItem>
          <MenuItem>and inside the screen</MenuItem>
          <MenuItem>at any edge</MenuItem>
        </MenuItems>
      </Menu>
    </div>
  ),
  parameters: { docs: { description: { story: "Near the bottom it opens above, and near the right edge it shifts left, so the whole panel stays on screen." } } },
};
