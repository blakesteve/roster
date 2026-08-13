import { useState } from "react";
import {
  useTable,
  tableFeatures,
  rowSortingFeature,
  rowPaginationFeature,
  createSortedRowModel,
  createPaginatedRowModel,
  sortFns,
  flexRender,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretUp,
  faCaretDown,
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";

import { cn } from "../../../lib/utils";
import { Button } from "../../atoms/Button/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  type TableProps,
} from "../Table/Table";

/**
 * The feature set DataTable registers: sorting and pagination, plus the row
 * models each one needs. v9 requires features to be declared up front, and it
 * types column definitions against them, so consumers need this type to write
 * their columns:
 *
 * ```ts
 * const columns: ColumnDef<RosterTableFeatures, Person>[] = [...]
 * // or
 * const helper = createColumnHelper<RosterTableFeatures, Person>()
 * ```
 *
 * Built statically at module scope, as v9 requires.
 */
const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  // The whole built-in registry, not a subset: DataTable is generic over
  // consumer data, so auto sort detection has to be able to reach any of them.
  sortFns,
});

export type RosterTableFeatures = typeof dataTableFeatures;

/**
 * `TValue` is gone from v8's `DataTableProps<TData, TValue>`: a columns array
 * is heterogeneous, so v9 types each entry's value as `unknown` and recovers
 * the real type per column through `createColumnHelper`.
 */
export interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<RosterTableFeatures, TData>[];
  data: TData[];
  className?: string;
  tableClassName?: string;
  paginationClassName?: string;
  variant?: TableProps["variant"];
  size?: TableProps["size"];
  hoverable?: boolean;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  className,
  tableClassName,
  paginationClassName,
  variant = "default",
  size = "md",
  hoverable = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Table
        variant={variant}
        size={size}
        hoverable={hoverable}
        className={tableClassName}
      >
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-2 transition-opacity",
                          header.column.getCanSort() &&
                            "cursor-pointer select-none opacity-80 hover:opacity-100",
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <span className="w-4 flex justify-center text-primary-500">
                            {header.column.getIsSorted() === "asc" ? (
                              <FontAwesomeIcon icon={faCaretUp} />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <FontAwesomeIcon icon={faCaretDown} />
                            ) : null}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            // No data-state on the row: row selection is not one of the
            // registered features, and v8's getIsSelected() was always false
            // here, so React omitted the attribute anyway.
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-gray-500 dark:text-gray-400 italic"
              >
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div
        className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-4 px-2",
          paginationClassName,
        )}
      >
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Page{" "}
          <strong className="text-gray-900 dark:text-gray-100">
            {table.state.pagination.pageIndex + 1}
          </strong>{" "}
          of{" "}
          <strong className="text-gray-900 dark:text-gray-100">
            {table.getPageCount()}
          </strong>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            colorScheme="neutral"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to first page"
          >
            <FontAwesomeIcon icon={faAnglesLeft} />
          </Button>
          <Button
            variant="outline"
            colorScheme="neutral"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to previous page"
          >
            <FontAwesomeIcon icon={faAngleLeft} />
          </Button>
          <Button
            variant="outline"
            colorScheme="neutral"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Go to next page"
          >
            <FontAwesomeIcon icon={faAngleRight} />
          </Button>
          <Button
            variant="outline"
            colorScheme="neutral"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Go to last page"
          >
            <FontAwesomeIcon icon={faAnglesRight} />
          </Button>
        </div>
      </div>
    </div>
  );
}
