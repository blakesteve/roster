import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { Pagination, type PaginationProps } from "./Pagination";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Every promise Pagination makes, checked in Chromium. Expected values are
 * literals written from the requirement, each paired with a twin that must
 * come out differently, so a pass means the pager did it rather than that
 * the check couldn't tell.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/Pagination/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Paged({ start = 40, ...props }: Partial<PaginationProps> & { start?: number }) {
  const [page, setPage] = useState(start);
  return <Pagination page={page} pageCount={79} onPageChange={setPage} {...props} />;
}

const q = <E extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<E>(s);
const control = (name: string, root: ParentNode = document) =>
  [...root.querySelectorAll<HTMLElement>("button, a")].find((el) => el.getAttribute("aria-label") === name && el.offsetParent)!;
const visibleForm = (root: ParentNode = document) =>
  [...root.querySelectorAll<HTMLElement>("[data-pagination-layout]")].filter((el) => getComputedStyle(el).display !== "none").map((el) => el.dataset.paginationLayout);

/* ── The current page ──────────────────────────────────────────────────── */

export const TheCurrentPageIsMarked: Story = {
  render: () => <Paged layout="pages" />,
  play: async () => {
    const current = () => [...document.querySelectorAll('[aria-current="page"]')].map((el) => el.getAttribute("aria-label"));
    await expect(current()).toEqual(["Page 40"]);
    await userEvent.click(control("Page 41"));
    /* The twin: it moves with the page. */
    await waitFor(() => expect(current()).toEqual(["Page 41"]));
  },
};

/* ── Focus ─────────────────────────────────────────────────────────────── */

export const FocusStaysOnWhatWasPressed: Story = {
  render: () => <Paged layout="pages" start={77} />,
  play: async () => {
    const pressed = control("Page 78");
    await userEvent.click(pressed);
    await waitFor(() => expect(pressed.getAttribute("aria-current")).toBe("page"));
    await expect(document.activeElement).toBe(pressed);
    /* Next, to the last page: it reaches the end and keeps focus. */
    const next = control("Next page (79)");
    next.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(next.getAttribute("aria-label")).toBe("Next page"));
    await expect([document.activeElement === next, next.getAttribute("aria-disabled")]).toEqual([true, "true"]);
    /* Pressing it again changes nothing. */
    await userEvent.keyboard("{Enter}");
    await expect(control("Page 79").getAttribute("aria-current")).toBe("page");
    await expect(document.activeElement).not.toBe(document.body);
  },
};

function ListWithHeading() {
  const [page, setPage] = useState(1);
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <div>
      <h3 ref={heading} tabIndex={-1} data-heading="">
        Page {page}
      </h3>
      <Pagination
        layout="pages"
        page={page}
        pageCount={12}
        onPageChange={(p) => {
          setPage(p);
          heading.current?.focus();
        }}
      />
    </div>
  );
}

export const TheAppCanTakeFocusToItsList: Story = {
  render: () => <ListWithHeading />,
  play: async () => {
    await userEvent.click(control("Next page (2)"));
    await waitFor(() => expect(q("[data-heading]")!.textContent).toBe("Page 2"));
    await expect(document.activeElement).toBe(q("[data-heading]"));
  },
};

export const TabReachesEveryControlInOrder: Story = {
  render: () => (
    <>
      <button type="button" data-before="">
        Before
      </button>
      <Paged layout="compact" />
    </>
  ),
  play: async () => {
    q("[data-before]")!.focus();
    const stops: string[] = [];
    for (let i = 0; i < 5; i++) {
      await userEvent.tab();
      const el = document.activeElement as HTMLElement;
      stops.push(el.getAttribute("aria-label") ?? el.tagName.toLowerCase());
    }
    await expect(stops).toEqual(["First page (1)", "Previous page (39)", "select", "Next page (41)", "Last page (79)"]);
    /* 16px, or iOS zooms the page when the picker takes focus. */
    await expect(getComputedStyle(q("[data-pagination-picker]")!).fontSize).toBe("16px");
  },
};

/* ── Links ─────────────────────────────────────────────────────────────── */

/* Whether the browser would have followed the link a click lands on: read
   after the pager's own handler, from the window, which then cancels it
   anyway, because following it would navigate the test's own frame. */
function followed(): { result: () => boolean[]; stop: () => void } {
  const seen: boolean[] = [];
  const listener = (e: MouseEvent) => {
    if (!(e.target as Element).closest("a")) return;
    seen.push(!e.defaultPrevented);
    e.preventDefault();
  };
  window.addEventListener("click", listener);
  return { result: () => seen, stop: () => window.removeEventListener("click", listener) };
}

