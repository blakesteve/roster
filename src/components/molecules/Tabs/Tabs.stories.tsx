import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, type TabItem, type TabsProps } from "./Tabs";
import { TabPanel } from "./TabPanel";
import { LiquidTabs } from "../LiquidTabs/LiquidTabs";
import { KEY_FOCUS } from "../../../internal/key-focus";

const meta = {
  title: "Molecules/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "**Tabs** is a controlled tab strip. Plain by default: the selected tab is underlined on a rule that runs the strip's width. `variant=\"liquid\"` draws the sliding pill instead.",
          "",
          "### Keyboard and focus, in every variant",
          "The WAI tabs pattern. Only the selected tab is in the tab order (the first tab, if `activeTab` matches none). Left and Right move between tabs and wrap; Home and End go to the ends. `activation=\"automatic\"` (the default) selects as focus moves; `\"manual\"` moves focus only, and Enter or Space selects. Every tab is `type=\"button\"`, so a strip inside a form never submits it.",
          "",
          "### Plain",
          "The selected tab's ink is `--roster-tabs-text-active` and its underline is `--roster-tabs-indicator`, 2px, laid over a 1px rule in `--roster-tabs-border`. The others read `--roster-tabs-text`, and under the pointer darken to `--roster-tabs-text-hover` with a lighter underline, `--roster-tabs-indicator-hover`. Keyboard focus is Roster's ring, as on a Button. The weight never changes, so selecting a tab never moves the row. In forced colors the underline stays: it's a border, and forced colors keeps borders.",
          "",
          "### Liquid",
          "`variant=\"liquid\"` is the pill `LiquidTabs` has always drawn: `liquidStyle=\"pill\"` (the default) or `\"filled\"`, `fullWidth`, both sizes, and its `--roster-lt-*` tokens. It renders exactly what `LiquidTabs` does, markup and styles alike.",
          "",
          "### Counts and panels",
          "A tab takes `count`, a number in a small mark beside the label, drawn from the tab's own ink and read as part of its name (\"Open, 12 items\"). Pair a panel with `TabPanel`. Both work in every variant.",
          "",
          "### From LiquidTabs",
          "`LiquidTabs` is deprecated and keeps working. To move: rename it `Tabs`, add `variant=\"liquid\"`, and move `variant=\"filled\"` to `liquidStyle=\"filled\"`. `LiquidTabPanel` is now `TabPanel`, and `liquidTabId` is `tabId`. Nothing else changes.",
        ].join("\n"),
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    tabs: { control: false },
    activeTab: { control: false },
    onChange: { control: false },
    variant: {
      control: "inline-radio",
      options: ["plain", "liquid"],
      description: "`plain`: an underline. `liquid`: the sliding pill.",
      table: { defaultValue: { summary: "plain" } },
    },
    liquidStyle: {
      control: "inline-radio",
      options: ["pill", "filled"],
      description: "The liquid variant's look; only with `variant=\"liquid\"`.",
      table: { defaultValue: { summary: "pill" } },
    },
    fullWidth: { control: "boolean", table: { defaultValue: { summary: "false" } } },
    size: { control: "inline-radio", options: ["md", "lg"], table: { defaultValue: { summary: "md" } } },
    activation: { control: "inline-radio", options: ["automatic", "manual"], table: { defaultValue: { summary: "automatic" } } },
    id: { control: "text" },
    "aria-label": { control: "text" },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PROJECT_TABS: TabItem[] = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "files", label: "Files" },
  { id: "settings", label: "Settings" },
];

const QUEUE_TABS: TabItem[] = [
  { id: "open", label: "Open", count: 12 },
  { id: "review", label: "In review", count: 3 },
  { id: "done", label: "Done", count: 0 },
];

/* A light and a dark page side by side, the way an app shows either. */
const PAGE: Record<"light" | "dark", CSSProperties> = {
  light: { background: "#ffffff", color: "#1c1917" },
  dark: { background: "#0c0a09", color: "#f5f5f4" },
};

