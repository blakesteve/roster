import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { breadcrumbVariants } from "./breadcrumb-variants";
import { Link } from "../../atoms/Link/Link";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export interface BreadcrumbsProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof breadcrumbVariants> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHomeIcon?: boolean;
}

const Breadcrumbs = ({
  items,
  separator,
  showHomeIcon,
  variant,
  className,
  ...props
}: BreadcrumbsProps) => {
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
            <Link
              href="/"
              className={cn(
                breadcrumbVariants({ variant }),
                "hover:underline-none",
              )}
              aria-label="Home"
            >
              <FontAwesomeIcon icon={faHome} className="h-4 w-4" />
            </Link>
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
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <span
                  className="mr-2 flex select-none items-center"
                  aria-hidden="true"
                >
                  {SeparatorIcon}
                </span>
              )}

              {isLast ? (
                <span
                  className={cn(
                    "font-semibold text-sm cursor-default transition-colors",
                    variant === "inverse"
                      ? "text-white"
                      : "text-gray-900 dark:text-gray-100",
                  )}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    breadcrumbVariants({ variant }),
                    "hover:underline",
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export { Breadcrumbs };
