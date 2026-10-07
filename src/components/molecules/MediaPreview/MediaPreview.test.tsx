import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MediaPreview } from "./MediaPreview";
import "@testing-library/jest-dom";

/* jsdom loads no images, so a failure here is a fired `error` event. The
   rendered behavior, with real loads, is MediaPreview.checks.stories.tsx. */
describe("MediaPreview", () => {
  it("shows the image while it hasn't failed", () => {
    render(<MediaPreview src="/fern.jpg" alt="A fern" />);
    expect(screen.getByRole("img", { name: "A fern" })).toHaveAttribute("src", "/fern.jpg");
  });

  it("swaps a failed image for a link to the original", () => {
    render(<MediaPreview src="/teapot.heic" href="/originals/teapot.heic" alt="A teapot" />);
    fireEvent.error(screen.getByRole("img", { name: "A teapot" }));
    const link = screen.getByRole("link", { name: "Preview unavailable. Open original, in a new tab: A teapot" });
    expect(link).toHaveAttribute("href", "/originals/teapot.heic");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(screen.queryByRole("img", { name: "A teapot" })).not.toBeInTheDocument();
  });

  it("falls back straight away when there's no source", () => {
    render(<MediaPreview src={null} href="/originals/lamp.jpg" alt="A lamp" />);
    expect(screen.getByRole("link", { name: /A lamp$/ })).toBeInTheDocument();
  });

  it("says what it would have shown when there's nothing to open either", () => {
    render(<MediaPreview src={null} alt="A lamp" />);
    expect(screen.getByRole("img", { name: "Preview unavailable: A lamp" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("takes its own words", () => {
    render(
      <MediaPreview
        src={null}
        href="/o.jpg"
        alt="Un helecho"
        unavailableLabel="Vista previa no disponible"
        openLabel="Abrir el original"
      />,
    );
    expect(
      screen.getByRole("link", { name: "Vista previa no disponible. Abrir el original, in a new tab: Un helecho" }),
    ).toBeInTheDocument();
  });

  it("reports each failure once, and gives a new source its own try", () => {
    const onUnavailable = vi.fn();
    const { rerender } = render(<MediaPreview src="/a.heic" href="/a" alt="A fern" onUnavailable={onUnavailable} />);
    fireEvent.error(screen.getByRole("img", { name: "A fern" }));
    expect(onUnavailable).toHaveBeenCalledTimes(1);

    rerender(<MediaPreview src="/b.jpg" href="/a" alt="A fern" onUnavailable={onUnavailable} />);
    expect(screen.getByRole("img", { name: "A fern" })).toHaveAttribute("src", "/b.jpg");

    fireEvent.error(screen.getByRole("img", { name: "A fern" }));
    expect(onUnavailable).toHaveBeenCalledTimes(2);
  });

  it("keeps the frame's classes on the image and both fallbacks, and the caller's", () => {
    const { rerender, container } = render(<MediaPreview src="/a.jpg" alt="A fern" className="extra" />);
    const frame = ["rst:h-28", "rst:w-36", "extra"];
    expect(container.firstElementChild).toHaveClass(...frame);
    rerender(<MediaPreview src={null} href="/o" alt="A fern" className="extra" />);
    expect(container.firstElementChild).toHaveClass(...frame);
    rerender(<MediaPreview src={null} alt="A fern" className="extra" />);
    expect(container.firstElementChild).toHaveClass(...frame);
  });
});
