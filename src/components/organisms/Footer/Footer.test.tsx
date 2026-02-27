import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Footer } from "./Footer";

describe("Footer Component", () => {
  const currentYear = new Date().getFullYear();

  it("renders the current year and default company name", () => {
    render(<Footer />);

    // Using a regex to match the text regardless of exact DOM structure
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
    render(<Footer data-testid="footer" className="bg-red-500" />);

    const footerElement = screen.getByTestId("footer");
    expect(footerElement).toHaveClass("bg-red-500");
  });
});
