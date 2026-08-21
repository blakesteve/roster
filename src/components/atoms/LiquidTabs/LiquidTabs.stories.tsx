import { useState } from "react";
import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { LiquidTabs, type TabItem, type LiquidTabsProps } from "./LiquidTabs";
import { Badge } from "../Badge/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTableCells,
  faList,
  faChartBar,
  faStar,
  faCode,
  faEye,
} from "@fortawesome/free-solid-svg-icons";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "Atoms/LiquidTabs",
  component: LiquidTabs,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "**LiquidTabs** is a controlled tab strip with a liquid sliding indicator.\n\n" +
          "### How it works\n" +
          "The pill animation runs entirely outside React's render cycle — positions and transitions are written directly to DOM refs so selecting a tab never triggers a re-render of the container. This keeps the animation smooth even when tab panels below it are expensive to render.\n\n" +
          "### Two-phase motion\n" +
          "1. **Stretch** (130 ms ease-out) — the pill expands to span the gap between the old and new tab, giving a viscous, stretchy feel.\n" +
          "2. **Contract** (160 ms ease-in) — the pill snaps to the target tab.\n\n" +
          "The `pill` variant squashes via `scaleY` during stretch. The `filled` variant morphs border-radius (oval during stretch) so the full-height pill never exposes gaps at the top or bottom edges.\n\n" +
          "### Controlled component\n" +
          "`LiquidTabs` is fully controlled — it owns no internal selected state. Pass `activeTab` and `onChange` from the parent. This makes it easy to sync tabs with routing, URL params, or any external state.\n\n" +
          "### Label render functions\n" +
          "Each `TabItem.label` can be a `ReactNode` (static) or a function `(isActive: boolean) => ReactNode`. Use the function form to render icons, badges, or other content that should visually differ in the active state.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    tabs: {
      control: false,
      description: "Ordered list of tab items. Each item needs a unique `id` and a `label`.",
    },
    activeTab: {
      control: false,
      description: "The `id` of the currently selected tab. Must match one of the tab `id` values.",
    },
    onChange: {
      control: false,
      description: "Callback fired with the new tab `id` when the user selects a different tab.",
    },
    variant: {
      control: "inline-radio",
      options: ["pill", "filled"],
      description:
        "`pill` — floating pill inside a padded container (`w-fit` by default). " +
        "`filled` — active tab fills its entire cell; container is always `w-full`.",
      table: { defaultValue: { summary: "pill" } },
    },
    fullWidth: {
      control: "boolean",
      description: "Stretch the `pill` variant to full width with `flex-1` buttons. No-op for `filled`.",
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      control: "text",
      description: "Extra CSS classes applied to the outer container.",
    },
  },
} satisfies Meta<typeof LiquidTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VIEW_TABS: TabItem[] = [
  { id: "grid",  label: "Grid" },
  { id: "list",  label: "List" },
  { id: "chart", label: "Chart" },
];

const EMBED_TABS: TabItem[] = [
  { id: "card",  label: "Card" },
  { id: "badge", label: "Badge" },
];

const THEME_TABS: TabItem[] = [
  { id: "dark",  label: "Dark" },
  { id: "light", label: "Light" },
];

// ─── Decorators ──────────────────────────────────────────────────────────────

