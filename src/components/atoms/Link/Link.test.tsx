import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Link } from "./Link";
import "@testing-library/jest-dom";

// --- Mock Component ---
// We use this to prove the component can behave like a Router Link
// without actually installing React Router in the library.
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

describe("Link Atom", () => {
  // 1. Standard Behavior
  it("renders a standard HTML anchor by default", () => {
    render(<Link href="/local">Standard Link</Link>);
    const link = screen.getByRole("link", { name: "Standard Link" });

    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/local");
    expect(link).not.toHaveAttribute("target"); // Should remain internal
  });

  // 2. External Link Security
  it("automatically adds security attributes to external links", () => {
    render(<Link href="https://google.com">External</Link>);
    const link = screen.getByRole("link", { name: "External" });

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  // 3. Auto-Icon Logic (The "Smart Default")
  it("automatically shows the icon for external links by default", () => {
    render(<Link href="https://google.com">Google</Link>);
    // We didn't ask for it, but it should be there because it's 'https'
    expect(screen.getByTestId("external-icon")).toBeInTheDocument();
  });

  // 4. Opt-Out Logic
  it("allows suppressing the icon on external links", () => {
    render(
      <Link href="https://google.com" showExternalIcon={false}>
        Google
      </Link>,
    );
    expect(screen.queryByTestId("external-icon")).not.toBeInTheDocument();
  });

  // 5. Opt-In Logic
  it("allows forcing the icon on internal links", () => {
    render(
      <Link href="/local-doc" showExternalIcon={true}>
        Local Document
      </Link>,
    );
    expect(screen.getByTestId("external-icon")).toBeInTheDocument();
  });

  // 6. Polymorphism Test
  it("renders as a custom component when 'as' is provided", () => {
    // We pass our MockLink. Notice we pass 'to' (a prop belonging to MockLink),
    // and NOT 'href'. If this renders without TS errors, our types are working.
    render(
      <Link as={MockLink} to="/dashboard">
        Polymorphic
      </Link>,
    );

    const link = screen.getByTestId("custom-link");

    // Did it receive the custom prop?
    expect(link).toHaveAttribute("href", "/dashboard");
    // Did it render our custom styling class?
    expect(link).toHaveClass("text-primary-500");
    // Did it render the children?
    expect(link).toHaveTextContent("Polymorphic (Mock)");
  });

  // 7. Styling
  it("applies variant classes correctly", () => {
    render(
      <Link href="#" variant="danger">
        Delete
      </Link>,
    );
    const link = screen.getByRole("link", { name: "Delete" });

    expect(link).toHaveClass("text-error-600");
  });
});
