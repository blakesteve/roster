import { useState } from "react";
import type { Meta, StoryObj, Decorator } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { LiquidTabs, type TabItem, type LiquidTabsProps } from "./LiquidTabs";
import { liquidTabId } from "./liquid-tab-id";
import { Badge } from "../../atoms/Badge/Badge";
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
  title: "Molecules/LiquidTabs",
  component: LiquidTabs,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "**LiquidTabs** is a controlled tab strip with a liquid sliding indicator.",
          "",
          "### Controlled, and the pill follows the value",
          "`LiquidTabs` owns no selected state: pass `activeTab` and `onChange`. The pill follows `activeTab`, never the click, so a change you veto, or one that waits on a route, never leaves it on the wrong tab.",
          "",
          "### Keyboard and focus",
          "The WAI tabs pattern. Only the selected tab is in the tab order (the first tab, if `activeTab` matches none). Left and Right move between tabs and wrap; Home and End go to the ends. `activation=\"automatic\"` (the default) selects as focus moves; `\"manual\"` moves focus only, and Enter or Space selects, for tabs that swap something expensive. Every tab is `type=\"button\"`, so a strip inside a form never submits it. Focus shows as an outline inside the tab, in the tab's own ink.",
          "",
          "### Naming and panels",
          "Name the strip with `aria-label` or `aria-labelledby`. Each tab's `id` is `liquidTabId(id, tab.id)`, so a panel can point back with `aria-labelledby`; give a tab `panelId` and it sets `aria-controls`.",
          "",
          "### Two-phase motion",
          "1. **Stretch** (130 ms ease-out): the pill spans old and new tab, squashed to `scaleY(0.55)`.",
          "2. **Contract** (160 ms ease-in): it settles on the new tab.",
          "",
          "Both variants squash the same way. Under `prefers-reduced-motion` the pill moves without either phase. Positions are written straight to the DOM, so an expensive panel below never re-renders mid-animation. The pill re-measures when the strip or a tab resizes and when web fonts arrive.",
          "",
          "### Size and color",
          "`size=\"lg\"` makes every tab at least 44px tall; `md`, the default, keeps the original heights. The active label reads `--roster-lt-text-active`, which defaults to `--roster-primary-500-ink`, the ink of the pill's default fill. Repaint the pill with `--roster-lt-pill` and set the ink to match.",
          "",
          "### Label render functions",
          "Each `TabItem.label` can be a `ReactNode` or `(isActive: boolean) => ReactNode`, for content that differs in the active state.",
          "",
          "For navigation between routes, use `LiquidNav`: the same strip, rendered as links.",
        ].join("\n"),
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
      description:
        "The `id` of the currently selected tab. If it matches none, no pill shows and the first tab takes the tab stop.",
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
    size: {
      control: "inline-radio",
      options: ["md", "lg"],
      description: "`md` keeps the original heights. `lg` makes every tab at least 44px tall.",
      table: { defaultValue: { summary: "md" } },
    },
    activation: {
      control: "inline-radio",
      options: ["automatic", "manual"],
      description:
        "`automatic`: arrowing onto a tab selects it. `manual`: arrows move focus, Enter or Space selects.",
      table: { defaultValue: { summary: "automatic" } },
    },
    id: {
      control: "text",
      description: "The tablist's id, and the base of each tab's id (`liquidTabId(id, tab.id)`).",
    },
    "aria-label": { control: "text", description: "Names the tablist." },
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
  args: {
    variant: "pill",
    fullWidth: false,
    size: "md",
    activation: "automatic",
    "aria-label": "View",
  } as LiquidTabsProps,
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
        story: "Live sandbox: switch variant, size and activation, and toggle fullWidth, from the controls panel.",
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
          "The pill squashes vertically during the stretch, as in the `pill` variant.",
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
          "Both variants at a glance. Both squash with `scaleY` while the pill stretches. " +
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
            {isActive ? "Grid" : <span className="rst:sr-only">Grid</span>}
          </span>
        ),
      },
      {
        id: "list",
        label: (isActive) => (
          <span className="rst:flex rst:items-center rst:gap-1.5">
            <FontAwesomeIcon icon={faList} className="rst:h-3 rst:w-3" />
            {isActive ? "List" : <span className="rst:sr-only">List</span>}
          </span>
        ),
      },
      {
        id: "chart",
        label: (isActive) => (
          <span className="rst:flex rst:items-center rst:gap-1.5">
            <FontAwesomeIcon icon={faChartBar} className="rst:h-3 rst:w-3" />
            {isActive ? "Chart" : <span className="rst:sr-only">Chart</span>}
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

/**
 * `size="lg"` makes every tab at least 44px tall.
 */
export const LargeSize: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [pill, setPill] = useState("grid");
    const [filled, setFilled] = useState("card");
    return (
      <div className="rst:flex rst:flex-col rst:gap-6 rst:w-72">
        <LiquidTabs tabs={VIEW_TABS} activeTab={pill} onChange={setPill} size="lg" aria-label="View" />
        <LiquidTabs tabs={EMBED_TABS} activeTab={filled} onChange={setFilled} size="lg" variant="filled" aria-label="Embed as" />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    for (const tab of within(canvasElement).getAllByRole("tab")) {
      await expect(tab.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    }
  },
  parameters: { controls: { disable: true } },
};

/**
 * One tab stop for the whole strip. Arrow keys, Home and End move between
 * tabs; with the default automatic activation, arriving selects.
 */
export const Keyboard: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("list");
    return (
      <div className="rst:flex rst:flex-col rst:gap-4 rst:items-center">
        <LiquidTabs id="view" tabs={VIEW_TABS.map((t) => ({ ...t, panelId: "view-panel" }))} activeTab={active} onChange={setActive} aria-label="View" />
        <div role="tabpanel" id="view-panel" aria-labelledby={liquidTabId("view", active)} className="rst:text-sm">
          Showing the {active} view.
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("tab", { name: "List" });
    await expect(list).toHaveAttribute("tabindex", "0");
    list.focus();
    await userEvent.keyboard("{ArrowRight}");
    const chart = canvas.getByRole("tab", { name: "Chart" });
    await expect(chart).toHaveFocus();
    await expect(chart).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel", { name: "Chart" })).toBeInTheDocument();
    await userEvent.keyboard("{Home}");
    await expect(canvas.getByRole("tab", { name: "Grid" })).toHaveFocus();
  },
  parameters: { controls: { disable: true } },
};

/**
 * The pill sits exactly on the active tab, even on a strip with a thick
 * border. It used to sit one border-width to the right.
 */
export const PillPlacement: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("grid");
    return (
      <LiquidTabs tabs={VIEW_TABS} activeTab={active} onChange={setActive} className="rst:border-2" aria-label="View" />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pill = canvas.getByTestId("liquid-tabs-pill");
    const check = async (name: string) => {
      const tab = canvas.getByRole("tab", { name }).getBoundingClientRect();
      await waitFor(() => {
        const p = pill.getBoundingClientRect();
        expect(Math.abs(p.left - tab.left)).toBeLessThan(0.5);
        expect(Math.abs(p.width - tab.width)).toBeLessThan(0.5);
      });
    };
    await check("Grid");
    await userEvent.click(canvas.getByRole("tab", { name: "Chart" }));
    await check("Chart");
  },
  parameters: { controls: { disable: true } },
};

