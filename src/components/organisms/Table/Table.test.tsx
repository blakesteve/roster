import { render, screen } from "@testing-library/react";
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
  TableFooter,
} from "./Table";

describe("Table Primitives", () => {
  it("renders a complete table structure correctly", () => {
    render(
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
        <TableFooter>
          <TableRow>
            <TableCell>Footer Data</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Test Caption")).toBeInTheDocument();
    expect(screen.getByText("Header 1")).toBeInTheDocument();
    expect(screen.getByText("Cell Data")).toBeInTheDocument();
    expect(screen.getByText("Footer Data")).toBeInTheDocument();
  });

  it("applies custom classes using the cn utility", () => {
    render(
      <Table className="rst:custom-table-class">
        <TableBody>
          <TableRow className="rst:custom-row-class">
            <TableCell className="rst:custom-cell-class">Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole("table")).toHaveClass("rst:custom-table-class");
    expect(screen.getByRole("row")).toHaveClass("rst:custom-row-class");
    expect(screen.getByRole("cell")).toHaveClass("rst:custom-cell-class");
  });

  // Context Propagation Tests
  it("applies default variants and sizes to children via Context", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const table = screen.getByRole("table");
    const wrapper = table.parentElement;
    const thead = table.querySelector("thead");
    const tbodyRow = table.querySelector("tbody tr");
    const th = screen.getByRole("columnheader");
    const td = screen.getByRole("cell");

    // Default variant assertions
    expect(wrapper).toHaveClass("rst:border-gray-200");
    expect(thead).toHaveClass("rst:bg-gray-50");
    expect(tbodyRow).toHaveClass("rst:bg-white");

    // Default size assertions ("md")
    expect(table).toHaveClass("rst:text-sm");
    expect(th).toHaveClass("rst:h-12", "rst:px-4");
    expect(td).toHaveClass("rst:p-4");
  });

  it("propagates the 'primary' variant and 'hoverable' states to children", () => {
    render(
      <Table variant="primary" hoverable={true}>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const table = screen.getByRole("table");
    const wrapper = table.parentElement;
    const thead = table.querySelector("thead");
    const tbodyRow = table.querySelector("tbody tr");
    const th = screen.getByRole("columnheader");

    expect(wrapper).toHaveClass("rst:border-primary-200");
    expect(thead).toHaveClass("rst:bg-primary-50");
    expect(th).toHaveClass("rst:text-primary-800");

    // Asserts compound variant injected by hoverable={true}
    expect(tbodyRow).toHaveClass(
      "rst:border-primary-100",
      "rst:cursor-pointer",
      "rst:hover:bg-primary-50/50",
    );
  });

  it("propagates the 'sm' size context down to table cells", () => {
    render(
      <Table size="sm">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole("table")).toHaveClass("rst:text-xs");
    expect(screen.getByRole("cell")).toHaveClass("rst:p-3");
  });
});
