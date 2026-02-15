import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Link } from "./Link";

// --- Mock Component ---
// This simulates 'react-router-dom' behavior for the stories.
// In your real app, you would import { Link as RouterLink } from 'react-router-dom'.
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
      alert(`Navigating internally to: ${to}`);
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
        component:
          "A polymorphic **Link** component. By default, it renders a standard HTML `<a>` tag. \n\n**Polymorphism:** To use it with client-side routing (like `react-router-dom` or `next/link`), pass your router's Link component to the `as` prop. The component will inherit the styling of the Roster system while using the logic of your router.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "neutral", "danger", "white"],
      description: "Visual style of the link.",
      table: { defaultValue: { summary: "primary" } },
    },
    underline: {
      control: "select",
      options: ["always", "hover", "none"],
      description: "Underline behavior.",
      table: { defaultValue: { summary: "hover" } },
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "Text size.",
      table: { defaultValue: { summary: "md" } },
    },
    external: {
      control: "boolean",
      description: "Forces `target='_blank'` and `rel='noopener'`.",
    },
    showExternalIcon: {
      control: "boolean",
      description: "Appends a small external link icon.",
    },
    as: {
      description: "The component to render as (e.g., `RouterLink`).",
      control: false, // Disable control because passing components via UI is buggy
    },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof Link>;

// 1. Default (Standard Anchor)
export const Default: Story = {
  args: {
    href: "#",
    children: "Standard Link",
  },
};

// 2. React Router Integration (Polymorphic)
export const AsRouterLink: Story = {
  args: {
    as: MockRouterLink, // 👈 The Magic
    to: "/dashboard/settings", // Prop passed to MockRouterLink
    children: "Go to Settings (Client-Side)",
  },
  parameters: {
    docs: {
      description: {
        story:
          "This story uses the `as` prop to render a `MockRouterLink`. Notice how it accepts the `to` prop instead of `href`.",
      },
    },
  },
};

// 3. External Link (Auto-Detection)
export const External: Story = {
  args: {
    href: "https://google.com",
    children: "Visit Google",
    showExternalIcon: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Links starting with `http` are automatically treated as external (opens in new tab) unless specified otherwise.",
      },
    },
  },
};

// 4. Danger Variant
export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Delete Account",
    href: "#delete",
  },
};

// 5. Inline Composition (The "Auth Footer" Pattern)
export const InlineComposition: Story = {
  render: () => (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
      <p className="text-sm text-gray-600">
        Don't have an account yet?{" "}
        <Link
          as={MockRouterLink}
          to="/register"
          variant="primary"
          underline="always"
        >
          Sign up now
        </Link>
      </p>
    </div>
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

// 6. Sizes Comparison
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <Link href="#" size="sm">
        Small Link (Legal text)
      </Link>
      <Link href="#" size="md">
        Medium Link (Default)
      </Link>
      <Link href="#" size="lg">
        Large Link (Headlines)
      </Link>
    </div>
  ),
};
