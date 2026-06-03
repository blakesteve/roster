import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { AvatarStrip, type AvatarStripItem } from "./AvatarStrip";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TEAM: AvatarStripItem[] = [
  { key: "u1", label: "Alice",   colorScheme: "primary", href: "/profile/alice"  },
  { key: "u2", label: "Bob",     colorScheme: "success", href: "/profile/bob"    },
  { key: "u3", label: "Carol",   colorScheme: "teal",    href: "/profile/carol"  },
  { key: "u4", label: "Dan",     colorScheme: "purple",  href: "/profile/dan"    },
  { key: "u5", label: "Eve",     colorScheme: "amber",   href: "/profile/eve"    },
  { key: "u6", label: "Frank",   colorScheme: "orange",  href: "/profile/frank"  },
  { key: "u7", label: "Grace",   colorScheme: "error",   href: "/profile/grace"  },
  { key: "u8", label: "Heidi",   colorScheme: "neutral", href: "/profile/heidi"  },
];

const FEW: AvatarStripItem[] = TEAM.slice(0, 3);

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "Atoms/AvatarStrip",
  component: AvatarStrip,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "**AvatarStrip** renders a compact social-proof strip: a stacked row of overlapping avatars " +
          "with an optional overflow chip, dismiss button, trailing slot, and label area.\n\n" +
          "### Layout\n" +
          "Avatars overlap via `-space-x-2` negative margin. Each avatar is wrapped in an `<a>` when " +
          "`href` is provided, or a `<span>` otherwise. A `+N` chip appears when visible avatars are " +
          "fewer than the total.\n\n" +
          "### Overflow accuracy\n" +
          "When a server-side fetch returns only the first N voters but the real total is larger, pass " +
          "`totalCount` so the chip reads the true remainder rather than just `items.length - maxDisplay`.\n\n" +
          "### Slots\n" +
          "`trailingSlot` renders inside the avatar stack after the overflow chip — use it for a ghost " +
          "CTA, an add-member button, or any custom element that should sit within the stacked row. " +
          "`label` renders to the right of the stack as a separate node — ideal for a one-liner description.\n\n" +
          "### Ring colour\n" +
          "The `ringClass` prop sets the ring colour around each avatar and the overflow chip. " +
          "It should match the background the strip is rendered on to produce the cutout stack effect. " +
          "Default: `\"ring-white dark:ring-gray-900\"`.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    items: {
      control: false,
      description: "Ordered list of avatar items.",
    },
    maxDisplay: {
      control: { type: "number", min: 1, max: 10, step: 1 },
      description: "Max avatars before the +N chip appears.",
      table: { defaultValue: { summary: "5" } },
    },
    totalCount: {
      control: { type: "number", min: 0 },
      description:
        "True total count. When set, the +N chip uses this instead of `items.length`.",
    },
    excludeKey: {
      control: "text",
      description: "Key of one item to remove from rendering (e.g. the current user).",
    },
    onDismiss: {
      control: false,
      description: "When provided, renders a ✕ button at the leading edge.",
    },
    trailingSlot: {
      control: false,
      description: "Rendered inside the avatar stack after the overflow chip.",
    },
    label: {
      control: false,
      description: "Rendered to the right of the avatar stack.",
    },
    ringClass: {
      control: "text",
      description: "Tailwind ring colour class applied to each avatar and the overflow chip.",
      table: { defaultValue: { summary: "ring-white dark:ring-gray-900" } },
    },
    className: {
      control: "text",
      description: "Extra classes applied to the outer container.",
    },
  },
} satisfies Meta<typeof AvatarStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Decorators ──────────────────────────────────────────────────────────────

const DualPreviewDecorator: Decorator = (Story) => (
  <div className="flex w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
    <div className="light flex-1 bg-white p-8 relative min-w-0">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        Light Mode
      </p>
      <div className="mt-4">
        <Story />
      </div>
    </div>
    <div className="dark flex-1 bg-gray-950 p-8 relative border-l border-gray-200 dark:border-gray-800 min-w-0">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        Dark Mode
      </p>
      <div className="mt-4">
        <Story />
      </div>
    </div>
  </div>
);

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Playground: Story = {
  tags: ["!autodocs"],
  args: {
    items: TEAM,
    maxDisplay: 5,
    label: <p className="text-xs text-gray-500 dark:text-gray-400">8 people in this group</p>,
  } as typeof AvatarStrip extends (props: infer P) => unknown ? P : never,
  decorators: [DualPreviewDecorator],
};