/**
 * The consumer decides. Here every change is refused, and the pill stays on
 * the tab that is actually selected.
 */
export const VetoedChange: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => <LiquidTabs tabs={VIEW_TABS} activeTab="grid" onChange={() => {}} aria-label="View" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pill = canvas.getByTestId("liquid-tabs-pill");
    const grid = canvas.getByRole("tab", { name: "Grid" }).getBoundingClientRect();
    await userEvent.click(canvas.getByRole("tab", { name: "Chart" }));
    // At once, and after the time a stretch and settle would have taken.
    await expect(Math.abs(pill.getBoundingClientRect().left - grid.left)).toBeLessThan(0.5);
    await new Promise((r) => setTimeout(r, 400));
    await expect(Math.abs(pill.getBoundingClientRect().left - grid.left)).toBeLessThan(0.5);
  },
  parameters: { controls: { disable: true } },
};

/**
 * Inside a form, a tab is a button that does not submit.
 */
export const InsideAForm: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("card");
    const [submits, setSubmits] = useState(0);
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmits((n) => n + 1);
        }}
        className="rst:flex rst:flex-col rst:gap-2 rst:items-center"
      >
        <LiquidTabs tabs={EMBED_TABS} activeTab={active} onChange={setActive} aria-label="Embed as" />
        <output className="rst:text-sm">Submitted {submits} times</output>
      </form>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Badge" }));
    await expect(canvas.getByRole("tab", { name: "Badge" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByText("Submitted 0 times")).toBeInTheDocument();
  },
  parameters: { controls: { disable: true } },
};

