import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Sheet, type SheetProps } from "./Sheet";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";
import { Textarea } from "../../atoms/Textarea/Textarea";
import { Toaster } from "../../molecules/Toast/Toaster";
import { toast } from "../../molecules/Toast/toast-api";
import { PageRegions } from "../../../test/PageRegions";

const meta = {
  title: "Organisms/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "A panel that comes up from the bottom of the screen, for detail that should not take the reader off the page. Full width on a phone; from 768px it centers at `maxWidth` (560px by default) and stays anchored to the bottom.",
          "",
          "**Three parts, one scroller.** A drag handle, a header (the title, an optional `actions` slot, and a close button), then the content. Only the content scrolls. The header is its sibling rather than sticky inside it, so it can never cover the element that has focus.",
          "",
          "**Dismissing.** Escape, a backdrop click, the close button, or a drag down from the handle or the header. Drags never start in the content, so reading never turns into dismissing. A drag closes past 30% of the sheet's height, or on a downward flick of at least 0.5 px/ms over 16px; an upward flick never closes; 8px of movement or less is a tap. A mouse drags from the handle only, so the title stays selectable. The close button is always there: it is the way out for anyone who can not drag.",
          "",
          "**Focus.** Trapped while open, and everything else on the page is `inert`. It lands on the close button, or on `initialFocus`. On close it returns to whatever opened the sheet, or to `returnFocus`, which is what a sheet opened from a deep link needs, since it has no opener. When `title` (or `contentKey`) changes while open, focus moves to the new title so a screen reader announces it, and nothing animates in again.",
          "",
          "**After closing.** `onAfterClose` runs once the leave transition has finished. Clear the sheet's content there, not in `onClose`, or it slides out empty.",
          "",
          "**Motion.** Slides up over about 280ms and leaves in about 200ms, set by `--roster-sheet-enter-duration`, `--roster-sheet-leave-duration` and the two matching easings. Under `prefers-reduced-motion` it fades for `--roster-sheet-fade-duration` (150ms) instead, with no slide and no spring back after a canceled drag.",
          "",
          "**Theming.** The surface is `Dialog`'s default: `--roster-popover-bg`, `-border` and `-text`, with `--roster-elevation-overlay`. The backdrop is `--roster-sheet-backdrop`, set in both `:root` and `.dark`. The sheet is portaled, and still follows a `.dark` scoped to part of the page; to find out, it renders an empty `<span hidden>` where you place it.",
          "",
          "**Two caveats.** The scroll lock pads `<html>` for the scrollbar it hides, and a fixed element elsewhere on the page may still shift by that width. The bottom padding includes `env(safe-area-inset-bottom)`, which is 0 unless the page's viewport meta sets `viewport-fit=cover`.",
          "",
          "```tsx",
          "<Sheet isOpen={open} onClose={close} onAfterClose={clear} title={item.name}>",
          "  <ItemDetail item={item} />",
          "</Sheet>",
          "```",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    isOpen: { control: false },
    onClose: { control: false },
    title: { control: "text" },
    description: { control: "text" },
    hideTitle: { control: "boolean" },
    busy: { control: "boolean" },
    dragToDismiss: { control: "boolean" },
    maxWidth: { control: "number" },
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

const PARAGRAPHS = [
  "The first paragraph sets out what this item is and why it is here. It is long enough to wrap on a phone and short enough to read at a glance.",
  "A second paragraph adds context. Sheets are for detail that belongs to the page underneath, so the reader can close this and carry on where they were.",
  "A third paragraph, because real content runs longer than a demo. Only this region scrolls; the handle and the header stay put above it.",
];

function Body({ count = 1 }: { count?: number }) {
  return (
    <div className="rst:flex rst:flex-col rst:gap-3 rst:text-sm">
      {Array.from({ length: count }, (_, i) => (
        <p key={i}>{PARAGRAPHS[i % PARAGRAPHS.length]}</p>
      ))}
    </div>
  );
}

/** Opens the sheet from a button, the way a page would. */
function Demo({
  children = <Body />,
  label = "Open sheet",
  ...props
}: Partial<Omit<SheetProps, "isOpen" | "onClose">> & { label?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>
      <Sheet title="Details" {...props} isOpen={open} onClose={() => setOpen(false)}>
        {children}
      </Sheet>
    </>
  );
}

const page = within(document.body);

async function openSheet(canvasElement: HTMLElement, label = "Open sheet") {
  await userEvent.click(within(canvasElement).getByRole("button", { name: label }));
  const dialog = await page.findByRole("dialog");
  const panel = page.getByTestId("sheet-panel");
  // Wait for the enter transition to finish, so measurements are of the resting sheet.
  await waitFor(() => expect(panel).not.toHaveAttribute("data-enter"));
  return { dialog, panel };
}

/**
 * Pointer events with real coordinates, as a finger would send them.
 *
 * `pauseBeforeUp` holds still before lifting. Events dispatched back to back
 * are microseconds apart, which reads as a flick at hundreds of px/ms, so a
 * slow drag has to actually be slow.
 */
async function dispatchDrag(
  target: Element,
  path: Array<[number, number]>,
  { pointerType = "touch", pauseBeforeUp = 0 } = {},
) {
  const send = (type: string, x: number, y: number) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        pointerType,
        isPrimary: true,
        button: 0,
        clientX: x,
        clientY: y,
      }),
    );
  const [x0, y0] = path[0];
  send("pointerdown", x0, y0);
  for (const [x, y] of path.slice(1)) send("pointermove", x, y);
  if (pauseBeforeUp) await new Promise((r) => setTimeout(r, pauseBeforeUp));
  const [xn, yn] = path[path.length - 1];
  send("pointerup", xn, yn);
}

