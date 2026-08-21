import React, { Fragment, useEffect, useRef } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faInbox,
  faRightFromBracket,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { Button } from "../../atoms/Button/Button";
import { Link } from "../../atoms/Link/Link";
import { Badge } from "../../atoms/Badge/Badge";
import { Avatar } from "../../atoms/Avatar/Avatar";
import { Switch } from "../../atoms/Switch/Switch";
import { navbarVariants } from "./navbar-variants";

/**
 * Content for a consumer-supplied slot. Pass a plain node, or a function that
 * receives `close` so anything inside the slot can dismiss the mobile panel —
 * needed when the slot holds a link, since the nav has no way to know a click
 * on arbitrary content was a navigation.
 */
export type NavbarSlot =
  | React.ReactNode
  | ((props: { close: () => void }) => React.ReactNode);

const renderSlot = (slot: NavbarSlot, close: () => void): React.ReactNode =>
  typeof slot === "function" ? slot({ close }) : slot;

export interface NavItem {
  label: string;
  path: string;
  /** Optional badge rendered inline after the link label. Any ReactNode.
   *  Use for "New" labels, notification counts, or status indicators.
   *  Appears in both the desktop nav and the mobile slide-out panel. */
  badge?: React.ReactNode;
}

export interface NavbarProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navbarVariants> {
  logoSrc: string;
  /**
   * Size of the logo image. Accepts any CSS length (`"2.75rem"`, `44`).
   * Defaults to `2rem`, the previous hard-coded `h-8 w-8`.
   */
  logoSize?: string | number;
  /**
   * Classes applied to the logo image. Replaces the default rounding, so a
   * circular mark can pass `"rst:rounded-full"` and a square one `""`.
   */
  logoClassName?: string;
  brandName: string;
  items: NavItem[];
  activePath?: string;
  routerElement?: React.ElementType;
  user?: {
    initials: string;
    notificationCount?: number;
    avatarSrc?: string;
    avatarColor?: string;
  };
  onLogin?: () => void;
  onLogout?: () => void;
  onInboxClick?: () => void;
  onThemeToggle?: () => void;
  /**
   * Which palette the nav paints itself with.
   *
   * `"auto"` follows the nearest ancestor carrying the `.dark` class, matching
   * how the rest of Roster handles dark mode. Use it in class-based dark apps
   * so the nav does not need wiring into your theme state. Omit the prop
   * entirely and the mode is inferred from `variant`, as before.
   */
  themeMode?: "light" | "dark" | "auto";
  notificationVariant?:
    | "primary"
    | "error"
    | "amber"
    | "success"
    | "neutral"
    | "orange"
    | "teal"
    | "purple";
  /**
   * Fill style of the notification count badge. Defaults to `"solid"`, which
   * is what the nav rendered before this was configurable. Use `"soft"` or
   * `"outline"` where a solid dot competes with a busy or colored nav surface.
   */
  notificationFill?: "soft" | "light" | "solid" | "outline";
  /**
   * Custom content rendered in the right-side action area. When provided it
   * replaces the built-in user menu / "Log In" button on desktop and the user
   * section in the mobile panel, giving you full control over auth UI.
   *
   * Pass a function to receive `close` and dismiss the mobile panel from
   * inside the slot: `actions={({ close }) => <Link onClick={close} … />}`.
   */
  actions?: NavbarSlot;
  /**
   * Replaces the default brand name `<span>` with arbitrary markup. Use this
   * when you need mixed weights, colors, or other rich styling that a plain
   * string cannot express (e.g. bold "GAME" + thin "VERDICT").
   * The logo image is always rendered; this only affects the text element.
   */
  brandElement?: React.ReactNode;
  /**
   * Extra content rendered between the nav link list and the user menu / Log In
   * button on desktop, and above the nav links in the mobile slide-out panel.
   * Use this for persistent nav-level controls like a search toggle that should
   * coexist with the built-in user menu. Does not replace the user menu;
   * see `actions` for full replacement.
   *
   * Pass a function to receive `close` and dismiss the mobile panel from
   * inside the slot: `navActions={({ close }) => <Link onClick={close} … />}`.
   */
  navActions?: NavbarSlot;
  /**
   * Auth-gated navigation items appended to the built-in user avatar dropdown
   * on desktop and to the nav section of the mobile slide-out panel. Only
   * rendered when the `user` prop is provided. Ignored when `actions` is set.
   */
  userMenuItems?: NavItem[];
}

