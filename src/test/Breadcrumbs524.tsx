import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { withLabels } from "../lib/labels";
import { breadcrumbVariants } from "../components/molecules/Breadcrumbs/breadcrumb-variants";
import { Link } from "../components/atoms/Link/Link";

/**
 * Breadcrumbs as 5.24 drew it, for checks that compare the wrapping trail with
 * it in the same page, engine and fonts: `Breadcrumbs.tsx` at 5.24.0, its types
 * renamed and its docs cut. Test-only: `src/test` is outside the package.
 */
type BreadcrumbLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
};

type BreadcrumbItem = {
  /** Takes a node, so a crumb can carry an icon or its own styling. */
  label: React.ReactNode;
  href?: string;
  /** Applied to this crumb only. */
  className?: string;
};

/** Every word Breadcrumbs says of its own. Pass any of them in `labels` to replace it. */
interface BreadcrumbsLabels {
  /** The trail's name. */
  nav: string;
  /** The home icon's name, with `showHomeIcon`. */
  home: string;
}

const LABELS: BreadcrumbsLabels = { nav: "Breadcrumb", home: "Home" };

export interface Breadcrumbs524Props
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof breadcrumbVariants> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHomeIcon?: boolean;
  /** Where the home icon points. */
  homeHref?: string;
  linkComponent?: React.ComponentType<BreadcrumbLinkProps>;
  /** Applied to the current (last) crumb, for a per-page accent. */
  currentClassName?: string;
  /** The component's own words, replaced; any left out stay English. */
  labels?: Partial<BreadcrumbsLabels>;
}

export const Breadcrumbs524 = ({
  items,
  separator,
  showHomeIcon,
  homeHref = "/",
  linkComponent,
  currentClassName,
  labels,
  variant,
  className,
  ...props
}: Breadcrumbs524Props) => {
  const l = withLabels(LABELS, labels);
  const Anchor = (linkComponent ?? Link) as React.ComponentType<BreadcrumbLinkProps>;

  const SeparatorIcon = separator ?? (
    <span className="rst:text-gray-300 rst:dark:text-gray-600 rst:text-sm rst:transition-colors">
      /
    </span>
  );

  return (
    <nav aria-label={l.nav} className={cn("rst:flex", className)} {...props}>
      <ol className="rst:flex rst:items-center rst:space-x-2">
        {showHomeIcon && (
          <li className="rst:flex rst:items-center">
            <Anchor
              href={homeHref}
              className={cn(
                breadcrumbVariants({ variant }),
                "rst:hover:no-underline",
              )}
              aria-label={l.home}
            >
              <FontAwesomeIcon icon={faHome} className="rst:h-4 rst:w-4" />
            </Anchor>
            <span
              className="rst:ml-2 rst:flex rst:select-none rst:items-center"
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
            <li key={index} className="rst:flex rst:items-center">
              {index > 0 && (
                <span
                  className="rst:mr-2 rst:flex rst:select-none rst:items-center"
                  aria-hidden="true"
                >
                  {SeparatorIcon}
                </span>
              )}

              {isLast || !item.href ? (
                <span
                  className={cn(
                    "rst:font-semibold rst:text-sm rst:cursor-default rst:transition-colors",
                    variant === "inverse"
                      ? "rst:text-white"
                      : "rst:text-gray-900 rst:dark:text-gray-100",
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
                    "rst:hover:underline",
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