export const Default: Story = {
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: (args) => (
    <Demo title={args.title} description={args.description} hideTitle={args.hideTitle} busy={args.busy} dragToDismiss={args.dragToDismiss} maxWidth={args.maxWidth} />
  ),
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole("button", { name: "Open sheet" });
    const { dialog } = await openSheet(canvasElement);

    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).toHaveAccessibleName("Details");
    /* The page behind is inert, the opener included: a real attribute in a
       real browser. */
    await waitFor(() => expect(opener.closest("[inert]")).not.toBeNull());
    await expect(dialog.closest("[inert]")).toBeNull();
    await waitFor(() => expect(page.getByRole("button", { name: "Close" })).toHaveFocus());

    const close = page.getByRole("button", { name: "Close" }).getBoundingClientRect();
    await expect(Math.round(close.width)).toBe(44);
    await expect(Math.round(close.height)).toBe(44);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(opener).toHaveFocus();
    await expect(opener.closest("[inert]")).toBeNull();
  },
};

/**
 * Drag the handle or the header down. The content never starts a drag.
 */
export const DragToDismiss: Story = {
  /* Also run under reduced motion: the spring back becomes a snap, and a
     closing drag fades from where the finger let go. */
  tags: ["reduced-motion"],
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const { panel } = await openSheet(canvasElement);
    const height = panel.getBoundingClientRect().height;
    const handle = page.getByTestId("sheet-handle").getBoundingClientRect();
    const x = handle.left + handle.width / 2;
    const y = handle.top + handle.height / 2;

    // From the content: nothing, however far or fast.
    const text = page.getByText(PARAGRAPHS[0]);
    const t = text.getBoundingClientRect();
    await dispatchDrag(text, [[t.left + 10, t.top + 5], [t.left + 10, t.top + 25], [t.left + 10, t.top + 400]]);
    await expect(page.getByRole("dialog")).toBeInTheDocument();
    await expect(panel).not.toHaveAttribute("data-leave");

    // A short, slow pull on the handle springs back.
    const handleEl = page.getByTestId("sheet-handle");
    await dispatchDrag(handleEl, [[x, y], [x, y + 20], [x, y + height * 0.2]], { pauseBeforeUp: 150 });
    await expect(panel).not.toHaveAttribute("data-leave");
    await expect(panel.style.getPropertyValue("--rst-sheet-drag")).toBe("0px");

    // Sideways first: a swipe for something else, not a dismiss.
    await dispatchDrag(handleEl, [[x, y], [x + 12, y + 6], [x + 40, y + height * 0.6]], { pauseBeforeUp: 150 });
    await expect(panel).not.toHaveAttribute("data-leave");

    // Past 30%, slowly, closes.
    await dispatchDrag(handleEl, [[x, y], [x, y + 20], [x, y + height * 0.4]], { pauseBeforeUp: 150 });
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

/**
 * Closed by a drag and opened again before it has finished leaving: it opens
 * at its resting place, not where the drag let go.
 */
export const ReopenWhileLeaving: Story = {
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole("button", { name: "Open sheet" });
    const { panel } = await openSheet(canvasElement);
    const handle = page.getByTestId("sheet-handle");
    const r = handle.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const height = panel.getBoundingClientRect().height;
    await dispatchDrag(handle, [[x, y], [x, y + 20], [x, y + height * 0.5]], { pauseBeforeUp: 150 });
    await waitFor(() => expect(panel).toHaveAttribute("data-leave"));
    // Past the frame the drag's own cleanup waits for, well inside the leave.
    await new Promise((r) => setTimeout(r, 60));
    await userEvent.click(opener);
    await expect(page.getByTestId("sheet-panel")).toBe(panel);
    await expect(panel.style.getPropertyValue("--rst-sheet-drag")).toBe("0px");
  },
};

