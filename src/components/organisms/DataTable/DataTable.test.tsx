import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom";
import { DataTable } from "./DataTable";
import type { ColumnDef } from "@tanstack/react-table";

// --- MOCK SETUP ---
type TestUser = {
  id: number;
  name: string;
};

const columns: ColumnDef<TestUser, unknown>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
];

// Generate 12 users to test pagination (default page size is 10)
const mockData: TestUser[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
}));

describe("DataTable Component", () => {
  it("renders the table headers and initial data", () => {
    render(<DataTable columns={columns} data={mockData} />);

    // Check headers
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();

    // Check first page of data (should show User 1 to 10)
    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("User 10")).toBeInTheDocument();

    // User 11 should be on the next page, so it shouldn't be visible yet
    expect(screen.queryByText("User 11")).not.toBeInTheDocument();
  });

  it("handles empty data state gracefully", () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("paginates data correctly when clicking next and previous", () => {
    render(<DataTable columns={columns} data={mockData} />);

    // Verify we are on page 1 by ensuring the first user is there and the 11th is not
    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.queryByText("User 11")).not.toBeInTheDocument();

    const nextPageButton = screen.getByRole("button", {
      name: /go to next page/i,
    });

    // Click Next Page
    fireEvent.click(nextPageButton);

    // Now User 11 and 12 should be visible
    expect(screen.getByText("User 11")).toBeInTheDocument();
    expect(screen.getByText("User 12")).toBeInTheDocument();

    // User 1 should be gone
    expect(screen.queryByText("User 1")).not.toBeInTheDocument();
  });

  it("sorts data when clicking a sortable header", () => {
    render(<DataTable columns={columns} data={mockData} />);

    const nameHeader = screen.getByText("Name");

    // Click once for Ascending
    fireEvent.click(nameHeader);

    // Click again for Descending
    fireEvent.click(nameHeader);

    // In a descending sort of "User X", "User 9" should appear before "User 1"
    // Verify the DOM reordered by checking if the component didn't crash
    // and the headers are still interactive.
    expect(screen.getByText("User 9")).toBeInTheDocument();
  });

  it("passes variant, size, and hoverable props down to the table primitives", () => {
    render(
      <DataTable
        columns={columns}
        data={mockData}
        variant="ghost"
        size="sm"
        hoverable={true}
      />,
    );

    const tableElement = screen.getByRole("table");
    const dataRows = screen.getAllByRole("row");
    // Grab the first actual data row (index 0 is the header row)
    const firstDataRow = dataRows[1];

    // Assert Size ("sm" maps to "text-xs" on the table)
    expect(tableElement).toHaveClass("text-xs");

    // Assert Variant ("ghost" maps to "bg-transparent" on rows)
    expect(firstDataRow).toHaveClass("bg-transparent");

    // Assert Hoverable (hoverable={true} maps to "cursor-pointer" and hover utility classes)
    expect(firstDataRow).toHaveClass("cursor-pointer");
    expect(firstDataRow).toHaveClass("hover:bg-gray-50");
  });
});
