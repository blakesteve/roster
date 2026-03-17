import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Countdown } from "./Countdown";

describe("Countdown Component", () => {
  // Set a fixed "current time" so our math is 100% predictable across environments
  const SYSTEM_TIME = new Date("2026-01-01T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(SYSTEM_TIME);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the title and countdown numbers correctly for a future date", () => {
    // Target is exactly 1 day, 2 hours, 30 minutes, and 15 seconds in the future
    const targetDate = new Date("2026-01-02T14:30:15Z");

    render(<Countdown targetDate={targetDate} title="Next Match" />);

    // Verify title
    expect(screen.getByText("Next Match")).toBeInTheDocument();

    // Verify labels
    expect(screen.getByText("Days")).toBeInTheDocument();
    expect(screen.getByText("Hours")).toBeInTheDocument();
    expect(screen.getByText("Minutes")).toBeInTheDocument();
    expect(screen.getByText("Seconds")).toBeInTheDocument();

    // Verify the math (padded with zeros)
    expect(screen.getByText("01")).toBeInTheDocument(); // Days
    expect(screen.getByText("02")).toBeInTheDocument(); // Hours
    expect(screen.getByText("30")).toBeInTheDocument(); // Minutes
    expect(screen.getByText("15")).toBeInTheDocument(); // Seconds
  });

  it("updates the countdown dynamically as time passes", () => {
    const targetDate = new Date("2026-01-01T12:00:10Z"); // 10 seconds in the future
    render(<Countdown targetDate={targetDate} />);

    // Initially should show 10 seconds
    expect(screen.getByText("10")).toBeInTheDocument();

    // Fast-forward time by 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Should now show 07 seconds
    expect(screen.getByText("07")).toBeInTheDocument();
  });

  it("applies the correct variant classes to the countdown numbers", () => {
    const targetDate = new Date("2026-01-02T12:00:00Z"); // Exactly 1 day in the future (Days = "01")

    // Test Default (Gradient)
    const { rerender } = render(<Countdown targetDate={targetDate} />);
    let dayNumber = screen.getByText("01");
    expect(dayNumber).toHaveClass("bg-gradient-to-br", "from-primary-700");

    // Test Primary Variant
    rerender(<Countdown targetDate={targetDate} variant="primary" />);
    dayNumber = screen.getByText("01");
    expect(dayNumber).toHaveClass("text-primary-600", "dark:text-primary-400");

    // Test Neutral Variant
    rerender(<Countdown targetDate={targetDate} variant="neutral" />);
    dayNumber = screen.getByText("01");
    expect(dayNumber).toHaveClass("text-gray-900", "dark:text-gray-100");
  });

  // Ensures native dark mode inheritance is working
  it("applies base text inheritance classes to the root container for native dark mode", () => {
    const targetDate = new Date("2026-01-02T12:00:00Z");
    const { container } = render(<Countdown targetDate={targetDate} />);

    // The root div should explicitly define the baseline text colors
    expect(container.firstChild).toHaveClass(
      "text-gray-900",
      "dark:text-gray-100",
    );
  });

  it("renders completionText when the target date is in the past", () => {
    const targetDate = new Date("2025-12-31T12:00:00Z"); // 1 day in the past

    render(
      <Countdown
        targetDate={targetDate}
        completionText="The event has started!"
      />,
    );

    // Should show completion text
    expect(screen.getByText("The event has started!")).toBeInTheDocument();

    // Should NOT show the timer labels
    expect(screen.queryByText("Days")).not.toBeInTheDocument();
  });

  it("renders nothing (null) when the date has passed and no completionText is provided", () => {
    const targetDate = new Date("2025-12-31T12:00:00Z"); // In the past

    const { container } = render(<Countdown targetDate={targetDate} />);

    // The container should be completely empty
    expect(container.firstChild).toBeNull();
  });
});