/**
 * A quick downward flick closes the sheet even when it barely moved it.
 */
export const FlickToDismiss: Story = {
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    await openSheet(canvasElement);
    const handle = page.getByTestId("sheet-handle");
    const r = handle.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    // 24px in no time at all: well past 0.5 px/ms and 16px.
    await dispatchDrag(handle, [[x, y], [x, y + 12], [x, y + 24]]);
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

/**
 * Long content scrolls inside the sheet. The handle and the header do not.
 */
export const LongContent: Story = {
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: () => (
    <Demo>
      <Body count={24} />
    </Demo>
  ),
  play: async ({ canvasElement }) => {
    const { panel } = await openSheet(canvasElement);
    const content = page.getByTestId("sheet-content");
    await expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    // At most 92% of the viewport tall.
    await expect(panel.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight * 0.92 + 1);

    const header = page.getByRole("heading", { name: "Details" });
    const before = header.getBoundingClientRect().top;
    content.scrollTop = content.scrollHeight;
    await expect(header.getBoundingClientRect().top).toBe(before);
    await expect(content).not.toContainElement(header);
  },
};

/**
 * `actions` sits in the header, before the close button: previous and next,
 * here. Changing `title` while open swaps the content in place: nothing
 * animates, and focus moves to the new title so a screen reader announces it.
 */
export const HeaderActionsAndContentSwap: Story = {
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const items = ["First item", "Second item", "Third item"];
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open sheet</Button>
        <Sheet
          isOpen={open}
          onClose={() => setOpen(false)}
          title={items[index]}
          actions={
            <>
              <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="ghost" disabled={index === items.length - 1} onClick={() => setIndex((i) => i + 1)}>
                Next
              </Button>
            </>
          }
        >
          <p className="rst:text-sm">This is the body of the {items[index].toLowerCase()}.</p>
        </Sheet>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole("button", { name: "Open sheet" });
    const { panel } = await openSheet(canvasElement);
    /* The actions come before the close button in the DOM, and focus still
       lands on Close, not on the first control it finds. */
    await waitFor(() => expect(page.getByRole("button", { name: "Close" })).toHaveFocus());

    /* The header's geometry: the grip near the sheet's top edge, and the
       title and the actions on the close button's center line. */
    const top = panel.getBoundingClientRect().top;
    const middle = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    };
    const grip = page.getByTestId("sheet-handle").firstElementChild!.getBoundingClientRect();
    await expect(grip.top - top).toBeLessThanOrEqual(12);
    const close = middle(page.getByRole("button", { name: "Close" }));
    await expect(Math.abs(middle(page.getByRole("heading", { level: 2 })) - close)).toBeLessThanOrEqual(1);
    await expect(Math.abs(middle(page.getByRole("button", { name: "Next" })) - close)).toBeLessThanOrEqual(1);
    // And the header sits close under the grip, not a whole strip below it.
    await expect(page.getByRole("heading", { level: 2 }).getBoundingClientRect().top - grip.bottom).toBeLessThanOrEqual(32);

    await userEvent.click(page.getByRole("button", { name: "Next" }));
    const title = page.getByRole("heading", { name: "Second item" });
    await expect(title).toHaveFocus();
    await expect(page.getByTestId("sheet-panel")).toBe(panel);
    await expect(panel).not.toHaveAttribute("data-enter");
    await expect(page.getByRole("dialog")).toHaveAccessibleName("Second item");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(opener).toHaveFocus();
  },
};

/**
 * `hideTitle` hides the heading visually. It is still the sheet's name.
 */
export const HiddenTitle: Story = {
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: () => (
    <Demo title="Photo" hideTitle>
      {/* Inline, because every class a story uses ships in Roster's stylesheet. */}
      <div className="rst:w-full rst:rounded-lg rst:bg-gray-200 rst:dark:bg-gray-700" style={{ aspectRatio: "16 / 9" }} />
    </Demo>
  ),
  play: async ({ canvasElement }) => {
    const { dialog } = await openSheet(canvasElement);
    await expect(dialog).toHaveAccessibleName("Photo");
  },
};

