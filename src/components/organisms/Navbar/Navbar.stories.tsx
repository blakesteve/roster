import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar, type NavbarProps } from "./Navbar";

const InteractiveWrapper = ({
  args,
  className = "bg-gray-50 dark:bg-gray-900 min-h-75",
  children,
}: {
  args: NavbarProps;
  className?: string;
  children?: ReactNode;
}) => {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={isDark ? "dark" : ""}>
      <div
        className={`relative w-full transition-colors duration-300 ${className}`}
      >
        <Navbar
          {...args}
          themeMode={isDark ? "dark" : "light"}
          onThemeToggle={() => setIsDark(!isDark)}
        />
        {children || (
          <div className="p-12 text-center opacity-30 font-bold text-3xl text-gray-500 dark:text-gray-400">
            Page Content Area
          </div>
        )}
      </div>
    </div>
  );
};

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

**2. Layout & Positioning (Defaults)**
By default, the Navbar renders with \`variant="slate"\` and \`position="sticky"\`. 
* Using \`sticky\` ensures the Navbar stays at the top of the viewport when scrolling, without pulling it out of the document flow (meaning you don't need to add top padding to your page content). 
* Use \`fixed\` only when you want the Navbar to float *over* elements like large hero images.

**3. Theming & Dark Mode**
The component supports multiple visual variants to suit different contexts. Additionally, if you pass a function to the \`onThemeToggle\` prop, the Navbar will automatically inject a Dark/Light mode toggle button into both the desktop dropdown and the mobile slide-out menu.
`,
      },
    },
  },
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
      table: { defaultValue: { summary: "sticky" } },
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
    onThemeToggle: { action: "theme toggled" },
  },
  args: {
    position: "sticky",
  },
  render: (args) => <InteractiveWrapper args={args} />,
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof Navbar>;

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

export const SlateTheme: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
    variant: "slate",
    user: mockUser,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The **Slate** variant is the standard dark theme. **Click the user avatar in this interactive story** to test the fully functional Switch component and watch the background respond.",
      },
    },
  },
};

export const ActiveLinkState: Story = {
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
          "When the `activePath` prop matches a navigation item's `path`, the link text transforms to indicate the user's current location. Notice how the active link uses `text-primary-400` on dark surfaces to ensure it pops vibrantly against the background.",
      },
    },
  },
};

export const PrimaryTheme: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
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

export const FallbackInitials: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
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

export const WhiteTheme: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
    variant: "white",
    user: mockUser,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The **White** variant is designed for lighter contexts, such as admin panels or settings pages. Toggle dark mode to see it gracefully transition to a deep, elevated surface gray.",
      },
    },
  },
};

export const Transparent: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
    variant: "transparent",
    position: "fixed",
    user: mockUser,
  },
  render: (args) => (
    <InteractiveWrapper
      args={args}
      className="bg-linear-to-br from-indigo-900 via-purple-900 to-black min-h-125"
    >
      <div className="pt-32 px-8 text-white text-center">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Enter the Arena
        </h1>
      </div>
    </InteractiveWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The **Transparent** variant removes borders and backgrounds, allowing it to overlay hero images or gradients seamlessly. Notice how `position: fixed` is used here to allow the hero image to slide up underneath it.",
      },
    },
  },
};

export const WithNotifications: Story = {
  args: {
    logoSrc: mockLogo,
    brandName: "MegaSquad",
    items: defaultItems,
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
          "Demonstrates the responsive hamburger menu behavior on constrained viewports. The interactive theme toggle is injected directly into the slide-out menu.",
      },
    },
  },
};