/**
 * Tracks the `.dark` class on <html> for `themeMode="auto"`. The DOM is the
 * source of truth (that is where class-based dark mode lives), so this reads
 * it rather than mirroring it into state. Returns false during SSR and the
 * hydration pass, then syncs. The class cannot be known on the server.
 */
function useDarkClass(enabled: boolean) {
  return React.useSyncExternalStore(
    (onChange) => {
      if (!enabled || typeof document === "undefined") return () => {};
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    },
    () => enabled && document.documentElement.classList.contains("dark"),
    () => false,
  );
}

// Mounts when the mobile panel is open. Listens for pointerdown on the document
// (capture phase so it fires before any element's own handlers) and closes the
// panel when the tap lands outside both the panel card and the hamburger toggle.
function MobileOutsideClickListener({ close }: { close: () => void }) {
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const panel = document.querySelector("[data-roster-mobile-panel]");
      const hamburger = document.querySelector("[data-roster-hamburger]");
      const target = e.target as Node;
      if (!panel?.contains(target) && !hamburger?.contains(target)) {
        close();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, { capture: true });
    return () => document.removeEventListener("pointerdown", handlePointerDown, { capture: true });
  }, [close]);
  return null;
}

// Mounts when the mobile panel is open. The built-in nav items call close()
// themselves, but `actions` / `navActions` hold arbitrary consumer content —
// a router link in either one navigates with the nav still mounted in the
// layout, leaving the panel open over the new page. Watching activePath
// catches every such navigation without the consumer wiring anything up.
// Only mounted while open, so the ref starts at the path the panel opened on
// and close() never fires on mount.
function CloseOnNavigation({
  activePath,
  close,
}: {
  activePath?: string;
  close: () => void;
}) {
  const openedAt = useRef(activePath);
  useEffect(() => {
    if (openedAt.current !== activePath) {
      openedAt.current = activePath;
      close();
    }
  }, [activePath, close]);
  return null;
}