/**
 * A title can carry markup, a date in a `<time>` here. The sheet is named by
 * its text, and the heading keeps the title's look.
 */
export const NodeTitle: Story = {
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: () => (
    <Demo
      title={
        <>
          Night of <time dateTime="2026-10-02" style={{ fontStyle: "italic" }}>2 Oct</time>
        </>
      }
    >
      <p>What the sky did that night.</p>
    </Demo>
  ),
  play: async ({ canvasElement }) => {
    const { dialog } = await openSheet(canvasElement);
    await expect(dialog).toHaveAccessibleName("Night of 2 Oct");
    const heading = within(dialog).getByRole("heading", { level: 2, name: "Night of 2 Oct" });
    await expect(heading.querySelector("time")).toHaveAttribute("dateTime", "2026-10-02");
  },
};

/**
 * `busy` marks the content `aria-busy` while it loads. The header shows at
 * once, with whatever title is already known.
 */
export const Busy: Story = {
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [loaded, setLoaded] = useState(false);
    return (
      <>
        <Button
          onClick={() => {
            setLoaded(false);
            setOpen(true);
            setTimeout(() => setLoaded(true), 1500);
          }}
        >
          Open sheet
        </Button>
        <Sheet isOpen={open} onClose={() => setOpen(false)} title="Details" busy={!loaded}>
          {loaded ? <Body /> : <p className="rst:text-sm rst:opacity-75">Loading…</p>}
        </Sheet>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    await openSheet(canvasElement);
    await expect(page.getByTestId("sheet-content")).toHaveAttribute("aria-busy", "true");
    await waitFor(() => expect(page.getByTestId("sheet-content")).not.toHaveAttribute("aria-busy"), {
      timeout: 3000,
    });
  },
};

/**
 * A form inside. `initialFocus` puts the caret in the first field. When the
 * on-screen keyboard shrinks the visual viewport, the sheet's height follows
 * it, so the field stays in view; `dvh` does not shrink for the iOS keyboard.
 */
export const FieldInside: Story = {
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: function Render() {
    const [open, setOpen] = useState(false);
    const field = useRef<HTMLInputElement>(null);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open sheet</Button>
        <Sheet
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Add a note"
          description="Notes are visible only to you."
          initialFocus={field}
        >
          <div className="rst:flex rst:flex-col rst:gap-3">
            <Input ref={field} label="Title" placeholder="A short title" />
            <Textarea label="Note" rows={4} />
            <div className="rst:flex rst:justify-end">
              <Button onClick={() => setOpen(false)}>Save</Button>
            </div>
          </div>
        </Sheet>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const { dialog } = await openSheet(canvasElement);
    await expect(dialog).toHaveAccessibleDescription("Notes are visible only to you.");
    await waitFor(() => expect(page.getByRole("textbox", { name: "Title" })).toHaveFocus());
  },
};

/**
 * Follows `.dark` on the page, like every Roster surface. The story puts
 * `.dark` on `<html>` only while its sheet is open, and takes it off when the
 * sheet closes or the story goes away, so it never darkens the docs page or
 * the stories around it.
 */
function DarkPageDemo() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.add("dark");
    return () => {
      if (!hadDark) root.classList.remove("dark");
    };
  }, [open]);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <Sheet isOpen={open} onClose={() => setOpen(false)} title="Details">
        <Body />
      </Sheet>
    </>
  );
}

export const Dark: Story = {
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: () => <DarkPageDemo />,
  play: async ({ canvasElement }) => {
    await expect(document.documentElement).not.toHaveClass("dark");
    const { panel } = await openSheet(canvasElement);
    await expect(document.documentElement).toHaveClass("dark");
    await expect(getComputedStyle(panel).backgroundColor).toBe("rgb(41, 37, 36)");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    // Put back as it was found, for whatever renders next.
    await expect(document.documentElement).not.toHaveClass("dark");
  },
};

/**
 * `.dark` on part of the page only. The sheet is portaled to `<body>`, outside
 * that subtree, and still renders dark.
 */
