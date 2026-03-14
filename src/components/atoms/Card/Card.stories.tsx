import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";
import { Button } from "../Button/Button";
import { Badge } from "../Badge/Badge";

const meta = {
  title: "Atoms/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A foundational layout atom used to group related content. \n\n### 🌙 Native Dark Mode\nThis component leverages Tailwind's native `dark:` classes. Text elements placed inside the card should utilize `text-inherit` so they automatically adjust their contrast based on the card's background variant.\n\n### 🎨 Branding\nThe `branded` prop can be applied to **any** variant to add the signature MegaSquad top and bottom colored borders. You can optionally override these default brand colors using `brandColorTop` and `brandColorBottom`.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 space-y-12 max-w-3xl mx-auto">
        <div className="light bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-inner">
          <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest">
            Light Mode Preview
          </p>
          <Story />
        </div>
        <div className="dark bg-gray-950 p-8 rounded-xl border border-gray-800 shadow-inner">
          <p className="text-[10px] font-bold text-gray-500 mb-6 uppercase tracking-widest">
            Dark Mode Preview
          </p>
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "white",
        "soft",
        "slate",
        "primary",
        "outline",
        "ghost",
        "glass",
      ],
      description: "The background and border style of the card.",
    },
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
      description: "Internal padding scale.",
    },
    branded: {
      control: "boolean",
      description: "Adds top and bottom accent borders.",
    },
    brandColorTop: {
      control: "color",
      description: "Hex override for top border.",
    },
    brandColorBottom: {
      control: "color",
      description: "Hex override for bottom border.",
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WhiteBranded: Story = {
  args: {
    variant: "white",
    branded: true,
    padding: "md",
    children: (
      <>
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-inherit">Premium Plan</h3>
          <Badge variant="orange" size="xs">
            PRO
          </Badge>
        </div>
        <p className="text-inherit opacity-75 mb-6 text-sm">
          Standard white card with default brand stripes applied.
        </p>
        <Button
          className="w-full justify-center"
          variant="solid"
          colorScheme="primary"
        >
          Upgrade Now
        </Button>
      </>
    ),
  },
};

export const SoftCard: Story = {
  args: {
    variant: "soft",
    branded: false,
    padding: "md",
    children: (
      <>
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-inherit">MegaSquad Draft</h3>
          <Badge variant="neutral" fill="solid" size="xs">
            LIVE
          </Badge>
        </div>
        <p className="text-inherit opacity-75 mb-6 text-sm">
          A subtle background fill without structural borders. Notice how the
          text remains perfectly legible in both themes.
        </p>
        <div className="space-y-2">
          <div className="h-2 bg-current opacity-20 rounded-sm w-3/4"></div>
          <div className="h-2 bg-current opacity-20 rounded-sm w-1/2"></div>
        </div>
      </>
    ),
  },
};

export const SlateMoody: Story = {
  args: {
    variant: "slate",
    branded: true,
    padding: "md",
    children: (
      <>
        <h3 className="font-bold text-lg text-inherit mb-2">System Settings</h3>
        <p className="text-inherit opacity-75 mb-6 text-sm">
          The slate variant forces light text automatically, making it excellent
          for high-contrast panels.
        </p>
        <Button
          variant="outline"
          className="w-full justify-center border-current text-inherit hover:bg-white/10"
        >
          Configure
        </Button>
      </>
    ),
  },
};

export const PrimaryBrand: Story = {
  args: {
    variant: "primary",
    branded: false,
    padding: "lg",
    children: (
      <>
        <h3 className="font-bold text-2xl text-inherit mb-2">
          Join the Action!
        </h3>
        <p className="text-inherit opacity-90 mb-6">
          Create your squad today and invite your friends to start making picks.
        </p>
        <Button
          variant="solid"
          className="bg-white text-primary-700 hover:bg-gray-100"
        >
          Get Started
        </Button>
      </>
    ),
  },
};

export const CustomBrandColors: Story = {
  args: {
    variant: "white",
    branded: true,
    brandColorTop: "#8B5CF6", // Violet
    brandColorBottom: "#10B981", // Emerald
    padding: "md",
    children: (
      <>
        <h3 className="font-bold text-lg text-inherit mb-2">Custom Theme</h3>
        <p className="text-inherit opacity-75 mb-4 text-sm">
          This card uses hex codes passed directly to the component Props.
        </p>
        <div className="text-xs font-mono bg-current opacity-10 p-2 rounded-md">
          top: #8B5CF6
          <br />
          bottom: #10B981
        </div>
      </>
    ),
  },
};

export const GlassEffect: Story = {
  args: {
    variant: "glass",
    branded: false,
    padding: "lg",
    children: (
      <>
        <h3 className="font-bold text-xl text-inherit mb-2">Glassmorphism</h3>
        <p className="text-inherit opacity-80 text-sm">
          Applies a backdrop blur. Notice how the background gradient bleeds
          through the card.
        </p>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="p-16 bg-linear-to-br from-blue-500 via-indigo-500 to-purple-600 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-950 rounded-xl flex justify-center transition-colors">
        <Story />
      </div>
    ),
  ],
};