const Navbar = ({
  logoSrc,
  logoSize = "2rem",
  logoClassName,
  brandName,
  items,
  activePath,
  routerElement,
  user,
  onLogin,
  onLogout,
  onInboxClick,
  onThemeToggle,
  actions,
  brandElement,
  navActions,
  userMenuItems = [],
  className,
  variant = "default",
  position = "sticky",
  themeMode,
  notificationVariant = "error",
  notificationFill = "solid",
  ...props
}: NavbarProps) => {
  const hasNotifications = (user?.notificationCount || 0) > 0;

  // A bare number reads as px, matching how width/height attributes behave.
  const logoDimension = typeof logoSize === "number" ? `${logoSize}px` : logoSize;
  const logoStyle = { width: logoDimension, height: logoDimension };

  const autoIsDark = useDarkClass(themeMode === "auto");

  // "default" for the light-mode assumption fallback
  const computedMode =
    themeMode === "auto"
      ? autoIsDark
        ? "dark"
        : "light"
      : (themeMode ??
        (variant === "white" || variant === "default" ? "light" : "dark"));
  const isDarkMode = computedMode === "dark";

  // Ensures default is treated as a dark surface when the app is in dark mode
  const isDarkSurface =
    variant === "slate" ||
    variant === "primary" ||
    (variant === "default" && isDarkMode) ||
    (variant === "white" && isDarkMode) ||
    (variant === "transparent" && isDarkMode);

  // Explicitly appending dark: prefixes to guarantee they overpower
  // the Link component's internal dark mode states
  const surfaceColors = {
    brand: isDarkSurface
      ? "rst:text-white rst:dark:text-white rst:hover:text-gray-200 rst:dark:hover:text-gray-200"
      : "rst:text-gray-900 rst:dark:text-gray-900 rst:hover:text-gray-600 rst:dark:hover:text-gray-600",

    linkBase: isDarkSurface
      ? "rst:text-gray-300 rst:dark:text-gray-300 rst:hover:text-white rst:dark:hover:text-white"
      : "rst:text-gray-600 rst:dark:text-gray-600 rst:hover:text-gray-900 rst:dark:hover:text-gray-900",

    linkActive: isDarkSurface
      ? "rst:text-primary-400 rst:dark:text-primary-400 rst:font-semibold rst:hover:text-primary-300 rst:dark:hover:text-primary-300"
      : "rst:text-primary-600 rst:dark:text-primary-600 rst:font-semibold rst:hover:text-primary-700 rst:dark:hover:text-primary-700",

    hamburger: isDarkSurface
      ? "rst:text-gray-300 rst:dark:text-gray-300 rst:hover:bg-white/10 rst:dark:hover:bg-white/10 rst:hover:text-white rst:dark:hover:text-white"
      : "rst:text-gray-500 rst:dark:text-gray-500 rst:hover:bg-gray-100 rst:dark:hover:bg-gray-100 rst:hover:text-gray-700 rst:dark:hover:text-gray-700",
  };

  return (
    <Popover
      as="nav"
      className={cn("rst:z-50", navbarVariants({ variant, position }), className)}
      {...props}
    >
      {({ open, close }) => {
        // Resolved once so the desktop and mobile render sites agree, and so a
        // function slot is only invoked once per render.
        const resolvedActions = renderSlot(actions, close);
        const resolvedNavActions = renderSlot(navActions, close);

        return (
        <>
          <div className="rst:container rst:mx-auto rst:flex rst:items-center rst:justify-between rst:px-4 rst:h-16">
            {/* Brand Logo */}
            <Link
              as={routerElement}
              href="/"
              to="/"
              variant="neutral"
              underline="none"
              className={cn(
                "rst:flex rst:items-center rst:gap-3 rst:transition-opacity",
                surfaceColors.brand,
              )}
            >
              <img
                src={logoSrc}
                alt={`${brandName} Logo`}
                style={logoStyle}
                className={cn("rst:shrink-0", logoClassName ?? "rst:rounded-md")}
              />
              {brandElement ?? (
                <span className="rst:text-xl rst:font-bold rst:tracking-tight">
                  {brandName}
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="rst:hidden rst:md:flex rst:items-center rst:gap-8">
              <div className="rst:flex rst:items-center rst:gap-6">
                {items.map((item) => {
                  const isActive = activePath === item.path;
                  return (
                    <Link
                      key={item.path}
                      as={routerElement}
                      href={item.path}
                      to={item.path}
                      variant="neutral"
                      underline="none"
                      className={cn(
                        "rst:inline-flex rst:items-center rst:gap-1.5 rst:text-sm rst:transition-colors rst:duration-200",
                        isActive
                          ? surfaceColors.linkActive
                          : surfaceColors.linkBase,
                      )}
                    >
                      {item.label}
                      {item.badge && <span className="rst:inline-flex">{item.badge}</span>}
                    </Link>
                  );
                })}
              </div>

              {/* Extra nav-level actions between links and user menu (e.g. search toggle) */}
              {resolvedNavActions}

              {/* User Menu / Custom Actions */}
              {resolvedActions ?? (user ? (
                <Menu as="div" className="rst:relative rst:ml-2">
                  <MenuButton className="rst:relative rst:flex rst:rounded-full rst:text-sm rst:focus:outline-none rst:focus:ring-2 rst:focus:ring-primary-500 rst:focus:ring-offset-2 rst:ring-offset-transparent">
                    <span className="rst:sr-only">Open user menu</span>

                    <Avatar
                      initials={user.initials}
                      src={user.avatarSrc}
                      size="sm"
                      shape="circle"
                      colorScheme={(user.avatarColor as React.ComponentProps<typeof Avatar>["colorScheme"]) ?? "primary"}
                    />

                    {hasNotifications && (
                      <div className="rst:absolute rst:-top-1 rst:-right-2">
                        <Badge
                          fill={notificationFill}
                          size="xs"
                          statusBadge
                          variant={notificationVariant}
                        >
                          {user.notificationCount}
                        </Badge>
                      </div>
                    )}
                  </MenuButton>

                  <Transition
                    as={Fragment}
                    enter="rst:transition rst:ease-out rst:duration-100"
                    enterFrom="rst:transform rst:opacity-0 rst:scale-95"
                    enterTo="rst:transform rst:opacity-100 rst:scale-100"
                    leave="rst:transition rst:ease-in rst:duration-75"
                    leaveFrom="rst:transform rst:opacity-100 rst:scale-100"
                    leaveTo="rst:transform rst:opacity-0 rst:scale-95"
                  >
                    <MenuItems className="rst:absolute rst:right-0 rst:z-50 rst:mt-2 rst:w-48 rst:origin-top-right rst:rounded-md rst:bg-white rst:dark:bg-gray-800 rst:py-1 rst:shadow-lg rst:ring-1 rst:ring-black/5 rst:dark:ring-white/10 rst:focus:outline-none rst:divide-y rst:divide-gray-100 rst:dark:divide-gray-700">
                      <div className="rst:py-1">
                        {hasNotifications && onInboxClick && (
                          <MenuItem>
                            {({ focus }) => (
                              <Button
                                variant="ghost"
                                colorScheme="neutral"
                                size="sm"
                                onClick={onInboxClick}
                                className={cn(
                                  "rst:w-full rst:justify-start rst:rounded-none rst:px-4",
                                  focus && "rst:bg-gray-50 rst:dark:bg-gray-700",
                                )}
                                startIcon={
                                  <FontAwesomeIcon
                                    icon={faInbox}
                                    className="rst:text-primary-500 rst:w-4"
                                  />
                                }
                              >
                                Inbox ({user.notificationCount})
                              </Button>
                            )}
                          </MenuItem>
                        )}

                        {/* THEME TOGGLE (DESKTOP) */}
                        {onThemeToggle && (
                          <MenuItem>
                            {({ focus }) => (
                              <div
                                onClick={(e) => {
                                  e.preventDefault();
                                  onThemeToggle();
                                }}
                                role="button"
                                tabIndex={0}
                                className={cn(
                                  "rst:flex rst:w-full rst:items-center rst:justify-between rst:px-4 rst:py-2 rst:text-sm rst:text-gray-700 rst:dark:text-gray-200 rst:cursor-pointer rst:transition-colors",
                                  focus && "rst:bg-gray-50 rst:dark:bg-gray-700",
                                )}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onThemeToggle();
                                  }
                                }}
                              >
                                <div className="rst:flex rst:items-center rst:gap-2">
                                  <FontAwesomeIcon
                                    icon={faMoon}
                                    className={cn(
                                      "rst:w-4 rst:transition-colors",
                                      isDarkMode
                                        ? "rst:text-amber-500"
                                        : "rst:text-gray-400",
                                    )}
                                  />
                                  <span className="rst:font-medium">Dark Mode</span>
                                </div>
                                <Switch
                                  checked={isDarkMode}
                                  onChange={() => {}}
                                  size="xs"
                                  variant="neutral"
                                  className="rst:pointer-events-none rst:m-0"
                                />
                              </div>
                            )}
                          </MenuItem>
                        )}
                      </div>

                      {userMenuItems.length > 0 && (
                        <div className="rst:py-1">
                          {userMenuItems.map((item) => (
                            <MenuItem key={item.path}>
                              {({ focus }) => (
                                <Link
                                  as={routerElement}
                                  href={item.path}
                                  to={item.path}
                                  variant="neutral"
                                  underline="none"
                                  className={cn(
                                    "rst:flex rst:w-full rst:items-center rst:justify-between rst:gap-2 rst:px-4 rst:py-2 rst:text-sm rst:text-gray-700 rst:dark:text-gray-200 rst:transition-colors",
                                    focus && "rst:bg-gray-50 rst:dark:bg-gray-700",
                                  )}
                                >
                                  {item.label}
                                  {item.badge && (
                                    <span className="rst:inline-flex">{item.badge}</span>
                                  )}
                                </Link>
                              )}
                            </MenuItem>
                          ))}
                        </div>
                      )}

                      {onLogout && (
                        <div className="rst:py-1">
                          <MenuItem>
                            {({ focus }) => (
                              <Button
                                variant="ghost"
                                colorScheme="neutral"
                                size="sm"
                                onClick={onLogout}
                                className={cn(
                                  "rst:w-full rst:justify-start rst:rounded-none rst:px-4",
                                  focus && "rst:bg-gray-50 rst:dark:bg-gray-700",
                                )}
                                startIcon={
                                  <FontAwesomeIcon
                                    icon={faRightFromBracket}
                                    className="rst:text-gray-400 rst:dark:text-gray-500 rst:w-4"
                                  />
                                }
                              >
                                Log Out
                              </Button>
                            )}
                          </MenuItem>
                        </div>
                      )}
                    </MenuItems>
                  </Transition>
                </Menu>
              ) : (
                <Button size="sm" variant="solid" colorScheme="primary" onClick={onLogin}>
                  Log In
                </Button>
              ))}
            </div>

            {/* Mobile Hamburger */}
            <div data-roster-hamburger className="rst:flex rst:md:hidden">
              <PopoverButton
                className={cn(
                  "rst:inline-flex rst:items-center rst:justify-center rst:rounded-md rst:p-2 rst:focus:outline-none rst:focus:ring-2 rst:focus:ring-inset rst:focus:ring-primary-500",
                  surfaceColors.hamburger,
                )}
              >
                <span className="rst:sr-only">Open main menu</span>
                {open ? (
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="rst:block rst:h-6 rst:w-6"
                    aria-hidden="true"
                  />
                ) : (
                  <div className="rst:relative">
                    <FontAwesomeIcon
                      icon={faBars}
                      className="rst:block rst:h-6 rst:w-6"
                      aria-hidden="true"
                    />
                    {hasNotifications && (
                      <span className="rst:absolute rst:top-0 rst:right-0 rst:block rst:h-2.5 rst:w-2.5 rst:rounded-full rst:bg-error-500 rst:ring-2 rst:ring-transparent rst:transform rst:translate-x-1/4 rst:-translate-y-1/4" />
                    )}
                  </div>
                )}
              </PopoverButton>
            </div>
          </div>

          {/* Document-level listener: closes panel when tapping outside it */}
          {open && <MobileOutsideClickListener close={close} />}

          {/* Closes the panel when a client-side navigation changes the route */}
          {open && <CloseOnNavigation activePath={activePath} close={close} />}

          {/* Mobile Menu Panel */}
          <Transition
            as={Fragment}
            enter="rst:duration-200 rst:ease-out"
            enterFrom="rst:opacity-0 rst:scale-95"
            enterTo="rst:opacity-100 rst:scale-100"
            leave="rst:duration-100 rst:ease-in"
            leaveFrom="rst:opacity-100 rst:scale-100"
            leaveTo="rst:opacity-0 rst:scale-95"
          >
            <PopoverPanel
              focus
              className="rst:absolute rst:top-0 rst:inset-x-0 rst:z-50 rst:origin-top-right rst:transform rst:p-2 rst:transition rst:md:hidden"
            >
              <div data-roster-mobile-panel className="rst:rounded-lg rst:shadow-lg rst:ring-1 rst:ring-black/5 rst:dark:ring-white/10 rst:divide-y rst:divide-gray-100 rst:dark:divide-gray-700 rst:bg-white rst:dark:bg-gray-800">
                <div className="rst:px-5 rst:pt-5 rst:pb-6">
                  <div className="rst:flex rst:items-center rst:justify-between">
                    <div className="rst:flex rst:items-center rst:gap-3">
                      <img
                        src={logoSrc}
                        alt={brandName}
                        style={logoStyle}
                        className={cn("rst:shrink-0", logoClassName ?? "rst:rounded-md")}
                      />
                      {brandElement ?? (
                        <span className="rst:font-bold rst:text-gray-900 rst:dark:text-white">
                          {brandName}
                        </span>
                      )}
                    </div>
                    <div className="rst:-mr-2">
                      <PopoverButton className="rst:inline-flex rst:items-center rst:justify-center rst:rounded-md rst:p-2 rst:text-gray-400 rst:hover:bg-gray-100 rst:dark:hover:bg-gray-700 rst:hover:text-gray-500 rst:dark:hover:text-white rst:focus:outline-none">
                        <span className="rst:sr-only">Close menu</span>
                        <FontAwesomeIcon
                          icon={faXmark}
                          className="rst:h-6 rst:w-6"
                          aria-hidden="true"
                        />
                      </PopoverButton>
                    </div>
                  </div>
                  <div className="rst:mt-6">
                    {resolvedNavActions && (
                      <div className="rst:mb-4">{resolvedNavActions}</div>
                    )}
                    <nav className="rst:grid rst:gap-y-4">
                      {items.map((item) => {
                        const isActive = activePath === item.path;
                        return (
                          <Link
                            key={item.path}
                            as={routerElement}
                            href={item.path}
                            to={item.path}
                            onClick={() => close()}
                            variant="neutral"
                            underline="none"
                            className={cn(
                              "rst:-m-3 rst:flex rst:items-center rst:rounded-md rst:p-3 rst:transition-colors",
                              "rst:hover:bg-gray-50 rst:dark:hover:bg-gray-700",
                              isActive
                                ? "rst:bg-gray-50 rst:dark:bg-gray-700"
                                : "rst:text-gray-900 rst:dark:text-gray-100",
                            )}
                          >
                            <span
                              className={cn(
                                "rst:ml-3 rst:inline-flex rst:items-center rst:gap-1.5 rst:text-base rst:font-medium",
                                isActive
                                  ? "rst:text-primary-600 rst:dark:text-primary-400 rst:font-bold"
                                  : "rst:text-gray-900 rst:dark:text-gray-100",
                              )}
                            >
                              {item.label}
                              {item.badge && <span className="rst:inline-flex">{item.badge}</span>}
                            </span>
                          </Link>
                        );
                      })}
                      {user && userMenuItems.length > 0 && (
                        <>
                          <hr className="rst:border-gray-100 rst:dark:border-gray-700" />
                          {userMenuItems.map((item) => {
                            const isActive = activePath === item.path;
                            return (
                              <Link
                                key={item.path}
                                as={routerElement}
                                href={item.path}
                                to={item.path}
                                onClick={() => close()}
                                variant="neutral"
                                underline="none"
                                className={cn(
                                  "rst:-m-3 rst:flex rst:items-center rst:rounded-md rst:p-3 rst:transition-colors",
                                  "rst:hover:bg-gray-50 rst:dark:hover:bg-gray-700",
                                  isActive
                                    ? "rst:bg-gray-50 rst:dark:bg-gray-700"
                                    : "rst:text-gray-900 rst:dark:text-gray-100",
                                )}
                              >
                                <span
                                  className={cn(
                                    "rst:ml-3 rst:text-base rst:font-medium",
                                    isActive
                                      ? "rst:text-primary-600 rst:dark:text-primary-400 rst:font-bold"
                                      : "rst:text-gray-900 rst:dark:text-gray-100",
                                  )}
                                >
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="rst:ml-2 rst:inline-flex">{item.badge}</span>
                                )}
                              </Link>
                            );
                          })}
                        </>
                      )}
                    </nav>
                  </div>
                </div>

                {(user || resolvedActions || onLogin) && (
                  <div className="rst:py-6 rst:px-5 rst:space-y-4">
                    {resolvedActions ? (
                      resolvedActions
                    ) : !user && onLogin ? (
                      <Button
                        variant="solid"
                        colorScheme="primary"
                        className="rst:w-full rst:justify-center"
                        onClick={() => { onLogin(); close(); }}
                      >
                        Log In
                      </Button>
                    ) : (
                      <>
                        {hasNotifications && onInboxClick && (
                          <Button
                            variant="ghost"
                            colorScheme="neutral"
                            onClick={() => {
                              onInboxClick?.();
                              close();
                            }}
                            className="rst:w-full rst:justify-between rst:px-4 rst:text-base rst:font-medium rst:hover:bg-gray-50 rst:dark:hover:bg-gray-700 rst:text-gray-900 rst:dark:text-gray-100"
                            endIcon={
                              <Badge
                                fill={notificationFill}
                                size="xs"
                                statusBadge
                                variant={notificationVariant}
                              >
                                {user?.notificationCount}
                              </Badge>
                            }
                          >
                            Pending Invitations
                          </Button>
                        )}

                        {/* THEME TOGGLE (MOBILE) */}
                        {onThemeToggle && (
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              onThemeToggle();
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onThemeToggle();
                              }
                            }}
                            className="rst:flex rst:w-full rst:items-center rst:justify-between rst:rounded-md rst:px-4 rst:py-2 rst:text-base rst:transition-colors rst:cursor-pointer rst:hover:bg-gray-50 rst:dark:hover:bg-gray-700 rst:text-gray-900 rst:dark:text-gray-100"
                          >
                            <div className="rst:flex rst:items-center rst:gap-3 rst:font-medium">
                              <FontAwesomeIcon
                                icon={faMoon}
                                className={cn(
                                  "rst:w-5 rst:transition-colors",
                                  isDarkMode ? "rst:text-amber-500" : "rst:text-gray-400",
                                )}
                              />
                              <span>Dark Mode</span>
                            </div>
                            <Switch
                              checked={isDarkMode}
                              onChange={() => {}}
                              size="sm"
                              variant="neutral"
                              className="rst:pointer-events-none rst:m-0"
                            />
                          </div>
                        )}

                        {onLogout && (
                          <Button
                            variant="outline"
                            colorScheme="error"
                            className="rst:w-full rst:justify-center"
                            onClick={() => {
                              onLogout?.();
                              close();
                            }}
                          >
                            Log Out
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </PopoverPanel>
          </Transition>
        </>
        );
      }}
    </Popover>
  );
};

export { Navbar };
