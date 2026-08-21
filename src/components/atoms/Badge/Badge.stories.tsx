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
  <div className="rst:flex rst:w-full rst:rounded-xl rst:overflow-hidden rst:border rst:border-gray-200 rst:dark:border-gray-800 rst:shadow-sm">
    <div className="light rst:flex-1 rst:bg-white rst:p-12 rst:relative rst:flex rst:flex-col rst:items-center rst:justify-center">
      <p className="rst:absolute rst:top-4 rst:left-4 rst:text-[10px] rst:font-bold rst:text-gray-400 rst:uppercase rst:tracking-widest rst:z-10">
        Light Mode
      </p>
      <Story />
    </div>
    <div className="dark rst:flex-1 rst:bg-gray-950 rst:p-12 rst:relative rst:flex rst:flex-col rst:items-center rst:justify-center rst:border-l rst:border-gray-200 rst:dark:border-gray-800">
      <p className="rst:absolute rst:top-4 rst:left-4 rst:text-[10px] rst:font-bold rst:text-gray-500 rst:uppercase rst:tracking-widest rst:z-10">
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
    <div className="rst:w-32 rst:p-4 rst:border rst:border-dashed rst:border-gray-300 rst:dark:border-gray-700 rst:rounded-lg rst:flex rst:flex-col rst:gap-2 rst:items-center rst:text-center">
      <span className="rst:text-xs rst:text-gray-400 rst:mb-2">
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
    <div className="rst:flex rst:flex-col rst:gap-12 rst:w-full">
      {ALL_FILLS.map((fill) => (
        <div key={fill} className="rst:flex rst:flex-col rst:gap-4">
          <h3 className="rst:text-sm rst:font-bold rst:text-gray-400 rst:uppercase rst:tracking-widest rst:border-b rst:border-gray-200 rst:dark:border-gray-800 rst:pb-2">
            Fill: {fill}
          </h3>
          <div className="rst:flex rst:flex-wrap rst:gap-4">
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