/**
 * `activation="manual"`: arrows move focus without selecting, and Enter or
 * Space selects. Focus and selection can part company, so the tab stop follows
 * focus: Tab from a focused tab leaves the strip, it does not land back on the
 * selected one.
 */
export const ManualActivation: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("chart");
    return (
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-4">
        <LiquidTabs tabs={VIEW_TABS} activeTab={active} onChange={setActive} activation="manual" aria-label="View" />
        <button type="button">After the strip</button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chart = canvas.getByRole("tab", { name: "Chart" });
    const list = canvas.getByRole("tab", { name: "List" });
    chart.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(list).toHaveFocus();
    await expect(list).toHaveAttribute("aria-selected", "false");
    await expect(chart).toHaveAttribute("aria-selected", "true");
    /* Chart, still selected, comes after List in the DOM. Tab must leave the
       strip, not land on it. */
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "After the strip" })).toHaveFocus();
    // Coming back in lands on the selected tab.
    await userEvent.tab({ shift: true });
    await expect(chart).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}{Enter}");
    await expect(list).toHaveAttribute("aria-selected", "true");
  },
  parameters: { controls: { disable: true } },
};

/**
 * A strip wider than its container scrolls, and the pill scrolls with it,
 * staying on its tab wherever the strip is scrolled to.
 */
export const ScrollingStrip: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const tabs: TabItem[] = ["Overview", "Details", "Reviews", "Related", "Changelog", "Support", "Pricing"].map(
      (label) => ({ id: label.toLowerCase(), label }),
    );
    const [active, setActive] = useState("overview");
    return (
      /* Inline, because every class a story uses ships in Roster's stylesheet. */
      <div style={{ width: 240 }}>
        <LiquidTabs
          tabs={tabs}
          activeTab={active}
          onChange={setActive}
          className="rst:max-w-full rst:overflow-x-auto"
          aria-label="Section"
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const strip = canvas.getByRole("tablist");
    const pill = canvas.getByTestId("liquid-tabs-pill");
    await expect(strip.scrollWidth).toBeGreaterThan(strip.clientWidth);

    const onTab = async (name: string) => {
      await waitFor(() => {
        const t = canvas.getByRole("tab", { name }).getBoundingClientRect();
        const p = pill.getBoundingClientRect();
        expect(Math.abs(p.left - t.left)).toBeLessThan(0.5);
        expect(Math.abs(p.width - t.width)).toBeLessThan(0.5);
      });
    };
    strip.scrollLeft = strip.scrollWidth;
    await userEvent.click(canvas.getByRole("tab", { name: "Pricing" }));
    await onTab("Pricing");
    // Scrolled back, the pill went with its tab.
    strip.scrollLeft = 0;
    await onTab("Pricing");
  },
  parameters: { controls: { disable: true } },
};