export const Basic: Story = {
  args: { items: FEW } as Parameters<typeof AvatarStrip>[0],
  render: () => (
    <AvatarStrip
      items={FEW}
      label={
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">3</span> other players prefer Controller
        </p>
      }
    />
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story: "Three avatars with a plain text label. The default `ringClass` (`ring-white dark:ring-gray-900`) matches a white/dark-950 background.",
      },
    },
  },
};

export const WithOverflow: Story = {
  args: { items: TEAM } as Parameters<typeof AvatarStrip>[0],
  render: () => (
    <AvatarStrip
      items={TEAM}
      label={
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">8</span> team members
        </p>
      }
    />
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Eight items with the default `maxDisplay={5}`. The `+3` chip appears for the remaining three. " +
          "Hover over an avatar to see the scale effect.",
      },
    },
  },
};

export const AccurateTotalCount: Story = {
  args: { items: TEAM } as Parameters<typeof AvatarStrip>[0],
  render: () => (
    <AvatarStrip
      items={TEAM}
      totalCount={142}
      label={
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">142</span> people agree
        </p>
      }
    />
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "8 items fetched, but `totalCount={142}`. The overflow chip reads `+137` (142 − 5 visible) " +
          "instead of `+3` (8 − 5). Use this when the fetched array is a paginated subset of the real total.",
      },
    },
  },
};

export const WithExcludeKey: Story = {
  args: { items: TEAM } as Parameters<typeof AvatarStrip>[0],
  render: () => (
    <AvatarStrip
      items={TEAM}
      excludeKey="u3"
      label={
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Others who voted — you&apos;re already counted
        </p>
      }
    />
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "`excludeKey=\"u3\"` removes Carol from the strip. " +
          "Use this to hide the current user so they don't see themselves in their own social-proof row.",
      },
    },
  },
};

export const WithDismiss: Story = {
  args: { items: FEW } as Parameters<typeof AvatarStrip>[0],
  render: () => (
    <AvatarStrip
      items={FEW}
      onDismiss={() => alert("dismissed")}
      label={
        <p className="text-xs text-gray-500 dark:text-gray-400">3 players voted</p>
      }
    />
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "`onDismiss` adds a `✕` button at the leading edge. " +
          "Used in contexts where the strip is a temporary post-action reveal that the user should be able to hide.",
      },
    },
  },
};

export const WithTrailingSlot: Story = {
  args: { items: FEW } as Parameters<typeof AvatarStrip>[0],
  render: () => (
    <AvatarStrip
      items={FEW}
      trailingSlot={
        <span
          title="Create an account to appear here"
          className="relative flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 ring-2 ring-white dark:ring-gray-900 cursor-pointer hover:border-primary-400 transition-colors"
        >
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 select-none">+</span>
        </span>
      }
      label={
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="text-primary-500 dark:text-primary-400 font-medium cursor-pointer hover:opacity-80 transition-opacity">
            Join
          </span>{" "}
          to appear here
        </p>
      }
    />
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "`trailingSlot` renders a custom element inside the avatar stack after the overflow chip. " +
          "Here it shows a ghost slot CTA — a dashed circle that invites the viewer to join.",
      },
    },
  },
};

export const TrailingSlotOnly: Story = {
  args: { items: [] } as Parameters<typeof AvatarStrip>[0],
  render: () => (
    <AvatarStrip
      items={[]}
      trailingSlot={
        <span
          title="Create an account to appear here"
          className="relative flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 ring-2 ring-white dark:ring-gray-900 cursor-pointer"
        >
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 select-none">+</span>
        </span>
      }
      label={
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="text-primary-500 dark:text-primary-400 font-medium cursor-pointer">Join</span>{" "}
          to appear here
        </p>
      }
    />
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "No items, only a `trailingSlot`. The strip still renders because `trailingSlot` is present. " +
          "This is the zero-voter anonymous state — the CTA is the only thing in the stack.",
      },
    },
  },
};

export const LinkedAvatars: Story = {
  args: { items: TEAM } as Parameters<typeof AvatarStrip>[0],
  render: () => (
    <AvatarStrip
      items={TEAM.slice(0, 4)}
      label={
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Hover to scale · click to navigate
        </p>
      }
    />
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "When `AvatarStripItem.href` is set, the avatar is wrapped in an `<a>` tag. " +
          "Each avatar scales up on hover and brings it to the front via `hover:z-10`.",
      },
    },
  },
};