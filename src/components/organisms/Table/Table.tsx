import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import {
  tableWrapperVariants,
  tableVariants,
  tableHeaderVariants,
  tableRowVariants,
  tableHeadVariants,
  tableCellVariants,
} from "./table-variants";

type TableContextType = {
  variant?: "default" | "ghost" | "subtle" | "primary" | null;
  size?: "sm" | "md" | "lg" | null;
  hoverable?: boolean;
};

const TableContext = React.createContext<TableContextType>({
  variant: "default",
  size: "md",
  hoverable: false,
});

export interface TableProps
  extends
    React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableWrapperVariants>,
    VariantProps<typeof tableVariants> {
  hoverable?: boolean; // ✨ Added to props
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      hoverable = false,
      ...props
    },
    ref,
  ) => (
    <TableContext.Provider value={{ variant, size, hoverable }}>
      <div className={cn(tableWrapperVariants({ variant }))}>
        <table
          ref={ref}
          className={cn(tableVariants({ size }), className)}
          {...props}
        />
      </div>
    </TableContext.Provider>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const { variant } = React.useContext(TableContext);
  return (
    <thead
      ref={ref}
      className={cn(tableHeaderVariants({ variant }), className)}
      {...props}
    />
  );
});
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
>(({ className, ...props }, ref) => {
  const { variant } = React.useContext(TableContext);
  return (
    <tfoot
      ref={ref}
      className={cn(
        tableHeaderVariants({ variant }),
        "border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
});
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => {
  const { variant, hoverable } = React.useContext(TableContext);
  return (
    <tr
      ref={ref}
      // Injects hoverable state to trigger the compound variant
      className={cn(tableRowVariants({ variant, hoverable }), className)}
      {...props}
    />
  );
});
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const { variant, size } = React.useContext(TableContext);
  return (
    <th
      ref={ref}
      className={cn(tableHeadVariants({ variant, size }), className)}
      {...props}
    />
  );
});
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const { variant, size } = React.useContext(TableContext);
  return (
    <td
      ref={ref}
      className={cn(tableCellVariants({ variant, size }), className)}
      {...props}
    />
  );
});
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