/**
 * Repaint the pill with `--roster-lt-pill` and set its ink with
 * `--roster-lt-text-active`. The ink defaults to `--roster-primary-500-ink`,
 * the ink of the pill's default fill, so a palette that sets that token gets
 * the right ink with no change.
 */
export const CustomPillAndInk: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("grid");
    return (
      <div style={{ ["--roster-lt-pill" as string]: "#fcd34d", ["--roster-lt-text-active" as string]: "#1c1917" }}>
        <LiquidTabs tabs={VIEW_TABS} activeTab={active} onChange={setActive} aria-label="View" />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(getComputedStyle(canvas.getByRole("tab", { name: "Grid" })).color).toBe("rgb(28, 25, 23)");
    await expect(getComputedStyle(canvas.getByTestId("liquid-tabs-pill")).backgroundColor).toBe("rgb(252, 211, 77)");
    await expect(getComputedStyle(canvas.getByRole("tab", { name: "List" })).color).not.toBe("rgb(28, 25, 23)");
  },
  parameters: { controls: { disable: true } },
};

/**
 * Right to left: the strip runs from the right, Left moves to the next tab and
 * Right to the previous, and the pill still sits on its tab.
 */
export const RightToLeft: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("grid");
    return (
      <div dir="rtl">
        <LiquidTabs tabs={VIEW_TABS} activeTab={active} onChange={setActive} aria-label="View" />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("tab", { name: "Grid" });
    const list = canvas.getByRole("tab", { name: "List" });
    await expect(grid.getBoundingClientRect().left).toBeGreaterThan(list.getBoundingClientRect().left);
    grid.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(list).toHaveFocus();
    await expect(list).toHaveAttribute("aria-selected", "true");
    const pill = canvas.getByTestId("liquid-tabs-pill");
    await waitFor(() =>
      expect(Math.abs(pill.getBoundingClientRect().left - list.getBoundingClientRect().left)).toBeLessThan(0.5),
    );
  },
  parameters: { controls: { disable: true } },
};

/**
 * When `activeTab` names no tab, no pill shows and the first tab takes the
 * tab stop, so the strip can still be reached from the keyboard.
 */
export const NothingSelected: Story = {
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("list");
    return (
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-4">
        <LiquidTabs tabs={VIEW_TABS} activeTab={active} onChange={setActive} aria-label="View" />
        <button type="button" onClick={() => setActive("")}>
          Clear selection
        </button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pill = canvas.getByTestId("liquid-tabs-pill");
    await expect(pill.style.opacity).toBe("1");
    // Cleared after it was showing: the pill must go, not stay where it was.
    await userEvent.click(canvas.getByRole("button", { name: "Clear selection" }));
    await expect(pill.style.opacity).toBe("0");
    await expect(canvas.getByRole("tab", { name: "Grid" })).toHaveAttribute("tabindex", "0");
    for (const tab of canvas.getAllByRole("tab")) await expect(tab).toHaveAttribute("aria-selected", "false");
  },
  parameters: { controls: { disable: true } },
};

/**
 * Under `prefers-reduced-motion` the pill moves to the new tab at once, with
 * no stretch and no squash. Turn on "Emulate CSS prefers-reduced-motion" in
 * your browser's rendering tools to see it. The play function checks whichever
 * mode the browser is in, and the test run includes a pass with it on.
 */
export const ReducedMotion: Story = {
  tags: ["reduced-motion"],
  args: { variant: "pill" } as LiquidTabsProps,
  render: () => {
    const [active, setActive] = useState("grid");
    return <LiquidTabs tabs={VIEW_TABS} activeTab={active} onChange={setActive} aria-label="View" />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Chart" }));
    const pill = canvas.getByTestId("liquid-tabs-pill");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await expect(pill.style.transition).toBe("none");
      await expect(pill.style.transform).toBe("scaleY(1)");
    } else {
      await expect(pill.style.transform).toBe("scaleY(0.55)");
    }
  },
  parameters: { controls: { disable: true } },
};
