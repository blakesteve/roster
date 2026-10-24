import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom";
import { useState, type FormEvent } from "react";
import { Tabs, type TabItem, type TabsProps } from "./Tabs";
import { tabId } from "./tab-id";
import { LiquidTabs } from "../LiquidTabs/LiquidTabs";
import { liquidTabId } from "../LiquidTabs/liquid-tab-id";

const TABS: TabItem[] = [
  { id: "alpha", label: "Alpha" },
  { id: "beta", label: "Beta" },
  { id: "gamma", label: "Gamma" },
];

function Controlled(props: Partial<TabsProps> & { onSelect?: (id: string) => void }) {
  const { onSelect, ...rest } = props;
  const [active, setActive] = useState("alpha");
  const onChange = (id: string) => {
    onSelect?.(id);
    setActive(id);
  };
  /* `Partial` of the variant union loosens `variant` on its liquid side, so
     the whole set is asserted back to the props it is. */
  const all = { tabs: TABS, "aria-label": "Greek", ...rest, activeTab: active, onChange } as TabsProps;
  return <Tabs {...all} />;
}

const tab = (name: string) => screen.getByRole("tab", { name });
const stops = () => screen.getAllByRole("tab").filter((t) => t.tabIndex === 0).map((t) => t.textContent);

describe("Tabs, plain by default", () => {
  it("is a tablist of tabs, the selected one marked, and draws no pill", () => {
    render(<Tabs tabs={TABS} activeTab="beta" onChange={vi.fn()} aria-label="Greek" />);
    expect(screen.getByRole("tablist", { name: "Greek" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((t) => t.getAttribute("aria-selected"))).toEqual(["false", "true", "false"]);
    /* The twin, below: the liquid variant draws one. */
    expect(screen.queryByTestId("liquid-tabs-pill")).toBeNull();
    expect(screen.queryByTestId("liquid-tabs")).toBeNull();
  });

  it("never measures anything: the pill's code runs only for the liquid variant", () => {
    const measure = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
    const { unmount } = render(<Tabs tabs={TABS} activeTab="beta" onChange={vi.fn()} />);
    const plain = measure.mock.calls.length;
    unmount();
    render(<Tabs variant="liquid" tabs={TABS} activeTab="beta" onChange={vi.fn()} />);
    expect([plain, measure.mock.calls.length > 0]).toEqual([0, true]);
    measure.mockRestore();
  });

  it("names each tab's id from the strip's, and points at its panel", () => {
    render(<Tabs id="greek" tabs={TABS.map((t) => ({ ...t, panelId: "greek-panel" }))} activeTab="alpha" onChange={vi.fn()} />);
    expect(tab("Beta")).toHaveAttribute("id", tabId("greek", "beta"));
    expect(tab("Beta")).toHaveAttribute("id", "greek-tab-beta");
    expect(tab("Beta")).toHaveAttribute("aria-controls", "greek-panel");
  });

  it("puts a count in the tab's name, and takes the consumer's words", () => {
    const { rerender } = render(<Tabs tabs={[{ id: "open", label: "Open", count: 12 }, { id: "done", label: "Done", count: 0 }]} activeTab="open" onChange={vi.fn()} />);
    expect(screen.getAllByRole("tab").map((t) => t.getAttribute("aria-label"))).toEqual(["Open, 12 items", "Done, 0 items"]);
    rerender(
      <Tabs
        tabs={[{ id: "open", label: "Open", count: 1 }]}
        activeTab="open"
        onChange={vi.fn()}
        labels={{ count: (n) => (n === 1 ? "1 game" : `${n} games`) }}
      />,
    );
    expect(tab("Open, 1 game")).toBeInTheDocument();
  });

  it("submits no form", () => {
    const submit = vi.fn((e: FormEvent) => e.preventDefault());
    render(
      <form onSubmit={submit}>
        <Controlled />
      </form>,
    );
    fireEvent.click(tab("Beta"));
    expect([submit.mock.calls.length, screen.getAllByRole("tab").map((t) => t.getAttribute("type"))]).toEqual([0, ["button", "button", "button"]]);
  });
});

describe("the WAI pattern, in every variant", () => {
  for (const variant of ["plain", "liquid"] as const) {
    describe(variant, () => {
      it("has one tab stop, the selected tab, and arrows that wrap, Home and End", async () => {
        const user = userEvent.setup();
        render(<Controlled variant={variant} />);
        expect(stops()).toEqual(["Alpha"]);
        await user.tab();
        expect(tab("Alpha")).toHaveFocus();
        const path: string[] = [];
        for (const key of ["{ArrowLeft}", "{ArrowLeft}", "{Home}", "{End}", "{ArrowRight}"]) {
          await user.keyboard(key);
          path.push(`${document.activeElement?.textContent}:${screen.getByRole("tab", { selected: true }).textContent}`);
        }
        expect(path).toEqual(["Gamma:Gamma", "Beta:Beta", "Alpha:Alpha", "Gamma:Gamma", "Alpha:Alpha"]);
        expect(stops()).toEqual(["Alpha"]);
      });

      it("with manual activation, moves focus on the arrows and selects on Enter or Space", async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(<Controlled variant={variant} activation="manual" onSelect={onSelect} />);
        await user.tab();
        await user.keyboard("{ArrowRight}");
        expect([document.activeElement?.textContent, onSelect.mock.calls.length, stops()]).toEqual(["Beta", 0, ["Beta"]]);
        await user.keyboard("{Enter}");
        await user.keyboard("{ArrowRight}");
        await user.keyboard(" ");
        expect(onSelect.mock.calls).toEqual([["beta"], ["gamma"]]);
      });

      it("reverses the arrows right to left", async () => {
        /* jsdom doesn't inherit `direction`, so the strip is told it's rtl. */
        vi.spyOn(window, "getComputedStyle").mockImplementation(() => ({ direction: "rtl" }) as CSSStyleDeclaration);
        try {
          const user = userEvent.setup();
          render(<Controlled variant={variant} />);
          await user.tab();
          await user.keyboard("{ArrowLeft}");
          expect(document.activeElement?.textContent).toBe("Beta");
        } finally {
          vi.restoreAllMocks();
        }
      });

      it("gives the first tab the stop when nothing is selected, and calls onChange only for a change", async () => {
        const onChange = vi.fn();
        render(<Tabs variant={variant} tabs={TABS} activeTab="nope" onChange={onChange} />);
        expect(stops()).toEqual(["Alpha"]);
        fireEvent.click(tab("Alpha"));
        render(<Tabs variant={variant} tabs={TABS} activeTab="beta" onChange={onChange} aria-label="Second" />);
        fireEvent.click(screen.getAllByRole("tab", { name: "Beta" })[1]);
        expect(onChange.mock.calls).toEqual([["alpha"]]);
      });
    });
  }
});

describe("the liquid variant", () => {
  afterEach(() => vi.restoreAllMocks());

  /* `LiquidTabs` is a wrapper over this; the two render the same thing, prop
     for prop, which is what lets an app move from one to the other. */
  it("renders exactly what LiquidTabs does, for each of its styles", () => {
    const html = (el: HTMLElement) => el.innerHTML.replace(/[«:_]r[0-9a-z]+[»:_]/g, "ID");
    for (const style of ["pill", "filled"] as const) {
      for (const extra of [{}, { fullWidth: true, size: "lg" as const, className: "mine" }]) {
        const tabs = [...TABS.slice(0, 2), { id: "gamma", label: "Gamma", count: 3, panelId: "p" }];
        const a = render(<LiquidTabs id="t" variant={style} tabs={tabs} activeTab="beta" onChange={vi.fn()} {...extra} />);
        const b = render(<Tabs id="t" variant="liquid" liquidStyle={style} tabs={tabs} activeTab="beta" onChange={vi.fn()} {...extra} />);
        expect(html(b.container)).toBe(html(a.container));
        a.unmount();
        b.unmount();
      }
    }
  });

  it("is the pill style unless told otherwise", () => {
    const a = render(<LiquidTabs id="t" tabs={TABS} activeTab="beta" onChange={vi.fn()} />);
    const b = render(<Tabs id="t" variant="liquid" tabs={TABS} activeTab="beta" onChange={vi.fn()} />);
    expect(b.container.innerHTML).toBe(a.container.innerHTML);
  });

  it("places its pill before the first paint", () => {
    /* The strip at 100, its border 1px; Beta's box at 181, 80 wide. */
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const at: Record<string, [number, number]> = { alpha: [101, 80], beta: [181, 80], gamma: [261, 80] };
      const [left, width] = this.dataset.testid === "liquid-tabs" ? [100, 400] : (at[this.dataset.tabId ?? ""] ?? [0, 0]);
      return { left, width, top: 0, height: 32, right: left + width, bottom: 32, x: left, y: 0 } as DOMRect;
    });
    vi.spyOn(Element.prototype, "clientLeft", "get").mockImplementation(function (this: Element) {
      return (this as HTMLElement).dataset?.testid === "liquid-tabs" ? 1 : 0;
    });
    render(<Tabs variant="liquid" tabs={TABS} activeTab="beta" onChange={vi.fn()} />);
    /* Read right after render, with no frame between: as the first paint sees it. */
    const pill = screen.getByTestId("liquid-tabs-pill");
    expect([pill.style.left, pill.style.width, pill.style.opacity]).toEqual(["80px", "80px", "1"]);
  });

  it("takes liquidStyle only with the liquid variant", () => {
    /* A type error, so a plain strip can't carry a style it would ignore. */
    // @ts-expect-error liquidStyle needs variant="liquid"
    const props: TabsProps = { tabs: TABS, activeTab: "alpha", onChange: vi.fn(), liquidStyle: "filled" };
    expect(props.liquidStyle).toBe("filled");
  });
});

describe("the old names", () => {
  it("are the new ones", () => {
    expect(liquidTabId("a", "b")).toBe(tabId("a", "b"));
  });
});
