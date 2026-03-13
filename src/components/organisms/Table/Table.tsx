import * as React from "react";
import { cn } from "../../../lib/utils"; // Adjusted to your correct path!
import { type VariantProps } from "class-variance-authority";
import { tableVariants } from "./table-variants";

export interface TableProps
  extends
    React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, size, ...props }, ref) => (
    <div className="relative w-full overflow-auto rounded-md border border-gray-200 dark:border-gray-700">
      <table
        ref={ref}
        className={cn(tableVariants({ size }), className)}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    // Light mode: gray-50. Dark mode: gray-900 (darker than rows)
    className={cn(
      "bg-gray-50 dark:bg-gray-900 [&_tr]:border-b border-gray-200 dark:border-gray-700",
      className,
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    // Matches the header's darker framing
    className={cn(
      "border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    // Light mode: white rows. Dark mode: gray-800 (lighter than header/footer)
    className={cn(
      "border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-700/80 data-[state=selected]:bg-gray-100 dark:data-[state=selected]:bg-gray-700",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    // Lighter text in dark mode for readability
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-gray-600 dark:text-gray-300 [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0 text-gray-900 dark:text-gray-100",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
