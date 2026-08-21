import type { Meta, StoryObj } from "@storybook/react-vite";
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

A minimal, structural component designed to anchor the bottom of a page or layout. It automatically calculates the current year for the copyright notice, features built-in dark mode resilience, and allows for customizable branding.

#### 🔧 Usage Notes

* **Dynamic Year:** The copyright year is evaluated at runtime (\`new Date().getFullYear()\`), meaning it never requires manual updating.
* **Variant System:** Supports \`default\`, \`primary\`, and \`transparent\` themes to adapt perfectly to standard layouts, brand-heavy pages, or immersive hero images.
* **Positioning:** It includes \`mt-auto\` by default to automatically push itself to the absolute bottom of any flex-column layout.
`,
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "primary", "transparent"],
      description: "The visual theme of the footer.",
      table: { defaultValue: { summary: "default" } },
    },
    companyName: {
      control: "text",
      description:
        "The legal entity or brand name to display in the copyright notice.",
      table: { defaultValue: { summary: "Ball Collaborative" } },
    },
  },
  decorators: [
    (Story) => (
      <div className="rst:p-8 rst:space-y-12 rst:w-full rst:max-w-4xl rst:mx-auto">
        <div className="light rst:bg-white rst:p-6 rst:rounded-xl rst:border rst:border-gray-100 rst:shadow-sm rst:flex rst:flex-col rst:min-h-75">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-400 rst:uppercase rst:tracking-widest rst:absolute">
            Light Mode Preview
          </p>
          <div className="rst:grow rst:flex rst:items-center rst:justify-center rst:text-gray-400 rst:text-sm rst:italic">
            Page Content Area
          </div>
          {/* mt-auto in the Footer will naturally push it to the bottom of this flex-col wrapper */}
          <Story />
        </div>

        <div className="dark rst:bg-gray-950 rst:p-6 rst:rounded-xl rst:border rst:border-gray-800 rst:shadow-xl rst:flex rst:flex-col rst:min-h-75">
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-500 rst:uppercase rst:tracking-widest rst:absolute">
            Dark Mode Preview
          </p>
          <div className="rst:grow rst:flex rst:items-center rst:justify-center rst:text-gray-600 rst:text-sm rst:italic">
            Page Content Area
          </div>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof Footer>;

// --- 1. Default Theme ---
export const DefaultTheme: Story = {
  args: {
    companyName: "MegaSquad",
    variant: "default",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The standard footer layout. It applies a subtle border and muted text that perfectly matches the default background of the application in both light and dark modes.",
      },
    },
  },
};

// --- 2. Primary Theme ---
export const PrimaryTheme: Story = {
  args: {
    companyName: "MegaSquad",
    variant: "primary",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Applies a deep, brand-colored background to create a strong visual anchor at the bottom of the page.",
      },
    },
  },
};

// --- 3. With Navigation Links ---
export const WithLinks: Story = {
  args: {
    companyName: "MegaSquad",
    variant: "default",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Pass a `links` array to render a row of navigation links above the copyright line. Useful for pages like Contact, Privacy Policy, and Terms of Service. Use the `routerElement` prop to swap the `<a>` tag for a framework-aware link (e.g. Next.js `Link`).",
      },
    },
  },
};

// --- 4. Transparent Theme ---
export const TransparentTheme: Story = {
  args: {
    companyName: "MegaSquad",
    variant: "transparent",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The transparent variant strips away all borders and backgrounds, allowing it to sit seamlessly over gradients or immersive images. Its text color natively adapts to maintain readability in dark or light contexts.",
      },
    },
  },
  // Overriding the default dual-decorator to show it off against a vibrant background
  decorators: [
    (Story) => (
      <div className="rst:p-8 rst:w-full rst:max-w-4xl rst:mx-auto">
        <div className="rst:bg-linear-to-br rst:from-indigo-900 rst:via-purple-900 rst:to-black rst:p-6 rst:rounded-xl rst:shadow-xl rst:flex rst:flex-col rst:min-h-75 dark">
          <div className="rst:grow rst:flex rst:items-center rst:justify-center rst:text-white/50 rst:text-sm rst:italic">
            Immersive Content Area
          </div>
          <Story />
        </div>
      </div>
    ),
  ],
};