export const LinksAreRealLinks: Story = {
  render: () => <Paged layout="pages" start={3} getPageHref={(p) => `/catalog?page=${p}`} />,
  play: async () => {
    const anchors = [...document.querySelectorAll<HTMLAnchorElement>("[data-pagination] a")];
    await expect(anchors.map((a) => a.getAttribute("href"))).toEqual([
      "/catalog?page=2",
      "/catalog?page=1",
      "/catalog?page=2",
      "/catalog?page=3",
      "/catalog?page=4",
      "/catalog?page=5",
      "/catalog?page=79",
      "/catalog?page=4",
    ]);
    await expect(document.querySelectorAll("[data-pagination] button")).toHaveLength(0);
    const probe = followed();
    try {
      /* A click, and Enter on a focused link, are followed. */
      await userEvent.click(control("Page 5"));
      /* The click also told the app, which is now on page 5. */
      await waitFor(() => expect(control("Page 5").getAttribute("aria-current")).toBe("page"));
      control("Next page (6)").focus();
      await userEvent.keyboard("{Enter}");
      await expect(probe.result()).toEqual([true, true]);
    } finally {
      probe.stop();
    }
  },
};

export const AnArrowAtTheEndLinksNowhere: Story = {
  render: () => <Pagination layout="arrows" page={1} pageCount={79} getPageHref={(p) => `/catalog?page=${p}`} />,
  play: async () => {
    const probe = followed();
    try {
      await userEvent.click(control("Previous page"));
      await userEvent.click(control("First page"));
      /* The twin: the other way is followed. */
      await userEvent.click(control("Next page (2)"));
      await expect(probe.result()).toEqual([false, false, true]);
    } finally {
      probe.stop();
    }
  },
};

/* ── Its own width, not the screen's ───────────────────────────────────── */

export const ItChoosesItsFormByItsOwnWidth: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      {[300, 380, 400, 440, 460, 900].map((w) => (
        <div key={w} style={{ width: w }} data-width={w}>
          <Paged />
        </div>
      ))}
    </div>
  ),
  play: async () => {
    const at = (w: number) => q(`[data-width="${w}"]`)!;
    /* Compact under 28rem (448px), numbers from there. */
    await expect([300, 380, 400, 440, 460, 900].map((w) => visibleForm(at(w)))).toEqual([
      ["compact"],
      ["compact"],
      ["compact"],
      ["compact"],
      ["pages"],
      ["pages"],
    ]);
    /* The compact form's first and last arrows join at 24rem (384px). */
    await expect([380, 400].map((w) => !!control("First page (1)", at(w)))).toEqual([false, true]);
    /* The words beside the arrows wait for 36rem (576px). */
    const prevTextShown = (w: number) => getComputedStyle(control("Previous page (39)", at(w)).querySelector("span")!).display !== "none";
    await expect([prevTextShown(460), prevTextShown(900)]).toEqual([false, true]);
  },
};

export const ButtonsDontMoveAsAGapAppears: Story = {
  render: () => (
    <div style={{ width: 700 }}>
      {[4, 5].map((p) => (
        <div key={p} data-on={p}>
          <Pagination layout="pages" align="start" page={p} pageCount={79} onPageChange={() => {}} />
        </div>
      ))}
    </div>
  ),
  play: async () => {
    /* At 4 there's one gap, at 5 two: every slot is as wide as a number, so
       Next and the last page stay put. */
    const x = (p: number, name: string) => Math.round(control(name, q(`[data-on="${p}"]`)!).getBoundingClientRect().left);
    await expect([x(5, "Page 79") - x(4, "Page 79"), x(5, "Next page (6)") - x(4, "Next page (5)")]).toEqual([0, 0]);
  },
};

