import type { Meta, StoryObj } from "@storybook/react";
import { Navbar } from "./Navbar";

const meta = {
  title: "Organisms/Navbar",
  component: Navbar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
### The Application Header

The **Navbar** is the primary navigation controller for the application. It is designed to be **responsive**, **themeable**, and **router-agnostic**.

#### 🔧 Implementation Guide

**1. Routing Integration**
This component is framework-agnostic. To use it with a specific router (like React Router), pass the router's Link component to the \`routerElement\` prop:
\`\`\`tsx
import { NavLink } from "react-router-dom";
<Navbar routerElement={NavLink} ... />
\`\`\`

**2. Responsiveness**
The Navbar automatically collapses into a hamburger menu on mobile viewports. The breakout point is defined by the standard \`md\` breakpoint.

**3. Theming**
The component supports multiple visual variants to suit different contexts (e.g., Dashboards, Marketing pages, Hero sections).
`,
      },
    },
  },
  // Default decorator to give context and ensure visibility
  decorators: [
    (Story) => (
      <div className="min-h-75 w-full bg-gray-50">
        <Story />
        <div className="p-12 text-center opacity-30 font-bold text-3xl text-gray-400">
          Page Content Area
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["slate", "primary", "white", "transparent"],
      description: "The visual theme of the navbar.",
      table: { defaultValue: { summary: "slate" } },
    },
    themeMode: {
      control: "radio",
      options: ["light", "dark"],
      description: "Explicitly overrides the text contrast mode.",
    },
    notificationVariant: {
      control: "select",
      options: ["primary", "error", "amber", "success", "neutral"],
      description: "The color scheme for the notification badge.",
    },
    position: {
      control: "select",
      options: ["fixed", "sticky", "static"],
      description: "CSS positioning behavior.",
    },
    activePath: {
      control: "text",
      description: "The current route path used to highlight the active link.",
    },
    user: {
      control: "object",
      description:
        "User profile object. Pass 'undefined' to render the Guest state.",
    },
    onLogout: { action: "logout clicked" },
    onInboxClick: { action: "inbox clicked" },
  },
  args: {
    position: "static", // Default to static in Storybook for visibility
  },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof Navbar>;

// --- Mock Data ---
const mockLogo = "https://placehold.co/40x40/4F46E5/FFF?text=M";
const defaultItems = [
  { label: "Schedule", path: "/schedule" },
  { label: "My Leagues", path: "/leagues" },
  { label: "Settings", path: "/settings" },
];
const mockUser = {
  initials: "MS",
  notificationCount: 0,
  avatarSrc: "https://i.pravatar.cc/150?u=ms",
};

// 1. Slate (Default)
export const SlateTheme: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
    activePath: "/leagues",
    variant: "slate",
    user: mockUser,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The **Slate** variant is the standard dark theme used for the main application interface.",
      },
    },
  },
};

// 2. Primary
export const PrimaryTheme: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
    activePath: "/settings",
    variant: "primary",
    user: mockUser,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The **Primary** variant applies the brand's primary color as the background.",
      },
    },
  },
};

// 3. Fallback Initials
export const FallbackInitials: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
    activePath: "/leagues",
    variant: "slate",
    user: {
      initials: "MS",
      notificationCount: 0,
      avatarSrc: undefined,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the avatar's behavior when no image source is provided. The component automatically falls back to the user's initials.",
      },
    },
  },
};

// 4. White (Light)
export const WhiteTheme: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
    activePath: "/schedule",
    variant: "white",
    user: mockUser,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The **White** variant is designed for lighter contexts, such as admin panels or settings pages.",
      },
    },
  },
};

// 5. Transparent
export const Transparent: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
    variant: "transparent",
    position: "fixed",
    user: mockUser,
  },
  decorators: [
    (Story) => (
      <div className="relative min-h-125 w-full bg-linear-to-br from-indigo-900 via-purple-900 to-black">
        <Story />
        <div className="pt-32 px-8 text-white text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">
            Enter the Arena
          </h1>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The **Transparent** variant removes borders and backgrounds, allowing it to overlay hero images or gradients seamlessly.",
      },
    },
  },
};

// 6. With Notifications
export const WithNotifications: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
    activePath: "/schedule",
    variant: "slate",
    notificationVariant: "amber",
    user: {
      initials: "MS",
      notificationCount: 3,
      avatarSrc: undefined,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Displays a badge on the user avatar when `notificationCount` is greater than zero.",
      },
    },
  },
};

// 7. Mobile View
export const MobileView: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
    activePath: "/leagues",
    variant: "slate",
    user: {
      initials: "MS",
      notificationCount: 2,
    },
  },
  parameters: {
    viewport: {
      value: "mobile1",
    },
    docs: {
      description: {
        story:
          "Demonstrates the responsive hamburger menu behavior on constrained viewports (requires Canvas view to simulate).",
      },
    },
  },
};