const DualPreviewDecorator: Decorator = (Story) => (
  <div className="rst:flex rst:w-full rst:rounded-xl rst:overflow-hidden rst:border rst:border-gray-200 rst:dark:border-gray-800 rst:shadow-sm">
    <div className="light rst:flex-1 rst:bg-white rst:p-8 rst:relative rst:flex rst:flex-col rst:items-center rst:justify-center rst:min-w-0">
      <p className="rst:absolute rst:top-4 rst:left-4 rst:text-[10px] rst:font-bold rst:text-gray-400 rst:uppercase rst:tracking-widest">
        Light Mode
      </p>
      <Story />
    </div>
    <div className="dark rst:flex-1 rst:bg-gray-950 rst:p-8 rst:relative rst:flex rst:flex-col rst:items-center rst:justify-center rst:border-l rst:border-gray-200 rst:dark:border-gray-800 rst:min-w-0">
      <p className="rst:absolute rst:top-4 rst:left-4 rst:text-[10px] rst:font-bold rst:text-gray-500 rst:uppercase rst:tracking-widest">
        Dark Mode
      </p>
      <Story />
    </div>
  </div>
);

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Playground: Story = {
  tags: ["!autodocs"],
  args: { variant: "pill", fullWidth: false } as LiquidTabsProps,
  argTypes: {
    variant: { control: false },
  },
  render: (args) => {
    const [active, setActive] = useState("grid");
    return (
      <LiquidTabs
        {...args}
        tabs={VIEW_TABS}
        activeTab={active}
        onChange={setActive}
      />
    );
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story: "Live sandbox — switch between variants and toggle fullWidth via the controls panel.",
      },
    },
  },
};

export const PillVariant: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("grid");
    return (
      <LiquidTabs
        tabs={VIEW_TABS}
        activeTab={active}
        onChange={setActive}
        variant="pill"
      />
    );
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The default `pill` variant. The container is `w-fit` and sits inline next to other content. " +
          "The pill squashes vertically (`scaleY(0.55)`) during the stretch phase for a viscous, gel-like feel.",
      },
    },
  },
};

export const FilledVariant: Story = {
  args: { variant: "filled" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("card");
    return (
      <div className="rst:w-64">
        <LiquidTabs
          tabs={EMBED_TABS}
          activeTab={active}
          onChange={setActive}
          variant="filled"
        />
      </div>
    );
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "The `filled` variant — the container is always `w-full` and each tab fills its cell. " +
          "The pill morphs border-radius during stretch (rectangular → oval → rectangular) so no gap ever appears at the top or bottom edges.",
      },
    },
  },
};

export const FullWidth: Story = {
  args: { variant: "pill", fullWidth: true } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("grid");
    return (
      <div className="rst:w-72">
        <LiquidTabs
          tabs={VIEW_TABS}
          activeTab={active}
          onChange={setActive}
          variant="pill"
          fullWidth
        />
      </div>
    );
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Pass `fullWidth` to stretch the `pill` variant to the container width with `flex-1` buttons. " +
          "Useful for tab bars that should fill a card header or sidebar panel.",
      },
    },
  },
};

export const BothVariantsSideBySide: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [activePill, setActivePill] = useState("dark");
    const [activeFilled, setActiveFilled] = useState("dark");
    return (
      <div className="rst:flex rst:flex-col rst:gap-6 rst:w-64">
        <div>
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-400 rst:dark:text-gray-500 rst:uppercase rst:tracking-widest rst:mb-2">
            pill (default)
          </p>
          <LiquidTabs
            tabs={THEME_TABS}
            activeTab={activePill}
            onChange={setActivePill}
            variant="pill"
            fullWidth
          />
        </div>
        <div>
          <p className="rst:text-[10px] rst:font-bold rst:text-gray-400 rst:dark:text-gray-500 rst:uppercase rst:tracking-widest rst:mb-2">
            filled
          </p>
          <LiquidTabs
            tabs={THEME_TABS}
            activeTab={activeFilled}
            onChange={setActiveFilled}
            variant="filled"
          />
        </div>
      </div>
    );
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Both variants at a glance. `pill` uses `scaleY` squash; `filled` uses border-radius morphing. " +
          "Click a tab in either strip to see the animation.",
      },
    },
  },
};

