import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { Tooltip, type TooltipProps } from "./Tooltip";
import { Button } from "../Button/Button";
import { Badge } from "../Badge/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faKeyboard,
  faShield,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";

const meta = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "**Tooltip** is a Radix-powered popup that reveals supplemental information when a user hovers, focuses, or taps a trigger element.\n\n" +
          "### Interaction model\n" +
          "- **Desktop:** Opens after a configurable hover delay (default 300 ms). Also opens on keyboard focus so screen-reader users aren't left out.\n" +
          "- **Mobile / touch:** Tap the trigger to toggle the tooltip open. Tap anywhere else to dismiss. This prevents tooltips from getting permanently stuck open on touchscreens.\n\n" +
          "### Placement & collision\n" +
          "Radix automatically flips the tooltip to the opposite side when the preferred placement would clip outside the viewport — no extra code needed.\n\n" +
          "### Variants\n" +
          "- **`dark` (default):** High-contrast zinc-900 bubble. Works great on both light and dark page backgrounds.\n" +
          "- **`light`:** White bubble with a subtle ring. Ideal for tooltips that appear on very dark surfaces (e.g. hero banners, code editors).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    content: {
      control: "text",
      description:
        "The tooltip's popup content. Accepts a plain string or any React node.",
    },
    placement: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
      description:
        "Which side of the trigger the bubble appears on. Radix flips it automatically if there isn't enough room.",
      table: { defaultValue: { summary: "top" } },
    },
    variant: {
      control: "inline-radio",
      options: ["dark", "light"],
      description: "Visual theme of the tooltip bubble.",
      table: { defaultValue: { summary: "dark" } },
    },
    delayDuration: {
      control: { type: "number", min: 0, max: 2000, step: 50 },
      description: "Milliseconds of hover delay before the tooltip opens.",
      table: { defaultValue: { summary: "300" } },
    },
    defaultOpen: {
      control: "boolean",
      description:
        "Mount the tooltip in its open state. Useful for visual testing and documentation.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      control: false,
      description: "The element that acts as the tooltip trigger.",
    },
    className: {
      control: "text",
      description: "Extra CSS classes applied to the tooltip content bubble.",
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Decorators ──────────────────────────────────────────────────────────────

const DualPreviewDecorator: Decorator = (Story) => (
  <div className="flex w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
    <div className="light flex-1 bg-white p-20 relative flex flex-col items-center justify-center">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">
        Light Mode
      </p>
      <Story />
    </div>
    <div className="dark flex-1 bg-gray-950 p-20 relative flex flex-col items-center justify-center border-l border-gray-200 dark:border-gray-800">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest z-10">
        Dark Mode
      </p>
      <Story />
    </div>
  </div>
);

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    content: "This is a helpful tooltip",
    placement: "top",
    variant: "dark",
    children: <Button size="sm">Hover or tap me</Button>,
  } as TooltipProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Live sandbox — use the controls panel to adjust all props in real time. Hover or click the button to see the tooltip.",
      },
    },
  },
};

export const Dark: Story = {
  args: {
    content: "Keyboard & Mouse provides the most precision",
    variant: "dark",
    defaultOpen: true,
    children: (
      <Button size="sm" startIcon={<FontAwesomeIcon icon={faKeyboard} />}>
        Input method
      </Button>
    ),
  } as TooltipProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The default **dark** variant uses a `zinc-900` background with a subtle white ring. It reads clearly on both light and dark page surfaces.",
      },
    },
  },
};

export const Light: Story = {
  args: {
    content: "Your data is end-to-end encrypted",
    variant: "light",
    defaultOpen: true,
    children: (
      <Button
        size="icon"
        variant="ghost"
        colorScheme="neutral"
        aria-label="Security info"
      >
        <FontAwesomeIcon icon={faShield} />
      </Button>
    ),
  } as TooltipProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The **light** variant uses a white background with a `zinc-200` ring. Best suited for tooltips that appear over dark or photographic backgrounds.",
      },
    },
  },
};

export const Placements: Story = {
  // args satisfies required prop types; render overrides the output entirely
  args: { content: "Placed on this side", children: "Trigger" },
  render: () => (
    <div className="grid grid-cols-2 gap-x-20 gap-y-16 p-12">
      {(["top", "bottom", "left", "right"] as const).map((side) => (
        <div key={side} className="flex flex-col items-center gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {side}
          </p>
          <Tooltip content={`Placed on the ${side}`} placement={side} defaultOpen>
            <Button size="sm" variant="outline" colorScheme="neutral">
              {side}
            </Button>
          </Tooltip>
        </div>
      ))}
    </div>
  ),
  parameters: {
    layout: "centered",
    docs: {
      description: {
        story:
          "All four placement options. Radix flips the side automatically when the tooltip would overflow the viewport — you don't need to handle this yourself.",
      },
    },
  },
};

export const WithIconButton: Story = {
  args: {
    content: "Add to library",
    placement: "bottom",
    defaultOpen: true,
    children: (
      <Button size="icon" variant="ghost" colorScheme="neutral" aria-label="Save">
        <FontAwesomeIcon icon={faBookmark} />
      </Button>
    ),
  } as TooltipProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Icon-only buttons benefit most from tooltips — they label the action for users who don't recognise the icon at a glance.",
      },
    },
  },
};

export const WithBadge: Story = {
  args: {
    content: "Awarded for casting 10 verdicts",
    placement: "top",
    defaultOpen: true,
    children: (
      <Badge variant="primary" fill="soft" size="sm">
        Veteran
      </Badge>
    ),
  } as TooltipProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Tooltips work with any trigger — not just buttons. Here a `Badge` explains the achievement criteria on hover.",
      },
    },
  },
};

export const WithInfoIcon: Story = {
  args: {
    content: "This score is calculated from the last 90 days of community verdicts",
    placement: "right",
    defaultOpen: true,
    children: (
      <FontAwesomeIcon
        icon={faCircleInfo}
        className="text-gray-400 hover:text-gray-600 cursor-help"
        aria-label="More information"
      />
    ),
  } as TooltipProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "A plain icon can act as the trigger by passing it directly as `children`. The Tooltip wraps it in a focusable `<span>` automatically.",
      },
    },
  },
};

export const RichContent: Story = {
  args: {
    content: (
      <span>
        <strong className="font-semibold text-zinc-100">Pro tip:</strong> hold{" "}
        <kbd className="rounded bg-zinc-700 px-1 py-0.5 font-mono text-[10px]">
          Shift
        </kbd>{" "}
        to multi-select rows
      </span>
    ),
    placement: "top",
    defaultOpen: true,
    children: <Button size="sm">Select rows</Button>,
  } as TooltipProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The `content` prop accepts any React node — use it to render keyboard shortcuts, bold labels, icons, or other rich markup inside the bubble.",
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    content:
      "Controller support requires a USB or Bluetooth gamepad. DualSense, Xbox Series, and Switch Pro controllers are all natively supported without additional drivers on macOS 12+.",
    placement: "bottom",
    defaultOpen: true,
    children: <Button size="sm" variant="outline">Controller setup</Button>,
  } as TooltipProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The bubble is capped at `max-w-60` (240 px) and wraps gracefully for longer descriptions. Keep tooltip copy concise — use a modal or popover for truly long content.",
      },
    },
  },
};

export const InstantOpen: Story = {
  args: {
    content: "No hover delay",
    delayDuration: 0,
    placement: "top",
    children: <Button size="sm">Instant</Button>,
  } as TooltipProps,
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Set `delayDuration={0}` for tooltips that should appear immediately — useful for toolbar buttons where the user is already in pointing mode.",
      },
    },
  },
};