import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { Card, type CardProps } from "./Card";

const meta = {
  title: "Atoms/Card",
  component: Card,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The **Card** is the primary container for grouping related content. It handles structural padding, rounded corners, and complex theming perfectly. \n* **Glassmorphism:** The `glass` variant now uses the perfected `/50` opacity + `backdrop-blur-md` formula.\n* **Deep Dark Mode:** Standard cards now use `gray-900` in dark mode for a much more premium, high-contrast look.\n* **Branded Stripes:** Use the `branded` prop to automatically inject customizable colored accent stripes at the top and bottom of the card.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: false,
      description: "The content of the card.",
    },
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
      description: "The visual style and background surface of the card.",
      table: { defaultValue: { summary: "white" } },
    },
    padding: {
      control: "radio",
      options: ["none", "sm", "md", "lg"],
      description: "Internal padding scale.",
      table: { defaultValue: { summary: "md" } },
    },
    branded: {
      control: "boolean",
      description: "Injects absolute-positioned signature color stripes.",
      table: { defaultValue: { summary: "false" } },
    },
    brandColorTop: {
      control: "color",
      description: "Custom hex for the top stripe (defaults to theme Orange).",
    },
    brandColorBottom: {
      control: "color",
      description:
        "Custom hex for the bottom stripe (defaults to theme Primary).",
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Side-by-side decorator (using gray-100 in light mode so White cards pop!)
const DualPreviewDecorator: Decorator = (Story) => (
  <div className="flex w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
    <div className="light flex-1 bg-gray-100 p-12 relative flex flex-col items-center justify-center">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">
        Light Mode
      </p>
      <div className="w-full max-w-sm">
        <Story />
      </div>
    </div>
    <div className="dark flex-1 bg-gray-950 p-12 relative flex flex-col items-center justify-center border-l border-gray-200 dark:border-gray-800">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest z-10">
        Dark Mode
      </p>
      <div className="w-full max-w-sm">
        <Story />
      </div>
    </div>
  </div>
);

// Helper to provide consistent dummy content inside the cards
const SampleContent = () => (
  <div className="flex flex-col gap-2">
    <h3 className="text-lg font-bold">Weekly Performance</h3>
    <p className="text-sm opacity-80 leading-relaxed">
      Your picks are looking solid this week. You are currently in the top 10%
      of your primary league.
    </p>
  </div>
);

export const DefaultWhite: Story = {
  args: {
    variant: "white",
    padding: "md",
    children: <SampleContent />,
  },
  decorators: [DualPreviewDecorator],
};

export const Soft: Story = {
  args: {
    variant: "soft",
    padding: "md",
    children: <SampleContent />,
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The **Soft** variant uses a crisp `gray-50` in light mode and drops into a beautiful translucent stained-glass effect in dark mode.",
      },
    },
  },
};

export const Branded: Story = {
  args: {
    variant: "white",
    padding: "md",
    branded: true,
    children: <SampleContent />,
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Setting `branded={true}` perfectly clips brand-colored stripes to the top and bottom of the card utilizing the `overflow-hidden` wrapper.",
      },
    },
  },
};

export const Primary: Story = {
  args: {
    variant: "primary",
    padding: "md",
    children: <SampleContent />,
  },
  decorators: [DualPreviewDecorator],
};

export const Glassmorphism: Story = {
  args: {
    variant: "glass",
    padding: "md",
    children: <SampleContent />,
  },
  decorators: [
    (Story) => (
      <div className="flex w-full rounded-xl overflow-hidden shadow-sm">
        <div className="light flex-1 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-12 relative flex justify-center">
          <div className="w-full max-w-sm">
            <Story />
          </div>
        </div>
        <div className="dark flex-1 bg-linear-to-br from-indigo-900 via-purple-900 to-black p-12 relative flex justify-center border-l border-white/10">
          <div className="w-full max-w-sm">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The **Glass** variant uses your new perfected `bg-[color]/50` and `backdrop-blur-md` utilities to float beautifully over complex backgrounds.",
      },
    },
  },
};

export const CustomBrandedColors: Story = {
  args: {
    variant: "white",
    padding: "md",
    branded: true,
    // Defined custom colors here. Accepts hex codes, RGB, or named colors.
    brandColorTop: "#34D399", // A custom Emerald green
    brandColorBottom: "#F472B6", // A custom Pink
    children: (
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold">Custom Brand Alliance</h3>
        <p className="text-sm opacity-80 leading-relaxed">
          This card demonstrates using completely custom colors for the top
          (#34D399) and bottom (#F472B6) brand stripes, overriding the default
          theme colors.
        </p>
      </div>
    ),
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Use the `brandColorTop` and `brandColorBottom` props to pass any valid CSS color (hex, rgb, named color, etc.) to completely customize the branded stripes for specific partnerships or UI contexts.",
      },
    },
  },
};

const ALL_VARIANTS: NonNullable<CardProps["variant"]>[] = [
  "white",
  "soft",
  "slate",
  "primary",
  "outline",
  "ghost",
  "glass",
];

export const AllVariantsMatrix: Story = {
  args: {
    children: <></>,
  },
  render: () => (
    <div className="flex flex-col gap-6 w-full">
      {ALL_VARIANTS.map((variant) => (
        <Card key={variant} variant={variant} padding="md">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-50">
              Variant
            </h3>
            <p className="text-lg font-semibold capitalize">{variant}</p>
          </div>
        </Card>
      ))}
    </div>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "A complete matrix of all Card variants across light and dark modes.",
      },
    },
  },
};
