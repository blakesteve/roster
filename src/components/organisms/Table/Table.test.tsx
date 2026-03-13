import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./Table";

describe("Table Primitives", () => {
  it("renders a complete table structure correctly", () => {
    const { getByText, getByRole } = render(
      <Table>
        <TableCaption>Test Caption</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Header 1</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(getByRole("table")).toBeInTheDocument();
    expect(getByText("Test Caption")).toBeInTheDocument();
    expect(getByText("Header 1")).toBeInTheDocument();
    expect(getByText("Cell Data")).toBeInTheDocument();
  });

  it("applies custom classes using the cn utility", () => {
    const { getByRole } = render(
      <Table className="custom-table-class">
        <TableBody>
          <TableRow className="custom-row-class">
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const table = getByRole("table");
    const row = getByRole("row");

    expect(table).toHaveClass("custom-table-class");
    expect(row).toHaveClass("custom-row-class");
  });
});
