import type { Meta, StoryObj } from "@storybook/react";
import { Footer } from "./Footer";

const meta = {
  title: "Organisms/Footer",
  component: Footer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  // Adding a dark background decorator since the default text is text-gray-100
  decorators: [
    (Story) => (
      <div className="min-h-50 flex flex-col bg-slate-900">
        <div className="grow flex items-center justify-center text-slate-500 text-sm">
          Page Content Area
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  args: {
    companyName: "Ball Collaborative",
  },
};

export const CustomCompany: Story = {
  args: {
    companyName: "MegaSquad",
  },
};

export const LightThemeOverride: Story = {
  args: {
    companyName: "Ball Collaborative",
    className: "text-gray-600 bg-gray-50",
  },
  // Override the default dark decorator for this specific story
  decorators: [
    (Story) => (
      <div className="min-h-50 flex flex-col bg-white">
        <div className="grow flex items-center justify-center text-gray-400 text-sm">
          Light Page Content Area
        </div>
        <Story />
      </div>
    ),
  ],
};
