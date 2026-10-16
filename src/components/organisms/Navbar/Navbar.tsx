import React, { Fragment, useEffect, useRef } from "react";
import {
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
import { withLabels } from "../../../lib/labels";
import { Button } from "../../atoms/Button/Button";
import { Link } from "../../atoms/Link/Link";
import { Badge } from "../../atoms/Badge/Badge";
import { Avatar } from "../../atoms/Avatar/Avatar";
import { switchThumbVariants, switchTrackVariants } from "../../atoms/Switch/switch-variants";
import { Menu, MenuButton, MenuCheckboxItem, MenuGroup, MenuItem, MenuItems, type MenuLinkProps } from "../../molecules/Menu/Menu";
import { navbarVariants } from "./navbar-variants";
import { useKeyFocus } from "../../../internal/key-focus";

/**
 * The theme rows' switch, drawn and nothing else.
 *
 * Each theme row is itself the control, so the track must not be one too: a
 * real `Switch` here was a second tab stop nested inside the row, named
 * "Toggle setting". This renders the same track and thumb from the same
 * variants, hidden from assistive technology, with no focus and no pointer
 * target of its own.
 */
function ThemeTrack({ on, size }: { on: boolean; size: "xs" | "sm" }) {
  return (
    <span
      aria-hidden="true"
      data-testid="navbar-theme-track"
      data-checked={on ? "" : undefined}
      className={cn(switchTrackVariants({ size, variant: "neutral" }), "rst:pointer-events-none")}
    >
      <span className={cn(switchThumbVariants({ size }))} />
    </span>
  );
}

/* The user menu's rows, drawn as they were before the menu was Roster's own:
   the panel's gray text, a pale fill under focus and the pointer, and each
   icon at its own width rather than in the menu's 16px slot. */
const USER_MENU_ROW =
  "rst:gap-2 rst:px-4 rst:[&>[data-menu-lead]]:w-auto rst:text-gray-700 rst:dark:text-gray-200 rst:focus:bg-gray-50 rst:focus:text-gray-700 rst:dark:focus:bg-gray-700 rst:dark:focus:text-gray-200";
/* Link rows were Links: semibold, slightly rounded, and darker under the
   pointer. Pointing at a row focuses it, so the darker text has to win over
   the focused one. */
const USER_MENU_LINK = /* @__PURE__ */ cn(
  USER_MENU_ROW,
  "rst:font-semibold rst:rounded-sm rst:hover:text-gray-900 rst:dark:hover:text-gray-100 rst:hover:focus:text-gray-900 rst:dark:hover:focus:text-gray-100",
);
/* The user menu's link rows go through the app's router element, as the bar's
   own links do. Made once per element, so the menu sees a stable component. */
const ROUTER_MENU_LINKS = new WeakMap<object, React.ComponentType<MenuLinkProps>>();
function routerMenuLink(As: React.ElementType | undefined): React.ComponentType<MenuLinkProps> | undefined {
  if (!As || typeof As === "string") return undefined;
  let link = ROUTER_MENU_LINKS.get(As);
  if (!link) {
    link = (props: MenuLinkProps) => <As {...props} />;
    ROUTER_MENU_LINKS.set(As, link);
  }
  return link;
}

/* Inbox and Log Out were ghost Buttons: a ghost Button's medium gray, its clear
   1px border, and its own fill under the pointer, over the focused one. */
const USER_MENU_ACTION = /* @__PURE__ */ cn(
  USER_MENU_ROW,
  "rst:border rst:border-transparent rst:font-medium rst:text-gray-600 rst:dark:text-gray-400 rst:focus:text-gray-600 rst:dark:focus:text-gray-400 rst:hover:bg-gray-500/10 rst:dark:hover:bg-gray-400/15 rst:hover:focus:bg-gray-500/10 rst:dark:hover:focus:bg-gray-400/15",
);

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

/** Every word Navbar shows or says of its own. Pass any of them in `labels` to replace it. */
export interface NavbarLabels {
  /** The menu button's name, on a phone. */
  openMainMenu: string;
  /** The menu panel's close button. */
  closeMainMenu: string;
  /** The avatar button's name. */
  openUserMenu: string;
  /** The log-in button, without a `user`. */
  logIn: string;
  /** The log-out item, with `onLogout`. */
  logOut: string;
  /** The theme row, with `onThemeToggle`. */
  darkMode: string;
  /** The menu panel's inbox button, with `onInboxClick` and a `notificationCount`. */
  pendingInvitations: string;
  /** The user menu's inbox item, with `onInboxClick` and a `notificationCount`. */
  inbox: (count: number) => string;
}

const LABELS: NavbarLabels = {
  openMainMenu: "Open main menu",
  closeMainMenu: "Close menu",
  openUserMenu: "Open user menu",
  logIn: "Log In",
  logOut: "Log Out",
  darkMode: "Dark Mode",
  pendingInvitations: "Pending Invitations",
  inbox: (count) => `Inbox (${count})`,
};

export interface NavbarProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navbarVariants> {
  logoSrc: string;
  /**
   * Size of a square logo: its width and its height. Accepts any CSS length
   * (`"2.75rem"`, `44`). Defaults to `2rem`, the previous hard-coded `h-8 w-8`.
   */
  logoSize?: string | number;
  /**
   * The logo's height, for a logo that isn't square. A wide lockup takes
   * `logoHeight` alone and keeps its own proportions: its width follows the
   * image. Either this or `logoWidth` replaces `logoSize`. When you know the
   * ratio, set both: the box is then held before the image loads, so the name
   * beside it doesn't move.
   */
  logoHeight?: string | number;
  /**
   * The logo's width, for a logo that isn't square. Alone, the height follows
   * the image; with `logoHeight`, the image is fitted inside that box,
   * never stretched.
   */
  logoWidth?: string | number;
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
  /** The component's own words, replaced; any left out stay English. */
  labels?: Partial<NavbarLabels>;
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
   * string can't express (e.g. a bold word beside a thin one).
   * The logo image is always rendered; this only affects the text element.
   * The logo is decorative (empty alt) because this or the brand name names
   * the link, so give it text a screen reader can read, visible or not.
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

/* Inside this Navbar's mobile panel: the card itself, or a Menu opened from it,
   which draws its own panel elsewhere in the document. */
function inMobilePanel(panel: HTMLElement | null, node: Node | null): boolean {
  if (!node || !panel) return false;
  if (panel.contains(node)) return true;
  const menu = (node as Element).closest?.("[data-menu-panel]")?.getAttribute("data-menu-tree");
  return !!menu && !!panel.querySelector(`[data-menu-tree="${CSS.escape(menu)}"]`);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Mounts when the mobile panel is open. Listens for pointerdown on the document
// (capture phase so it fires before any element's own handlers) and closes the
// panel when the tap lands outside both the panel card and the hamburger toggle.
type MobilePanelProps = {
  close: () => void;
  panel: React.RefObject<HTMLDivElement | null>;
  hamburger: React.RefObject<HTMLDivElement | null>;
};

function MobileOutsideClickListener({ close, panel, hamburger }: MobilePanelProps) {
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!inMobilePanel(panel.current, target) && !hamburger.current?.contains(target)) {
        close();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, { capture: true });
    return () => document.removeEventListener("pointerdown", handlePointerDown, { capture: true });
  }, [close, panel, hamburger]);
  return null;
}

