import { useId, useMemo, useRef, useState, type ComponentType, type MouseEvent, type ReactNode } from "react";
import { cn } from "../../../lib/utils";
import { Button } from "../../atoms/Button/Button";
import { buttonVariants } from "../../atoms/Button/button-variants";
import { selectTriggerVariants } from "../../atoms/Select/select-variants";
import { clampPage, pageItems } from "./page-items";

/** Every word Pagination shows or says. Pass any of them in `labels` to replace it. */
export interface PaginationLabels {
  /** The landmark's name. A page with two pagers needs each named. */
  nav: string;
  /** A page number's accessible name: "Page 40". */
  page: (page: number) => string;
  /** A page number as shown. */
  number: (page: number) => string;
  /** Shown beside the arrows where there's room. */
  previous: string;
  next: string;
  /** Each arrow's accessible name, given the page it goes to, or `null` at the end it can't pass. */
  previousPage: (target: number | null) => string;
  nextPage: (target: number | null) => string;
  firstPage: (target: number | null) => string;
  lastPage: (target: number | null) => string;
  /** Where pages are skipped. Hidden from screen readers, which hear the numbers either side. */
  gap: string;
  /** The page picker's label in the compact form: "Page". */
  picker: string;
  /** After the picker: "of 79". */
  of: (pageCount: number) => string;
  /** Said politely when the page changes: "Page 41 of 79". */
  status: (page: number, pageCount: number) => string;
}

const LABELS: PaginationLabels = {
  nav: "Pagination",
  page: (page) => `Page ${page}`,
  number: (page) => String(page),
  previous: "Previous",
  next: "Next",
  previousPage: (target) => (target === null ? "Previous page" : `Previous page (${target})`),
  nextPage: (target) => (target === null ? "Next page" : `Next page (${target})`),
  firstPage: (target) => (target === null ? "First page" : `First page (${target})`),
  lastPage: (target) => (target === null ? "Last page" : `Last page (${target})`),
  gap: "…",
  picker: "Page",
  of: (pageCount) => `of ${pageCount}`,
  status: (page, pageCount) => `Page ${page} of ${pageCount}`,
};

/**
 * The props every link is rendered with, in link mode.
 *
 * `href` and `to` carry the same value, so `next/link`, React Router's `Link`
 * and a plain `<a>` all work without a wrapper.
 */
export interface PaginationLinkProps {
  href: string;
  to: string;
  className: string;
  children: ReactNode;
  "aria-label": string;
  "aria-current"?: "page";
  "aria-disabled"?: true;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}

/* Named props rather than a spread, so `to` doesn't land on the anchor. */
function DefaultLink({ href, className, children, onClick, ...aria }: PaginationLinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={onClick}
      aria-label={aria["aria-label"]}
      aria-current={aria["aria-current"]}
      aria-disabled={aria["aria-disabled"]}
    >
      {children}
    </a>
  );
}

export interface PaginationProps {
  /** The current page, from 1. */
  page: number;
  /** How many pages there are. */
  pageCount: number;
  /**
   * Called with the page a control goes to.
   *
   * Without `getPageHref`, every control is a button and this is the only
   * thing that changes the page: page in your own state.
   *
   * With `getPageHref`, the controls are links and navigate themselves; this
   * is called first, on a plain left click (not one that opens a new tab),
   * for an app that wants to do something as it goes.
   */
  onPageChange?: (page: number) => void;
  /**
   * Makes every control a real link to `getPageHref(page)`: crawlable,
   * shareable, and openable in a new tab. Use it when your pages are URLs.
   */
  getPageHref?: (page: number) => string;
  /**
   * Renders each link in link mode. Defaults to a plain `<a>`, which is right
   * for a static site and wrong inside a router, where every hop becomes a
   * full page load.
   *
   * **Pass it from a client component.** Functions can not cross the React
   * Server Component boundary. Bind it in a small `"use client"` wrapper.
   */
  linkComponent?: ComponentType<PaginationLinkProps>;
  /**
   * How the compact form's page picker goes to a page in link mode, where
   * there's no link to follow. Defaults to a full page load
   * (`location.assign`); pass your router's push to stay client-side.
   */
  navigate?: (href: string) => void;
  /**
   * - `"pages"`: previous, page numbers with gaps, next.
   * - `"compact"`: previous, a page picker ("Page 40 of 79"), next, and the
   *   first and last pages where there's room. Any page is two taps away.
   * - `"arrows"`: first, previous, next, last, for a pager that shows its
   *   own position.
   * - `"auto"` (the default): `"pages"` where the pager has room, `"compact"`
   *   where it doesn't. Decided by the pager's own width, not the screen's.
   */
  layout?: "auto" | "pages" | "compact" | "arrows";
  /** Page numbers shown either side of the current one. */
  siblings?: number;
  /** Whether the compact and arrow forms offer the first and last pages. */
  edges?: boolean;
  /** Where the controls sit in the pager's width. */
  align?: "start" | "center" | "end";
  /** How the controls other than the current page are drawn. */
  variant?: "ghost" | "outline";
  /** Say the new page in a polite live region when it changes. */
  announce?: boolean;
  labels?: Partial<PaginationLabels>;
  className?: string;
}

