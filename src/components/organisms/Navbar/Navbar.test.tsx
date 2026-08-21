import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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

  // The default variant is driven by --roster-nav-* rather than literal
  // colors, so a themed app can retint the bar without selector overrides.
  // The token defaults resolve to the previous white / gray-950 pair.
  it("applies the token-driven 'default' variant classes by default", () => {
    render(<Navbar {...defaultProps} />);

    const navElement = screen.getByRole("navigation");
    expect(navElement).toHaveClass(
      "rst:bg-[var(--roster-nav-bg)]",
      "rst:border-[var(--roster-nav-border)]",
      "rst:text-[var(--roster-nav-text)]",
    );
  });

  // The default variant in light mode uses the darker primary-600 text
  it("highlights the active navigation item using light surface colors by default", () => {
    render(<Navbar {...defaultProps} activePath="/leagues" />);

    const activeLink = screen.getByText("Leagues");
    const linkElement = activeLink.closest("a");

    expect(linkElement).toHaveClass("rst:text-primary-600");
    expect(linkElement).toHaveClass("rst:dark:text-primary-600");
    expect(linkElement).toHaveClass("rst:font-semibold");
  });

  // Proves that the "slate" variant flips the links to light text (primary-400)
  it("highlights the active navigation item using dark surface colors when variant is slate", () => {
    render(<Navbar {...defaultProps} activePath="/leagues" variant="slate" />);

    const activeLink = screen.getByText("Leagues");
    const linkElement = activeLink.closest("a");

    expect(linkElement).toHaveClass("rst:text-primary-400");
    expect(linkElement).toHaveClass("rst:dark:text-primary-400");
    expect(linkElement).toHaveClass("rst:font-semibold");
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

    const logoutButton = screen.getByText(/log out/i);
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

  it("does not render the theme toggle if onThemeToggle is undefined", () => {
    render(<Navbar {...defaultProps} user={mockUser} />);

    const userButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(userButton);

    expect(screen.queryByText(/dark mode/i)).not.toBeInTheDocument();
  });

  it("omits the Log Out button when onLogout is not provided", () => {
    render(<Navbar {...defaultProps} user={mockUser} onLogout={undefined} />);

    const userButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(userButton);

    expect(screen.queryByText(/log out/i)).not.toBeInTheDocument();
  });

  it("omits the inbox button when onInboxClick is not provided even with notifications", () => {
    const userWithNotifications = { initials: "JD", notificationCount: 3 };
    render(
      <Navbar
        {...defaultProps}
        user={userWithNotifications}
        onInboxClick={undefined}
      />,
    );

    const userButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(userButton);

    expect(screen.queryByText(/inbox/i)).not.toBeInTheDocument();
  });

  it("calls onLogin when the Log In button is clicked on desktop", () => {
    const onLogin = vi.fn();
    render(<Navbar {...defaultProps} onLogin={onLogin} />);

    const loginButton = screen.getByRole("button", { name: /log in/i });
    fireEvent.click(loginButton);

    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it("renders the Log In button in the mobile panel when onLogin is provided", async () => {
    const onLogin = vi.fn();
    render(<Navbar {...defaultProps} onLogin={onLogin} />);

    const hamburger = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(hamburger);

    const loginButtons = await screen.findAllByRole("button", { name: /log in/i });
    expect(loginButtons.length).toBeGreaterThan(0);
  });

  it("renders custom actions slot instead of user menu on desktop", () => {
    render(
      <Navbar
        {...defaultProps}
        actions={<button>Custom Sign In</button>}
      />,
    );

    expect(screen.getByRole("button", { name: /custom sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /user menu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /log in/i })).not.toBeInTheDocument();
  });

  it("renders custom actions slot in the mobile panel when open", async () => {
    render(
      <Navbar
        {...defaultProps}
        actions={<button>Custom Auth</button>}
      />,
    );

    const hamburger = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(hamburger);

    const customActions = await screen.findAllByRole("button", { name: /custom auth/i });
    expect(customActions.length).toBeGreaterThan(0);
  });

  it("renders custom brandElement instead of the default brand name span", () => {
    render(
      <Navbar
        {...defaultProps}
        brandElement={<span data-testid="custom-brand">CUSTOM BRAND</span>}
      />,
    );

    expect(screen.getByTestId("custom-brand")).toBeInTheDocument();
    expect(screen.getByTestId("custom-brand")).toHaveTextContent("CUSTOM BRAND");
    // The plain brandName string should not appear as visible text outside the img alt
    expect(screen.queryByText("MegaSquad")).not.toBeInTheDocument();
  });

  it("renders userMenuItems in the desktop dropdown when user is present", () => {
    render(
      <Navbar
        {...defaultProps}
        user={mockUser}
        userMenuItems={[{ label: "Admin", path: "/admin" }]}
      />,
    );

    const userButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(userButton);

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("does not render userMenuItems when no user is provided", () => {
    render(
      <Navbar
        {...defaultProps}
        userMenuItems={[{ label: "Admin", path: "/admin" }]}
      />,
    );

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("renders userMenuItems in the mobile panel nav section when user is present", async () => {
    render(
      <Navbar
        {...defaultProps}
        user={mockUser}
        userMenuItems={[{ label: "Admin", path: "/admin" }]}
      />,
    );

    const hamburger = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(hamburger);

    const adminLinks = await screen.findAllByText("Admin");
    expect(adminLinks.length).toBeGreaterThan(0);
  });

  it("does not render userMenuItems in the mobile panel when no user is provided", async () => {
    render(
      <Navbar
        {...defaultProps}
        userMenuItems={[{ label: "Admin", path: "/admin" }]}
      />,
    );

    const hamburger = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(hamburger);

    // Wait for panel to open then assert Admin is absent
    await screen.findByRole("button", { name: /close menu/i });
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("renders and triggers the theme toggle in the desktop menu", () => {
    const onThemeToggle = vi.fn();
    render(
      <Navbar
        {...defaultProps}
        user={mockUser}
        onThemeToggle={onThemeToggle}
      />,
    );

    const userButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(userButton);

    const themeToggleText = screen.getByText(/dark mode/i);
    expect(themeToggleText).toBeInTheDocument();

    fireEvent.click(themeToggleText);

    expect(onThemeToggle).toHaveBeenCalledTimes(1);
  });

  it("renders navActions between nav links and user menu on desktop", () => {
    render(
      <Navbar
        {...defaultProps}
        user={mockUser}
        navActions={<button>Search</button>}
      />,
    );

    // navActions is visible alongside the user menu (not replacing it)
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /user menu/i })).toBeInTheDocument();
  });

  it("renders navActions above nav links in the mobile panel", async () => {
    render(
      <Navbar
        {...defaultProps}
        navActions={<input placeholder="Search games…" />}
      />,
    );

    const hamburger = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(hamburger);

    const searchInputs = await screen.findAllByPlaceholderText("Search games…");
    expect(searchInputs.length).toBeGreaterThan(0);
  });

  it("applies a custom avatarColor to the user avatar button", () => {
    render(
      <Navbar
        {...defaultProps}
        user={{ ...mockUser, avatarColor: "teal" }}
      />,
    );

    const userButton = screen.getByRole("button", { name: /user menu/i });
    // The avatar inside the button should carry the teal color class
    const avatar = userButton.querySelector("[class*='teal']");
    expect(avatar).toBeInTheDocument();
  });

  it("renders a badge next to a nav item label on desktop", () => {
    render(
      <Navbar
        {...defaultProps}
        items={[
          { label: "Home", path: "/" },
          { label: "Quick Vote", path: "/vote", badge: <span data-testid="new-badge">New</span> },
        ]}
      />,
    );

    expect(screen.getByTestId("new-badge")).toBeInTheDocument();
    expect(screen.getByTestId("new-badge")).toHaveTextContent("New");
  });

  it("renders a badge next to a nav item label in the mobile panel", async () => {
    render(
      <Navbar
        {...defaultProps}
        items={[
          { label: "Home", path: "/" },
          { label: "Quick Vote", path: "/vote", badge: <span data-testid="mobile-badge">New</span> },
        ]}
      />,
    );

    const hamburger = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(hamburger);

    const badges = await screen.findAllByTestId("mobile-badge");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("closes the mobile panel when tapping outside the panel", async () => {
    render(<Navbar {...defaultProps} />);

    const hamburger = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(hamburger);

    await screen.findByRole("button", { name: /close menu/i });
    expect(document.querySelector("[data-roster-mobile-panel]")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /close menu/i })).not.toBeInTheDocument();
    });
  });

  it("renders and triggers the theme toggle in the mobile menu", async () => {
    const onThemeToggle = vi.fn();
    render(
      <Navbar
        {...defaultProps}
        user={mockUser}
        onThemeToggle={onThemeToggle}
      />,
    );

    const hamburger = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(hamburger);

    const themeToggleText = await screen.findByText(/dark mode/i);
    expect(themeToggleText).toBeInTheDocument();

    fireEvent.click(themeToggleText);

    expect(onThemeToggle).toHaveBeenCalledTimes(1);
  });
});

// The nav is mounted once in an app-wide layout, so a client-side navigation
// does not unmount it. Anything that navigates from inside the open mobile
// panel has to close the panel itself, or the new page renders underneath it.
describe("Navbar mobile panel dismissal on navigation", () => {
  const openPanel = async () => {
    const hamburger = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(hamburger);
    await waitFor(() => {
      expect(hamburger).toHaveAttribute("aria-expanded", "true");
    });
  };

  // aria-expanded on the hamburger is the authoritative open state. Node
  // presence is not: HeadlessUI unmounts the panel under jsdom but keeps it
  // mounted at opacity 0 in a real browser, so a querySelector check passes
  // for the wrong reason there.
  const expectPanelClosed = async () => {
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /open main menu/i }),
      ).toHaveAttribute("aria-expanded", "false");
    });
  };

  // Control: the built-in slots already wire close() themselves.
  it("closes the panel when a built-in nav item is clicked", async () => {
    render(<Navbar {...defaultProps} />);
    await openPanel();

    const panel = document.querySelector("[data-roster-mobile-panel]")!;
    fireEvent.click(within(panel as HTMLElement).getByText("Leagues"));

    await expectPanelClosed();
  });

  // A route change is the signal that a navigation happened, whatever caused
  // it — including a link in a slot the nav cannot introspect.
  it("closes the panel when activePath changes while it is open", async () => {
    const { rerender } = render(
      <Navbar {...defaultProps} navActions={<a href="/search">Search</a>} />,
    );
    await openPanel();

    rerender(
      <Navbar
        {...defaultProps}
        activePath="/leagues"
        navActions={<a href="/search">Search</a>}
      />,
    );

    await expectPanelClosed();
  });

  it("leaves the panel open when activePath is unchanged", async () => {
    const { rerender } = render(<Navbar {...defaultProps} />);
    await openPanel();

    rerender(<Navbar {...defaultProps} user={mockUser} />);

    // A re-render that is not a navigation must not dismiss the panel.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /open main menu/i }),
      ).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("gives navActions a close callback via the render-prop form", async () => {
    render(
      <Navbar
        {...defaultProps}
        navActions={({ close }) => (
          <a href="/search" onClick={close}>
            Search
          </a>
        )}
      />,
    );
    await openPanel();

    const panel = document.querySelector("[data-roster-mobile-panel]")!;
    fireEvent.click(within(panel as HTMLElement).getByText("Search"));

    await expectPanelClosed();
  });

  it("gives actions a close callback via the render-prop form", async () => {
    render(
      <Navbar
        {...defaultProps}
        actions={({ close }) => (
          <a href="/account" onClick={close}>
            My account
          </a>
        )}
      />,
    );
    await openPanel();

    const panel = document.querySelector("[data-roster-mobile-panel]")!;
    fireEvent.click(within(panel as HTMLElement).getByText("My account"));

    await expectPanelClosed();
  });

  // Desktop: HeadlessUI's Menu closes itself on MenuItem click. Pinned so the
  // dropdown half of the "menus should close on navigate" report stays fixed.
  it("closes the desktop user dropdown when a userMenuItem is clicked", async () => {
    render(
      <Navbar
        {...defaultProps}
        user={mockUser}
        userMenuItems={[{ label: "Family area", path: "/family" }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /user menu/i }));
    const item = await screen.findByText("Family area");

    fireEvent.click(item);

    await waitFor(() => {
      expect(screen.queryByText("Family area")).not.toBeInTheDocument();
    });
  });
});