export const ScopedDark: Story = {
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: () => (
    <div className="dark rst:rounded-xl rst:bg-gray-950 rst:p-8">
      <Demo />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { dialog, panel } = await openSheet(canvasElement);
    await expect(document.documentElement).not.toHaveClass("dark");
    await expect(dialog).toHaveClass("dark");
    // gray-800, the dark `--roster-popover-bg`.
    await expect(getComputedStyle(panel).backgroundColor).toBe("rgb(41, 37, 36)");
  },
};

/**
 * Under `prefers-reduced-motion` the sheet fades for 150ms, with no slide and
 * no spring after a canceled drag. Turn on "Emulate CSS prefers-reduced-motion"
 * in your browser's rendering tools to see it. The play function checks
 * whichever mode the browser is in, and the test run includes a second pass
 * with reduced motion on.
 */
export const ReducedMotion: Story = {
  tags: ["reduced-motion"],
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const { panel } = await openSheet(canvasElement);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const style = getComputedStyle(panel);
    if (reduced) {
      await expect(style.transitionProperty).toBe("opacity");
      await expect(style.transitionDuration).toBe("0.15s");
    } else {
      await expect(style.transitionProperty).toContain("translate");
      await expect(style.transitionDuration).toBe("0.28s");
    }
  },
};

/**
 * A page laid out as a header, a main and a footer, all children of `<body>`,
 * with the toast host inside the main. While the sheet is open, all three are
 * inert and hidden from a screen reader, and a toast fired from the sheet is
 * still announced. On close, each gets back exactly what it had.
 */
export const PageAroundIsInert: Story = {
  /* Kept off the docs page: it renders into `<body>`, so there it would land
     below everything else. */
  tags: ["!autodocs"],
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <PageRegions>
        <Toaster />
        <Button onClick={() => setOpen(true)}>Open sheet</Button>
        <Sheet isOpen={open} onClose={() => setOpen(false)} title="Details">
          <Button onClick={() => toast.error("Could not save")}>Save</Button>
        </Sheet>
      </PageRegions>
    );
  },
  play: async () => {
    const header = page.getByTestId("page-header");
    const main = page.getByTestId("page-main");
    const footer = page.getByTestId("page-footer");
    const hidden = "[inert], [aria-hidden='true']";

    await userEvent.click(page.getByRole("button", { name: "Open sheet" }));
    const dialog = await page.findByRole("dialog");
    await waitFor(() => expect(main).toHaveAttribute("inert"));
    for (const region of [header, footer]) {
      await expect(region).toHaveAttribute("inert");
      await expect(region).toHaveAttribute("aria-hidden", "true");
    }

    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    const failed = await page.findByText("Could not save");
    await expect(failed.closest(hidden)).toBeNull();
    await expect(failed.closest("[aria-live]")).toHaveAttribute("aria-live", "assertive");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(main).not.toHaveAttribute("inert"));
    await expect(header).not.toHaveAttribute("inert");
    await expect(header).toHaveAttribute("aria-hidden", "false");
    await expect(footer).not.toHaveAttribute("inert");
    await expect(footer).not.toHaveAttribute("aria-hidden");
    toast.remove();
  },
  parameters: { controls: { disable: true } },
};

/**
 * A route change unmounts a sheet without closing it. The page around it
 * comes back whole.
 */
export const UnmountedWhileOpen: Story = {
  tags: ["!autodocs"],
  args: { isOpen: false, onClose: () => {}, title: "Details", children: null },
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(true);
    return (
      <PageRegions>
        <Button onClick={() => setOpen(true)}>Open sheet</Button>
        {mounted && (
          <Sheet isOpen={open} onClose={() => setOpen(false)} title="Details">
            <Button onClick={() => setMounted(false)}>Go to another page</Button>
          </Sheet>
        )}
      </PageRegions>
    );
  },
  play: async () => {
    const regions = ["page-header", "page-main", "page-footer"].map((id) => page.getByTestId(id));
    await userEvent.click(page.getByRole("button", { name: "Open sheet" }));
    const dialog = await page.findByRole("dialog");
    await waitFor(() => {
      for (const region of regions) expect(region).toHaveAttribute("inert");
    });

    await userEvent.click(within(dialog).getByRole("button", { name: "Go to another page" }));
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => {
      for (const region of regions) expect(region).not.toHaveAttribute("inert");
    });
    await expect(regions[0]).toHaveAttribute("aria-hidden", "false");
    await expect(regions[1]).not.toHaveAttribute("aria-hidden");
    await expect(regions[2]).not.toHaveAttribute("aria-hidden");
  },
  parameters: { controls: { disable: true } },
};
