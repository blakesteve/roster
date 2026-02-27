import type { Meta, StoryObj } from "@storybook/react";
import { Footer } from "./Footer";

const meta = {
  title: "Organisms/Footer",
  component: Footer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
### Page Footer

A minimal, structural component designed to anchor the bottom of a page or layout. It automatically calculates the current year for the copyright notice and allows for customizable branding.

#### 🔧 Usage Notes

* **Dynamic Year:** The copyright year is evaluated at runtime (\`new Date().getFullYear()\`), meaning it never requires manual updating.
* **Color Context:** It defaults to a light text color (\`text-gray-100\`), assuming it will be placed on a dark background. You can seamlessly override this by passing standard text utilities (e.g., \`text-gray-600\`) via the \`className\` prop when placing it on a light background.
* **Positioning:** It includes \`mt-auto\` by default to push itself to the bottom of flex-column layouts.
`,
      },
    },
  },
  argTypes: {
    companyName: {
      control: "text",
      description:
        "The legal entity or brand name to display in the copyright notice.",
      table: { defaultValue: { summary: "Ball Collaborative" } },
    },
  },
  // Adding a dark background decorator since the default text is text-gray-100
  decorators: [
    (Story) => (
      <div className="min-h-50 flex flex-col bg-slate-900">
        <div className="grow flex items-center justify-center text-slate-500 text-sm italic">
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
  parameters: {
    docs: {
      description: {
        story:
          "The standard footer layout, rendering the dynamic year and default company name against a dark background context.",
      },
    },
  },
};

export const CustomCompany: Story = {
  args: {
    companyName: "MegaSquad",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates passing a custom `companyName` prop for use across different applications or sub-brands within the ecosystem.",
      },
    },
  },
};

export const LightThemeOverride: Story = {
  args: {
    companyName: "MegaSquad",
    className: "text-gray-500 bg-gray-50",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows how to override the default light-text styling for bright environments. Passing a text color utility via `className` will safely replace the default `text-gray-100`.",
      },
    },
  },
  // Override the default dark decorator for this specific story
  decorators: [
    (Story) => (
      <div className="min-h-50 flex flex-col bg-white">
        <div className="grow flex items-center justify-center text-gray-400 text-sm italic">
          Light Page Content Area
        </div>
        <Story />
      </div>
    ),
  ],
};
