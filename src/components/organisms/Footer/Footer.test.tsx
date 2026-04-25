import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Footer } from "./Footer";

describe("Footer Component", () => {
  const currentYear = new Date().getFullYear();

  it("renders the current year and default company name", () => {
    render(<Footer />);

    const expectedText = new RegExp(
      `© ${currentYear} Ball Collaborative, All rights reserved.`,
    );
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it("accepts and renders a custom company name", () => {
    render(<Footer companyName="MegaSquad" />);

    const expectedText = new RegExp(
      `© ${currentYear} MegaSquad, All rights reserved.`,
    );
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it("applies custom classNames passed to it", () => {
    render(<Footer data-testid="footer" className="mt-12 opacity-50" />);

    const footerElement = screen.getByTestId("footer");
    expect(footerElement).toHaveClass("mt-12");
    expect(footerElement).toHaveClass("opacity-50");
  });

  it("applies the default variant classes when no variant is specified", () => {
    render(<Footer data-testid="footer" />);

    const footerElement = screen.getByTestId("footer");
    expect(footerElement).toHaveClass("bg-gray-50");
    expect(footerElement).toHaveClass("text-gray-500");
    expect(footerElement).toHaveClass("dark:bg-gray-900/50");
  });

  it("applies the primary variant classes", () => {
    render(<Footer data-testid="footer" variant="primary" />);

    const footerElement = screen.getByTestId("footer");
    expect(footerElement).toHaveClass("bg-primary-900");
    expect(footerElement).toHaveClass("text-primary-200");
    expect(footerElement).toHaveClass("dark:bg-primary-950");
  });

  it("applies the transparent variant classes", () => {
    render(<Footer data-testid="footer" variant="transparent" />);

    const footerElement = screen.getByTestId("footer");
    expect(footerElement).toHaveClass("bg-transparent");
    expect(footerElement).toHaveClass("text-gray-500");
    expect(footerElement).toHaveClass("dark:text-gray-400");
  });

  it("renders footer links when provided", () => {
    render(
      <Footer
        links={[
          { label: "Contact", href: "/contact" },
          { label: "Privacy", href: "/privacy" },
        ]}
      />,
    );

    const contactLink = screen.getByRole("link", { name: "Contact" });
    const privacyLink = screen.getByRole("link", { name: "Privacy" });

    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute("href", "/contact");
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });

  it("renders a footer nav landmark when links are provided", () => {
    render(
      <Footer links={[{ label: "Contact", href: "/contact" }]} />,
    );

    expect(screen.getByRole("navigation", { name: /footer navigation/i })).toBeInTheDocument();
  });

  it("does not render a nav element when no links are provided", () => {
    render(<Footer />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("uses a custom routerElement for link rendering", () => {
    const MockLink = ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
      <a data-testid="router-link" href={href} {...rest}>{children}</a>
    );

    render(
      <Footer
        links={[{ label: "Feedback", href: "/feedback" }]}
        routerElement={MockLink}
      />,
    );

    expect(screen.getByTestId("router-link")).toBeInTheDocument();
    expect(screen.getByTestId("router-link")).toHaveTextContent("Feedback");
  });
});
