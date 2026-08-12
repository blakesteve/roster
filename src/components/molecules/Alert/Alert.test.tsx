import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Alert } from "./Alert";
import "@testing-library/jest-dom";

describe("Alert Component", () => {
  it("renders its message", () => {
    render(<Alert>Something went wrong</Alert>);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders an optional title above the message", () => {
    render(<Alert title="Upload failed">The file was too large</Alert>);
    expect(screen.getByText("Upload failed")).toBeInTheDocument();
    expect(screen.getByText("The file was too large")).toBeInTheDocument();
  });

  // Errors interrupt; everything else waits its turn.
  it("announces errors assertively", () => {
    render(<Alert colorScheme="error">Boom</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("announces non-errors politely", () => {
    render(<Alert colorScheme="success">Saved</Alert>);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("applies the color scheme classes", () => {
    const { container } = render(<Alert colorScheme="success">Saved</Alert>);
    expect(container.firstChild).toHaveClass("border-success-500", "bg-success-50");
  });

  it("renders no dismiss button unless onDismiss is provided", () => {
    render(<Alert>No dismiss</Alert>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onDismiss when the dismiss button is clicked", async () => {
    const onDismiss = vi.fn();
    render(<Alert onDismiss={onDismiss}>Dismiss me</Alert>);

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // `icon={null}` has to mean "no icon", distinct from omitting the prop.
  it("omits the icon when icon is null", () => {
    const { container } = render(<Alert icon={null}>No icon</Alert>);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders a custom icon when provided", () => {
    render(<Alert icon={<span data-testid="custom" />}>Custom</Alert>);
    expect(screen.getByTestId("custom")).toBeInTheDocument();
  });
});
