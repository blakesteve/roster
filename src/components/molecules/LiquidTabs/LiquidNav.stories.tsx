import { createContext, useContext, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { LiquidNav, type LiquidNavItem, type LiquidNavLinkProps } from "./LiquidNav";

const ITEMS: LiquidNavItem[] = [
  { id: "overview", label: "Overview", href: "#overview" },
  { id: "activity", label: "Activity", href: "#activity" },
  { id: "settings", label: "Settings", href: "#settings" },
];

const meta = {
  title: "Molecules/LiquidNav",
  component: LiquidNav,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "`LiquidTabs`' strip and pill, for navigation between routes: a `nav` of links rather than a tablist of buttons.",
          "",
          "A separate component rather than a mode, because the two are different things to assistive technology. Tabs switch panels on one page, take a single tab stop and move by arrow keys. Links go somewhere: each is its own tab stop, as in any nav, and the current one carries `aria-current=\"page\"`.",
          "",
          "`activeTab` names the current item, usually from the route, and the pill follows it. `onChange` is optional and fires on a plain left click; a modified or middle click opens elsewhere and does nothing.",
          "",
          "**Routers.** `linkComponent` renders each link and receives `href` and `to` with the same value, so `next/link`, React Router's `Link` and a plain `<a>` all work unchanged, plus `className`, `children`, `aria-current`, `onClick` and `data-tab-id`. Forward `data-tab-id` to the DOM: the pill finds its item by it. The props type is exported as `LiquidNavLinkProps`.",
          "",
          "**Pass `linkComponent` from a client component.** Functions can not cross the React Server Component boundary, so handing `next/link` over from a server layout fails the render. Bind it in a small `\"use client\"` wrapper:",
          "",
          "```tsx",
          "\"use client\";",
          "import NextLink from \"next/link\";",
          "import { usePathname } from \"next/navigation\";",
          "import { LiquidNav } from \"@blakesteve/roster\";",
          "",
          "const ITEMS = [",
          "  { id: \"overview\", label: \"Overview\", href: \"/project\" },",
          "  { id: \"activity\", label: \"Activity\", href: \"/project/activity\" },",
          "];",
          "",
          "export function SectionNav() {",
          "  const path = usePathname();",
          "  // Exact match: a prefix test would light /project for every page under it.",
          "  const active = ITEMS.find((i) => path === i.href)?.id ?? \"\";",
          "  return <LiquidNav aria-label=\"Sections\" items={ITEMS} activeTab={active} linkComponent={NextLink} />;",
          "}",
          "```",
          "",
          "React Router's `Link` works the same way: it reads `to`.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["pill", "filled"] },
    size: { control: "inline-radio", options: ["md", "lg"] },
    fullWidth: { control: "boolean" },
    "aria-label": { control: "text" },
    items: { control: false },
    activeTab: { control: false },
    linkComponent: { control: false },
  },
} satisfies Meta<typeof LiquidNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A stand-in for a router: it records navigation instead of leaving the page.
 * The link component is defined once, outside any render, as a real one would
 * be; one made inside a render is a new component every time, and React
 * remounts every link, dropping focus to `<body>`.
 */
const NavigateContext = createContext<(to: string) => void>(() => {});

function FakeRouterLink({ to, href, onClick, ...props }: LiquidNavLinkProps) {
  const navigate = useContext(NavigateContext);
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        navigate(to);
      }}
    />
  );
}

function FakeRouter({ initial, children }: { initial: string; children: (path: string) => ReactNode }) {
  const [path, setPath] = useState(initial);
  return <NavigateContext.Provider value={setPath}>{children(path)}</NavigateContext.Provider>;
}

const activeFor = (path: string) => ITEMS.find((i) => i.href === path)?.id ?? "";

