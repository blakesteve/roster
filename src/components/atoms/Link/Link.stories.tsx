import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "./Link";

// --- Mock Components for Storybook ---
const MockRouterLink = ({
  to,
  children,
  className,
  ...props
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <a
    href={to}
    className={className}
    onClick={(e) => {
      e.preventDefault();
      alert(`[React Router] Navigating internally to: ${to}`);
    }}
    {...props}
  >
    {children}
  </a>
);

const MockNextLink = ({
  href,
  children,
  className,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <a
    href={href}
    className={className}
    onClick={(e) => {
      e.preventDefault();
      alert(`[Next.js] Prefetching route: ${href}...`);
    }}
    {...props}
  >
    {children}
  </a>
);

const meta = {
  title: "Atoms/Link",
  component: Link,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
### The Polymorphic Link

The \`<Link>\` component is **framework agnostic**. It defaults to a standard HTML \`<a>\` tag, but can morph into any routing component (React Router, Next.js, TanStack, etc.) using the \`as\` prop.

It preserves Roster's accessibility and styling (focus rings, hover states, dark mode) while delegating navigation logic to your framework.
`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 space-y-12">
        <div className="light bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest">
            Light Mode Preview
          </p>
          <div className="max-w-md">
            <Story />
          </div>
        </div>
        <div className="dark bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-[10px] font-bold text-gray-500 mb-6 uppercase tracking-widest">
            Dark Mode Preview
          </p>
          <div className="max-w-md">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "neutral", "danger", "white"],
      description: "The visual style of the link.",
      table: { defaultValue: { summary: "primary" } },
    },
    underline: {
      control: "select",
      options: ["always", "hover", "none"],
      description: "Controls when the underline appears.",
      table: { defaultValue: { summary: "hover" } },
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "The size of the text.",
      table: { defaultValue: { summary: "md" } },
    },
    external: {
      control: "boolean",
      description: "Forces `target='_blank'` behavior even for relative paths.",
    },
    showExternalIcon: {
      control: "boolean",
      description:
        "Controls the external link icon. Defaults to `true` if the link is external, `false` otherwise.",
    },
    as: {
      control: false,
      description:
        "The component to render as (e.g., `RouterLink`, `NextLink`).",
    },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof Link>;

// --- 1. Core Variants ---
export const Primary: Story = {
  args: {
    variant: "primary",
    href: "#",
    children: "Primary Action Link",
  },
};

export const Neutral: Story = {
  args: {
    variant: "neutral",
    href: "#",
    children: "Neutral Secondary Link",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    href: "#",
    children: "Delete Account",
  },
};

export const WhiteMegaSquad: Story = {
  args: {
    variant: "white",
    href: "#",
    children: "White Link (Visible on Dark)",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The `white` variant is specifically designed to sit on top of dark panels, dialogs, or primary colored backgrounds. (Note: It will be nearly invisible in the Light Mode preview above).",
      },
    },
  },
};

// --- 2. Composition Example ---
export const InlineParagraph: Story = {
  render: () => (
    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
      By clicking "Agree", you accept our{" "}
      <Link href="/terms" size="md" underline="always">
        Terms of Service
      </Link>{" "}
      and acknowledge that you have read our{" "}
      <Link href="/privacy" size="md" underline="always">
        Privacy Policy
      </Link>
      .
    </p>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Links are `inline-flex` by default, allowing them to sit perfectly inside paragraph text while adapting to the surrounding font size.",
      },
    },
  },
};

// --- 3. External Links ---
export const ExternalWithIcon: Story = {
  args: {
    href: "https://github.com",
    children: "View Source on GitHub",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Links starting with `http` are automatically treated as external. They receive `target='_blank'` and automatically display the external icon.",
      },
    },
  },
};

export const ExternalClean: Story = {
  args: {
    href: "https://google.com",
    children: "External (Icon Suppressed)",
    showExternalIcon: false,
  },
};

// --- 4. Polymorphic Integrations ---
export const WithReactRouter: Story = {
  args: {
    as: MockRouterLink,
    to: "/app/dashboard",
    children: "Go to Dashboard",
  },
  parameters: {
    docs: {
      description: {
        story:
          "To use with **React Router**, import their `Link` and pass it to the `as` prop. You can then use the `to` prop natively.",
      },
    },
  },
};

export const WithNextJS: Story = {
  args: {
    as: MockNextLink,
    href: "/blog/latest",
    children: "Read Latest Post",
    variant: "neutral",
  },
  parameters: {
    docs: {
      description: {
        story:
          "For **Next.js**, pass `next/link` to the `as` prop. Next uses `href` just like a standard anchor, so the API feels native.",
      },
    },
  },
};
