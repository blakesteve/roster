import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Navbar, type NavbarProps } from "./Navbar";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// mock data
const defaultProps: NavbarProps = {
  brandName: "MegaSquad",
  logoSrc: "/logo.png",
  items: [
    { label: "Home", path: "/" },
    { label: "Leagues", path: "/leagues" },
  ],
  activePath: "/",
  onLogout: vi.fn(),
  onInboxClick: vi.fn(),
};

const mockUser = {
  initials: "JD",
  notificationCount: 5,
};

describe("Navbar Component", () => {
  it("renders the brand name and logo", () => {
    render(<Navbar {...defaultProps} />);

    expect(screen.getByText("MegaSquad")).toBeInTheDocument();

    const logo = screen.getByRole("img", { name: /MegaSquad Logo/i });
    expect(logo).toHaveAttribute("src", "/logo.png");
  });

  it("highlights the active navigation item", () => {
    render(<Navbar {...defaultProps} activePath="/leagues" />);

    const activeLink = screen.getByText("Leagues");
    const linkElement = activeLink.closest("a");

    expect(linkElement).toHaveClass("text-primary-400");
    expect(linkElement).toHaveClass("font-semibold");
  });

  it("displays the user initials and notification count when a user is provided", () => {
    render(<Navbar {...defaultProps} user={mockUser} />);

    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("calls onLogout when the logout button is clicked", () => {
    const onLogout = vi.fn();
    render(<Navbar {...defaultProps} user={mockUser} onLogout={onLogout} />);

    const userButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(userButton);

    const logoutButton = screen.getByText(/sign out/i);
    fireEvent.click(logoutButton);

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("toggles the mobile menu state when the hamburger icon is clicked", async () => {
    render(<Navbar {...defaultProps} />);

    const hamburger = screen.getByRole("button", { name: /open main menu/i });

    expect(
      screen.queryByRole("button", { name: /close menu/i }),
    ).not.toBeInTheDocument();
    fireEvent.click(hamburger);

    const closeButton = await screen.findByRole("button", {
      name: /close menu/i,
    });
    expect(closeButton).toBeInTheDocument();
  });
});
