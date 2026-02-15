import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Link } from "./Link";

// --- Mock Components for Storybook ---
// These simulate the behavior of real frameworks so we can render them here.
// In a real app, you would import these from 'react-router' or 'next/link'.

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

It preserves Roster's accessibility and styling (focus rings, hover states) while delegating navigation logic to your framework.
`,
      },
    },
  },
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
        "The component to render as (e.g., \`RouterLink\`, \`NextLink\`).",
    },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof Link>;

// --- 1. React Router Integration ---
export const WithReactRouter: Story = {
  args: {
    as: MockRouterLink,
    to: "/app/dashboard", // This prop is passed through to the Router Link
    children: "Go to Dashboard",
  },
  parameters: {
    docs: {
      description: {
        story:
          "To use with **React Router**, import their `Link` and pass it to the `as` prop. You can then use the `to` prop as usual.",
      },
      source: {
        language: "tsx",
        code: `
import { Link } from "@roster/ui";
import { Link as RouterLink } from "react-router";

export const NavBar = () => (
  <nav>
    <Link as={RouterLink} to="/dashboard">
      Dashboard
    </Link>
  </nav>
);
        `,
      },
    },
  },
};

// --- 2. Next.js Integration ---
export const WithNextJS: Story = {
  args: {
    as: MockNextLink,
    href: "/blog/latest", // Next.js uses 'href', so we pass that
    children: "Read Latest Post",
    variant: "neutral",
  },
  parameters: {
    docs: {
      description: {
        story:
          "For **Next.js (App Router)**, simply pass `next/link` to the `as` prop. Since Next.js uses `href` just like a standard anchor, the API feels native.",
      },
      source: {
        language: "tsx",
        code: `
import { Link } from "@roster/ui";
import NextLink from "next/link";

export const Footer = () => (
  <footer>
    <Link as={NextLink} href="/privacy" variant="neutral">
      Privacy Policy
    </Link>
  </footer>
);
        `,
      },
    },
  },
};

// --- 3. External Links ---
export const External: Story = {
  args: {
    href: "https://github.com",
    children: "View Source on GitHub",
    // Note: showExternalIcon is NOT needed here; it is automatic for https://
  },
  parameters: {
    docs: {
      description: {
        story:
          "Links starting with `http` are automatically treated as external. They get `target='_blank'`, `rel='noopener'`, and **automatically display the external icon**.",
      },
    },
  },
};

// --- 4. External (Clean) ---
export const ExternalClean: Story = {
  args: {
    href: "https://google.com",
    children: "External (Icon Suppressed)",
    showExternalIcon: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "You can suppress the automatic icon by explicitly setting `showExternalIcon={false}`.",
      },
    },
  },
};

// --- 5. Composition Example ---
export const InlineParagraph: Story = {
  render: () => (
    <p className="text-gray-600 max-w-md leading-relaxed border p-4 rounded bg-gray-50">
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
          "Links are `inline-flex` by default, allowing them to sit perfectly inside paragraph text.",
      },
    },
  },
};

// --- 6. Danger Variant ---
export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Delete Account",
    href: "#delete",
  },
};
