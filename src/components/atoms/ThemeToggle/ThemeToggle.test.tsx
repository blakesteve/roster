import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle";
import "@testing-library/jest-dom";

describe("ThemeToggle Component", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  it("offers dark mode when the page is light", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("adds the dark class when clicked", async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button"));
    expect(document.documentElement).toHaveClass("dark");
  });

  it("removes the dark class on a second click", async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("button"));
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("reflects state with aria-pressed", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("swaps the accessible label with the mode", async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });

  it("persists the choice", async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole("button"));
    expect(localStorage.getItem("roster-theme")).toBe("dark");
  });

  it("honors a custom storage key", async () => {
    render(<ThemeToggle storageKey="app-theme" />);
    await userEvent.click(screen.getByRole("button"));
    expect(localStorage.getItem("app-theme")).toBe("dark");
  });

  // The DOM is the source of truth, so a class set by a blocking script before
  // React ran must be picked up rather than overwritten.
  it("reads an existing dark class on mount", () => {
    document.documentElement.classList.add("dark");
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("reports changes through onThemeChange", async () => {
    const onThemeChange = vi.fn();
    render(<ThemeToggle onThemeChange={onThemeChange} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  it("shows no text label by default", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).not.toHaveTextContent(/light|dark/i);
  });

  it("shows the mode when showLabel is set", () => {
    render(<ThemeToggle showLabel />);
    expect(screen.getByRole("button")).toHaveTextContent("Light");
  });
});
