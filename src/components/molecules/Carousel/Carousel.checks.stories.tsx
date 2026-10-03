import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Carousel, type CarouselHandle } from "./Carousel";
import { realInput, realInputOrSkip } from "../../../test/real-input";

/* Fixtures are styled inline: Tailwind scans all of `src`, so a class used
   only in a story would ship in `roster.css` to every consumer. */
const CARD: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  height: 140,
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgb(0 0 0 / 0.12)",
  background: "rgb(99 102 241 / 0.08)",
  color: "inherit",
  textDecoration: "none",
  font: "inherit",
};
const BUTTON_CARD: CSSProperties = { ...CARD, width: "100%", cursor: "pointer", textAlign: "start" };

const songs = Array.from({ length: 13 }, (_, i) => `Song ${i + 1}`);

function SongCard({ title }: { title: string }) {
  return (
    <a href={`#${title.replace(" ", "-").toLowerCase()}`} style={CARD} onClick={(e) => e.preventDefault()}>
      {title}
    </a>
  );
}

function Frame({ width, children }: { width: number; children: ReactNode }) {
  return <div style={{ width, maxWidth: "none" }}>{children}</div>;
}

/**
 * The acceptance checks behind the Carousel: exact positions in fixed frames,
 * a real wheel and mouse drag, reduced motion, focus. They are tests, not
 * documentation, so they are hidden from the sidebar and the docs page
 * (`!dev`, `!autodocs`); the test runner still runs every one. The stories a
 * reader should look at are in Carousel.stories.tsx.
 */
