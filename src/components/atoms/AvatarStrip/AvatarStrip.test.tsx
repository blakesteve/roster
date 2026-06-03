import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AvatarStrip, type AvatarStripItem } from "./AvatarStrip";
import "@testing-library/jest-dom";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SIX_ITEMS: AvatarStripItem[] = [
  { key: "u1", label: "Alice",   colorScheme: "primary" },
  { key: "u2", label: "Bob",     colorScheme: "success" },
  { key: "u3", label: "Carol",   colorScheme: "neutral" },
  { key: "u4", label: "Dan",     colorScheme: "primary" },
  { key: "u5", label: "Eve",     colorScheme: "teal"    },
  { key: "u6", label: "Frank",   colorScheme: "amber"   },
];

const THREE_ITEMS: AvatarStripItem[] = SIX_ITEMS.slice(0, 3);

const LINKED_ITEMS: AvatarStripItem[] = [
  { key: "u1", label: "Alice", href: "/profile/alice" },
  { key: "u2", label: "Bob",   href: "/profile/bob"   },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AvatarStrip", () => {
  // ── Null guard ─────────────────────────────────────────────────────────────

  it("returns null when there are no items and no trailingSlot", () => {
    const { container } = render(<AvatarStrip items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when all items are excluded and there is no trailingSlot", () => {
    const single: AvatarStripItem[] = [{ key: "me", label: "Me" }];
    const { container } = render(<AvatarStrip items={single} excludeKey="me" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when items are empty but trailingSlot is provided", () => {
    render(<AvatarStrip items={[]} trailingSlot={<span>CTA</span>} />);
    expect(screen.getByTestId("avatar-strip")).toBeInTheDocument();
    expect(screen.getByText("CTA")).toBeInTheDocument();
  });

  // ── Structure ──────────────────────────────────────────────────────────────

  it("renders the strip container", () => {
    render(<AvatarStrip items={THREE_ITEMS} />);
    expect(screen.getByTestId("avatar-strip")).toBeInTheDocument();
  });

  it("renders the avatar stack", () => {
    render(<AvatarStrip items={THREE_ITEMS} />);
    expect(screen.getByTestId("avatar-strip-stack")).toBeInTheDocument();
  });

  it("renders one item wrapper per visible item", () => {
    render(<AvatarStrip items={THREE_ITEMS} />);
    expect(screen.getByTestId("avatar-strip-item-u1")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-strip-item-u2")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-strip-item-u3")).toBeInTheDocument();
  });

  // ── maxDisplay & overflow ──────────────────────────────────────────────────

  it("caps visible avatars at maxDisplay (default 5)", () => {
    render(<AvatarStrip items={SIX_ITEMS} />);
    expect(screen.getByTestId("avatar-strip-item-u1")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-strip-item-u5")).toBeInTheDocument();
    expect(screen.queryByTestId("avatar-strip-item-u6")).not.toBeInTheDocument();
  });

  it("shows +N overflow chip for items beyond maxDisplay", () => {
    render(<AvatarStrip items={SIX_ITEMS} />);
    expect(screen.getByTestId("avatar-strip-overflow")).toBeInTheDocument();
    expect(screen.getByTitle("1 more")).toBeInTheDocument();
  });

  it("respects a custom maxDisplay value", () => {
    render(<AvatarStrip items={SIX_ITEMS} maxDisplay={2} />);
    expect(screen.getByTestId("avatar-strip-item-u1")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-strip-item-u2")).toBeInTheDocument();
    expect(screen.queryByTestId("avatar-strip-item-u3")).not.toBeInTheDocument();
    expect(screen.getByTitle("4 more")).toBeInTheDocument();
  });

  it("does not render the overflow chip when all items fit within maxDisplay", () => {
    render(<AvatarStrip items={THREE_ITEMS} />);
    expect(screen.queryByTestId("avatar-strip-overflow")).not.toBeInTheDocument();
  });

  // ── totalCount ─────────────────────────────────────────────────────────────

  it("uses totalCount for the overflow chip instead of items.length", () => {
    // 6 items fetched, maxDisplay=5, but real total is 40
    render(<AvatarStrip items={SIX_ITEMS} totalCount={40} />);
    // overflow = 40 - 5 (visible) = 35
    expect(screen.getByTitle("35 more")).toBeInTheDocument();
  });

  it("shows no overflow chip when totalCount equals visible count", () => {
    render(<AvatarStrip items={THREE_ITEMS} totalCount={3} />);
    expect(screen.queryByTestId("avatar-strip-overflow")).not.toBeInTheDocument();
  });

  // ── excludeKey ─────────────────────────────────────────────────────────────

  it("excludes the item matching excludeKey", () => {
    render(<AvatarStrip items={THREE_ITEMS} excludeKey="u2" />);
    expect(screen.queryByTestId("avatar-strip-item-u2")).not.toBeInTheDocument();
    expect(screen.getByTestId("avatar-strip-item-u1")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-strip-item-u3")).toBeInTheDocument();
  });

  it("does not affect rendering when excludeKey does not match any item", () => {
    render(<AvatarStrip items={THREE_ITEMS} excludeKey="nobody" />);
    expect(screen.getAllByTestId(/avatar-strip-item-/)).toHaveLength(3);
  });

  // ── Linked avatars ─────────────────────────────────────────────────────────

  it("wraps avatar in <a> when item has href", () => {
    render(<AvatarStrip items={LINKED_ITEMS} />);
    const link = screen.getByTestId("avatar-strip-item-u1");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/profile/alice");
  });

  it("uses <span> wrapper when item has no href", () => {
    render(<AvatarStrip items={THREE_ITEMS} />);
    const wrapper = screen.getByTestId("avatar-strip-item-u1");
    expect(wrapper.tagName).toBe("SPAN");
  });

  it("sets title attribute on avatar wrapper to item label", () => {
    render(<AvatarStrip items={LINKED_ITEMS} />);
    expect(screen.getByTitle("Alice")).toBeInTheDocument();
    expect(screen.getByTitle("Bob")).toBeInTheDocument();
  });

  // ── Dismiss button ─────────────────────────────────────────────────────────

  it("renders the dismiss button when onDismiss is provided", () => {
    render(<AvatarStrip items={THREE_ITEMS} onDismiss={vi.fn()} />);
    expect(screen.getByTestId("avatar-strip-dismiss")).toBeInTheDocument();
  });

  it("does not render the dismiss button when onDismiss is not provided", () => {
    render(<AvatarStrip items={THREE_ITEMS} />);
    expect(screen.queryByTestId("avatar-strip-dismiss")).not.toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(<AvatarStrip items={THREE_ITEMS} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId("avatar-strip-dismiss"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("dismiss button has aria-label='Dismiss'", () => {
    render(<AvatarStrip items={THREE_ITEMS} onDismiss={vi.fn()} />);
    expect(screen.getByLabelText("Dismiss")).toBeInTheDocument();
  });

  // ── trailingSlot ───────────────────────────────────────────────────────────

  it("renders trailingSlot content inside the avatar stack", () => {
    render(
      <AvatarStrip
        items={THREE_ITEMS}
        trailingSlot={<span data-testid="ghost">Ghost</span>}
      />,
    );
    const stack = screen.getByTestId("avatar-strip-stack");
    expect(stack).toContainElement(screen.getByTestId("ghost"));
  });

  it("does not render trailingSlot when not provided", () => {
    render(<AvatarStrip items={THREE_ITEMS} />);
    // just confirm no unexpected children beyond avatars + optional overflow
    expect(screen.queryByText("Ghost")).not.toBeInTheDocument();
  });

  // ── label ──────────────────────────────────────────────────────────────────

  it("renders label content to the right of the stack", () => {
    render(
      <AvatarStrip
        items={THREE_ITEMS}
        label={<p>42 other players</p>}
      />,
    );
    expect(screen.getByTestId("avatar-strip-label")).toBeInTheDocument();
    expect(screen.getByText("42 other players")).toBeInTheDocument();
  });

  it("does not render the label area when label is not provided", () => {
    render(<AvatarStrip items={THREE_ITEMS} />);
    expect(screen.queryByTestId("avatar-strip-label")).not.toBeInTheDocument();
  });

  // ── ringClass ──────────────────────────────────────────────────────────────

  it("applies the default ring class to avatar wrappers", () => {
    render(<AvatarStrip items={THREE_ITEMS} />);
    expect(screen.getByTestId("avatar-strip-item-u1")).toHaveClass("ring-white");
  });

  it("applies a custom ringClass to avatar wrappers", () => {
    render(<AvatarStrip items={THREE_ITEMS} ringClass="ring-gray-950" />);
    expect(screen.getByTestId("avatar-strip-item-u1")).toHaveClass("ring-gray-950");
  });

  it("applies ringClass to the overflow chip", () => {
    render(<AvatarStrip items={SIX_ITEMS} ringClass="ring-gray-950" />);
    expect(screen.getByTestId("avatar-strip-overflow")).toHaveClass("ring-gray-950");
  });

  // ── className ──────────────────────────────────────────────────────────────

  it("applies className to the outer container", () => {
    render(<AvatarStrip items={THREE_ITEMS} className="my-custom-class" />);
    expect(screen.getByTestId("avatar-strip")).toHaveClass("my-custom-class");
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it("renders a single item with no overflow chip", () => {
    const single: AvatarStripItem[] = [{ key: "only", label: "Only" }];
    render(<AvatarStrip items={single} />);
    expect(screen.getByTestId("avatar-strip-item-only")).toBeInTheDocument();
    expect(screen.queryByTestId("avatar-strip-overflow")).not.toBeInTheDocument();
  });

  it("renders all items when count equals maxDisplay exactly", () => {
    render(<AvatarStrip items={SIX_ITEMS} maxDisplay={6} />);
    SIX_ITEMS.forEach((item) => {
      expect(screen.getByTestId(`avatar-strip-item-${item.key}`)).toBeInTheDocument();
    });
    expect(screen.queryByTestId("avatar-strip-overflow")).not.toBeInTheDocument();
  });
});