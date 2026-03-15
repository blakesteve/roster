import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Select } from "./Select";
import "@testing-library/jest-dom";

// Polyfill ResizeObserver for Headless UI
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const options = [
  { value: "1", label: "Option One" },
  { value: "2", label: "Option Two" },
  { value: "3", label: "Disabled Option", disabled: true },
];

describe("Select Component", () => {
  it("renders placeholder when no value is selected", () => {
    render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        placeholder="Select me"
      />,
    );
    expect(screen.getByText("Select me")).toBeInTheDocument();
  });

  it("renders selected label", () => {
    render(<Select options={options} value="1" onChange={() => {}} />);
    // When "1" is selected, the button should display "Option One"
    expect(screen.getByText("Option One")).toBeInTheDocument();
  });

  it("renders a label above the select when provided", () => {
    render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        label="My Custom Label"
      />,
    );
    expect(screen.getByText("My Custom Label")).toBeInTheDocument();
  });

  it("opens menu and calls onChange when option clicked", async () => {
    const handleChange = vi.fn();
    render(
      <Select
        options={options}
        value={null}
        onChange={handleChange}
        placeholder="Open me"
      />,
    );

    const trigger = screen.getByRole("button", { name: /open me/i });
    fireEvent.click(trigger);

    // Headless UI v2 still utilizes standard ARIA roles
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeInTheDocument();

    const optionTwo = within(listbox).getByText("Option Two");
    fireEvent.click(optionTwo);

    expect(handleChange).toHaveBeenCalledWith("2");
  });

  it("does not open when disabled", () => {
    const handleChange = vi.fn();
    render(
      <Select
        disabled
        options={options}
        value={null}
        onChange={handleChange}
        placeholder="Disabled"
      />,
    );

    const trigger = screen.getByRole("button", { name: /disabled/i });
    fireEvent.click(trigger);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("applies variant and error classes correctly to the trigger", () => {
    const { rerender } = render(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        placeholder="Variant Test"
        variant="slate"
      />,
    );

    const trigger = screen.getByRole("button", { name: /variant test/i });
    expect(trigger).toHaveClass("bg-gray-700", "dark:bg-gray-900");

    rerender(
      <Select
        options={options}
        value={null}
        onChange={() => {}}
        placeholder="Variant Test"
        error={true}
      />,
    );
    expect(trigger).toHaveClass("ring-error-500", "text-error-600");
  });
});