/* A control is at least 44 by 44 at every size. */
const TARGET = "rst:h-11 rst:min-w-11 rst:px-2";
/* An arrow at either end is `aria-disabled`, not `disabled`: a browser drops
   focus from a disabled control to the page, so whoever pressed Next to reach
   the last page would be thrown to the top. */
const DIMMED = "rst:cursor-not-allowed rst:opacity-50";
/* In forced colors every button is the same outline on the same background,
   so the current page carries a heavier border and an underline too. */
const CURRENT_FORCED = "rst:forced-colors:border-2 rst:forced-colors:underline rst:forced-colors:decoration-2 rst:forced-colors:underline-offset-4";

const ICON = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const Chevron = ({ dir, double = false }: { dir: "left" | "right"; double?: boolean }) => (
  <svg {...ICON} className="rst:shrink-0">
    {dir === "left" ? (
      double ? <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" /> : <path d="m15 18-6-6 6-6" />
    ) : double ? (
      <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
    ) : (
      <path d="m9 18 6-6-6-6" />
    )}
  </svg>
);

type Kind = "first" | "previous" | "next" | "last" | "page";

/**
 * The compact form's page picker: a native select, so a phone shows its own
 * list of pages.
 *
 * A pick from the list goes at once. A key on the closed select doesn't: on
 * Windows and Linux an arrow key steps a closed select's value and fires
 * `change` for each step, so going straight there would leave page 40 for 41
 * on the first press, and a keyboard could never reach 50. A change that
 * follows a key in the same moment is held until Enter or leaving the select;
 * Escape puts it back.
 */
function PagePicker({
  id,
  describedBy,
  page,
  pageCount,
  number,
  onCommit,
}: {
  id: string;
  describedBy: string;
  page: number;
  pageCount: number;
  number: (page: number) => string;
  onCommit: (page: number) => void;
}) {
  const [draft, setDraft] = useState<{ page: number; value: number } | null>(null);
  const keyed = useRef(false);
  /* A draft belongs to the page it was made on. */
  const held = draft && draft.page === page ? draft.value : null;
  const commit = (value: number) => {
    setDraft(null);
    if (value !== page) onCommit(value);
  };
  const options = useMemo(
    () =>
      Array.from({ length: pageCount }, (_, i) => (
        <option key={i + 1} value={i + 1}>
          {number(i + 1)}
        </option>
      )),
    [pageCount, number],
  );
  return (
    <select
      id={id}
      value={held ?? page}
      aria-describedby={describedBy}
      disabled={pageCount < 1}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (held !== null) {
            e.preventDefault();
            commit(held);
          }
          return;
        }
        if (e.key === "Escape") {
          setDraft(null);
          return;
        }
        keyed.current = true;
        setTimeout(() => {
          keyed.current = false;
        }, 0);
      }}
      onChange={(e) => {
        const value = Number(e.currentTarget.value);
        if (keyed.current) setDraft({ page, value });
        else commit(value);
      }}
      onBlur={() => {
        if (held !== null) commit(held);
      }}
      className={cn(
        selectTriggerVariants({ variant: "outline" }),
        /* 16px: iOS zooms the page into a select whose text is smaller. */
        "rst:h-11 rst:w-auto rst:min-w-16 rst:appearance-none rst:pl-3 rst:pr-8 rst:text-base rst:tabular-nums",
      )}
      data-pagination-picker=""
    >
      {options}
    </select>
  );
}

