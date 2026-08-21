import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Avatar } from "./Avatar";
import "@testing-library/jest-dom";

describe("Avatar Component", () => {
  it("renders initials when no image provided", () => {
    render(<Avatar initials="JD" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders image when src provided", () => {
    render(<Avatar src="avatar.jpg" alt="User Avatar" />);
    const img = screen.getByRole("img", { name: /user avatar/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "avatar.jpg");
  });

  it("applies variant classes with the new crisp colors", () => {
    const { container } = render(
      <Avatar initials="XY" size="xl" colorScheme="orange" />,
    );

    const avatarDiv = container.firstChild as HTMLElement;

    expect(avatarDiv).toHaveClass("rst:h-16", "rst:w-16");
    expect(avatarDiv).toHaveClass("rst:bg-orange-50", "rst:text-orange-700");
  });

  it("renders Popover structure when title is provided", () => {
    render(<Avatar initials="T" title="Tooltip Text" />);

    const textElement = screen.getByText("T");
    expect(textElement).toBeInTheDocument();
  });
});
