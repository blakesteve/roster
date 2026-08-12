import type { Meta, StoryObj } from "@storybook/react-vite";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt } from "@fortawesome/free-solid-svg-icons";
import { Pill } from "./Pill";
import { Badge } from "../Badge/Badge";

const meta = {
  title: "Atoms/Pill",
  component: Pill,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Inline chrome for a short phrase: social proof (*3 friends voted*), live state (*Live now*), or an applied filter.",
          "",
          "**Pill or Badge?** Badge is a compact label *attached to something else*: a count on an avatar, a status on a table row. It is sized to sit in a corner. Pill is *standalone* and reads as a fragment of a sentence, so it is always fully rounded, gives words more horizontal room, and can lead with a status dot. If it hangs off another element, reach for Badge; if it sits in the flow, reach for Pill.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    colorScheme: {
      control: "select",
      options: ["primary", "success", "error", "amber", "info", "neutral"],
    },
    variant: { control: "inline-radio", options: ["soft", "outline", "solid"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    dot: { control: "boolean" },
    pulse: { control: "boolean", description: "Requires `dot`." },
  },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: "3 friends voted", colorScheme: "neutral" },
};

export const AllSchemes: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Pill colorScheme="primary">Primary</Pill>
      <Pill colorScheme="success">Success</Pill>
      <Pill colorScheme="error">Error</Pill>
      <Pill colorScheme="amber">Amber</Pill>
      <Pill colorScheme="info">Info</Pill>
      <Pill colorScheme="neutral">Neutral</Pill>
    </div>
  ),
};

export const Variants: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-col gap-4">
      {(["soft", "outline", "solid"] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-xs opacity-60">{variant}</span>
          <Pill variant={variant} colorScheme="primary">Primary</Pill>
          <Pill variant={variant} colorScheme="success">Success</Pill>
          <Pill variant={variant} colorScheme="error">Error</Pill>
          <Pill variant={variant} colorScheme="amber">Amber</Pill>
          <Pill variant={variant} colorScheme="neutral">Neutral</Pill>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`soft` is the default and stays quiet enough to sit inside body copy. `outline` suits dense rows where a fill adds too much weight. `solid` is for when the pill is deliberately the loudest thing in its row. Note that solid amber takes dark text, since white on amber fails contrast.",
      },
    },
  },
};

export const Sizes: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Pill size="sm">Small</Pill>
      <Pill size="md">Medium</Pill>
      <Pill size="sm" dot colorScheme="success">Small with dot</Pill>
      <Pill size="md" dot colorScheme="success">Medium with dot</Pill>
    </div>
  ),
};

export const StatusDot: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Pill dot colorScheme="success">Online</Pill>
      <Pill dot colorScheme="amber">Away</Pill>
      <Pill dot colorScheme="neutral">Offline</Pill>
      <Pill dot variant="outline" colorScheme="info">Syncing</Pill>
      <Pill dot variant="solid" colorScheme="success">Solid</Pill>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The dot takes the pill's color scheme, except on `solid` fills where it borrows the text color so it stays legible against the background.",
      },
    },
  },
};

export const LivePulse: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Pill dot pulse colorScheme="error">Live now</Pill>
      <Pill dot pulse colorScheme="success" size="md">12 watching</Pill>
      <Pill dot pulse variant="solid" colorScheme="error">On air</Pill>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`pulse` radiates a ring from the dot for genuinely live state. Reserve it for things that are actually happening; a pulsing dot on static content is just noise. The animation is gated behind `motion-safe`, so reduced-motion users still get the dot, it just holds still.",
      },
    },
  },
};

export const WithLeadingIcon: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Pill leadingIcon={<FontAwesomeIcon icon={faBolt} className="h-3 w-3" />}>
        Fast pick
      </Pill>
      <Pill
        size="md"
        colorScheme="primary"
        leadingIcon={<FontAwesomeIcon icon={faBolt} className="h-3.5 w-3.5" />}
      >
        Streak x4
      </Pill>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`leadingIcon` takes any node: an icon, an avatar, an emoji. It is ignored when `dot` is set, since two leading indicators is one too many.",
      },
    },
  },
};

export const InContext: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="max-w-md space-y-3 text-sm">
      <p>
        Hades II is currently{" "}
        <Pill dot colorScheme="success">64% controller</Pill> across 1,573
        verdicts.
      </p>
      <p>
        The Sunday Scaries league is{" "}
        <Pill dot pulse colorScheme="error">live now</Pill>, and picks lock at
        kickoff.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Pills are designed to sit inline without disturbing the line height around them.",
      },
    },
  },
};

export const VersusBadge: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Pill dot colorScheme="success">3 friends voted</Pill>
        <span className="text-xs opacity-60">
          Pill: standalone, reads as a phrase
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="success">Active</Badge>
        <span className="text-xs opacity-60">
          Badge: a label attached to something
        </span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Side by side, so the distinction is easy to feel: Badge is a tag on an object, Pill is a phrase in the flow.",
      },
    },
  },
};

export const DarkMode: Story = {
  args: { children: "placeholder" },
  render: () => (
    <div className="dark">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-950 p-6">
        <Pill colorScheme="primary">Primary</Pill>
        <Pill colorScheme="success" dot>Online</Pill>
        <Pill colorScheme="error" variant="outline">Error</Pill>
        <Pill colorScheme="amber" variant="solid">Warning</Pill>
        <Pill colorScheme="error" dot pulse>Live now</Pill>
      </div>
    </div>
  ),
};