export const InASlotThatSizesToItsContentItIsCompact: Story = {
  render: () => (
    <div style={{ width: 1000, display: "grid", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center" }} data-slot="fit">
        <h3 style={{ margin: 0 }}>Catalog</h3>
        <div style={{ marginLeft: "auto" }}>
          <Paged />
        </div>
      </div>
      {/* The twin: the same row, the pager's slot given the width. */}
      <div style={{ display: "flex", alignItems: "center" }} data-slot="wide">
        <h3 style={{ margin: 0 }}>Catalog</h3>
        <div style={{ flex: 1 }}>
          <Paged />
        </div>
      </div>
    </div>
  ),
  play: async () => {
    const read = (slot: string) => {
      const root = q(`[data-slot="${slot}"]`)!;
      const boxes = [...root.querySelectorAll<HTMLElement>("button, a, select")].filter((el) => el.offsetParent).map((el) => el.getBoundingClientRect());
      return {
        width: Math.round(root.querySelector("nav")!.getBoundingClientRect().width),
        form: visibleForm(root),
        rows: new Set(boxes.map((b) => Math.round(b.top))).size,
      };
    };
    /* 18rem, not 0: the compact form on one row. */
    await expect(read("fit")).toEqual({ width: 288, form: ["compact"], rows: 1 });
    await expect(read("wide").form).toEqual(["pages"]);
  },
};

/* ── Phones and desks ──────────────────────────────────────────────────── */

const pagerAt = (page: number) => (
  <div data-at={page} style={{ marginBottom: 16 }}>
    <Pagination page={page} pageCount={79} onPageChange={() => {}} />
  </div>
);

export const At320And375And1280EveryControlFitsOnOneRow: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ padding: "0 16px" }}>
      {pagerAt(1)}
      {pagerAt(40)}
      {pagerAt(79)}
      <div data-forced="">
        <Pagination layout="pages" page={40} pageCount={79} onPageChange={() => {}} />
      </div>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const read = (root: HTMLElement) => {
      const nav = root.querySelector<HTMLElement>("nav")!.getBoundingClientRect();
      const boxes = [...root.querySelectorAll<HTMLElement>("button, a, select")].filter((el) => el.offsetParent).map((el) => el.getBoundingClientRect());
      return {
        form: visibleForm(root),
        small: boxes.filter((b) => Math.round(b.width) < 44 || Math.round(b.height) < 44).length,
        rows: new Set(boxes.map((b) => Math.round(b.top))).size,
        inside: boxes.every((b) => b.left >= nav.left - 0.5 && b.right <= nav.right + 0.5),
      };
    };
    try {
      for (const [width, form] of [[320, "compact"], [375, "compact"], [1280, "pages"]] as const) {
        await real.page.viewport(width, 700);
        await waitFor(() => expect(document.documentElement.clientWidth).toBe(width));
        for (const page of [1, 40, 79]) {
          await expect(read(q(`[data-at="${page}"]`)!), `${width}px, page ${page}`).toEqual({ form: [form], small: 0, rows: 1, inside: true });
        }
        await expect(document.documentElement.scrollWidth, `${width}px: no sideways scroll`).toBeLessThanOrEqual(width);
      }
      /* The twin, and the reason for the compact form: numbers forced at 320px wrap. */
      await real.page.viewport(320, 700);
      await waitFor(() => expect(document.documentElement.clientWidth).toBe(320));
      await expect(read(q("[data-forced]")!).rows).toBeGreaterThan(1);
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};

export const InForcedColorsTheCurrentPageStillStandsOut: Story = {
  tags: ["real-input"],
  render: () => <Paged layout="pages" />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const read = () =>
      ["Page 40", "Page 41"].map((name) => {
        const style = getComputedStyle(control(name));
        return [style.textDecorationLine, style.borderTopWidth];
      });
    try {
      await real.commands.realEmulateMedia({ forcedColors: "active" });
      await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(true));
      /* The current page is underlined and heavier; the page beside it isn't. */
      await expect(read()).toEqual([
        ["underline", "2px"],
        ["none", "1px"],
      ]);
    } finally {
      await real.commands.realEmulateMedia({ forcedColors: null });
    }
    /* The twin: outside forced colors, the fill says it and nothing else changes. */
    await waitFor(() => expect(matchMedia("(forced-colors: active)").matches).toBe(false));
    await expect(read()).toEqual([
      ["none", "1px"],
      ["none", "1px"],
    ]);
  },
};

/* ── The accessibility tree ────────────────────────────────────────────── */

export const NamesRolesAndWhatsHidden: Story = {
  tags: ["ax-tree"],
  render: () => (
    <div style={{ width: 360 }}>
      <Paged />
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    const hiddenNumber = [...document.querySelectorAll<HTMLElement>('[data-pagination-layout="pages"] button')].find(
      (b) => b.getAttribute("aria-label") === "Page 41",
    )!;
    const probes = [
      q("nav")!,
      control("Previous page (39)"),
      q("[data-pagination-picker]")!,
      control("Next page (41)"),
      hiddenNumber,
      q("[data-pagination-live]")!,
    ];
    const ids = probes.map((el, i) => {
      const id = `pg-${i}-${Math.random().toString(36).slice(2)}`;
      el.setAttribute("data-ax-probe", id);
      return `[data-ax-probe="${id}"]`;
    });
    const states = await real.commands.axStates(ids);
    probes.forEach((el) => el.removeAttribute("data-ax-probe"));
    await expect(states.map((s) => [s.role, s.name, s.description, s.ignored])).toEqual([
      ["navigation", "Pagination", "", false],
      ["button", "Previous page (39)", "", false],
      ["combobox", "Page", "of 79", false],
      ["button", "Next page (41)", "", false],
      /* The twin: the numbered form, hidden at this width, is out of the tree. */
      ["none", "", "", true],
      ["status", "", "", false],
    ]);
  },
};
