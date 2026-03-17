import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
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

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  tableClassName?: string;
  paginationClassName?: string;
  variant?: TableProps["variant"];
  size?: TableProps["size"];
  hoverable?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  tableClassName,
  paginationClassName,
  variant = "default",
  size = "md",
  hoverable = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
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
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
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
            {table.getState().pagination.pageIndex + 1}
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