/**
 * Moves through pages of a list.
 *
 * Controlled: you hold `page`, and the pager says which page a control goes
 * to. Its controls are buttons that call `onPageChange`, or, with
 * `getPageHref`, real links.
 *
 * **Focus.** A control keeps focus after the page changes: the number you
 * pressed is the same element afterwards, and an arrow that reaches the end
 * stays focusable, `aria-disabled`. Nothing moves focus for you. To take a
 * reader to the top of the new page, focus your list's heading in
 * `onPageChange`.
 */
function Pagination({
  page: rawPage,
  pageCount: rawCount,
  onPageChange,
  getPageHref,
  linkComponent,
  navigate,
  layout = "auto",
  siblings = 1,
  edges = true,
  align = "center",
  variant = "ghost",
  announce = true,
  labels: overrides,
  className,
}: PaginationProps) {
  const l = { ...LABELS, ...overrides };
  /* A count still loading (NaN) or divided by a page size of 0 (Infinity)
     reads as no pages, rather than rendering forever or not at all. */
  const pageCount = Number.isFinite(rawCount) ? Math.max(0, Math.floor(rawCount)) : 0;
  const page = clampPage(rawPage, pageCount);
  const id = useId();
  const Link = linkComponent ?? DefaultLink;

  /* The page as last said, adjusted while rendering rather than in an
     effect: a change of `page` sets what the live region says. */
  const [said, setSaid] = useState({ page, text: "" });
  if (said.page !== page) setSaid({ page, text: announce ? l.status(page, pageCount) : "" });

  /* Compared with the page the app holds, not the one shown: an app left on
     page 80 of 79 by a filter sees 79 as current, and pressing it has to
     tell the app so. */
  const go = (target: number) => {
    if (target !== Math.floor(rawPage)) onPageChange?.(target);
  };

  const control = (kind: Kind, target: number | null, content: ReactNode, opts: { label: string; className?: string }) => {
    const current = kind === "page" && target === page;
    const disabled = target === null;
    const classes = cn(TARGET, disabled && DIMMED, current && CURRENT_FORCED, opts.className);
    const key = kind === "page" ? `page-${target}` : kind;

    if (getPageHref) {
      /* An arrow at the end links to the page you're on and does nothing, so
         it stays the same element, and keeps focus, as it reaches the end. */
      const href = getPageHref(target ?? page);
      return (
        <Link
          key={key}
          href={href}
          to={href}
          className={cn(buttonVariants({ variant: current ? "solid" : variant, colorScheme: current ? "primary" : "neutral" }), classes)}
          aria-label={opts.label}
          aria-current={current ? "page" : undefined}
          aria-disabled={disabled ? true : undefined}
          onClick={(e) => {
            if (disabled) {
              e.preventDefault();
              return;
            }
            const plain = !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
            if (plain && target !== null) go(target);
          }}
        >
          {content}
        </Link>
      );
    }
    return (
      <Button
        key={key}
        type="button"
        variant={current ? "solid" : variant}
        colorScheme={current ? "primary" : "neutral"}
        className={classes}
        aria-label={opts.label}
        aria-current={current ? "page" : undefined}
        aria-disabled={disabled || undefined}
        onClick={() => {
          if (target !== null) go(target);
        }}
      >
        {content}
      </Button>
    );
  };

  const prev = page > 1 ? page - 1 : null;
  const next = page < pageCount ? page + 1 : null;
  const atFirst = page > 1 ? 1 : null;
  const atLast = page < pageCount ? pageCount : null;

  const previousArrow = (withText: boolean) =>
    control(
      "previous",
      prev,
      <>
        <Chevron dir="left" />
        {withText && <span className="rst:hidden rst:pr-1 rst:@[36rem]:inline">{l.previous}</span>}
      </>,
      { label: l.previousPage(prev) },
    );
  const nextArrow = (withText: boolean) =>
    control(
      "next",
      next,
      <>
        {withText && <span className="rst:hidden rst:pl-1 rst:@[36rem]:inline">{l.next}</span>}
        <Chevron dir="right" />
      </>,
      { label: l.nextPage(next) },
    );
  /* In the compact form the first and last pages wait for room: the picker
     reaches them anyway. */
  const firstArrow = (narrowHides: boolean) =>
    control("first", atFirst, <Chevron dir="left" double />, {
      label: l.firstPage(atFirst),
      className: narrowHides ? "rst:hidden rst:@[24rem]:inline-flex" : undefined,
    });
  const lastArrow = (narrowHides: boolean) =>
    control("last", atLast, <Chevron dir="right" double />, {
      label: l.lastPage(atLast),
      className: narrowHides ? "rst:hidden rst:@[24rem]:inline-flex" : undefined,
    });

  const row = "rst:flex rst:flex-wrap rst:items-center rst:gap-1";
  const justify = { start: "rst:justify-start", center: "rst:justify-center", end: "rst:justify-end" }[align];

  const pages = (hide?: string) => (
    <div className={cn(row, justify, hide)} data-pagination-layout="pages">
      {previousArrow(true)}
      {pageItems(page, pageCount, siblings).map((item) =>
        typeof item === "number" ? (
          control("page", item, l.number(item), { label: l.page(item) })
        ) : (
          <span key={item} aria-hidden="true" className="rst:inline-flex rst:h-11 rst:w-11 rst:items-center rst:justify-center rst:text-sm rst:text-gray-500 rst:dark:text-gray-400">
            {l.gap}
          </span>
        ),
      )}
      {nextArrow(true)}
    </div>
  );

  const pickerId = `${id}-picker`;
  const ofId = `${id}-of`;
  const compact = (hide?: string) => (
    <div className={cn(row, justify, hide)} data-pagination-layout="compact">
      {edges && firstArrow(true)}
      {previousArrow(false)}
      <div className="rst:flex rst:items-center rst:gap-2 rst:px-1 rst:text-sm rst:font-medium rst:text-[var(--roster-control-text)]">
        <label htmlFor={pickerId}>{l.picker}</label>
        <span className="rst:relative rst:inline-flex">
          <PagePicker
            id={pickerId}
            describedBy={ofId}
            page={page}
            pageCount={pageCount}
            number={l.number}
            onCommit={(target) => {
              if (getPageHref) {
                onPageChange?.(target);
                const href = getPageHref(target);
                if (navigate) navigate(href);
                else window.location.assign(href);
              } else go(target);
            }}
          />
          <svg {...ICON} width={16} height={16} className="rst:pointer-events-none rst:absolute rst:right-2.5 rst:top-1/2 rst:-translate-y-1/2 rst:text-gray-500 rst:dark:text-gray-400">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
        <span id={ofId} className="rst:tabular-nums">
          {l.of(pageCount)}
        </span>
      </div>
      {nextArrow(false)}
      {edges && lastArrow(true)}
    </div>
  );

  const arrows = (
    <div className={cn(row, justify)} data-pagination-layout="arrows">
      {edges && firstArrow(false)}
      {previousArrow(false)}
      {nextArrow(false)}
      {edges && lastArrow(false)}
    </div>
  );

  return (
    /* A query container sizes itself as if it were empty across, so it takes
       the full width it's given; in a slot that sizes to its content (an
       `ml-auto` box, an `auto` grid column) it would be 0 wide. There it
       falls back to 18rem, which is the compact form. The arrows need no
       queries, and size to fit, to sit in a row beside something else. */
    <nav
      aria-label={l.nav}
      className={cn(
        "rst:font-ui",
        layout === "arrows" ? "rst:w-fit" : "rst:@container rst:w-full rst:[contain-intrinsic-inline-size:18rem]",
        className,
      )}
      data-pagination=""
    >
      {layout === "pages" && pages()}
      {layout === "compact" && compact()}
      {layout === "arrows" && arrows}
      {/* Both, with the pager's own width choosing: no measuring, so the
          server render is already the right one. A hidden form is out of the
          accessibility tree and the tab order. */}
      {layout === "auto" && (
        <>
          {pages("rst:hidden rst:@[28rem]:flex")}
          {compact("rst:@[28rem]:hidden")}
        </>
      )}
      {announce && (
        <div role="status" aria-live="polite" aria-atomic="true" className="rst:sr-only" data-pagination-live="">
          {said.text}
        </div>
      )}
    </nav>
  );
}

export { Pagination };
