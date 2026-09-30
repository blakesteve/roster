import { render, screen, fireEvent, act } from "@testing-library/react";
import { StrictMode } from "react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { LiquidTabs, type TabItem } from "./LiquidTabs";
import { liquidTabId } from "./liquid-tab-id";
import "@testing-library/jest-dom";
import type { FormEvent } from "react";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const THREE_TABS: TabItem[] = [
  { id: "alpha", label: "Alpha" },
  { id: "beta",  label: "Beta" },
  { id: "gamma", label: "Gamma" },
];

const TWO_TABS: TabItem[] = [
  { id: "card",  label: "Card" },
  { id: "badge", label: "Badge" },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LiquidTabs", () => {
  // ── Structure ──────────────────────────────────────────────────────────────

  it("renders the tablist container", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("renders a tab button for each item", () => {
    render(<LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={vi.fn()} />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("renders tab labels as text", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.getByText("Badge")).toBeInTheDocument();
  });

  it("renders the pill element", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tabs-pill")).toBeInTheDocument();
  });

  it("renders individual tab test ids", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tab-card")).toBeInTheDocument();
    expect(screen.getByTestId("liquid-tab-badge")).toBeInTheDocument();
  });

  // ── ARIA ──────────────────────────────────────────────────────────────────

  it("marks the active tab as selected", () => {
    render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tab-beta")).toHaveAttribute("aria-selected", "true");
  });

  it("marks inactive tabs as not selected", () => {
    render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tab-alpha")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("liquid-tab-gamma")).toHaveAttribute("aria-selected", "false");
  });

  it("updates aria-selected when activeTab prop changes", () => {
    const { rerender } = render(
      <LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={vi.fn()} />,
    );
    expect(screen.getByTestId("liquid-tab-alpha")).toHaveAttribute("aria-selected", "true");
    rerender(<LiquidTabs tabs={THREE_TABS} activeTab="gamma" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tab-alpha")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("liquid-tab-gamma")).toHaveAttribute("aria-selected", "true");
  });

  // ── Interaction ────────────────────────────────────────────────────────────

  it("calls onChange with the clicked tab id", () => {
    const onChange = vi.fn();
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("liquid-tab-badge"));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith("badge");
  });

  it("does not call onChange when clicking the already-active tab", () => {
    const onChange = vi.fn();
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("liquid-tab-card"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange for each different tab clicked", () => {
    const onChange = vi.fn();
    render(<LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("liquid-tab-beta"));
    fireEvent.click(screen.getByTestId("liquid-tab-gamma"));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, "beta");
    expect(onChange).toHaveBeenNthCalledWith(2, "gamma");
  });

  // ── Active tab styling ─────────────────────────────────────────────────────

  it("inks the active tab from the pill's ink token, not a literal white", () => {
    /* A literal white could not survive a light pill: a consumer who moved
       primary-500 to a brighter fill measured 3.27:1 and had to reach in
       through `[role="tab"][aria-selected="true"]`. */
    render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
    const active = screen.getByTestId("liquid-tab-beta");
    expect(active).toHaveClass("rst:text-(--roster-lt-text-active)");
    expect(active).not.toHaveClass("rst:text-white");
  });

  it("applies muted text color to inactive tabs", () => {
    render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tab-alpha")).toHaveClass("rst:text-(--roster-lt-text-inactive)");
    expect(screen.getByTestId("liquid-tab-gamma")).toHaveClass("rst:text-(--roster-lt-text-inactive)");
  });

  // ── Variant: pill (default) ────────────────────────────────────────────────

  it("applies pill container classes by default", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    const container = screen.getByTestId("liquid-tabs");
    expect(container).toHaveClass("rst:rounded-xl");
    expect(container).toHaveClass("rst:p-1");
  });

  it("defaults to w-fit in pill variant", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tabs")).toHaveClass("rst:w-fit");
  });

  it("applies w-full when fullWidth is true in pill variant", () => {
    render(
      <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} fullWidth />,
    );
    expect(screen.getByTestId("liquid-tabs")).toHaveClass("rst:w-full");
  });

  it("applies flex-1 to pill buttons when fullWidth is true", () => {
    render(
      <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} fullWidth />,
    );
    screen.getAllByRole("tab").forEach((btn) => {
      expect(btn).toHaveClass("rst:flex-1");
    });
  });

  it("applies px-4 to pill buttons when fullWidth is false", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    screen.getAllByRole("tab").forEach((btn) => {
      expect(btn).toHaveClass("rst:px-4");
    });
  });

  // ── Variant: filled ────────────────────────────────────────────────────────

  it("applies filled container classes for filled variant", () => {
    render(
      <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} variant="filled" />,
    );
    const container = screen.getByTestId("liquid-tabs");
    expect(container).toHaveClass("rst:w-full");
    expect(container).toHaveClass("rst:overflow-hidden");
    expect(container).toHaveClass("rst:rounded-lg");
  });

  it("does not apply pill padding in filled variant", () => {
    render(
      <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} variant="filled" />,
    );
    expect(screen.getByTestId("liquid-tabs")).not.toHaveClass("rst:p-1");
  });

  it("applies flex-1 to filled buttons", () => {
    render(
      <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} variant="filled" />,
    );
    screen.getAllByRole("tab").forEach((btn) => {
      expect(btn).toHaveClass("rst:flex-1");
    });
  });

  // ── className ──────────────────────────────────────────────────────────────

  it("applies className to the container", () => {
    render(
      <LiquidTabs
        tabs={TWO_TABS}
        activeTab="card"
        onChange={vi.fn()}
        className="rst:my-custom-class"
      />,
    );
    expect(screen.getByTestId("liquid-tabs")).toHaveClass("rst:my-custom-class");
  });

  // ── Label render function ──────────────────────────────────────────────────

  it("calls label render function with true for the active tab", () => {
    const labelFn = vi.fn((isActive: boolean) => (isActive ? "Active" : "Inactive"));
    const tabs: TabItem[] = [{ id: "a", label: labelFn }];
    render(<LiquidTabs tabs={tabs} activeTab="a" onChange={vi.fn()} />);
    expect(labelFn).toHaveBeenCalledWith(true);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("calls label render function with false for inactive tabs", () => {
    const labelFn = vi.fn((isActive: boolean) => (isActive ? "Active" : "Inactive"));
    const tabs: TabItem[] = [
      { id: "a", label: "A" },
      { id: "b", label: labelFn },
    ];
    render(<LiquidTabs tabs={tabs} activeTab="a" onChange={vi.fn()} />);
    expect(labelFn).toHaveBeenCalledWith(false);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it("renders a single tab correctly", () => {
    const single: TabItem[] = [{ id: "only", label: "Only" }];
    render(<LiquidTabs tabs={single} activeTab="only" onChange={vi.fn()} />);
    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(screen.getByTestId("liquid-tab-only")).toHaveAttribute("aria-selected", "true");
  });

  it("renders many tabs without errors", () => {
    const many: TabItem[] = Array.from({ length: 6 }, (_, i) => ({
      id: `t${i}`,
      label: `Tab ${i}`,
    }));
    render(<LiquidTabs tabs={many} activeTab="t0" onChange={vi.fn()} />);
    expect(screen.getAllByRole("tab")).toHaveLength(6);
  });

  // ── Form safety ────────────────────────────────────────────────────────────

  it("gives every tab type=button, so a tab inside a form never submits it", () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={vi.fn()} />
      </form>,
    );
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveAttribute("type", "button");
    }
    fireEvent.click(screen.getByTestId("liquid-tab-beta"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // ── Roving focus and keyboard (WAI tabs pattern) ──────────────────────────

  describe("roving focus", () => {
    it("puts only the selected tab in the tab order", () => {
      render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
      expect(screen.getByTestId("liquid-tab-alpha")).toHaveAttribute("tabindex", "-1");
      expect(screen.getByTestId("liquid-tab-beta")).toHaveAttribute("tabindex", "0");
      expect(screen.getByTestId("liquid-tab-gamma")).toHaveAttribute("tabindex", "-1");
    });

    it("makes the first tab the stop when activeTab matches none", () => {
      render(<LiquidTabs tabs={THREE_TABS} activeTab="nope" onChange={vi.fn()} />);
      expect(screen.getByTestId("liquid-tab-alpha")).toHaveAttribute("tabindex", "0");
      expect(screen.getByTestId("liquid-tab-beta")).toHaveAttribute("tabindex", "-1");
    });

    it("tabs into the strip once and out of it on the next Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>before</button>
          <LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />
          <button>after</button>
        </>,
      );
      await user.click(screen.getByText("before"));
      await user.tab();
      expect(screen.getByTestId("liquid-tab-beta")).toHaveFocus();
      await user.tab();
      expect(screen.getByText("after")).toHaveFocus();
    });
  });

  describe("keyboard, automatic activation", () => {
    const setup = (activeTab = "alpha") => {
      const onChange = vi.fn();
      render(<LiquidTabs tabs={THREE_TABS} activeTab={activeTab} onChange={onChange} />);
      screen.getByTestId(`liquid-tab-${activeTab}`).focus();
      return onChange;
    };

    it("ArrowRight moves focus and selects the next tab", async () => {
      const onChange = setup("alpha");
      await userEvent.keyboard("{ArrowRight}");
      expect(screen.getByTestId("liquid-tab-beta")).toHaveFocus();
      expect(onChange).toHaveBeenCalledWith("beta");
    });

    it("ArrowRight wraps from the last tab to the first", async () => {
      const onChange = setup("gamma");
      await userEvent.keyboard("{ArrowRight}");
      expect(screen.getByTestId("liquid-tab-alpha")).toHaveFocus();
      expect(onChange).toHaveBeenCalledWith("alpha");
    });

    it("ArrowLeft wraps from the first tab to the last", async () => {
      const onChange = setup("alpha");
      await userEvent.keyboard("{ArrowLeft}");
      expect(screen.getByTestId("liquid-tab-gamma")).toHaveFocus();
      expect(onChange).toHaveBeenCalledWith("gamma");
    });

    it("Home and End go to the ends", async () => {
      const onChange = setup("beta");
      await userEvent.keyboard("{End}");
      expect(screen.getByTestId("liquid-tab-gamma")).toHaveFocus();
      expect(onChange).toHaveBeenLastCalledWith("gamma");
      await userEvent.keyboard("{Home}");
      expect(screen.getByTestId("liquid-tab-alpha")).toHaveFocus();
      expect(onChange).toHaveBeenLastCalledWith("alpha");
    });

    it("ignores other keys", async () => {
      const onChange = setup("alpha");
      await userEvent.keyboard("{ArrowDown}");
      expect(screen.getByTestId("liquid-tab-alpha")).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("the tab stop follows focus", () => {
    it("leaves the strip on Tab from a tab that is focused but not selected", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>before</button>
          <LiquidTabs tabs={THREE_TABS} activeTab="gamma" onChange={vi.fn()} activation="manual" />
          <button>after</button>
        </>,
      );
      await user.click(screen.getByText("before"));
      await user.tab();
      expect(screen.getByTestId("liquid-tab-gamma")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(screen.getByTestId("liquid-tab-alpha")).toHaveFocus();
      /* Without the stop following focus, gamma (still selected, still 0)
         would come next in the tab order, after alpha. */
      await user.tab();
      expect(screen.getByText("after")).toHaveFocus();
    });

    it.each([
      ["after", "gamma", "{ArrowLeft}", "beta"],
      ["before", "alpha", "{ArrowRight}", "beta"],
    ])(
      "Tab leaves from an unselected tab, and Shift+Tab back in lands on the selected tab (selected %s it)",
      async (_order, selected, arrow, unselected) => {
        /* The WAI-ARIA tabs pattern in manual activation: Tab into the
           tablist lands on the selected tab, and once focus has left, the
           roving tab stop is the selected tab again. */
        const user = userEvent.setup();
        render(
          <>
            <button>before</button>
            <LiquidTabs tabs={THREE_TABS} activeTab={selected} onChange={vi.fn()} activation="manual" />
            <button>after</button>
          </>,
        );
        screen.getByTestId(`liquid-tab-${selected}`).focus();
        await user.keyboard(arrow);
        expect(screen.getByTestId(`liquid-tab-${unselected}`)).toHaveFocus();
        expect(screen.getByTestId(`liquid-tab-${unselected}`)).toHaveAttribute("aria-selected", "false");

        await user.tab();
        expect(screen.getByText("after")).toHaveFocus();

        await user.tab({ shift: true });
        expect(screen.getByTestId(`liquid-tab-${selected}`)).toHaveFocus();
      },
    );

    it("returns the stop to the selected tab once focus leaves", async () => {
      const user = userEvent.setup();
      render(
        <>
          <LiquidTabs tabs={THREE_TABS} activeTab="gamma" onChange={vi.fn()} activation="manual" />
          <button>after</button>
        </>,
      );
      screen.getByTestId("liquid-tab-gamma").focus();
      await user.keyboard("{Home}");
      expect(screen.getByTestId("liquid-tab-alpha")).toHaveAttribute("tabindex", "0");
      await user.click(screen.getByText("after"));
      expect(screen.getByTestId("liquid-tab-alpha")).toHaveAttribute("tabindex", "-1");
      expect(screen.getByTestId("liquid-tab-gamma")).toHaveAttribute("tabindex", "0");
    });
  });

  describe("keyboard, right to left", () => {
    it("swaps Left and Right, so Left moves forward", async () => {
      const onChange = vi.fn();
      vi.spyOn(window, "getComputedStyle").mockImplementation(
        () => ({ direction: "rtl" }) as CSSStyleDeclaration,
      );
      try {
        render(<LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={onChange} />);
        screen.getByTestId("liquid-tab-alpha").focus();
        await userEvent.keyboard("{ArrowLeft}");
        expect(screen.getByTestId("liquid-tab-beta")).toHaveFocus();
        expect(onChange).toHaveBeenCalledWith("beta");
      } finally {
        vi.restoreAllMocks();
      }
    });
  });

  describe("keyboard, manual activation", () => {
    it("moves focus without selecting, and Enter or Space selects", async () => {
      const onChange = vi.fn();
      render(
        <LiquidTabs
          tabs={THREE_TABS}
          activeTab="alpha"
          onChange={onChange}
          activation="manual"
        />,
      );
      screen.getByTestId("liquid-tab-alpha").focus();

      await userEvent.keyboard("{ArrowRight}");
      expect(screen.getByTestId("liquid-tab-beta")).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();

      await userEvent.keyboard("{Enter}");
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith("beta");

      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard(" ");
      expect(onChange).toHaveBeenLastCalledWith("gamma");
    });
  });

  // ── Naming and wiring ──────────────────────────────────────────────────────

  describe("naming and ids", () => {
    it("names the tablist with aria-label or aria-labelledby", () => {
      const { rerender } = render(
        <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} aria-label="Views" />,
      );
      expect(screen.getByRole("tablist", { name: "Views" })).toBeInTheDocument();
      rerender(
        <>
          <h2 id="views-heading">Embed as</h2>
          <LiquidTabs
            tabs={TWO_TABS}
            activeTab="card"
            onChange={vi.fn()}
            aria-labelledby="views-heading"
          />
        </>,
      );
      expect(screen.getByRole("tablist", { name: "Embed as" })).toBeInTheDocument();
    });

    it("gives each tab a predictable id from the list id", () => {
      render(<LiquidTabs id="views" tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
      expect(screen.getByRole("tablist")).toHaveAttribute("id", "views");
      /* Literal, not recomputed from the helper, so a change to the format is
         a failing test rather than a silently moved target. */
      expect(screen.getByTestId("liquid-tab-card")).toHaveAttribute("id", "views-tab-card");
      expect(screen.getByTestId("liquid-tab-badge")).toHaveAttribute("id", "views-tab-badge");
      expect(liquidTabId("views", "badge")).toBe("views-tab-badge");
    });

    it("generates distinct ids for two strips that name none", () => {
      render(
        <>
          <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />
          <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />
        </>,
      );
      const ids = screen.getAllByTestId("liquid-tab-card").map((t) => t.id);
      expect(ids[0]).not.toBe("");
      expect(ids[0]).not.toBe(ids[1]);
    });

    it("sets aria-controls only from a panel id the consumer passes", () => {
      render(
        <LiquidTabs
          tabs={[
            { id: "a", label: "A", panelId: "panel-a" },
            { id: "b", label: "B" },
          ]}
          activeTab="a"
          onChange={vi.fn()}
        />,
      );
      expect(screen.getByTestId("liquid-tab-a")).toHaveAttribute("aria-controls", "panel-a");
      expect(screen.getByTestId("liquid-tab-b")).not.toHaveAttribute("aria-controls");
    });

    it("lets a panel take its name from its tab", () => {
      render(
        <>
          <LiquidTabs
            id="v"
            tabs={[{ id: "grid", label: "Grid", panelId: "v-panel" }]}
            activeTab="grid"
            onChange={vi.fn()}
          />
          <div role="tabpanel" id="v-panel" aria-labelledby={liquidTabId("v", "grid")} />
        </>,
      );
      expect(screen.getByRole("tabpanel", { name: "Grid" })).toBeInTheDocument();
    });
  });

  // ── Size and focus style ───────────────────────────────────────────────────

  describe("size", () => {
    it("lg makes every tab at least 44px tall, in both variants", () => {
      for (const variant of ["pill", "filled"] as const) {
        const { unmount } = render(
          <LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} size="lg" variant={variant} />,
        );
        for (const tab of screen.getAllByRole("tab")) {
          expect(tab).toHaveClass("rst:min-h-11");
        }
        unmount();
      }
    });

    it("md, the default, keeps today's heights", () => {
      render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
      for (const tab of screen.getAllByRole("tab")) {
        expect(tab).not.toHaveClass("rst:min-h-11");
        expect(tab).toHaveClass("rst:py-1.5");
      }
    });
  });

  it("paints the active tab in the pill's color until the pill is measured", () => {
    /* Server-rendered HTML has no measured pill; without this the active
       label is its ink on the strip's background, white on white. */
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    const active = screen.getByTestId("liquid-tab-card");
    expect(active).toHaveClass("rst:bg-(--roster-lt-pill)", "rst:in-data-[pill-ready]:bg-transparent");
    expect(screen.getByTestId("liquid-tab-badge").className).not.toMatch(/lt-pill/);
  });

  it("draws its own focus-visible outline, inside the tab, in the tab's ink", () => {
    render(<LiquidTabs tabs={TWO_TABS} activeTab="card" onChange={vi.fn()} />);
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveClass(
        "rst:focus-visible:outline-2",
        "rst:focus-visible:-outline-offset-4",
        "rst:focus-visible:outline-current",
      );
    }
  });
});

// ─── The pill ─────────────────────────────────────────────────────────────────

/* jsdom has no layout, so these tests supply one. The strip's border box
   starts at x=100 with a 2px border; each tab's border box is where its entry
   below says, in viewport coordinates. `scrollLeft` is the strip's horizontal
   scroll. Everything else measures zero, which is jsdom's own answer. */
type Layout = { clientLeft: number; scrollLeft: number; tabs: Record<string, [number, number]> };

function useLayout(layout: Layout) {
  const rect = (left: number, width: number) =>
    ({ left, width, top: 0, height: 32, right: left + width, bottom: 32, x: left, y: 0 }) as DOMRect;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.dataset.testid === "liquid-tabs") return rect(100, 400);
    const id = this.dataset.tabId;
    if (id && layout.tabs[id]) return rect(...layout.tabs[id]);
    return rect(0, 0);
  });
  vi.spyOn(Element.prototype, "clientLeft", "get").mockImplementation(function (this: Element) {
    return (this as HTMLElement).dataset?.testid === "liquid-tabs" ? layout.clientLeft : 0;
  });
  vi.spyOn(Element.prototype, "scrollLeft", "get").mockImplementation(function (this: Element) {
    return (this as HTMLElement).dataset?.testid === "liquid-tabs" ? layout.scrollLeft : 0;
  });
}

