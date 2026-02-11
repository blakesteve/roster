import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";
import { Button } from "../Button/Button";
import { Badge } from "../Badge/Badge";

const meta = {
  title: "Atoms/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A layout atom used to group content. It supports `default` (white), `filled` (gray), and `ghost` variants. \n\n**Branding:** The `branded` prop can be applied to **any** variant to add the signature top and bottom colored borders. You can optionally override these colors with specific hex codes using `brandColorTop` and `brandColorBottom`.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "filled", "ghost"],
    },
    padding: {
      control: "select",
      options: ["none", "sm", "md", "lg"],
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

// 1. Standard Branded Card (White)
export const BrandedDefault: Story = {
  args: {
    variant: "default",
    branded: true,
    children: "Content placeholder",
    padding: "md",
  },
  render: (args) => (
    <Card {...args} className="w-87.5">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg">Premium Plan</h3>
        <Badge variant="orange" size="xs">
          PRO
        </Badge>
      </div>
      <p className="text-gray-600 mb-6">
        Standard white card with branding applied.
      </p>
      <Button className="w-full" variant="solid" colorScheme="primary">
        Upgrade Now
      </Button>
    </Card>
  ),
};

// 2. Branded Filled Card (MegaSquad Style)
export const BrandedFilled: Story = {
  args: {
    variant: "filled",
    branded: true,
    children: "Content placeholder",
  },
  render: (args) => (
    <Card {...args} className="w-87.5">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg">MegaSquad Draft</h3>
        <Badge variant="neutral" fill="solid" size="xs">
          LIVE
        </Badge>
      </div>
      <p className="text-gray-700 mb-6 text-sm">
        This shows that branding works perfectly on top of the "Filled" gray
        variant.
      </p>
      <div className="space-y-2">
        <div className="h-2 bg-gray-400 rounded-sm w-3/4"></div>
        <div className="h-2 bg-gray-400 rounded-sm w-1/2"></div>
      </div>
    </Card>
  ),
};

// 3. Custom Brand Colors (Hex Override)
export const CustomColors: Story = {
  args: {
    variant: "default",
    branded: true,
    brandColorTop: "#8B5CF6",
    brandColorBottom: "#10B981",
    children: "Content placeholder",
  },
  render: (args) => (
    <Card {...args} className="w-87.5">
      <h3 className="font-bold text-lg mb-2">Custom Theme</h3>
      <p className="text-gray-500 mb-4">
        This card uses hex codes passed directly to the component Props.
      </p>
      <div className="text-xs font-mono bg-gray-100 p-2 rounded-md">
        top: #8B5CF6
        <br />
        bottom: #10B981
      </div>
    </Card>
  ),
};
