import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { breadcrumbVariants } from "./breadcrumb-variants";
import { Link } from "../../atoms/Link/Link";

/**
 * The shape a crumb's link component is called with. `next/link`, React
 * Router's `Link`, and a plain `<a>` all satisfy it as-is.
 */
export type BreadcrumbLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
};

export type BreadcrumbItem = {
  /** Takes a node, so a crumb can carry an icon or its own styling. */
  label: React.ReactNode;
  /**
   * Omit to render the crumb as plain text. The last crumb is treated as the
   * current page regardless, since that is what a breadcrumb trail means.
   */
  href?: string;
  /** Applied to this crumb only. */
  className?: string;
};

export interface BreadcrumbsProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof breadcrumbVariants> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHomeIcon?: boolean;
  /** Where the home icon points. */
  homeHref?: string;
  /**
   * Renders every crumb that has an `href`. Defaults to Roster's `Link`, which
   * is a plain `<a>` — fine for a static site, wrong inside a router, where an
   * `<a>` turns each hop into a full page load. Pass `next/link` or your
   * router's equivalent and navigation stays client-side.
   *
   * ```tsx
   * import NextLink from "next/link";
   * <Breadcrumbs linkComponent={NextLink} items={items} />
   * ```
   *
   * **Pass it from a client component.** This is a function prop, and functions
   * cannot cross the React Server Component boundary — handing `NextLink` to
   * Breadcrumbs from a server component fails the render with "Functions cannot
   * be passed directly to Client Components". Bind it in a small `"use client"`
   * wrapper and the pages that use that wrapper stay server-rendered.
   */
  linkComponent?: React.ComponentType<BreadcrumbLinkProps>;
  /** Applied to the current (last) crumb, for a per-page accent. */
  currentClassName?: string;
}

const Breadcrumbs = ({
  items,
  separator,
  showHomeIcon,
  homeHref = "/",
  linkComponent,
  currentClassName,
  variant,
  className,
  ...props
}: BreadcrumbsProps) => {
  const Anchor = (linkComponent ?? Link) as React.ComponentType<BreadcrumbLinkProps>;

  const SeparatorIcon = separator ?? (
    <span className="text-gray-300 dark:text-gray-600 text-sm transition-colors">
      /
    </span>
  );

  return (
    <nav aria-label="Breadcrumb" className={cn("flex", className)} {...props}>
      <ol className="flex items-center space-x-2">
        {showHomeIcon && (
          <li className="flex items-center">
            <Anchor
              href={homeHref}
              className={cn(
                breadcrumbVariants({ variant }),
                "hover:underline-none",
              )}
              aria-label="Home"
            >
              <FontAwesomeIcon icon={faHome} className="h-4 w-4" />
            </Anchor>
            <span
              className="ml-2 flex select-none items-center"
              aria-hidden="true"
            >
              {SeparatorIcon}
            </span>
          </li>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            /* Keyed by index: `href` is optional now, and a trail can legally
               repeat one. */
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span
                  className="mr-2 flex select-none items-center"
                  aria-hidden="true"
                >
                  {SeparatorIcon}
                </span>
              )}

              {isLast || !item.href ? (
                <span
                  className={cn(
                    "font-semibold text-sm cursor-default transition-colors",
                    variant === "inverse"
                      ? "text-white"
                      : "text-gray-900 dark:text-gray-100",
                    isLast && currentClassName,
                    item.className,
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Anchor
                  href={item.href}
                  className={cn(
                    breadcrumbVariants({ variant }),
                    "hover:underline",
                    item.className,
                  )}
                >
                  {item.label}
                </Anchor>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export { Breadcrumbs };
