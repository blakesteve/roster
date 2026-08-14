import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumbs, type BreadcrumbLinkProps } from "./Breadcrumbs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

const meta = {
  title: "Molecules/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A navigation helper that indicates the user's current location within a hierarchical structure. It automatically handles accessibility attributes (`aria-current`, `aria-label`), visually emphasizes the active page, and features comprehensive dark mode resilience.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 space-y-12 w-full max-w-4xl mx-auto">
        <div className="light bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest">
            Light Mode Preview
          </p>
          <div className="max-w-xl">
            <Story />
          </div>
        </div>
        <div className="dark bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-xl">
          <p className="text-[10px] font-bold text-gray-500 mb-6 uppercase tracking-widest">
            Dark Mode Preview
          </p>
          <div className="max-w-xl">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "primary", "inverse"],
      description: "Color theme applied to the interactive links.",
      table: { defaultValue: { summary: "default" } },
    },
    separator: {
      control: false,
      description: "Custom separator element (defaults to a slash `/`).",
    },
    showHomeIcon: {
      control: "boolean",
      description:
        "If true, adds a clickable Home icon at the start of the chain.",
    },
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

const sampleItems = [
  { label: "Leagues", href: "/leagues" },
  { label: "MegaSquad Premier", href: "/leagues/123" },
  { label: "Settings", href: "/leagues/123/settings" },
];

// --- 1. The Playground ---
export const Playground: Story = {
  args: {
    items: sampleItems,
    variant: "default",
    showHomeIcon: true,
  },
};

// --- 2. All Variants Showcase ---
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono text-gray-400 mb-2">default</p>
        <Breadcrumbs items={sampleItems} variant="default" showHomeIcon />
      </div>
      <div>
        <p className="text-xs font-mono text-gray-400 mb-2">primary</p>
        <Breadcrumbs items={sampleItems} variant="primary" showHomeIcon />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Breadcrumbs automatically style the final item (the current page) as high-contrast, non-interactive text to firmly ground the user in their current location.",
      },
    },
  },
};

// --- 3. Custom Separator ---
export const ChevronSeparator: Story = {
  args: {
    items: sampleItems,
    showHomeIcon: true,
    separator: (
      <FontAwesomeIcon
        icon={faChevronRight}
        className="h-2.5 w-2.5 text-gray-400 dark:text-gray-600 transition-colors"
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "You can override the default slash with any React node, such as a customized Chevron icon.",
      },
    },
  },
};

// --- 4. Inverse (Dark Backgrounds) ---
export const InverseOnDark: Story = {
  render: () => (
    <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-md border border-slate-700 shadow-inner">
      <Breadcrumbs items={sampleItems} variant="inverse" showHomeIcon />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Use `variant='inverse'` when placing breadcrumbs inside dark headers, hero sections, or sidebars regardless of the overall app theme. The links default to a muted light-gray and illuminate to pure white on hover.",
      },
    },
  },
};

// --- 5. Routing ---
export const WithRouterLink: Story = {
  render: () => {
    /* Stands in for next/link or React Router's Link. The real thing has the
       same call signature, which is the point: `href`, `className`, children. */
    function RouterLink({ href, className, children, ...rest }: BreadcrumbLinkProps) {
      return (
        <a
          href={href}
          className={className}
          onClick={(event) => {
            event.preventDefault();
            alert(`Client-side navigation to ${href} — no page load.`);
          }}
          {...rest}
        >
          {children}
        </a>
      );
    }

    return (
      <Breadcrumbs
        linkComponent={RouterLink}
        showHomeIcon
        items={[
          { label: "Work", href: "/work" },
          { label: "Game Verdict" },
        ]}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: [
          "`linkComponent` renders every crumb that has an `href`, including the home icon.",
          "",
          "```tsx",
          'import NextLink from "next/link";',
          "",
          "<Breadcrumbs linkComponent={NextLink} items={items} />",
          "```",
          "",
          "Without it the component falls back to a plain `<a>`, which is correct for a static page and wrong inside a router: every hop becomes a full page load. blakeb.dev hand-rolled its breadcrumb rather than pay that, which is why this prop exists.",
          "",
          "**In an app with React Server Components, pass it from a client component.** `linkComponent` is a function, and functions do not cross the RSC boundary — doing this from a server component fails the render with *Functions cannot be passed directly to Client Components*. A four-line wrapper is enough, and the pages using it stay server-rendered:",
          "",
          "```tsx",
          '"use client";',
          "",
          'import { Breadcrumbs } from "@blakesteve/roster";',
          'import NextLink from "next/link";',
          "",
          "export function AppBreadcrumbs(props) {",
          "  return <Breadcrumbs linkComponent={NextLink} {...props} />;",
          "}",
          "```",
        ].join("\n"),
      },
    },
  },
};

export const CurrentPageAccent: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        currentClassName="!text-primary-600 dark:!text-primary-400"
        items={[{ label: "Work", href: "/work" }, { label: "Game Verdict" }]}
      />
      <Breadcrumbs
        currentClassName="!text-success-600 dark:!text-success-400"
        items={[{ label: "Work", href: "/work" }, { label: "Roster" }]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`currentClassName` tints the last crumb only. Useful when each page carries its own accent and the trail should pick it up, as blakeb.dev's case studies do.",
      },
    },
  },
};

export const UnlinkedCrumbs: Story = {
  render: () => (
    <Breadcrumbs
      items={[
        { label: "Archive", href: "/archive" },
        { label: "2026" },
        { label: "Game Verdict" },
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`href` is optional. A crumb without one renders as plain text — for a grouping level that names a section but has no page of its own. Only the last crumb gets `aria-current=\"page\"`.",
      },
    },
  },
};

export const NodeLabels: Story = {
  render: () => (
    <Breadcrumbs
      items={[
        {
          label: (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-success-500" />
              Live
            </span>
          ),
          href: "/live",
        },
        { label: "Game Verdict" },
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`label` takes a node, so a crumb can carry a status dot, an icon, or its own emphasis.",
      },
    },
  },
};
