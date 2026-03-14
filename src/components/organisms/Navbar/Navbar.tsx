import React, { Fragment } from "react";
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

export interface NavItem {
  label: string;
  path: string;
}

export interface NavbarProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navbarVariants> {
  logoSrc: string;
  brandName: string;
  items: NavItem[];
  activePath?: string;
  routerElement?: React.ElementType;
  user?: {
    initials: string;
    notificationCount?: number;
    avatarSrc?: string;
  };
  onLogout: () => void;
  onInboxClick: () => void;
  onThemeToggle?: () => void;
  themeMode?: "light" | "dark";
  notificationVariant?:
    | "primary"
    | "error"
    | "amber"
    | "success"
    | "neutral"
    | "orange"
    | "teal"
    | "purple";
}

const Navbar = ({
  logoSrc,
  brandName,
  items,
  activePath,
  routerElement,
  user,
  onLogout,
  onInboxClick,
  onThemeToggle,
  className,
  variant = "slate",
  position = "sticky",
  themeMode,
  notificationVariant = "error",
  ...props
}: NavbarProps) => {
  const hasNotifications = (user?.notificationCount || 0) > 0;

  const computedMode = themeMode ?? (variant === "white" ? "light" : "dark");
  const isDarkMode = computedMode === "dark";

  // Determines if the main navbar strip is currently a dark surface
  const isDarkSurface =
    variant === "slate" ||
    variant === "primary" ||
    (variant === "white" && isDarkMode) ||
    (variant === "transparent" && isDarkMode);

  // Surface colors strictly apply to the main Navbar strip
  const surfaceColors = {
    brand: isDarkSurface
      ? "text-white hover:text-gray-200"
      : "text-gray-900 hover:text-gray-600",

    linkBase: isDarkSurface
      ? "text-gray-300 hover:text-white"
      : "text-gray-600 hover:text-gray-900",

    linkActive: isDarkSurface
      ? "text-primary-300 font-semibold hover:text-primary-200"
      : "text-primary-600 font-semibold hover:text-primary-700",

    hamburger: isDarkSurface
      ? "text-gray-300 hover:bg-white/10 hover:text-white"
      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
  };

  return (
    <Popover
      as="nav"
      className={cn(navbarVariants({ variant, position }), className)}
      {...props}
    >
      {({ open, close }) => (
        <>
          <div className="container mx-auto flex items-center justify-between px-4 h-16">
            {/* Brand Logo */}
            <Link
              as={routerElement}
              href="/"
              to="/"
              variant="neutral"
              className={cn(
                "flex items-center gap-3 transition-opacity no-underline",
                surfaceColors.brand,
              )}
            >
              <img
                src={logoSrc}
                alt={`${brandName} Logo`}
                className="h-8 w-8 rounded-md"
              />
              <span className="text-xl font-bold tracking-tight">
                {brandName}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-6">
                {items.map((item) => {
                  const isActive = activePath === item.path;
                  return (
                    <Link
                      key={item.path}
                      as={routerElement}
                      href={item.path}
                      to={item.path}
                      variant="neutral"
                      className={cn(
                        "text-sm font-medium transition-colors duration-200 no-underline",
                        isActive
                          ? surfaceColors.linkActive
                          : surfaceColors.linkBase,
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* User Menu */}
              {user ? (
                <Menu as="div" className="relative ml-2">
                  <MenuButton className="relative flex rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ring-offset-transparent">
                    <span className="sr-only">Open user menu</span>

                    <Avatar
                      initials={user.initials}
                      src={user.avatarSrc}
                      size="sm"
                      shape="circle"
                      colorScheme="primary"
                    />

                    {hasNotifications && (
                      <div className="absolute -top-1 -right-2">
                        <Badge
                          fill="solid"
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
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none divide-y divide-gray-100 dark:divide-gray-700">
                      <div className="py-1">
                        {hasNotifications && (
                          <MenuItem>
                            {({ focus }) => (
                              <Button
                                variant="ghost"
                                colorScheme="neutral"
                                size="sm"
                                onClick={onInboxClick}
                                className={cn(
                                  "w-full justify-start rounded-none px-4",
                                  focus && "bg-gray-50 dark:bg-gray-700",
                                )}
                                startIcon={
                                  <FontAwesomeIcon
                                    icon={faInbox}
                                    className="text-primary-500 w-4"
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
                              <button
                                onClick={(e) => {
                                  e.preventDefault(); // Keeps menu open
                                  onThemeToggle();
                                }}
                                className={cn(
                                  "flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer transition-colors",
                                  focus && "bg-gray-50 dark:bg-gray-700",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon
                                    icon={faMoon}
                                    className={cn(
                                      "w-4 transition-colors",
                                      isDarkMode
                                        ? "text-amber-500"
                                        : "text-gray-400",
                                    )}
                                  />
                                  <span className="font-medium">Dark Mode</span>
                                </div>
                                <Switch
                                  checked={isDarkMode}
                                  onChange={() => {}} // Controlled by the parent button click
                                  size="xs"
                                  variant="neutral"
                                  className="pointer-events-none m-0"
                                />
                              </button>
                            )}
                          </MenuItem>
                        )}
                      </div>

                      <div className="py-1">
                        <MenuItem>
                          {({ focus }) => (
                            <Button
                              variant="ghost"
                              colorScheme="neutral"
                              size="sm"
                              onClick={onLogout}
                              className={cn(
                                "w-full justify-start rounded-none px-4",
                                focus && "bg-gray-50 dark:bg-gray-700",
                              )}
                              startIcon={
                                <FontAwesomeIcon
                                  icon={faRightFromBracket}
                                  className="text-gray-400 dark:text-gray-500 w-4"
                                />
                              }
                            >
                              Log Out
                            </Button>
                          )}
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </Transition>
                </Menu>
              ) : (
                <Button size="sm" variant="solid" colorScheme="primary">
                  Log In
                </Button>
              )}
            </div>

            {/* Mobile Hamburger */}
            <div className="flex md:hidden">
              <PopoverButton
                className={cn(
                  "inline-flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500",
                  surfaceColors.hamburger,
                )}
              >
                <span className="sr-only">Open main menu</span>
                {open ? (
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="block h-6 w-6"
                    aria-hidden="true"
                  />
                ) : (
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faBars}
                      className="block h-6 w-6"
                      aria-hidden="true"
                    />
                    {hasNotifications && (
                      <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-error-500 ring-2 ring-transparent transform translate-x-1/4 -translate-y-1/4" />
                    )}
                  </div>
                )}
              </PopoverButton>
            </div>
          </div>

          {/* Mobile Menu Panel */}
          <Transition
            as={Fragment}
            enter="duration-200 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <PopoverPanel
              focus
              className="absolute top-0 inset-x-0 z-30 origin-top-right transform p-2 transition md:hidden"
            >
              <div className="rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-white/10 divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                <div className="px-5 pt-5 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={logoSrc}
                        alt={brandName}
                        className="h-8 w-8 rounded-md"
                      />
                      <span className="font-bold text-gray-900 dark:text-white">
                        {brandName}
                      </span>
                    </div>
                    <div className="-mr-2">
                      <PopoverButton className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-white focus:outline-none">
                        <span className="sr-only">Close menu</span>
                        <FontAwesomeIcon
                          icon={faXmark}
                          className="h-6 w-6"
                          aria-hidden="true"
                        />
                      </PopoverButton>
                    </div>
                  </div>
                  <div className="mt-6">
                    <nav className="grid gap-y-4">
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
                            className={cn(
                              "-m-3 flex items-center rounded-md p-3 no-underline transition-colors",
                              "hover:bg-gray-50 dark:hover:bg-gray-700",
                              isActive
                                ? "bg-gray-50 dark:bg-gray-700"
                                : "text-gray-900 dark:text-gray-100",
                            )}
                          >
                            <span
                              className={cn(
                                "ml-3 text-base font-medium",
                                isActive
                                  ? "text-primary-600 dark:text-primary-400 font-bold"
                                  : "text-gray-900 dark:text-gray-100",
                              )}
                            >
                              {item.label}
                            </span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                {user && (
                  <div className="py-6 px-5 space-y-4">
                    {hasNotifications && (
                      <Button
                        variant="ghost"
                        colorScheme="neutral"
                        onClick={() => {
                          onInboxClick();
                          close();
                        }}
                        className="w-full justify-between px-4 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        endIcon={
                          <Badge
                            fill="solid"
                            size="xs"
                            statusBadge
                            variant={notificationVariant}
                          >
                            {user.notificationCount}
                          </Badge>
                        }
                      >
                        Pending Invitations
                      </Button>
                    )}

                    {/* THEME TOGGLE (MOBILE) */}
                    {onThemeToggle && (
                      <button
                        onClick={(e) => {
                          e.preventDefault(); // Keeps mobile slide-out open
                          onThemeToggle();
                        }}
                        className="flex w-full items-center justify-between rounded-md px-4 py-2 text-base transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <div className="flex items-center gap-3 font-medium">
                          <FontAwesomeIcon
                            icon={faMoon}
                            className={cn(
                              "w-5 transition-colors",
                              isDarkMode ? "text-amber-500" : "text-gray-400",
                            )}
                          />
                          <span>Dark Mode</span>
                        </div>
                        <Switch
                          checked={isDarkMode}
                          onChange={() => {}} // Controlled by parent button click
                          size="sm"
                          variant="neutral"
                          className="pointer-events-none m-0"
                        />
                      </button>
                    )}

                    <Button
                      variant="outline"
                      colorScheme="error"
                      className="w-full justify-center"
                      onClick={() => {
                        onLogout();
                        close();
                      }}
                    >
                      Log Out
                    </Button>
                  </div>
                )}
              </div>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

export { Navbar };
