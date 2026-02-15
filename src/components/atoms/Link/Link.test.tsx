import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Link } from "./Link";
import "@testing-library/jest-dom";

// This mimics how 'react-router-dom' or 'next/link' behaves.
// It proves Link component is truly agnostic.
const MockLink = ({
  to,
  children,
  className,
  ...props
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <a href={to} className={className} data-testid="custom-link" {...props}>
    {children} (Mock)
  </a>
);

describe("Link Atom (Dependency-Free)", () => {
  // 1. Standard HTML Anchor
  it("renders a standard HTML anchor by default", () => {
    render(<Link href="/local">Standard Link</Link>);
    const link = screen.getByRole("link", { name: "Standard Link" });

    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/local");
    expect(link).not.toHaveAttribute("target");
  });

  // 2. External Security
  it("automatically detects external links and adds security attributes", () => {
    render(<Link href="https://google.com">External</Link>);
    const link = screen.getByRole("link", { name: "External" });

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  // 3. The Polymorphic Test (The 'as' prop)
  it("renders as a custom component when 'as' is provided", () => {
    // MockLink passed here. We pass 'to'
    // (a prop belonging to MockLink), and NOT 'href'.
    render(
      <Link as={MockLink} to="/dashboard">
        Polymorphic
      </Link>,
    );

    const link = screen.getByTestId("custom-link");

    // Did it receive the custom prop?
    expect(link).toHaveAttribute("href", "/dashboard");
    // Did it render our custom styling class? (Roster styles)
    expect(link).toHaveClass("text-primary-500");
  });

  // 4. Styles
  it("applies variant classes correctly", () => {
    render(
      <Link href="#" variant="danger">
        Delete
      </Link>,
    );
    const link = screen.getByRole("link", { name: "Delete" });

    expect(link).toHaveClass("text-error-600");
  });

  // 5. External Icon
  it("renders the external icon when requested", () => {
    const { container } = render(
      <Link href="https://example.com" showExternalIcon>
        With Icon
      </Link>,
    );
    // FontAwesome renders an SVG
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