function setReducedMotion(reduce: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: reduce && query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

const pill = () => screen.getByTestId("liquid-tabs-pill");

describe("LiquidTabs pill", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("marks the strip once the pill is placed, and only then", () => {
    useLayout({ clientLeft: 1, scrollLeft: 0, tabs: { alpha: [101, 80], beta: [181, 80], gamma: [261, 80] } });
    render(<LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tabs")).toHaveAttribute("data-pill-ready");
  });

  it("does not mark the strip when there is nothing to place", () => {
    render(<LiquidTabs tabs={THREE_TABS} activeTab="nope" onChange={vi.fn()} />);
    expect(screen.getByTestId("liquid-tabs")).not.toHaveAttribute("data-pill-ready");
  });

  it("does not squash the pill on StrictMode's second run", () => {
    setReducedMotion(false);
    useLayout({ clientLeft: 1, scrollLeft: 0, tabs: { alpha: [101, 80], beta: [181, 80], gamma: [261, 80] } });
    render(
      <StrictMode>
        <LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />
      </StrictMode>,
    );
    expect(pill().style.transform).toBe("scaleY(1)");
    expect(pill().style.transition).toBe("none");
    expect(pill().style.left).toBe("80px");
  });

  it("sits on the padding edge, not one border-width to the right", () => {
    /* Tab alpha's border box starts at 102: the strip's left edge (100) plus
       its 2px border. Measured from the border edge that is 2; the pill is
       positioned from the padding edge, where it is 0. The old code wrote 2. */
    useLayout({ clientLeft: 2, scrollLeft: 0, tabs: { alpha: [102, 80], beta: [182, 80], gamma: [262, 80] } });
    render(<LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={vi.fn()} />);
    expect(pill().style.left).toBe("0px");
    expect(pill().style.width).toBe("80px");
    expect(pill().style.opacity).toBe("1");
  });

  it("accounts for the strip's own horizontal scroll", () => {
    /* Gamma starts 160px into the content. Scrolled 50px, its border box is on
       screen at 100 + 2 + 160 - 50 = 212. The pill scrolls with the content,
       so its left is the content offset, 160. */
    useLayout({ clientLeft: 2, scrollLeft: 50, tabs: { alpha: [52, 80], beta: [132, 80], gamma: [212, 80] } });
    render(<LiquidTabs tabs={THREE_TABS} activeTab="gamma" onChange={vi.fn()} />);
    expect(pill().style.left).toBe("160px");
  });

  it("follows activeTab, never the click", () => {
    useLayout({ clientLeft: 1, scrollLeft: 0, tabs: { alpha: [101, 80], beta: [181, 80], gamma: [261, 80] } });
    const onChange = vi.fn();
    render(<LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={onChange} />);
    expect(pill().style.left).toBe("0px");

    /* The consumer hears about the click and, here, declines it. */
    fireEvent.click(screen.getByTestId("liquid-tab-gamma"));
    expect(onChange).toHaveBeenCalledWith("gamma");
    expect(pill().style.left).toBe("0px");
    expect(pill().style.width).toBe("80px");
  });

  it("stretches across the gap, then settles, when activeTab changes", () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    useLayout({ clientLeft: 1, scrollLeft: 0, tabs: { alpha: [101, 80], beta: [181, 80], gamma: [261, 80] } });
    const { rerender } = render(
      <LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={vi.fn()} />,
    );
    rerender(<LiquidTabs tabs={THREE_TABS} activeTab="gamma" onChange={vi.fn()} />);

    // Phase 1: spans alpha's left (0) to gamma's right (160 + 80).
    expect(pill().style.left).toBe("0px");
    expect(pill().style.width).toBe("240px");
    expect(pill().style.transform).toBe("scaleY(0.55)");

    act(() => vi.advanceTimersByTime(130));

    // Phase 2: on gamma.
    expect(pill().style.left).toBe("160px");
    expect(pill().style.width).toBe("80px");
    expect(pill().style.transform).toBe("scaleY(1)");
    expect(pill().style.transition).toContain("160ms");
  });

  it("moves without stretching or animating under reduced motion", () => {
    setReducedMotion(true);
    useLayout({ clientLeft: 1, scrollLeft: 0, tabs: { alpha: [101, 80], beta: [181, 80], gamma: [261, 80] } });
    const { rerender } = render(
      <LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={vi.fn()} />,
    );
    rerender(<LiquidTabs tabs={THREE_TABS} activeTab="gamma" onChange={vi.fn()} />);
    expect(pill().style.left).toBe("160px");
    expect(pill().style.width).toBe("80px");
    expect(pill().style.transform).toBe("scaleY(1)");
    expect(pill().style.transition).toBe("none");
  });

  it("hides when activeTab matches no tab", () => {
    useLayout({ clientLeft: 1, scrollLeft: 0, tabs: { alpha: [101, 80], beta: [181, 80], gamma: [261, 80] } });
    const { rerender } = render(
      <LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={vi.fn()} />,
    );
    expect(pill().style.opacity).toBe("1");
    rerender(<LiquidTabs tabs={THREE_TABS} activeTab="nope" onChange={vi.fn()} />);
    expect(pill().style.opacity).toBe("0");
  });

  it("observes every tab as well as the strip", () => {
    const observed: Element[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe(el: Element) {
          observed.push(el);
        }
        unobserve() {}
        disconnect() {}
      },
    );
    render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
    expect(observed).toContain(screen.getByTestId("liquid-tabs"));
    for (const tab of screen.getAllByRole("tab")) expect(observed).toContain(tab);
  });

  it("re-measures when web fonts arrive", async () => {
    const layout: Layout = { clientLeft: 1, scrollLeft: 0, tabs: { alpha: [101, 80], beta: [181, 80], gamma: [261, 80] } };
    useLayout(layout);
    let loaded!: () => void;
    const ready = new Promise<void>((r) => (loaded = r));
    Object.defineProperty(document, "fonts", { value: { ready }, configurable: true });
    try {
      render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
      expect(pill().style.width).toBe("80px");
      layout.tabs = { alpha: [101, 90], beta: [191, 90], gamma: [281, 90] };
      await act(async () => {
        loaded();
        await ready;
      });
      expect(pill().style.left).toBe("90px");
      expect(pill().style.width).toBe("90px");
    } finally {
      Reflect.deleteProperty(document, "fonts");
    }
  });

  it("lets an animation in flight finish rather than snapping it on resize", () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    useLayout({ clientLeft: 1, scrollLeft: 0, tabs: { alpha: [101, 80], beta: [181, 80], gamma: [261, 80] } });
    const callbacks: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          callbacks.push(cb);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const { rerender } = render(<LiquidTabs tabs={THREE_TABS} activeTab="alpha" onChange={vi.fn()} />);
    rerender(<LiquidTabs tabs={THREE_TABS} activeTab="gamma" onChange={vi.fn()} />);
    expect(pill().style.width).toBe("240px");
    act(() => callbacks.forEach((cb) => cb([], {} as ResizeObserver)));
    // Still stretching: the resize did not cut it short.
    expect(pill().style.width).toBe("240px");
    expect(pill().style.transform).toBe("scaleY(0.55)");
    act(() => vi.advanceTimersByTime(130));
    expect(pill().style.left).toBe("160px");
  });

  it("re-measures when the strip resizes", () => {
    const layout: Layout = { clientLeft: 1, scrollLeft: 0, tabs: { alpha: [101, 80], beta: [181, 80], gamma: [261, 80] } };
    useLayout(layout);
    const callbacks: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          callbacks.push(cb);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    render(<LiquidTabs tabs={THREE_TABS} activeTab="beta" onChange={vi.fn()} />);
    expect(pill().style.left).toBe("80px");

    // A wider viewport: every tab grows to 120px.
    layout.tabs = { alpha: [101, 120], beta: [221, 120], gamma: [341, 120] };
    act(() => callbacks.forEach((cb) => cb([], {} as ResizeObserver)));
    expect(pill().style.left).toBe("120px");
    expect(pill().style.width).toBe("120px");
  });
});