export const RenderFunctionLabels: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("grid");
    const tabs: TabItem[] = [
      {
        id: "grid",
        label: (isActive) => (
          <span className="rst:flex rst:items-center rst:gap-1.5">
            <FontAwesomeIcon icon={faTableCells} className="rst:h-3 rst:w-3" />
            {isActive && "Grid"}
          </span>
        ),
      },
      {
        id: "list",
        label: (isActive) => (
          <span className="rst:flex rst:items-center rst:gap-1.5">
            <FontAwesomeIcon icon={faList} className="rst:h-3 rst:w-3" />
            {isActive && "List"}
          </span>
        ),
      },
      {
        id: "chart",
        label: (isActive) => (
          <span className="rst:flex rst:items-center rst:gap-1.5">
            <FontAwesomeIcon icon={faChartBar} className="rst:h-3 rst:w-3" />
            {isActive && "Chart"}
          </span>
        ),
      },
    ];
    return (
      <LiquidTabs tabs={tabs} activeTab={active} onChange={setActive} variant="pill" />
    );
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "When `label` is a function `(isActive: boolean) => ReactNode`, the tab can render differently in its active state. " +
          "Here inactive tabs show only an icon; the active tab expands to show the icon and label — without any extra state in the parent.",
      },
    },
  },
};

export const WithBadgeLabels: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("preview");
    const tabs: TabItem[] = [
      {
        id: "preview",
        label: (
          <span className="rst:flex rst:items-center rst:gap-1.5">
            <FontAwesomeIcon icon={faEye} className="rst:h-3 rst:w-3" />
            Preview
          </span>
        ),
      },
      {
        id: "code",
        label: (
          <span className="rst:flex rst:items-center rst:gap-1.5">
            <FontAwesomeIcon icon={faCode} className="rst:h-3 rst:w-3" />
            Code
          </span>
        ),
      },
      {
        id: "reviews",
        label: (
          <span className="rst:flex rst:items-center rst:gap-2">
            <FontAwesomeIcon icon={faStar} className="rst:h-3 rst:w-3" />
            Reviews
            <Badge variant="primary" fill="soft" size="xs">4</Badge>
          </span>
        ),
      },
    ];
    return (
      <LiquidTabs tabs={tabs} activeTab={active} onChange={setActive} variant="pill" />
    );
  },
  decorators: [DualPreviewDecorator],
  parameters: {
    docs: {
      description: {
        story:
          "Labels accept any `ReactNode` — here tabs include icons and a `Badge` count. " +
          "Static `ReactNode` labels (not render functions) render identically in active and inactive states.",
      },
    },
  },
};

export const ManyTabs: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const tabs: TabItem[] = [
      { id: "overview",  label: "Overview" },
      { id: "details",   label: "Details" },
      { id: "reviews",   label: "Reviews" },
      { id: "related",   label: "Related" },
      { id: "changelog", label: "Changelog" },
    ];
    const [active, setActive] = useState("overview");
    return (
      <LiquidTabs tabs={tabs} activeTab={active} onChange={setActive} variant="pill" />
    );
  },
  decorators: [
    (Story) => (
      <div className="rst:flex rst:flex-col rst:gap-4 rst:w-full">
        <div className="light rst:bg-white rst:rounded-xl rst:border rst:border-gray-200 rst:p-6 rst:relative">
          <p className="rst:absolute rst:top-4 rst:left-4 rst:text-[10px] rst:font-bold rst:text-gray-400 rst:uppercase rst:tracking-widest">
            Light Mode
          </p>
          <div className="rst:mt-4">
            <Story />
          </div>
        </div>
        <div className="dark rst:bg-gray-950 rst:rounded-xl rst:border rst:border-gray-800 rst:p-6 rst:relative">
          <p className="rst:absolute rst:top-4 rst:left-4 rst:text-[10px] rst:font-bold rst:text-gray-500 rst:uppercase rst:tracking-widest">
            Dark Mode
          </p>
          <div className="rst:mt-4">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        story:
          "With five tabs the stretch animation is most visible when jumping across the strip — try clicking from **Overview** to **Changelog** and back. " +
          "The pill spans the full gap before contracting.",
      },
    },
  },
};