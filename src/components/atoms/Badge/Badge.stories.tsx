import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { Badge, type BadgeProps } from "./Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faPlus,
  faUser,
  faTimes,
  faExclamationCircle,
  faShieldAlt,
  faBolt,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";

const iconMap: Record<string, React.ReactNode> = {
  None: null,
  Check: <FontAwesomeIcon icon={faCheck} />,
  Plus: <FontAwesomeIcon icon={faPlus} />,
  User: <FontAwesomeIcon icon={faUser} />,
  Close: <FontAwesomeIcon icon={faTimes} />,
  Warning: <FontAwesomeIcon icon={faExclamationCircle} />,
  Shield: <FontAwesomeIcon icon={faShieldAlt} />,
  Lightning: <FontAwesomeIcon icon={faBolt} />,
  Idea: <FontAwesomeIcon icon={faLightbulb} />,
};

const meta = {
  title: "Atoms/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A versatile **Badge** component used to label content, display status, or indicate counts. \n\n✨ **New in v2:** \n* **Crisp Colors:** Light mode now uses solid pastel backgrounds (`bg-[color]-50`) to prevent muddy text, while dark mode intelligently adapts to translucent layers (`bg-[color]-900/30`) for a stained-glass effect.\n* **Truncation:** Badges now natively support truncation (`...`) when placed in restrictive containers, and icons are protected from crushing via `shrink-0`.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "orange",
        "teal",
        "purple",
        "amber",
        "success",
        "error",
        "neutral",
      ],
      description: "The semantic color theme of the badge.",
      table: { defaultValue: { summary: "primary" } },
    },
    fill: {
      control: "radio",
      options: ["soft", "light", "solid", "outline"],
      description: "The visual style (background opacity and border).",
      table: { defaultValue: { summary: "solid" } },
    },
    size: {
      control: "radio",
      options: ["xs", "sm", "md"],
      description: "The size of the badge.",
      table: { defaultValue: { summary: "sm" } },
    },
    statusBadge: {
      control: "boolean",
      description:
        "Transforms the badge into a circular notification dot or status pill.",
      table: { defaultValue: { summary: "false" } },
    },
    leftIcon: {
      options: Object.keys(iconMap),
      mapping: iconMap,
      control: { type: "select", labels: { None: "No Icon" } },
      description: "Icon to display on the left side of the text.",
    },
    rightIcon: {
      options: Object.keys(iconMap),
      mapping: iconMap,
      control: { type: "select", labels: { None: "No Icon" } },
      description: "Icon to display on the right side of the text.",
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof Badge>;

// ✨ Side-by-side decorator perfect for showcasing Atom-level components
const DualPreviewDecorator: Decorator = (Story) => (
  <div className="flex w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
    <div className="light flex-1 bg-white p-12 relative flex flex-col items-center justify-center">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">
        Light Mode
      </p>
      <Story />
    </div>
    <div className="dark flex-1 bg-gray-950 p-12 relative flex flex-col items-center justify-center border-l border-gray-200 dark:border-gray-800">
      <p className="absolute top-4 left-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest z-10">
        Dark Mode
      </p>
      <Story />
    </div>
  </div>
);

export const Default: Story = {
  args: {
    children: "Badge",
    variant: "primary",
    fill: "solid",
    size: "sm",
  },
  decorators: [DualPreviewDecorator],
};

export const SoftPastels: Story = {
  args: {
    children: "User Settings",
    variant: "purple",
    fill: "soft",
    leftIcon: iconMap.User,
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The **Soft** fill uses a crisp, solid pastel background in light mode (no more muddy transparency) and a rich, translucent background in dark mode.",
      },
    },
  },
};

export const StatusPill: Story = {
  args: {
    children: "12",
    statusBadge: true,
    variant: "error",
    fill: "solid",
    size: "sm",
  },
  decorators: [DualPreviewDecorator],
};

export const OutlineHighlight: Story = {
  args: {
    children: "Beta Feature",
    variant: "amber",
    fill: "outline",
    leftIcon: iconMap.Lightning,
  },
  decorators: [DualPreviewDecorator],
};

// ✨ The new Truncation demonstration!
export const LongTextTruncation: Story = {
  render: (args) => (
    <div className="w-32 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col gap-2 items-center text-center">
      <span className="text-xs text-gray-400 mb-2">
        Restricted Container (128px)
      </span>
      <Badge {...args} leftIcon={iconMap.Shield} rightIcon={iconMap.Check}>
        Super Long Badge Name That Should Never Wrap
      </Badge>
    </div>
  ),
  args: {
    variant: "teal",
    fill: "light",
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the new `truncate` and `shrink-0` protections. When placed in a restrictive container, the text perfectly ellipses out without crushing the icons or wrapping to a second line.",
      },
    },
  },
};

// ✨ The Ultimate Grid! Auto-generates all variants so you can review the whole palette at once.
const ALL_VARIANTS: BadgeProps["variant"][] = [
  "primary",
  "orange",
  "teal",
  "purple",
  "amber",
  "success",
  "error",
  "neutral",
];
const ALL_FILLS: BadgeProps["fill"][] = ["soft", "light", "solid", "outline"];

export const AllVariantsMatrix: Story = {
  render: () => (
    <div className="flex flex-col gap-12 w-full">
      {ALL_FILLS.map((fill) => (
        <div key={fill} className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-gray-800 pb-2">
            Fill: {fill}
          </h3>
          <div className="flex flex-wrap gap-4">
            {ALL_VARIANTS.map((variant) => (
              <Badge key={`${fill}-${variant}`} variant={variant} fill={fill}>
                {variant}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "A complete matrix of all semantic colors and fill styles across light and dark modes.",
      },
    },
  },
};