function Pages({ children, width = 380 }: { children: (scheme: "light" | "dark") => ReactNode; width?: number }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", border: "1px solid rgb(120 113 108 / 0.3)", borderRadius: 12, overflow: "hidden" }}>
      {(["light", "dark"] as const).map((scheme) => (
        <div key={scheme} className={scheme} style={{ ...PAGE[scheme], width, padding: 24, display: "grid", gap: 20, alignContent: "start" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.6 }}>{scheme}</p>
          {children(scheme)}
        </div>
      ))}
    </div>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <p style={{ margin: "0 0 8px", fontSize: 12, opacity: 0.7 }}>{children}</p>;
}

function Controlled(props: Omit<TabsProps, "activeTab" | "onChange"> & { initial?: string }) {
  const { initial, ...rest } = props;
  const [active, setActive] = useState(initial ?? rest.tabs[0]?.id ?? "");
  return <Tabs {...(rest as TabsProps)} activeTab={active} onChange={setActive} />;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: { tabs: PROJECT_TABS, activeTab: "overview", onChange: () => {}, variant: "plain", "aria-label": "Project" },
  render: function Render(args) {
    const [active, setActive] = useState(args.activeTab);
    const props = { ...args, liquidStyle: args.variant === "liquid" ? args.liquidStyle : undefined } as TabsProps;
    return (
      <div style={{ width: 440 }}>
        <Tabs {...props} activeTab={active} onChange={setActive} />
      </div>
    );
  },
};

/* The hover state, drawn without a pointer: the same tokens the hover rule
   reads, on one tab. A check holds it to a real hover, so it can't drift. */
const HOVER_SPECIMEN = `
[data-specimen="hover"] [data-tab-id="activity"] { color: var(--roster-tabs-text-hover); }
[data-specimen="hover"] [data-tab-id="activity"]::after { border-bottom: 2px solid var(--roster-tabs-indicator-hover); }
`;

/* Keyboard focus, drawn without a keyboard: the mark Roster's focus variant
   matches, so it's the component's own ring. A click anywhere clears every
   mark, so it's put back. */
function FocusSpecimen({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tab = ref.current?.querySelector('[aria-selected="true"]');
    if (!tab) return;
    const mark = () => {
      if (!tab.hasAttribute(KEY_FOCUS)) tab.setAttribute(KEY_FOCUS, "");
    };
    mark();
    const observer = new MutationObserver(mark);
    observer.observe(tab, { attributes: true, attributeFilter: [KEY_FOCUS] });
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} data-specimen="focus">
      {children}
    </div>
  );
}

export const TheLook: Story = {
  name: "Plain: the look",
  args: { tabs: PROJECT_TABS, activeTab: "overview", onChange: () => {} },
  render: () => (
    <>
      <style>{HOVER_SPECIMEN}</style>
      <Pages>
        {(scheme) => (
          <>
            <div>
              <Caption>Selected, and at rest</Caption>
              <Controlled tabs={PROJECT_TABS} aria-label={`Project, ${scheme}`} />
            </div>
            <div data-specimen="hover">
              <Caption>Under the pointer: Activity</Caption>
              <Tabs tabs={PROJECT_TABS} activeTab="overview" onChange={() => {}} aria-label={`Hover, ${scheme}`} />
            </div>
            <div>
              <Caption>Keyboard focus: Overview</Caption>
              <FocusSpecimen>
                <Tabs tabs={PROJECT_TABS} activeTab="overview" onChange={() => {}} aria-label={`Focus, ${scheme}`} />
              </FocusSpecimen>
            </div>
            <div>
              <Caption>With counts</Caption>
              <Controlled tabs={QUEUE_TABS} aria-label={`Queue, ${scheme}`} />
            </div>
          </>
        )}
      </Pages>
    </>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The plain variant's indicator, proposed: a 2px underline in the ring's color on a 1px rule, the selected label in full ink and the rest muted. " +
          "Under the pointer a tab darkens and takes a lighter underline, a hint that never reads as selected. Keyboard focus is Roster's own ring. " +
          "The first strip in each scheme is live: hover it, and Tab into it.",
      },
    },
  },
};