const meta = {
  title: "Molecules/Carousel/Checks",
  component: Carousel,
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const page = within(document.body);
const list = (name: string) => page.getByRole("list", { name });
const frame = () => new Promise((r) => requestAnimationFrame(() => r(undefined)));
/* The row has arrived: no smooth settle in progress, and still for three frames. */
const settled = async (el: HTMLElement) => {
  await waitFor(
    async () => {
      expect(el).not.toHaveAttribute("data-settling");
      const at = el.scrollLeft;
      await frame();
      await frame();
      await frame();
      expect(el.scrollLeft).toBe(at);
    },
    { timeout: 3000 },
  );
};
/* The test frame resizes over a few frames; wait until it has. */
const resize = async (input: NonNullable<ReturnType<typeof realInput>>, width: number, height: number) => {
  await input.page.viewport(width, height);
  await waitFor(() => expect(window.innerWidth).toBe(width));
  await frame();
  await frame();
};
const box = (el: Element) => el.getBoundingClientRect();
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Thirteen cards of 240px with a 12px gap, in a 720px column: two whole cards
 * and most of a third. The arrows page by the two in view and land on an
 * item's edge. At either end its arrow is `disabled`, out of the tab order.
 */
export const RowOfCards: Story = {
  args: { "aria-label": "Songs", itemWidth: 240, gap: 12, gutter: 16, children: null },
  render: function Render(args) {
    const [index, setIndex] = useState(0);
    const ref = useRef<CarouselHandle>(null);
    return (
      <Frame width={720}>
        <Carousel {...args} ref={ref} arrows="always" onIndexChange={setIndex}>
          {songs.map((s) => (
            <SongCard key={s} title={s} />
          ))}
        </Carousel>
        <output data-testid="index">{index}</output>{" "}
        <button type="button" onClick={() => ref.current?.scrollToIndex(5, { behavior: "instant" })}>
          Go to song 6
        </button>{" "}
        <button type="button" onClick={() => ref.current?.scrollToIndex(0, { behavior: "instant" })}>
          Go to song 1
        </button>
      </Frame>
    );
  },
  play: async () => {
    const row = list("Songs");
    const prev = page.getByRole("button", { name: "Previous Songs" });
    const next = page.getByRole("button", { name: "Next Songs" });

    // R3, test 9: 44 by 44, named with the row's label.
    for (const arrow of [prev, next]) {
      await expect(box(arrow).width).toBeGreaterThanOrEqual(44);
      await expect(box(arrow).height).toBeGreaterThanOrEqual(44);
    }
    // R7: a named list of items, and no carousel or slide roles.
    await expect(row.tagName).toBe("UL");
    await expect(row.children).toHaveLength(13);
    await expect(document.querySelector("[aria-roledescription]")).toBeNull();
    // R10, R12: sideways overscroll contained, scrollbar hidden.
    await expect(getComputedStyle(row).overscrollBehaviorX).toBe("contain");
    await expect(getComputedStyle(row).scrollbarWidth).toBe("none");

    // Test 4: next pages by the two wholly in view, from item 0 to item 2,
    // whose edge lands on the 16px gutter: 2 * (240 + 12) = 504.
    await expect(prev).toBeDisabled();
    await userEvent.click(next);
    await settled(row);
    await expect(row.scrollLeft).toBe(504);
    await expect(box(row.children[2]).left - box(row).left).toBe(16);
    await expect(prev).toBeEnabled();
    // R11: the first item wholly in view is reported.
    await waitFor(() => expect(page.getByTestId("index")).toHaveTextContent("2"));

    // On to the end: next goes quiet, disabled and out of the tab order.
    for (let i = 0; i < 6 && !(next as HTMLButtonElement).disabled; i++) {
      await userEvent.click(next);
      await settled(row);
    }
    await expect(next).toBeDisabled();
    await expect(row.scrollLeft).toBe(row.scrollWidth - row.clientWidth);
    await expect(Number(getComputedStyle(next).opacity)).toBeLessThan(1);

    // And back: prev pages the same way, onto an item's edge.
    await userEvent.click(prev);
    await settled(row);
    const lefts = Array.from(row.children).map((c) => box(c).left - box(row).left);
    await expect(lefts).toContain(16);

    // Two quick clicks are two whole pages, not one and a half: 0 to 1008.
    await userEvent.click(page.getByRole("button", { name: "Go to song 1" }));
    await settled(row);
    await userEvent.click(next);
    await userEvent.click(next);
    await settled(row);
    await expect(row.scrollLeft).toBe(1008);

    // R11: scrollToIndex snaps the asked-for item into place: 5 * 252 = 1260.
    await userEvent.click(page.getByRole("button", { name: "Go to song 6" }));
    await expect(row.scrollLeft).toBe(1260);
    await waitFor(() => expect(page.getByTestId("index")).toHaveTextContent("5"));

    // R3: shown where a pointer can hover by default; this row asked for always.
    await expect(next.className).not.toContain("any-hover");

    // From the keyboard: Enter on Next until it is disabled hands focus to
    // Previous rather than dropping it on the page.
    await userEvent.click(page.getByRole("button", { name: "Go to song 1" }));
    next.focus();
    for (let i = 0; i < 8 && !(next as HTMLButtonElement).disabled; i++) {
      await userEvent.keyboard("{Enter}");
      await settled(row);
    }
    await expect(next).toBeDisabled();
    await waitFor(() => expect(prev).toHaveFocus());

    // Last, because it moves the row: from prev, Tab skips the disabled next
    // and lands on the first card, which (as natively) brings the row home.
    for (let i = 0; i < 6 && !(next as HTMLButtonElement).disabled; i++) {
      await userEvent.click(next);
      await settled(row);
    }
    await expect(next).toBeDisabled();
    prev.focus();
    await userEvent.tab();
    await expect(document.activeElement).not.toBe(next);
    await expect(row.contains(document.activeElement)).toBe(true);
  },
};

/**
 * A row in the middle of a long page. Turn the mouse wheel with the pointer
 * over the row: the page scrolls past it, and the row stays put. A sideways
 * swipe on a trackpad, or Shift with the wheel, moves the row instead.
 */
export const WheelScrollsThePage: Story = {
  /* Real input and viewport changes: run in their own project, alone. Kept
     off the docs page, where a long page inside a page makes no sense. */
  tags: ["real-input", "!autodocs"],
  args: { "aria-label": "Songs", itemWidth: 240, children: null },
  render: (args) => (
    <Frame width={720}>
      <p style={{ marginTop: 0 }}>
        Put the pointer over the row and turn the mouse wheel. The page scrolls; the row doesn't. A sideways
        swipe, or Shift with the wheel, moves the row.
      </p>
      <div data-testid="wheel-row">
        <Carousel {...args}>
          {songs.map((s) => (
            <SongCard key={s} title={s} />
          ))}
        </Carousel>
      </div>
      {/* The rest of the page: enough of it to scroll past the row. */}
      {Array.from({ length: 6 }, (_, i) => (
        <section
          key={i}
          style={{ height: 260, marginTop: 24, borderRadius: 16, border: "1px dashed rgb(0 0 0 / 0.2)", padding: 16 }}
        >
          More of the page, section {i + 1}
        </section>
      ))}
    </Frame>
  ),
  play: async () => {
    const input = realInputOrSkip();
    if (!input) return; // Storybook's UI has no trusted input to give.
    await resize(input, 1280, 700);
    const row = list("Songs");
    window.scrollTo(0, 0);
    /* A no-op listener that is not passive. Without one, Chrome scrolls the
       page first and hit-tests the wheel event afterward, under a pointer
       that is now below the row, so a handler on the row would never see it
       and a hijack would pass. Counting also proves the wheel reached the row. */
    let wheels = 0;
    const count = () => {
      wheels++;
    };
    row.addEventListener("wheel", count, { passive: false });
    await input.commands.realWheel('[data-testid="wheel-row"] ul', 0, 400);
    row.removeEventListener("wheel", count);
    await expect(wheels).toBe(1);
    await expect(row.scrollLeft).toBe(0);
    await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
    // Control: a sideways wheel does move the row.
    await input.commands.realWheel('[data-testid="wheel-row"] ul', 400, 0);
    await waitFor(() => expect(row.scrollLeft).toBeGreaterThan(0));
    window.scrollTo(0, 0);
    await resize(input, 414, 896);
  },
};

function DragStrip() {
  const [log, setLog] = useState<string[]>([]);
  return (
    <Frame width={720}>
      <Carousel aria-label="Picks" itemWidth={240} data-testid="drag-row">
        {songs.map((s) => (
          <button key={s} type="button" style={BUTTON_CARD} onClick={() => setLog((l) => [...l, s])}>
            {s}
          </button>
        ))}
      </Carousel>
      <output data-testid="log">{log.join(", ") || "none"}</output>
    </Frame>
  );
}

/**
 * A mouse drags the row one to one, and on release it settles on the nearest
 * item. The click that ends a drag is dropped; the next click, and Enter on a
 * focused item, go through. The items here are buttons, as in a selection
 * strip, so a drag that selected one would show.
 */
export const MouseDrag: Story = {
  /* Real input and viewport changes: run in their own project, alone. */
  tags: ["real-input"],
  args: { "aria-label": "Picks", children: null },
  render: () => <DragStrip />,
  play: async () => {
    const input = realInputOrSkip();
    const row = list("Picks");
    const log = page.getByTestId("log");
    await expect(getComputedStyle(row).cursor).toBe("grab");
    if (!input) return;
    await resize(input, 1280, 700);

    // Test 2: 300px left, from the middle of the first card.
    await input.commands.realDrag('[data-testid="drag-row"] li:first-child button', -300, { holdMs: 150 });
    await settled(row);
    const lefts = Array.from(row.children).map((c) => Math.round(box(c).left - box(row).left));
    await expect(lefts).toContain(16); // settled on an item's edge
    await expect(row.scrollLeft).toBeGreaterThanOrEqual(252); // at least one item along
    /* The release activated nothing. In Chromium that is the pointer capture's
       doing as much as the dropped click's: the click goes to the row, not the
       item. NothingStaysArmedAfterADrag covers the drop itself. */
    await expect(log).toHaveTextContent("none");

    // ...and the next click does.
    await input.commands.realClick('[data-testid="drag-row"] li:nth-child(3) button');
    await expect(log).toHaveTextContent("Song 3");

    // A mouse click on the card peeking at the edge selects it and leaves the
    // row where it is: only keyboard focus snaps an item into place.
    const at = row.scrollLeft;
    const peeking = Array.from(row.children).find((c) => box(c).right > box(row).right + 1)!;
    const n = Array.prototype.indexOf.call(row.children, peeking) + 1;
    await input.commands.realClick(`[data-testid="drag-row"] li:nth-child(${n}) button`, { fx: 0.1 });
    await expect(log).toHaveTextContent(`Song ${n}`);
    await new Promise((r) => setTimeout(r, 200));
    await expect(row.scrollLeft).toBe(at);

    // Test 3: after a drag, Enter on a focused item activates it.
    await input.commands.realDrag('[data-testid="drag-row"] li:nth-child(4) button', -260, { holdMs: 150 });
    await settled(row);
    const target = row.children[5].querySelector("button")!;
    target.focus();
    await input.userEvent.keyboard("{Enter}");
    await expect(log).toHaveTextContent("Song 6");
    await resize(input, 414, 896);
  },
};

const PICTURE =
  "data:image/svg+xml," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120"><rect width="240" height="120" fill="#c7d2fe"/></svg>');

/**
 * A row of linked pictures drags like any other. Without its guard, pressing
 * on an image inside a link starts the browser's own drag of the link, whose
 * ghost replaces the row's drag and leaves it where it was.
 */
export const DragFromALinkedImage: Story = {
  tags: ["real-input"],
  args: { "aria-label": "Pictures", children: null },
  render: () => (
    <Frame width={720}>
      <Carousel aria-label="Pictures" itemWidth={240} data-testid="picture-row">
        {songs.map((s) => (
          <a key={s} href={`#${s}`} onClick={(e) => e.preventDefault()} style={{ display: "block" }}>
            <img src={PICTURE} alt={s} width={240} height={120} style={{ display: "block" }} />
          </a>
        ))}
      </Carousel>
    </Frame>
  ),
  play: async () => {
    const input = realInputOrSkip();
    if (!input) return;
    await resize(input, 1280, 700);
    const row = list("Pictures");
    await input.commands.realDrag('[data-testid="picture-row"] li:first-child img', -300, { holdMs: 150 });
    await settled(row);
    await expect(row.scrollLeft).toBeGreaterThanOrEqual(252);
    await resize(input, 414, 896);
  },
};

/**
 * Touch and pen scroll the row natively, with the system's momentum, and no
 * script drag runs for them. Control: the same press and move from a mouse
 * does start one.
 */
export const TouchUsesNativeScrolling: Story = {
  /* Also run with reduced motion on: the settle after a drag is instant there. */
  tags: ["reduced-motion"],
  args: { "aria-label": "Songs", itemWidth: 240, children: null },
  render: (args) => (
    <Frame width={720}>
      <Carousel {...args}>
        {songs.map((s) => (
          <SongCard key={s} title={s} />
        ))}
      </Carousel>
    </Frame>
  ),
  play: async () => {
    const row = list("Songs");
    await waitFor(() => expect(row).toHaveAttribute("data-overflowing"));
    const send = (type: string, pointerType: string, x: number) =>
      row.dispatchEvent(
        new PointerEvent(type, { bubbles: true, pointerId: 9, pointerType, isPrimary: true, button: 0, clientX: x, clientY: 50 }),
      );
    // Test 11.
    send("pointerdown", "touch", 400);
    send("pointermove", "touch", 300);
    await expect(row).not.toHaveAttribute("data-dragging");
    await expect(row.scrollLeft).toBe(0);
    send("pointerup", "touch", 300);
    // Control: a mouse does drag, one to one, with snapping off meanwhile.
    send("pointerdown", "mouse", 400);
    send("pointermove", "mouse", 300);
    await expect(row).toHaveAttribute("data-dragging");
    await expect(row.scrollLeft).toBe(100);
    send("pointerup", "mouse", 300);
    // Released at 100, it settles on the nearest item, the first (0, not 252).
    if (reduced()) {
      await frame();
      await expect(row.scrollLeft).toBe(0);
    }
    await settled(row);
    await expect(row.scrollLeft).toBe(0);
  },
};

/**
 * Only the click a drag ends with is dropped. A drag that ends with no click
 * at all (released off the row, say) leaves nothing armed: Enter on an item
 * right away, and a click a moment later, both go through. Synthetic events,
 * since no native click follows them, which is the case under test.
 */
export const NothingStaysArmedAfterADrag: Story = {
  args: { "aria-label": "Picks", children: null },
  render: () => <DragStrip />,
  play: async () => {
    const row = list("Picks");
    const log = page.getByTestId("log");
    await waitFor(() => expect(row).toHaveAttribute("data-overflowing"));
    const drag = () => {
      for (const [type, x] of [["pointerdown", 400], ["pointermove", 300], ["pointerup", 300]] as const) {
        row.dispatchEvent(
          new PointerEvent(type, { bubbles: true, pointerId: 3, pointerType: "mouse", isPrimary: true, button: 0, clientX: x, clientY: 50 }),
        );
      }
    };
    const first = row.children[0].querySelector("button")!;
    // The click a drag ends with is dropped even where the pointer couldn't be
    // captured (as here: no real pointer), and it would land on an item.
    drag();
    first.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await new Promise((r) => setTimeout(r, 50));
    await expect(log).toHaveTextContent("none");
    await settled(row);
    // A keyboard activation in that same moment goes through.
    drag();
    first.click(); // detail 0, as Enter or Space on a button produces
    await waitFor(() => expect(log).toHaveTextContent("Song 1"));
    await settled(row);
    drag();
    await new Promise((r) => setTimeout(r, 50));
    row.children[1].querySelector("button")!.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await waitFor(() => expect(log).toHaveTextContent("Song 2"));
    await settled(row);
  },
};

/**
 * Under reduced motion every scroll the component makes is instant: an arrow
 * lands within one frame. With motion, the same arrow glides there.
 */
export const ReducedMotion: Story = {
  tags: ["reduced-motion"],
  args: { "aria-label": "Songs", itemWidth: 240, children: null },
  render: (args) => (
    <Frame width={720}>
      <Carousel {...args} arrows="always">
        {songs.map((s) => (
          <SongCard key={s} title={s} />
        ))}
      </Carousel>
    </Frame>
  ),
  play: async () => {
    const row = list("Songs");
    const next = await page.findByRole("button", { name: "Next Songs" });
    await userEvent.click(next);
    await frame();
    if (reduced()) {
      // Test 5.
      await expect(row.scrollLeft).toBe(504);
    } else {
      await expect(row.scrollLeft).toBeLessThan(504);
      await settled(row);
      await expect(row.scrollLeft).toBe(504);
    }
  },
};

/**
 * Tabbing onto an item snaps it into place at once, its edge on the gutter.
 * Items stay in the normal tab order; Left and Right keep their native
 * behavior.
 */
export const KeyboardFocus: Story = {
  args: { "aria-label": "Songs", itemWidth: 240, children: null },
  render: (args) => (
    <Frame width={720}>
      <a href="#before">Before the row</a>
      <Carousel {...args} arrows="none">
        {songs.map((s) => (
          <SongCard key={s} title={s} />
        ))}
      </Carousel>
    </Frame>
  ),
  play: async () => {
    const row = list("Songs");
    page.getByRole("link", { name: "Before the row" }).focus();
    // Test 6: Tab to the fourth item.
    for (let i = 0; i < 4; i++) await userEvent.tab();
    const fourth = row.children[3];
    await expect(fourth.contains(document.activeElement)).toBe(true);
    await expect(box(fourth).left - box(row).left).toBe(16);
    await expect(box(fourth).right).toBeLessThanOrEqual(box(row).right);
  },
};

/**
 * On a 375px phone the next card peeks by 107px. Fixed mode shows a peek once
 * the items outgrow the box; at 3 items of 240px, the row fits exactly at
 * 3 * 240 + 2 * 12 + 2 * 16 = 776px, and from there up there is nothing to
 * peek.
 */
export const PeekOnAPhone: Story = {
  args: { "aria-label": "Songs", itemWidth: 240, children: null },
  render: (args) => (
    <div style={{ display: "grid", gap: 24 }}>
      <Frame width={375}>
        <Carousel {...args}>
          {songs.map((s) => (
            <SongCard key={s} title={s} />
          ))}
        </Carousel>
      </Frame>
      <Frame width={776}>
        <Carousel aria-label="Three that fit" itemWidth={240} arrows="always">
          {songs.slice(0, 3).map((s) => (
            <SongCard key={s} title={s} />
          ))}
        </Carousel>
      </Frame>
    </div>
  ),
  play: async () => {
    const row = list("Songs");
    // Test 7: at least 24px of the next item shows.
    const peek = box(row).right - box(row.children[1]).left;
    await expect(peek).toBeGreaterThanOrEqual(24);
    await expect(Math.round(peek)).toBe(107);
    // R3: by default the arrows show only where a pointer can hover.
    const next = await page.findByRole("button", { name: "Next Songs" });
    await expect(next.className).toContain("[@media(any-hover:hover)]:inline-flex");
    // Shown here, in a browser whose pointer can hover; `none` where none can.
    const hover = window.matchMedia("(any-hover: hover)").matches;
    if (hover) await expect(getComputedStyle(next).display).not.toBe("none");
    else await expect(getComputedStyle(next).display).toBe("none");
    const fits = list("Three that fit");
    await expect(fits.scrollWidth).toBe(fits.clientWidth);
    await expect(page.queryByRole("button", { name: /Three that fit/ })).toBeNull();
  },
};

/**
 * Fluid mode: say how many items are in view at each width and the component
 * sizes them. `1.3` is one item and a third of the next; from `md` up it is
 * two and a half. The fraction is the peek.
 */
export const FluidPerView: Story = {
  /* Real input and viewport changes: run in their own project, alone. */
  tags: ["real-input"],
  args: { "aria-label": "Highlights", perView: { base: 1.3, md: 2.5 }, children: null },
  render: (args) => (
    <Frame width={375}>
      <Carousel {...args}>
        {songs.map((s) => (
          <SongCard key={s} title={s} />
        ))}
      </Carousel>
    </Frame>
  ),
  play: async () => {
    const input = realInputOrSkip();
    const row = list("Highlights");
    const width = () => box(row.children[0]).width;
    if (input) await resize(input, 414, 896);
    // (375 - 2 * 16 + 16 - 12) / 1.3 = 266.92: one item and 0.3 of the next.
    await waitFor(() => expect(width()).toBeCloseTo(266.92, 0));
    const peek = box(row).right - box(row.children[1]).left;
    await expect(peek).toBeCloseTo(0.3 * width(), 0);
    if (!input) return;
    await resize(input, 1024, 800);
    // (375 - 32 + 16 - 2 * 12) / 2.5 = 134: two items and half a third.
    await waitFor(() => expect(width()).toBeCloseTo(134, 0));
    await resize(input, 414, 896);
  },
};

/**
 * Twelve selection-strip buttons of 208px with a 10px gap in an 1100px
 * frame, with the arrows over the row's ends and the edge fade on. The fade
 * shows only on a side with more to see, so at the end the last item is
 * never faded. Four items that fit render no arrows at all.
 */
export const SelectionStripOverlay: Story = {
  args: { "aria-label": "Featured", children: null },
  render: function Render() {
    const [chosen, setChosen] = useState(0);
    const [edges, setEdges] = useState("");
    const ref = useRef<CarouselHandle>(null);
    const items = Array.from({ length: 12 }, (_, i) => `Game ${i + 1}`);
    return (
      <div style={{ display: "grid", gap: 24 }}>
        <Frame width={1100}>
          <p data-testid="chosen">Featured: {items[chosen]}</p>
          <p data-testid="edges">{edges}</p>
          <Carousel
            ref={ref}
            aria-label="Featured"
            itemWidth={208}
            gap={10}
            arrowPlacement="overlay"
            arrows="always"
            fade
            prevLabel="Previous games"
            nextLabel="Next games"
            nextIcon={<span data-testid="next-icon">{"\u2192"}</span>}
            onScrollStateChange={(s) => setEdges(`${s.canScrollPrev ? "back" : "start"}/${s.canScrollNext ? "on" : "end"}`)}
          >
            {items.map((title, i) => (
              <button
                key={title}
                type="button"
                aria-pressed={chosen === i}
                style={BUTTON_CARD}
                onClick={() => {
                  setChosen(i);
                  ref.current?.scrollToIndex(0);
                }}
              >
                {title}
              </button>
            ))}
          </Carousel>
        </Frame>
        <Frame width={1100}>
          <Carousel aria-label="Four that fit" itemWidth={208} gap={10} arrowPlacement="overlay" arrows="always" fade>
            {items.slice(0, 4).map((title) => (
              <button key={title} type="button" style={BUTTON_CARD}>
                {title}
              </button>
            ))}
          </Carousel>
        </Frame>
      </div>
    );
  },
  play: async () => {
    const row = list("Featured");
    // Named by the consumer, with the consumer's icon in place of the chevron.
    const next = await page.findByRole("button", { name: "Next games" });
    /* Hidden at the start (it is over the row). A hidden element has no
       accessible name to query by, so it is found by its label. */
    const prev = document.querySelector<HTMLButtonElement>('[aria-label="Previous games"]')!;
    await expect(prev).toBeDisabled();
    await expect(next).toContainElement(page.getByTestId("next-icon"));
    await waitFor(() => expect(page.getByTestId("edges")).toHaveTextContent("start/on"));
    // R4: faded only on the side with more.
    await waitFor(() => expect(row.style.maskImage).toContain("transparent"));
    await expect(row.style.maskImage.startsWith("linear-gradient(to right, black")).toBe(true);
    // Over the row, the disabled arrow at the start is hidden, not just quiet.
    await expect(getComputedStyle(prev).visibility).toBe("hidden");
    await expect(getComputedStyle(next).visibility).toBe("visible");
    // R14: overlay arrows take no space.
    const wrapper = row.parentElement!;
    await expect(box(wrapper).height).toBe(box(row).height);
    // At the end: next disabled, and no fade over the last item.
    for (let i = 0; i < 6 && !(next as HTMLButtonElement).disabled; i++) {
      await userEvent.click(next);
      await settled(row);
    }
    await expect(next).toBeDisabled();
    await expect(row.style.maskImage.endsWith("black)")).toBe(true);
    await waitFor(() => expect(page.getByTestId("edges")).toHaveTextContent("back/end"));
    // R11, R13: choosing an item resets the row to the start, through the ref.
    await userEvent.click(page.getByRole("button", { name: "Game 11" }));
    await expect(page.getByTestId("chosen")).toHaveTextContent("Game 11");
    await settled(row);
    await expect(row.scrollLeft).toBe(0);
    // Test 10: four that fit, no arrows.
    await expect(page.queryByRole("button", { name: /Four that fit/ })).toBeNull();
    await expect(list("Four that fit")).not.toHaveAttribute("data-overflowing");
  },
};

/**
 * A gallery of one per view, one at a time, with its position as text and in
 * each item's name. The readout is a polite live region, so a move is
 * announced and the first render is not.
 */
export const Gallery: Story = {
  tags: ["reduced-motion"],
  args: { "aria-label": "Photos", children: null },
  render: (args) => (
    <Frame width={375}>
      <Carousel {...args} perView={1} oneAtATime showPosition arrows="always">
        {["Moon", "Stage", "Crowd", "Encore", "Street"].map((p) => (
          <div key={p} style={{ ...CARD, height: 220 }}>
            {p}
          </div>
        ))}
      </Carousel>
      <Carousel aria-label="One photo" perView={1}>
        <div style={{ ...CARD, height: 80 }}>Only</div>
      </Carousel>
    </Frame>
  ),
  play: async () => {
    const row = list("Photos");
    const readout = await page.findByText("1 of 5");
    await expect(readout).toHaveAttribute("aria-live", "polite");
    await expect(row.children[1]).toHaveAttribute("aria-label", "2 of 5");
    await expect(getComputedStyle(row.children[0]).scrollSnapStop).toBe("always");
    // One per view: the item is the row's width between the gutters.
    await expect(box(row.children[0]).width).toBe(375 - 32);
    // Nothing in a gallery can take focus, so the list itself is the tab stop.
    await expect(row).toHaveAttribute("tabindex", "0");
    // A row with nowhere to scroll is not a tab stop at all.
    await expect(list("One photo")).not.toHaveAttribute("tabindex");
    await userEvent.click(page.getByRole("button", { name: "Next Photos" }));
    await settled(row);
    await waitFor(() => expect(readout).toHaveTextContent("2 of 5"));
    // R8: and nothing moves on its own.
    const at = row.scrollLeft;
    await new Promise((r) => setTimeout(r, 800));
    await expect(row.scrollLeft).toBe(at);
  },
};

/**
 * The arrows in a heading line beside "See all", through `renderArrows`. The
 * row is named by the heading.
 */
export const ArrowsInAHeadingLine: Story = {
  args: { children: null },
  render: () => (
    <Frame width={720}>
      <Carousel
        aria-labelledby="songs-heading"
        itemWidth={240}
        arrows="always"
        renderArrows={({ prev, next }) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <h2 id="songs-heading" style={{ margin: 0, marginInlineEnd: "auto", fontSize: 18 }}>
              Songs
            </h2>
            <a href="#all">See all</a>
            {prev}
            {next}
          </div>
        )}
      >
        {songs.map((s) => (
          <SongCard key={s} title={s} />
        ))}
      </Carousel>
    </Frame>
  ),
  play: async () => {
    const row = list("Songs");
    await expect(row).toHaveAttribute("aria-labelledby", "songs-heading");
    // Named from the heading's text.
    const next = await page.findByRole("button", { name: "Next Songs" });
    const heading = page.getByRole("heading", { name: "Songs" });
    await expect(Math.abs(box(next).top + box(next).height / 2 - (box(heading).top + box(heading).height / 2))).toBeLessThan(4);
    // Above the row, never over it.
    await expect(box(next).bottom).toBeLessThanOrEqual(box(row).top);
  },
};

/**
 * A full-bleed row on a 320px page: pulled out by one gutter so it runs to
 * the edges, with the first item still on the text's line, and the page
 * itself never scrolls sideways.
 */
export const FullBleedOnASmallPhone: Story = {
  /* Real input and viewport changes: run in their own project, alone. */
  tags: ["real-input"],
  args: { "aria-label": "Coming up", children: null },
  render: () => (
    <div style={{ paddingInline: 16 }}>
      <p data-testid="text-line">Coming up</p>
      <Carousel aria-label="Coming up" itemWidth={240} bleed>
        {songs.map((s) => (
          <SongCard key={s} title={s} />
        ))}
      </Carousel>
    </div>
  ),
  play: async () => {
    const input = realInputOrSkip();
    if (input) await resize(input, 320, 700);
    const row = list("Coming up");
    // The first item lines up with the text above it.
    await waitFor(() =>
      expect(Math.round(box(row.children[0]).left)).toBe(Math.round(box(page.getByTestId("text-line")).left)),
    );
    if (!input) return;
    // Test 8.
    const root = document.documentElement;
    await expect(root.scrollWidth).toBe(root.clientWidth);
    await resize(input, 414, 896);
  },
};
