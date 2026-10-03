import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, vi } from "vitest";
import { Carousel, type CarouselHandle } from "./Carousel";
import { BREAKPOINTS, FLUID_CLASSES, fluidItemWidth, perViewVars } from "./carousel-layout";


/* jsdom has no layout: every box is zero, so nothing overflows and no arrow
   renders here. These cover structure, names and wiring; the stories measure
   drag, paging, snapping and focus in Chromium. */

const items = ["One", "Two", "Three"];

describe("Carousel", () => {
  it("is a named list with one item per child, and no carousel or slide roles", () => {
    render(
      <Carousel aria-label="Songs">
        {items.map((t) => (
          <a key={t} href={`#${t}`}>
            {t}
          </a>
        ))}
      </Carousel>,
    );
    const list = screen.getByRole("list", { name: "Songs" });
    expect(list.tagName).toBe("UL");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(document.querySelector("[aria-roledescription]")).toBeNull();
    expect(document.querySelector("[aria-live]")).toBeNull();
    expect(document.querySelector('[role="group"], [role="region"]')).toBeNull();
  });

  it("is named by a heading through aria-labelledby", () => {
    render(
      <>
        <h2 id="h">Highlights</h2>
        <Carousel aria-labelledby="h">
          {items.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </Carousel>
      </>,
    );
    expect(screen.getByRole("list", { name: "Highlights" })).toBeInTheDocument();
  });

  it("never makes the list a tab stop when it fits, or when its items take focus", () => {
    /* jsdom lays nothing out, so every row "fits" here. The Gallery story
       checks the list becomes the tab stop once it overflows. */
    const { unmount } = render(
      <Carousel aria-label="Photos">
        {items.map((t) => (
          <div key={t}>{t}</div>
        ))}
      </Carousel>,
    );
    expect(screen.getByRole("list", { name: "Photos" })).not.toHaveAttribute("tabindex");
    unmount();
    render(
      <Carousel aria-label="Links">
        {items.map((t) => (
          <a key={t} href={`#${t}`}>
            {t}
          </a>
        ))}
      </Carousel>,
    );
    // Items keep their own tab order; nothing roves.
    expect(screen.getByRole("list", { name: "Links" })).not.toHaveAttribute("tabindex");
    for (const link of screen.getAllByRole("link")) expect(link).not.toHaveAttribute("tabindex");
  });

  it("names each item by its position, and reads it out politely, in a gallery", () => {
    render(
      <Carousel aria-label="Photos" showPosition perView={1}>
        {items.map((t) => (
          <div key={t}>{t}</div>
        ))}
      </Carousel>,
    );
    const listItems = screen.getAllByRole("listitem");
    expect(listItems.map((li) => li.getAttribute("aria-label"))).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
    expect(screen.getByText("1 of 3")).toHaveAttribute("aria-live", "polite");
  });

  it("sizes fixed-mode items and snaps each one", () => {
    render(
      <Carousel aria-label="Songs" itemWidth={240}>
        {items.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </Carousel>,
    );
    for (const li of screen.getAllByRole("listitem")) {
      expect(li.style.width).toBe("240px");
      expect(li).toHaveClass("rst:snap-start");
      expect(li).not.toHaveClass("rst:snap-always");
    }
  });

  it("takes its snapping from the props", () => {
    render(
      <Carousel aria-label="Photos" snap="center" snapStrictness="proximity" oneAtATime>
        {items.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </Carousel>,
    );
    const list = screen.getByRole("list");
    expect(list).toHaveClass("rst:snap-proximity");
    expect(list).not.toHaveClass("rst:snap-mandatory");
    for (const li of screen.getAllByRole("listitem")) expect(li).toHaveClass("rst:snap-center", "rst:snap-always");
  });

  it("hides the scrollbar unless asked, and bleeds only when asked", () => {
    const { rerender } = render(<Carousel aria-label="Songs">{items}</Carousel>);
    const list = screen.getByRole("list");
    expect(list.className).toMatch(/scrollbar-width:none/);
    expect(list.className).not.toMatch(/-mx-/);
    rerender(
      <Carousel aria-label="Songs" scrollbar bleed>
        {items}
      </Carousel>,
    );
    expect(list.className).not.toMatch(/scrollbar-width:none/);
    expect(list.className).toMatch(/-mx-\(--rst-cv-gutter\)/);
  });

  it("hands back scrollToIndex, scrollPrev and scrollNext (positions are the stories')", () => {
    const ref = createRef<CarouselHandle>();
    render(
      <Carousel aria-label="Songs" ref={ref}>
        {items}
      </Carousel>,
    );
    const list = screen.getByRole("list");
    list.scrollTo = vi.fn();
    ref.current!.scrollToIndex(2, { behavior: "instant" });
    expect(list.scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "instant" });
    expect(typeof ref.current!.scrollPrev).toBe("function");
    expect(typeof ref.current!.scrollNext).toBe("function");
  });

  it("lets a consumer place the arrows, and passes null while there is nothing to page", () => {
    const renderArrows = vi.fn(() => <p>controls</p>);
    render(
      <Carousel aria-label="Songs" renderArrows={renderArrows}>
        {items}
      </Carousel>,
    );
    expect(screen.getByText("controls")).toBeInTheDocument();
    expect(renderArrows).toHaveBeenLastCalledWith({ prev: null, next: null, position: null });
  });

  it("renders the arrows, disabled, before it has measured, so a server render has them", () => {
    /* The server can't measure. Rendering them disabled until the first
       layout effect means a row that overflows, the usual case, paints with
       its controls line and nothing shifts. */
    const html = renderToString(
      <Carousel aria-label="Songs" arrows="always">
        {items}
      </Carousel>,
    );
    expect(html).toContain('aria-label="Next Songs"');
    expect(html.match(/ disabled=""/g)).toHaveLength(2); // not data-disabled
  });
});

describe("fluid sizing", () => {
  it("gives every breakpoint a width, carrying the one below it up", () => {
    /* All five are always set, so a row nested in another fluid row never
       inherits the outer row's width for a breakpoint it didn't give. */
    const vars = perViewVars({ base: 1.3, md: 2.5 });
    expect(Object.keys(vars)).toEqual(BREAKPOINTS.map((bp) => `--rst-cv-w-${bp}`));
    expect(vars["--rst-cv-w-sm"]).toBe(vars["--rst-cv-w-base"]);
    expect(vars["--rst-cv-w-lg"]).toBe(vars["--rst-cv-w-md"]);
    expect(vars["--rst-cv-w-xl"]).toBe(vars["--rst-cv-w-md"]);
  });

  it("peeks into the trailing gutter for a fraction, and fits between the gutters for a whole number", () => {
    // 1.3: one gap, and the peek runs on into the gutter.
    expect(fluidItemWidth(1.3)).toBe("calc((100% + 1 * var(--rst-cv-gutter) - 1 * var(--rst-cv-gap)) / 1.3)");
    // 2.5: two gaps.
    expect(fluidItemWidth(2.5)).toBe("calc((100% + 1 * var(--rst-cv-gutter) - 2 * var(--rst-cv-gap)) / 2.5)");
    // 3: no peek, two gaps, between the gutters. 1: the whole content box.
    expect(fluidItemWidth(3)).toBe("calc((100% + 0 * var(--rst-cv-gutter) - 2 * var(--rst-cv-gap)) / 3)");
    expect(fluidItemWidth(1)).toBe("calc((100% + 0 * var(--rst-cv-gutter) - 0 * var(--rst-cv-gap)) / 1)");
  });

  it("has one short class per breakpoint for Tailwind to read", () => {
    BREAKPOINTS.forEach((bp) => {
      const prefix = bp === "base" ? "rst:" : `rst:${bp}:`;
      expect(FLUID_CLASSES.split(" ")).toContain(`${prefix}[--rst-cv-w:var(--rst-cv-w-${bp})]`);
    });
    expect(FLUID_CLASSES.split(" ")).toHaveLength(5);
  });
});
