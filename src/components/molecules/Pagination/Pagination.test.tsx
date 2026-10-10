import { useState } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { Pagination, type PaginationLinkProps, type PaginationProps } from "./Pagination";

/* jsdom applies no CSS, so `layout="auto"`, which hides one of two forms by
   the pager's width, shows both here. These pick a form; the width rules,
   the 44px boxes and the accessibility tree are checked in Chromium
   (Pagination.checks.stories.tsx). */
afterEach(() => vi.restoreAllMocks());

/* Every control's name, in the order Tab reaches them. */
const names = () => [...document.querySelectorAll("nav button, nav a")].map((el) => el.getAttribute("aria-label"));

describe("Pagination", () => {
  it("is a named navigation landmark with the current page marked", () => {
    render(<Pagination layout="pages" page={40} pageCount={79} onPageChange={() => {}} />);
    const nav = screen.getByRole("navigation", { name: "Pagination" });
    const current = within(nav).getAllByRole("button").filter((b) => b.getAttribute("aria-current") === "page");
    expect(current.map((b) => b.getAttribute("aria-label"))).toEqual(["Page 40"]);
  });

  it("names every control by the page it goes to", () => {
    render(<Pagination layout="pages" page={40} pageCount={79} onPageChange={() => {}} />);
    expect(names()).toEqual(["Previous page (39)", "Page 1", "Page 39", "Page 40", "Page 41", "Page 79", "Next page (41)"]);
  });

  it("hides the gaps from screen readers", () => {
    const { container } = render(<Pagination layout="pages" page={40} pageCount={79} onPageChange={() => {}} />);
    const gaps = [...container.querySelectorAll("span")].filter((s) => s.textContent === "…");
    expect(gaps.map((g) => g.getAttribute("aria-hidden"))).toEqual(["true", "true"]);
  });

  it("calls onPageChange with the page a control goes to, and not for the current page", () => {
    const onPageChange = vi.fn();
    render(<Pagination layout="pages" page={40} pageCount={79} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Page 79" }));
    fireEvent.click(screen.getByRole("button", { name: "Next page (41)" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous page (39)" }));
    fireEvent.click(screen.getByRole("button", { name: "Page 40" }));
    expect(onPageChange.mock.calls).toEqual([[79], [41], [39]]);
  });

  it("keeps an arrow at the end focusable, and ignores it", () => {
    const onPageChange = vi.fn();
    render(<Pagination layout="arrows" page={79} pageCount={79} onPageChange={onPageChange} />);
    const next = screen.getByRole("button", { name: "Next page" });
    const last = screen.getByRole("button", { name: "Last page" });
    expect([next.getAttribute("aria-disabled"), last.getAttribute("aria-disabled")]).toEqual(["true", "true"]);
    expect([next.hasAttribute("disabled"), last.hasAttribute("disabled")]).toEqual([false, false]);
    fireEvent.click(next);
    fireEvent.click(last);
    expect(onPageChange).not.toHaveBeenCalled();
    /* The twin: the other end goes. */
    fireEvent.click(screen.getByRole("button", { name: "First page (1)" }));
    expect(onPageChange.mock.calls).toEqual([[1]]);
  });

  it("keeps focus on the number you pressed after the page changes", async () => {
    const user = userEvent.setup();
    function Paged() {
      const [page, setPage] = useState(40);
      return <Pagination layout="pages" page={page} pageCount={79} onPageChange={setPage} />;
    }
    render(<Paged />);
    const pressed = screen.getByRole("button", { name: "Page 41" });
    await user.click(pressed);
    expect(pressed).toHaveAttribute("aria-current", "page");
    expect(pressed).toHaveFocus();
    expect(screen.getByRole("button", { name: "Page 42" })).toBeInTheDocument();
    /* And on Next as it reaches the end. */
    const { rerender } = render(<Pagination layout="arrows" page={78} pageCount={79} onPageChange={() => {}} />);
    const next = screen.getByRole("button", { name: "Next page (79)" });
    act(() => next.focus());
    rerender(<Pagination layout="arrows" page={79} pageCount={79} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBe(next);
    expect(next).toHaveFocus();
  });

  it("makes every control a link to its page, with getPageHref", () => {
    render(<Pagination layout="pages" page={1} pageCount={79} getPageHref={(p) => `/games?page=${p}`} />);
    const links = screen.getAllByRole("link");
    expect(links.map((a) => [a.getAttribute("aria-label"), a.getAttribute("href")])).toEqual([
      ["Previous page", "/games?page=1"],
      ["Page 1", "/games?page=1"],
      ["Page 2", "/games?page=2"],
      ["Page 3", "/games?page=3"],
      ["Page 4", "/games?page=4"],
      ["Page 5", "/games?page=5"],
      ["Page 79", "/games?page=79"],
      ["Next page (2)", "/games?page=2"],
    ]);
    expect(screen.queryByRole("button")).toBeNull();
    expect(links[1]).toHaveAttribute("aria-current", "page");
    /* The arrow at the end goes nowhere: a link to this page, marked, and canceled. */
    expect(links[0]).toHaveAttribute("aria-disabled", "true");
    expect(fireEvent.click(links[0])).toBe(false);
    expect(fireEvent.click(links[2])).toBe(true);
  });

  it("calls onPageChange on a plain click in link mode, not one that opens elsewhere", () => {
    const onPageChange = vi.fn();
    render(<Pagination layout="arrows" page={5} pageCount={9} getPageHref={(p) => `#${p}`} onPageChange={onPageChange} />);
    const next = screen.getByRole("link", { name: "Next page (6)" });
    fireEvent.click(next, { metaKey: true });
    fireEvent.click(next, { ctrlKey: true });
    fireEvent.click(next, { button: 1 });
    expect(onPageChange).not.toHaveBeenCalled();
    fireEvent.click(next);
    expect(onPageChange.mock.calls).toEqual([[6]]);
  });

  it("renders links through linkComponent, with href and to", () => {
    const seen: Pick<PaginationLinkProps, "href" | "to">[] = [];
    const RouterLink = (props: PaginationLinkProps) => {
      seen.push({ href: props.href, to: props.to });
      return <a href={props.href} aria-label={props["aria-label"]} className={props.className} onClick={props.onClick} data-router="" />;
    };
    const { container } = render(<Pagination layout="arrows" edges={false} page={2} pageCount={3} getPageHref={(p) => `/p/${p}`} linkComponent={RouterLink} />);
    expect(container.querySelectorAll("[data-router]")).toHaveLength(2);
    expect(seen).toEqual([
      { href: "/p/1", to: "/p/1" },
      { href: "/p/3", to: "/p/3" },
    ]);
  });

  it("offers every page in the compact form's picker, labeled", () => {
    const onPageChange = vi.fn();
    render(<Pagination layout="compact" page={40} pageCount={79} onPageChange={onPageChange} />);
    const picker = screen.getByRole("combobox", { name: "Page" });
    expect(picker).toHaveValue("40");
    expect(picker).toHaveAccessibleDescription("of 79");
    expect(within(picker).getAllByRole("option")).toHaveLength(79);
    fireEvent.change(picker, { target: { value: "12" } });
    expect(onPageChange.mock.calls).toEqual([[12]]);
    expect(names()).toEqual(["First page (1)", "Previous page (39)", "Next page (41)", "Last page (79)"]);
  });

  it("navigates from the picker in link mode, through navigate or a page load", () => {
    const navigate = vi.fn();
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination layout="compact" page={1} pageCount={9} getPageHref={(p) => `/p/${p}`} navigate={navigate} onPageChange={onPageChange} />,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "7" } });
    expect([navigate.mock.calls, onPageChange.mock.calls]).toEqual([[["/p/7"]], [[7]]]);
    const assign = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, assign });
    rerender(<Pagination layout="compact" page={1} pageCount={9} getPageHref={(p) => `/p/${p}`} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "3" } });
    expect(assign.mock.calls).toEqual([["/p/3"]]);
  });

  it("offers first, previous, next and last in the arrow form, or just two", () => {
    const { rerender } = render(<Pagination layout="arrows" page={3} pageCount={7} onPageChange={() => {}} />);
    expect(names()).toEqual(["First page (1)", "Previous page (2)", "Next page (4)", "Last page (7)"]);
    rerender(<Pagination layout="arrows" edges={false} page={3} pageCount={7} onPageChange={() => {}} />);
    expect(names()).toEqual(["Previous page (2)", "Next page (4)"]);
  });

  it("says a new page politely, and nothing on first render", () => {
    const props: PaginationProps = { layout: "arrows", page: 40, pageCount: 79, onPageChange: () => {} };
    const { container, rerender } = render(<Pagination {...props} />);
    const live = () => container.querySelector("[data-pagination-live]");
    expect(live()).toHaveAttribute("role", "status");
    expect(live()).toHaveAttribute("aria-live", "polite");
    expect(live()!.textContent).toBe("");
    rerender(<Pagination {...props} page={41} />);
    expect(live()!.textContent).toBe("Page 41 of 79");
    rerender(<Pagination {...props} page={41} announce={false} />);
    expect(live()).toBeNull();
  });

  it("treats a page out of range as the nearest end, and tells the app when it's pressed", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination layout="pages" page={80} pageCount={79} onPageChange={onPageChange} />);
    const last = screen.getByRole("button", { name: "Page 79" });
    expect(last).toHaveAttribute("aria-current", "page");
    /* The app holds 80, which a filter left past the end: pressing 79 takes it there. */
    fireEvent.click(last);
    expect(onPageChange.mock.calls).toEqual([[79]]);
    /* The twin: an app already on 79 isn't told again. */
    rerender(<Pagination layout="pages" page={79} pageCount={79} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Page 79" }));
    expect(onPageChange.mock.calls).toEqual([[79]]);
  });

  it("reads a count that isn't a number yet as no pages, rather than failing", () => {
    for (const pageCount of [Number.NaN, Number.POSITIVE_INFINITY, -3]) {
      const { unmount } = render(
        <>
          <Pagination layout="pages" page={1} pageCount={pageCount} onPageChange={() => {}} />
          <Pagination layout="compact" page={1} pageCount={pageCount} onPageChange={() => {}} />
        </>,
      );
      expect(screen.queryAllByRole("button", { name: /^Page \d/ }), String(pageCount)).toHaveLength(0);
      expect(screen.getByRole("combobox")).toBeDisabled();
      unmount();
    }
    /* The twin: a real count renders its pages. */
    render(<Pagination layout="pages" page={1} pageCount={79} onPageChange={() => {}} />);
    expect(screen.getAllByRole("button", { name: /^Page \d/ })).toHaveLength(6);
  });

  it("holds a keyboard step on the picker until Enter, and takes a pick at once", () => {
    const onPageChange = vi.fn();
    render(<Pagination layout="compact" page={40} pageCount={79} onPageChange={onPageChange} />);
    const picker = screen.getByRole("combobox");
    /* An arrow on a closed select steps it and fires change in the same moment. */
    fireEvent.keyDown(picker, { key: "ArrowDown" });
    fireEvent.change(picker, { target: { value: "41" } });
    fireEvent.keyDown(picker, { key: "ArrowDown" });
    fireEvent.change(picker, { target: { value: "42" } });
    expect(onPageChange).not.toHaveBeenCalled();
    expect(picker).toHaveValue("42");
    fireEvent.keyDown(picker, { key: "Enter" });
    expect(onPageChange.mock.calls).toEqual([[42]]);
  });

  it("puts a held step back on Escape, and takes it on leaving", async () => {
    const onPageChange = vi.fn();
    render(<Pagination layout="compact" page={40} pageCount={79} onPageChange={onPageChange} />);
    const picker = screen.getByRole("combobox");
    fireEvent.keyDown(picker, { key: "ArrowUp" });
    fireEvent.change(picker, { target: { value: "39" } });
    fireEvent.keyDown(picker, { key: "Escape" });
    expect(picker).toHaveValue("40");
    fireEvent.blur(picker);
    expect(onPageChange).not.toHaveBeenCalled();
    fireEvent.keyDown(picker, { key: "ArrowUp" });
    fireEvent.change(picker, { target: { value: "39" } });
    fireEvent.blur(picker);
    expect(onPageChange.mock.calls).toEqual([[39]]);
    /* The twin: a pick with no key before it goes at once. */
    await new Promise((r) => setTimeout(r, 0));
    fireEvent.change(picker, { target: { value: "12" } });
    expect(onPageChange.mock.calls).toEqual([[39], [12]]);
  });

  it("leaves a click its link component canceled alone", () => {
    const onPageChange = vi.fn();
    const Guarded = (props: PaginationLinkProps) => (
      <a
        href={props.href}
        aria-label={props["aria-label"]}
        className={props.className}
        onClick={(e) => {
          if (props.href.endsWith("/2")) e.preventDefault();
          props.onClick(e);
        }}
      />
    );
    render(<Pagination layout="arrows" edges={false} page={1} pageCount={3} getPageHref={(p) => `/p/${p}`} linkComponent={Guarded} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("link", { name: "Next page (2)" }));
    expect(onPageChange).not.toHaveBeenCalled();
    /* The twin: the same link, not canceled, tells the app. */
    render(<Pagination layout="arrows" edges={false} page={2} pageCount={3} getPageHref={(p) => `/p/${p}`} linkComponent={Guarded} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("link", { name: "Next page (3)" }));
    expect(onPageChange.mock.calls).toEqual([[3]]);
  });

  it("says nothing in English once every label is replaced", () => {
    const labels = {
      nav: "Páginas",
      page: (p: number) => `Página ${p}`,
      number: (p: number) => `#${p}`,
      previous: "Anterior",
      next: "Siguiente",
      previousPage: (t: number | null) => `Anterior ${t ?? ""}`,
      nextPage: (t: number | null) => `Siguiente ${t ?? ""}`,
      firstPage: (t: number | null) => `Primera ${t ?? ""}`,
      lastPage: (t: number | null) => `Última ${t ?? ""}`,
      gap: "~",
      picker: "Página",
      of: (c: number) => `de ${c}`,
      status: (p: number, c: number) => `Página ${p} de ${c}`,
    };
    const props = { pageCount: 79, onPageChange: () => {}, labels };
    const { container, rerender } = render(
      <>
        <Pagination {...props} layout="pages" page={40} />
        <Pagination {...props} layout="compact" page={40} />
        <Pagination {...props} layout="arrows" page={40} />
      </>,
    );
    rerender(
      <>
        <Pagination {...props} layout="pages" page={41} />
        <Pagination {...props} layout="compact" page={41} />
        <Pagination {...props} layout="arrows" page={41} />
      </>,
    );
    const said = [
      container.textContent,
      ...[...container.querySelectorAll("[aria-label]")].map((el) => el.getAttribute("aria-label")),
    ].join(" ");
    for (const english of ["Page", "Previous", "Next", "First", "Last", "of 79", "Pagination", "…"]) {
      expect(said, english).not.toContain(english);
    }
    /* The twin: the replaced words are there, numbers formatted too. */
    for (const word of ["Páginas", "Página 41", "#41", "Anterior 40", "Primera 1", "Última 79", "de 79", "Página 41 de 79", "~"]) {
      expect(said, word).toContain(word);
    }
  });
});
