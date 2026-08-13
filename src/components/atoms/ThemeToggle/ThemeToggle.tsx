"use client";

import React, { useCallback, useSyncExternalStore } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { Button, type ButtonProps } from "../Button/Button";

/**
 * Toggles Roster's class-based dark mode by putting `.dark` on the document
 * root, and remembers the choice.
 *
 * **How this relates to Navbar.** `Navbar` has a `themeMode` prop describing
 * what palette the bar paints itself with; it does not change the app's theme.
 * This component is the thing that actually changes it. Pair them with
 * `themeMode="auto"` and the nav will follow whatever this sets. They are not
 * two answers to the same question.
 *
 * **First paint.** A toggle alone cannot prevent a flash of the wrong theme,
 * because the class has to be on `<html>` before React runs. Add a blocking
 * script in your document head:
 *
 * ```html
 * <script>
 *   try {
 *     var s = localStorage.getItem("roster-theme");
 *     var dark = s ? s === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
 *     if (dark) document.documentElement.classList.add("dark");
 *   } catch (e) {}
 * </script>
 * ```
 */

const DEFAULT_STORAGE_KEY = "roster-theme";

/* The DOM is the source of truth: the blocking script writes there before
   React exists, so state would only ever be a stale copy. */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => {
    listeners.delete(onStoreChange);
    observer.disconnect();
  };
}

function readIsDark() {
  return document.documentElement.classList.contains("dark");
}

/* The server cannot know the visitor's preference. */
function readServer() {
  return false;
}

export interface ThemeToggleProps
  extends Omit<ButtonProps, "onClick" | "children" | "aria-label"> {
  /** localStorage key. Match it to your blocking script. */
  storageKey?: string;
  /** Fires after the theme changes, with the new mode. */
  onThemeChange?: (mode: "light" | "dark") => void;
  /** Renders the current mode beside the icon. */
  showLabel?: boolean;
  /** Accessible label offering to switch to dark. */
  toDarkLabel?: string;
  /** Accessible label offering to switch back to light. */
  toLightLabel?: string;
}

const ThemeToggle = React.forwardRef<HTMLButtonElement, ThemeToggleProps>(
  (
    {
      storageKey = DEFAULT_STORAGE_KEY,
      onThemeChange,
      showLabel = false,
      toDarkLabel = "Switch to dark mode",
      toLightLabel = "Switch to light mode",
      variant = "ghost",
      colorScheme = "neutral",
      size = "sm",
      ...props
    },
    ref,
  ) => {
    const isDark = useSyncExternalStore(subscribe, readIsDark, readServer);

    const toggle = useCallback(() => {
      const next = !document.documentElement.classList.contains("dark");
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem(storageKey, next ? "dark" : "light");
      } catch {
        /* Safari private mode: the toggle still works for this session. */
      }
      listeners.forEach((notify) => notify());
      onThemeChange?.(next ? "dark" : "light");
    }, [storageKey, onThemeChange]);

    return (
      <Button
        ref={ref}
        variant={variant}
        colorScheme={colorScheme}
        size={size}
        onClick={toggle}
        aria-pressed={isDark}
        aria-label={isDark ? toLightLabel : toDarkLabel}
        startIcon={
          <FontAwesomeIcon
            icon={isDark ? faSun : faMoon}
            className="h-3.5 w-3.5"
            aria-hidden="true"
          />
        }
        {...props}
      >
        {showLabel ? (isDark ? "Dark" : "Light") : null}
      </Button>
    );
  },
);

ThemeToggle.displayName = "ThemeToggle";

export { ThemeToggle };