export const Liquid: Story = {
  args: { tabs: PROJECT_TABS, activeTab: "overview", onChange: () => {}, variant: "liquid" },
  render: () => (
    <Pages>
      {(scheme) => (
        <>
          <div>
            <Caption>liquidStyle=&quot;pill&quot; (the default)</Caption>
            <Controlled tabs={PROJECT_TABS} variant="liquid" aria-label={`Pill, ${scheme}`} />
          </div>
          <div>
            <Caption>liquidStyle=&quot;filled&quot;</Caption>
            <Controlled tabs={PROJECT_TABS.slice(0, 3)} variant="liquid" liquidStyle="filled" aria-label={`Filled, ${scheme}`} />
          </div>
        </>
      )}
    </Pages>
  ),
  parameters: {
    docs: {
      description: {
        story: "The sliding pill, in its two styles. Click a tab, or arrow along the strip, to watch it stretch and settle.",
      },
    },
  },
};

export const Counts: Story = {
  args: { tabs: QUEUE_TABS, activeTab: "open", onChange: () => {} },
  render: () => (
    <Pages>
      {(scheme) => (
        <>
          <Controlled tabs={QUEUE_TABS} aria-label={`Plain queue, ${scheme}`} />
          <Controlled tabs={QUEUE_TABS} variant="liquid" aria-label={`Liquid queue, ${scheme}`} />
        </>
      )}
    </Pages>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A `count` on a tab, in either variant. Zero shows. The mark is drawn from the tab's own ink, so it follows the tab through every state, and the count is part of the tab's name: \"Open, 12 items\".",
      },
    },
  },
};

export const FullWidthAndLarge: Story = {
  args: { tabs: PROJECT_TABS, activeTab: "overview", onChange: () => {}, fullWidth: true, size: "lg" },
  render: () => (
    <div style={{ width: 420 }}>
      <Controlled tabs={PROJECT_TABS.slice(0, 3)} fullWidth size="lg" aria-label="Sections" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "`fullWidth` gives every tab an equal share of the row, and `size=\"lg\"` makes each at least 44px tall, the WCAG 2.5.5 target.",
      },
    },
  },
};

export const ManualActivation: Story = {
  args: { tabs: PROJECT_TABS, activeTab: "overview", onChange: () => {}, activation: "manual" },
  render: () => (
    <div style={{ width: 440 }}>
      <Controlled tabs={PROJECT_TABS} activation="manual" aria-label="Report sections" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "With `activation=\"manual\"`, the arrows move focus without selecting; Enter or Space selects. For tabs that swap something costly.",
      },
    },
  },
};

function WithPanels() {
  const [view, setView] = useState("overview");
  return (
    <div style={{ width: 440, display: "grid", gap: 16 }}>
      <Tabs id="project" aria-label="Project" tabs={PROJECT_TABS.map((t) => ({ ...t, panelId: `project-${t.id}` }))} activeTab={view} onChange={setView} />
      {PROJECT_TABS.map((t) => (
        <TabPanel key={t.id} tabsId="project" id={`project-${t.id}`} tab={t.id} activeTab={view}>
          <p style={{ margin: 0 }}>The {String(t.label).toLowerCase()} of the project goes here.</p>
        </TabPanel>
      ))}
    </div>
  );
}

export const WithAPanel: Story = {
  args: { tabs: PROJECT_TABS, activeTab: "overview", onChange: () => {} },
  render: () => <WithPanels />,
  parameters: {
    docs: {
      description: {
        story: "A `TabPanel` per tab, each named for its tab. Give `Tabs` an `id`, each tab a `panelId`, and each panel the strip's `id` and its tab.",
      },
    },
  },
};

export const FromLiquidTabs: Story = {
  args: { tabs: PROJECT_TABS, activeTab: "overview", onChange: () => {}, variant: "liquid" },
  render: function Render() {
    const [a, setA] = useState("activity");
    const [b, setB] = useState("activity");
    return (
      <div style={{ display: "grid", gap: 16, width: 440 }}>
        <div>
          <Caption>{'<LiquidTabs variant="filled" … />'}</Caption>
          <LiquidTabs variant="filled" tabs={PROJECT_TABS} activeTab={a} onChange={setA} aria-label="Before" />
        </div>
        <div>
          <Caption>{'<Tabs variant="liquid" liquidStyle="filled" … />'}</Caption>
          <Tabs variant="liquid" liquidStyle="filled" tabs={PROJECT_TABS} activeTab={b} onChange={setB} aria-label="After" />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "The move from `LiquidTabs`: the same strip, before and after. `LiquidTabs` keeps working, so nothing has to move at once.",
      },
    },
  },
};