// Mounts when the mobile panel is open: moves focus into it, and closes it when
// focus goes anywhere else, the hamburger included: the panel covers it, so
// focus there (Shift+Tab from the panel's first control) is focus out of
// sight. Headless UI's `focus` on the panel did both, but it took a Menu opened
// from inside the panel, whose own panel is drawn elsewhere in the document,
// for focus leaving, and closed under it.
function MobilePanelFocus({ close, panel }: Pick<MobilePanelProps, "close" | "panel">) {
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      /* A click on something in the card that doesn't take focus itself, its
         words or its padding, focuses the nearest focusable ancestor: Headless
         UI's own panel element around this card. WebKit treats a click on a
         button the same way, since it never focuses one on a click. That's
         still inside. */
      if (e.target === panel.current?.parentElement) return;
      if (!inMobilePanel(panel.current, e.target as Node)) close();
    };
    /* A frame on: Headless UI settles focus on its button after this effect. */
    const frame = requestAnimationFrame(() => {
      panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      document.addEventListener("focusin", handleFocusIn);
    });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [close, panel]);
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
  logoHeight,
  logoWidth,
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
  labels,
  notificationVariant = "error",
  notificationFill = "solid",
  ...props
}: NavbarProps) => {
  useKeyFocus();
  const l = withLabels(LABELS, labels);
  const menuLink = routerMenuLink(routerElement);
  const hasNotifications = (user?.notificationCount || 0) > 0;

  // A bare number reads as px, matching how width/height attributes behave.
  const length = (value: string | number) => (typeof value === "number" ? `${value}px` : value);
  /* Square from `logoSize` unless either side is given; then the side left
     out follows the image, and a box set on both sides fits it, unstretched,
     against the start edge (classes, so a right-to-left page mirrors it).
     Both images, the bar's and the menu panel's, take the same box. */
  const logoFree = logoHeight !== undefined || logoWidth !== undefined;
  const logoStyle: React.CSSProperties = logoFree
    ? {
        width: logoWidth === undefined ? "auto" : length(logoWidth),
        height: logoHeight === undefined ? "auto" : length(logoHeight),
      }
    : { width: length(logoSize), height: length(logoSize) };
  const logoFit = logoFree && "rst:object-contain rst:object-left rst:rtl:object-right";

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
  const surfaceColors =
    variant === "primary"
      ? {
          // On primary-700, text is that fill's ink (the dimmer links at 80%),
          // so a light primary gets dark text. The dark fill is primary-950,
          // which the ink doesn't describe: there it stays the dark surface's
          // white and grays.
          brand:
            "rst:text-primary-700-ink rst:hover:text-primary-700-ink/80 rst:dark:text-white rst:dark:hover:text-gray-200",
          linkBase:
            "rst:text-primary-700-ink/80 rst:hover:text-primary-700-ink rst:dark:text-gray-300 rst:dark:hover:text-white",
          linkActive:
            "rst:text-primary-700-ink rst:font-semibold rst:hover:text-primary-700-ink/80 rst:dark:text-primary-400 rst:dark:hover:text-primary-300",
          hamburger:
            "rst:text-primary-700-ink/80 rst:hover:bg-primary-700-ink/10 rst:hover:text-primary-700-ink rst:dark:text-gray-300 rst:dark:hover:bg-white/10 rst:dark:hover:text-white",
        }
      : {
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

  const mobilePanel = useRef<HTMLDivElement>(null);
  const hamburger = useRef<HTMLDivElement>(null);

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
              {/* Empty alt: the brand's name sits beside it in the same link,
                  so naming the logo too reads the brand twice. */}
              <img
                src={logoSrc}
                alt=""
                style={logoStyle}
                className={cn("rst:shrink-0", logoFit, logoClassName ?? "rst:rounded-md")}
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
                <div className="rst:relative rst:ml-2">
                  <Menu linkComponent={menuLink}>
                    {/* The avatar is 32px; the hit area around it is 44. */}
                    <MenuButton
                      plain
                      className="rst:relative rst:flex rst:rounded-full rst:text-sm rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:ring-offset-background rst:before:absolute rst:before:-inset-1.5 rst:before:content-['']"
                    >
                      <span className="rst:sr-only">{l.openUserMenu}</span>

                      {/* Hidden, photo and initials alike: the button is named by
                          its label, which an alt or initials would add to. */}
                      <Avatar
                        aria-hidden="true"
                        alt=""
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

                    <MenuItems
                      align="end"
                      offset={8}
                      className="rst:w-48 rst:min-w-0 rst:bg-white rst:dark:bg-gray-800 rst:ring-black/5 rst:dark:ring-white/10 rst:divide-y rst:divide-gray-100 rst:dark:divide-gray-700"
                    >
                      {((hasNotifications && onInboxClick) || onThemeToggle) && (
                        <MenuGroup className="rst:py-1">
                          {hasNotifications && onInboxClick && (
                            <MenuItem
                              onSelect={onInboxClick}
                              className={USER_MENU_ACTION}
                              icon={<FontAwesomeIcon icon={faInbox} className="rst:text-primary-500 rst:w-4" />}
                            >
                              {l.inbox(user.notificationCount ?? 0)}
                            </MenuItem>
                          )}

                          {/* THEME TOGGLE (DESKTOP): an on/off row, so a
                              `menuitemcheckbox`. It stays open when chosen,
                              as it always has. */}
                          {onThemeToggle && (
                            <MenuCheckboxItem
                              checked={isDarkMode}
                              onCheckedChange={() => onThemeToggle()}
                              closeOnSelect={false}
                              className={USER_MENU_ROW}
                              icon={
                                <FontAwesomeIcon
                                  icon={faMoon}
                                  className={cn("rst:w-4 rst:transition-colors", isDarkMode ? "rst:text-amber-500" : "rst:text-gray-400")}
                                />
                              }
                              indicator={<ThemeTrack on={isDarkMode} size="xs" />}
                            >
                              <span className="rst:font-medium">{l.darkMode}</span>
                            </MenuCheckboxItem>
                          )}
                        </MenuGroup>
                      )}

                      {userMenuItems.length > 0 && (
                        <MenuGroup className="rst:py-1">
                          {userMenuItems.map((item) => (
                            <MenuItem key={item.path} href={item.path} badge={item.badge} className={USER_MENU_LINK}>
                              {item.label}
                            </MenuItem>
                          ))}
                        </MenuGroup>
                      )}

                      {onLogout && (
                        <MenuGroup className="rst:py-1">
                          <MenuItem
                            onSelect={onLogout}
                            className={USER_MENU_ACTION}
                            icon={<FontAwesomeIcon icon={faRightFromBracket} className="rst:text-gray-400 rst:dark:text-gray-500 rst:w-4" />}
                          >
                            {l.logOut}
                          </MenuItem>
                        </MenuGroup>
                      )}
                    </MenuItems>
                  </Menu>
                </div>
              ) : (
                <Button size="sm" variant="solid" colorScheme="primary" onClick={onLogin}>
                  {l.logIn}
                </Button>
              ))}
            </div>

            {/* Mobile Hamburger */}
            <div ref={hamburger} data-roster-hamburger className="rst:flex rst:md:hidden">
              <PopoverButton
                className={cn(
                  "rst:inline-flex rst:items-center rst:justify-center rst:rounded-md rst:p-2 rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:ring-offset-background",
                  surfaceColors.hamburger,
                )}
              >
                <span className="rst:sr-only">{l.openMainMenu}</span>
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
          {open && <MobileOutsideClickListener close={close} panel={mobilePanel} hamburger={hamburger} />}

          {/* Focus into the panel on opening, and closes it when focus leaves */}
          {open && <MobilePanelFocus close={close} panel={mobilePanel} />}

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
              className="rst:absolute rst:top-0 rst:inset-x-0 rst:z-50 rst:origin-top-right rst:transform rst:p-2 rst:transition rst:md:hidden"
            >
              <div ref={mobilePanel} data-roster-mobile-panel className="rst:rounded-lg rst:elevation-anchored rst:ring rst:ring-black/5 rst:dark:ring-white/10 rst:divide-y rst:divide-gray-100 rst:dark:divide-gray-700 rst:bg-white rst:dark:bg-gray-800">
                <div className="rst:px-5 rst:pt-5 rst:pb-6">
                  <div className="rst:flex rst:items-center rst:justify-between">
                    <div className="rst:flex rst:items-center rst:gap-3">
                      <img
                        src={logoSrc}
                        alt=""
                        style={logoStyle}
                        className={cn("rst:shrink-0", logoFit, logoClassName ?? "rst:rounded-md")}
                      />
                      {brandElement ?? (
                        <span className="rst:font-bold rst:text-gray-900 rst:dark:text-white">
                          {brandName}
                        </span>
                      )}
                    </div>
                    <div className="rst:-mr-2">
                      <PopoverButton className="rst:inline-flex rst:items-center rst:justify-center rst:rounded-md rst:p-2 rst:text-gray-400 rst:hover:bg-gray-100 rst:dark:hover:bg-gray-700 rst:hover:text-gray-500 rst:dark:hover:text-white rst:focus:outline-hidden">
                        <span className="rst:sr-only">{l.closeMainMenu}</span>
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
                        {l.logIn}
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
                            {l.pendingInvitations}
                          </Button>
                        )}

                        {/* THEME TOGGLE (MOBILE) */}
                        {onThemeToggle && (
                          /* The row is the switch: one tab stop, its
                             state in `aria-checked`, its name from its text. */
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              onThemeToggle();
                            }}
                            role="switch"
                            aria-checked={isDarkMode}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              /* Held down, a key repeats; a switch toggles
                                 once per press, as a native one does. */
                              if (e.repeat) return;
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
                              <span>{l.darkMode}</span>
                            </div>
                            <ThemeTrack on={isDarkMode} size="sm" />
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
                            {l.logOut}
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
