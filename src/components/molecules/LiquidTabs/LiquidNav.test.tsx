import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { LiquidNav, type LiquidNavItem, type LiquidNavLinkProps } from "./LiquidNav";

const ITEMS: LiquidNavItem[] = [
  { id: "overview", label: "Overview", href: "/overview" },
  { id: "activity", label: "Activity", href: "/activity" },
  { id: "settings", label: "Settings", href: "/settings" },
];

describe("LiquidNav", () => {
  it("renders a named nav of links, not a tablist", () => {
    render(<LiquidNav aria-label="Views" items={ITEMS} activeTab="overview" />);
    const nav = screen.getByRole("navigation", { name: "Views" });
    expect(nav.tagName).toBe("NAV");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Activity" })).toHaveAttribute("href", "/activity");
  });

  it("marks only the current item with aria-current=page", () => {
    render(<LiquidNav aria-label="Views" items={ITEMS} activeTab="activity" />);
    expect(screen.getByRole("link", { name: "Activity" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Settings" })).not.toHaveAttribute("aria-current");
  });

  it("leaves every link in the tab order, as in any nav", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>before</button>
        <LiquidNav aria-label="Views" items={ITEMS} activeTab="activity" />
      </>,
    );
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("tabindex");
    }
    await user.click(screen.getByText("before"));
    await user.tab();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Activity" })).toHaveFocus();
  });

  it("calls onChange on a plain left click on another item", () => {
    const onChange = vi.fn();
    render(<LiquidNav aria-label="Views" items={ITEMS} activeTab="overview" onChange={onChange} />);
    fireEvent.click(screen.getByRole("link", { name: "Settings" }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith("settings");
  });

  it("ignores modified and middle clicks, which open elsewhere", () => {
    const onChange = vi.fn();
    render(<LiquidNav aria-label="Views" items={ITEMS} activeTab="overview" onChange={onChange} />);
    const settings = screen.getByRole("link", { name: "Settings" });
    fireEvent.click(settings, { metaKey: true });
    fireEvent.click(settings, { ctrlKey: true });
    fireEvent.click(settings, { shiftKey: true });
    fireEvent.click(settings, { altKey: true });
    fireEvent.click(settings, { button: 1 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not call onChange when the link component already handled the click", () => {
    /* A router link that cancels the click (to navigate itself, or because
       navigation is blocked) calls preventDefault first. */
    const onChange = vi.fn();
    const Canceling = (props: LiquidNavLinkProps) => (
      <a
        href={props.href}
        data-tab-id={props["data-tab-id"]}
        onClick={(event) => {
          event.preventDefault();
          props.onClick(event);
        }}
      >
        {props.children}
      </a>
    );
    render(
      <LiquidNav aria-label="Views" items={ITEMS} activeTab="overview" onChange={onChange} linkComponent={Canceling} />,
    );
    fireEvent.click(screen.getByRole("link", { name: "Settings" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not call onChange for the current item", () => {
    const onChange = vi.fn();
    render(<LiquidNav aria-label="Views" items={ITEMS} activeTab="overview" onChange={onChange} />);
    fireEvent.click(screen.getByRole("link", { name: "Overview" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("works without onChange", () => {
    render(<LiquidNav aria-label="Views" items={ITEMS} activeTab="overview" />);
    expect(() => fireEvent.click(screen.getByRole("link", { name: "Settings" }))).not.toThrow();
  });

  it("hands linkComponent href AND to, plus the rest of the contract", () => {
    /* `to` is what React Router's Link reads, `href` is what next/link and an
       anchor read. Both, always, so either router works unchanged. */
    const calls: LiquidNavLinkProps[] = [];
    const Spy = (props: LiquidNavLinkProps) => {
      calls.push(props);
      return (
        <a href={props.href} data-tab-id={props["data-tab-id"]}>
          {props.children}
        </a>
      );
    };
    render(<LiquidNav aria-label="Views" items={ITEMS} activeTab="activity" linkComponent={Spy} />);

    const activity = calls.find((p) => p["data-tab-id"] === "activity")!;
    expect(activity.href).toBe("/activity");
    expect(activity.to).toBe("/activity");
    expect(activity["aria-current"]).toBe("page");
    expect(typeof activity.onClick).toBe("function");
    expect(activity.className).toContain("rst:text-(--roster-lt-text-active)");
    expect(activity.children).toBe("Activity");

    const settings = calls.find((p) => p["data-tab-id"] === "settings")!;
    expect(settings.to).toBe("/settings");
    expect(settings["aria-current"]).toBeUndefined();
  });

  it("does not put `to` on a plain anchor", () => {
    render(<LiquidNav aria-label="Views" items={ITEMS} activeTab="overview" />);
    expect(screen.getByRole("link", { name: "Settings" })).not.toHaveAttribute("to");
  });

  it("keeps the pill's test id, which consumers style through", () => {
    render(<LiquidNav aria-label="Views" items={ITEMS} activeTab="overview" />);
    expect(screen.getByTestId("liquid-tabs-pill")).toHaveAttribute("aria-hidden");
  });

  it("looks the same as the tabs: size lg reaches 44px", () => {
    render(<LiquidNav aria-label="Views" items={ITEMS} activeTab="overview" size="lg" />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass("rst:min-h-11");
    }
  });

  it("renders a label function in its active form on the current link only", () => {
    const items: LiquidNavItem[] = ITEMS.map((i) => ({
      ...i,
      label: (active: boolean) => (active ? `${i.id} (current)` : i.id),
    }));
    render(<LiquidNav aria-label="Views" items={items} activeTab="activity" />);
    expect(screen.getByRole("link", { name: "activity (current)" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "overview" })).toBeInTheDocument();
    expect(screen.queryByText("overview (current)")).not.toBeInTheDocument();
  });

  it("takes its name from aria-labelledby", () => {
    render(
      <>
        <h2 id="sections-heading">Project sections</h2>
        <LiquidNav aria-labelledby="sections-heading" items={ITEMS} activeTab="overview" />
      </>,
    );
    expect(screen.getByRole("navigation", { name: "Project sections" })).toBeInTheDocument();
  });

  it("stretches across its container with fullWidth", () => {
    render(<LiquidNav aria-label="Views" items={ITEMS} activeTab="overview" fullWidth />);
    expect(screen.getByRole("navigation")).toHaveClass("rst:w-full");
    for (const link of screen.getAllByRole("link")) expect(link).toHaveClass("rst:flex-1");
  });
});