export const Default: Story = {
  args: { items: ITEMS, activeTab: "overview", "aria-label": "Sections", variant: "pill", size: "md" },
  render: (args) => (
    <FakeRouter initial="#overview">
      {(path) => (
        <LiquidNav {...args} items={ITEMS} activeTab={activeFor(path)} linkComponent={FakeRouterLink} />
      )}
    </FakeRouter>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Sections" });
    await expect(canvas.queryByRole("tab")).not.toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");

    const settings = canvas.getByRole("link", { name: "Settings" });
    await userEvent.click(settings);
    await expect(settings).toHaveAttribute("aria-current", "page");
    // The same element: navigating did not remount the links.
    await expect(canvas.getByRole("link", { name: "Settings" })).toBe(settings);
    await expect(canvas.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");

    // Every link is its own tab stop.
    canvas.getByRole("link", { name: "Overview" }).focus();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Activity" })).toHaveFocus();
    await expect(nav).toContainElement(document.activeElement as HTMLElement);
  },
};

/** The same sizes and variants as the tabs. */
export const LargeFilled: Story = {
  args: { items: ITEMS, activeTab: "activity" },
  render: () => (
    <FakeRouter initial="#activity">
      {(path) => (
        <div style={{ width: 320 }}>
          <LiquidNav
            aria-label="Sections"
            items={ITEMS}
            activeTab={activeFor(path)}
            linkComponent={FakeRouterLink}
            variant="filled"
            size="lg"
          />
        </div>
      )}
    </FakeRouter>
  ),
  play: async ({ canvasElement }) => {
    for (const link of within(canvasElement).getAllByRole("link")) {
      await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    }
  },
  parameters: { controls: { disable: true } },
};

/**
 * Both variants and both sizes, on a light and a dark surface.
 */
export const Variants: Story = {
  args: { items: ITEMS, activeTab: "overview" },
  render: () => (
    <div className="rst:flex rst:flex-col rst:gap-4">
      {["light", "dark"].map((scheme) => (
        <div
          key={scheme}
          className={scheme === "dark" ? "dark rst:rounded-xl rst:bg-gray-950 rst:p-6" : "rst:rounded-xl rst:bg-white rst:p-6"}
        >
          <div className="rst:flex rst:flex-col rst:gap-4" style={{ width: 320 }}>
            <LiquidNav aria-label={`${scheme} pill md`} items={ITEMS} activeTab="overview" />
            <LiquidNav aria-label={`${scheme} pill lg`} items={ITEMS} activeTab="activity" size="lg" />
            <LiquidNav aria-label={`${scheme} filled md`} items={ITEMS} activeTab="settings" variant="filled" />
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["light pill lg", "dark pill lg"]) {
      for (const link of within(canvas.getByRole("navigation", { name })).getAllByRole("link")) {
        await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
      }
    }
    // Each current item has the pill under it.
    for (const nav of canvas.getAllByRole("navigation")) {
      const current = within(nav).getByRole("link", { current: "page" }).getBoundingClientRect();
      const pill = within(nav).getByTestId("liquid-tabs-pill").getBoundingClientRect();
      await expect(Math.abs(pill.left - current.left)).toBeLessThan(0.5);
    }
  },
  parameters: { controls: { disable: true } },
};

/**
 * A modified or middle click opens the link elsewhere, so it changes nothing
 * here: no `onChange`, and the current item stays current.
 */
export const ModifiedClick: Story = {
  args: { items: ITEMS, activeTab: "overview", onChange: fn() },
  render: (args) => (
    <FakeRouter initial="#overview">
      {(path) => (
        <LiquidNav
          aria-label="Sections"
          items={ITEMS}
          activeTab={activeFor(path)}
          onChange={args.onChange}
          linkComponent={FakeRouterLink}
        />
      )}
    </FakeRouter>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const settings = canvas.getByRole("link", { name: "Settings" });
    /* Dispatched by hand and canceled on `document`, after React has seen
       it, so the story opens no tab. Canceled any earlier, LiquidNav's own
       `defaultPrevented` check would return first and the modifier checks
       would go untested. */
    for (const init of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init });
      document.addEventListener("click", (e) => e.preventDefault(), { once: true });
      settings.dispatchEvent(click);
    }
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(canvas.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");

    // A plain click does reach it.
    await userEvent.click(settings);
    await expect(args.onChange).toHaveBeenCalledWith("settings");
    await expect(settings).toHaveAttribute("aria-current", "page");
  },
};

/**
 * With no `linkComponent`, each item is a plain `<a>`: right for a static
 * site, a full page load inside a router.
 */
export const PlainAnchors: Story = {
  args: { items: ITEMS, activeTab: "activity" },
  render: () => <LiquidNav aria-label="Sections" items={ITEMS} activeTab="activity" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const activity = canvas.getByRole("link", { name: "Activity" });
    await expect(activity.tagName).toBe("A");
    await expect(activity).toHaveAttribute("href", "#activity");
    await expect(activity).toHaveAttribute("aria-current", "page");
    await expect(activity).not.toHaveAttribute("to");
  },
  parameters: { controls: { disable: true } },
};

