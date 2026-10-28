import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Dialog, type DialogProps } from "./Dialog";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * Dialog with none of its newer options set, pinned to 5.16.0's build, in
 * Chromium and WebKit.
 *
 * Five dialogs: white at md; slate at lg marked destructive; primary marked
 * success; glass at sm; and white again on a dark page. Each is opened from
 * the keyboard, read once it has settled open, under a real pointer on its
 * close button, along a real Tab walk inside it, and closed with a real
 * Escape. What's pinned, as SHA-256 digests: the dialog's HTML, and the
 * computed styles of every element in it and of the scrim (colors, borders,
 * corners, type, padding, outline, rings, cursor, opacity, transform,
 * heights). Also pinned: where focus is at each step, and where it lands on
 * close.
 *
 * Pinned the same on macOS and on Linux, where CI runs, so what differs
 * between them for reasons not Dialog's own is left out:
 * - widths and pixel values, which come from the system font;
 * - an outline's width, color and offset when its style is `none`, so it
 *   draws nothing, or `auto`, the browser's own focus ring: that ring is the
 *   platform's color (Chromium's is rgb(0, 95, 204) on macOS and
 *   rgb(16, 16, 16) on Linux). Dialog shows it on itself when nothing inside
 *   asks for focus, and the fixture's plain buttons show it too. The style
 *   stays pinned, so a ring that appears or goes still fails;
 * - the browser's click-focus choice: each dialog is opened with Enter on a
 *   focused opener, so where focus returns is the dialog's doing alone.
 * React's and Headless UI's generated ids are masked too. A mismatch logs
 * everything it read, every Tab step's styles included.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Organisms/Dialog/Unchanged checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Case = { key: string; dark?: boolean } & Pick<DialogProps, "size" | "variant" | "status">;
const CASES: Case[] = [
  { key: "white" },
  { key: "slate", variant: "slate", size: "lg", status: "destructive" },
  { key: "primary", variant: "primary", status: "success" },
  { key: "glass", variant: "glass", size: "sm" },
  { key: "dark", dark: true },
];

/* Fixed-width children, so nothing inside wraps by the system font. */
const ACTION = { width: 140, height: 40, font: "inherit" } as const;

/* Two stories of a few dialogs each, so neither runs near a test's time limit. */
const GROUPS = { light: CASES.slice(0, 3), others: CASES.slice(3) };
type Group = keyof typeof GROUPS;

function Dialogs({ cases }: { cases: Case[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {cases.map((c) => (
        <div key={c.key}>
          <button type="button" data-pin-open={c.key} onClick={() => setOpen(c.key)}>
            Open {c.key}
          </button>
          <Dialog
            isOpen={open === c.key}
            onClose={() => setOpen(null)}
            title="Rename item"
            description="Choose a new name."
            size={c.size}
            variant={c.variant}
            status={c.status}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={ACTION}>
                Cancel
              </button>
              <button type="button" style={ACTION}>
                Save
              </button>
            </div>
          </Dialog>
        </div>
      ))}
    </div>
  );
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
/* Headless UI's portal root, which holds the dialog while it's open and is
   gone once it has closed. */
const root = () => document.querySelector("#headlessui-portal-root");
const html = () =>
  (root()?.innerHTML ?? "")
    .replace(/-?\d+(\.\d+)?px/g, "#px")
    .replace(/[«:_]r[0-9a-z]+[»:_]/g, "ID");

const PROPS = [
  "display", "position", "box-sizing", "color", "background-color",
  "border-top-style", "border-top-width", "border-top-color", "border-bottom-width", "border-bottom-color",
  "border-left-width", "border-right-width", "border-top-left-radius", "border-bottom-right-radius",
  "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-align",
  "padding-top", "padding-right", "padding-bottom", "padding-left", "margin-top", "margin-left",
  "gap", "flex-direction", "justify-content", "align-items", "overflow-x", "overflow-y",
  "outline-style", "outline-width", "outline-color", "outline-offset", "box-shadow",
  "cursor", "opacity", "transform", "visibility", "height", "min-height", "z-index", "inset",
  "backdrop-filter", "transition-property", "transition-duration",
];
/* An element's styles, as pinned: an outline with no style draws nothing,
   and an `auto` one is the browser's own ring, so for both, the width, color
   and offset (the platform's) aren't read. */
const look = (el: Element) => {
  const s = getComputedStyle(el);
  const platform = s.outlineStyle === "none" || s.outlineStyle === "auto";
  return PROPS.map((p) => (platform && p.startsWith("outline-") && p !== "outline-style" ? "-" : s.getPropertyValue(p))).join(";");
};
const styles = () =>
  [...(root()?.querySelectorAll("*") ?? [])]
    .map((el) => `${el.tagName.toLowerCase()} ${look(el)}`)
    .join("\n");

async function digest(text: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return [...bytes.slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const read = async () => `${await digest(html())} ${await digest(styles())}`;

const where = () => {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return "body";
  const inside = el.closest('[role="dialog"]') ? "dialog" : "page";
  return `${inside}: ${el.tagName.toLowerCase()} ${el.getAttribute("aria-label") ?? el.textContent?.trim()}${el.hasAttribute("data-key-focus") ? " (marked)" : ""}`;
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chromium = () => /Chrome/.test(navigator.userAgent);

/* Every transition on the page run to its end, and the styles holding still
   across two reads 100ms apart: a read is of where they land. */
async function still() {
  for (let i = 0; i < 10; i++) {
    const running = document.getAnimations().filter((a) => a.playState === "running");
    if (!running.length) break;
    await Promise.race([Promise.all(running.map((a) => a.finished.catch(() => undefined))), wait(1000)]);
  }
  for (let i = 0, before = ""; i < 20; i++) {
    const now = styles();
    if (now === before) return;
    before = now;
    await wait(100);
  }
}

/* Open: in the page, settled, with focus inside. A positive end state, not
   "nothing animating", which is also true before the entrance starts. */
async function settledOpen() {
  await waitFor(() => expect(dialog()).not.toBeNull());
  await waitFor(() => expect(dialog()!.contains(document.activeElement)).toBe(true));
  await waitFor(() => expect(document.querySelector("#headlessui-portal-root [data-enter], #headlessui-portal-root [data-transition]")).toBeNull());
  await still();
}

type Pinned = { open: Record<string, string>; hovered: Record<string, string>; walk: string[] };

/* Read from 8e8817d, 5.16.0, 27 Oct 2026, with the browser's own focus ring
   left out (above). */
const OLD_BUILD: Record<Group, Record<"chromium" | "webkit", Pinned>> = {
  light: {
    chromium: {
      open: {
        white: "b5f6ea9ea1a10b5f 00a28029b1388d2c",
        slate: "3f317646f90ab967 f9a8957f8d58541d",
        primary: "e9b22ff2e1ace6d2 d40516d716f2cbcc",
      },
      hovered: {
        white: "b5f6ea9ea1a10b5f 73bef63e3b0887dd",
        slate: "3f317646f90ab967 855ab85350bfdd48",
        primary: "e9b22ff2e1ace6d2 64f9320863127b26",
      },
      walk: [
        "white opened: dialog: div Rename itemChoose a new name.CancelSave (marked)",
        "white Tab: dialog: button Close dialog (marked) | 4a3ce78b7d4b010c",
        "white Tab: dialog: button Cancel (marked) | 2f07716822aa99d3",
        "white Tab: dialog: button Save (marked) | 2f07716822aa99d3",
        "white Tab: dialog: button Close dialog (marked) | 4a3ce78b7d4b010c",
        "white closed: page: button Open white (marked)",
        "slate opened: dialog: div Rename itemChoose a new name.CancelSave (marked)",
        "slate Tab: dialog: button Close dialog (marked) | 21c104233e93c607",
        "slate Tab: dialog: button Cancel (marked) | f4e6e6ff5a3c33c3",
        "slate Tab: dialog: button Save (marked) | f4e6e6ff5a3c33c3",
        "slate Tab: dialog: button Close dialog (marked) | 21c104233e93c607",
        "slate closed: page: button Open slate (marked)",
        "primary opened: dialog: div Rename itemChoose a new name.CancelSave (marked)",
        "primary Tab: dialog: button Close dialog (marked) | 401b69cefb5993d9",
        "primary Tab: dialog: button Cancel (marked) | 35505050a5c02e9d",
        "primary Tab: dialog: button Save (marked) | 35505050a5c02e9d",
        "primary Tab: dialog: button Close dialog (marked) | 401b69cefb5993d9",
        "primary closed: page: button Open primary (marked)",
      ],
    },
    webkit: {
      open: {
        white: "4136a7bab7c11e07 ecd8683392a41b25",
        slate: "d9569334454872c5 9193b5753b3c65b5",
        primary: "78de349250ad879a 09b257bf0cc20af9",
      },
      hovered: {
        white: "4136a7bab7c11e07 ecd8683392a41b25",
        slate: "d9569334454872c5 9193b5753b3c65b5",
        primary: "78de349250ad879a 09b257bf0cc20af9",
      },
      walk: [
        "white opened: dialog: div Rename itemChoose a new name.CancelSave (marked)",
        "white Alt+Tab: dialog: button Close dialog (marked) | 4a3ce78b7d4b010c",
        "white Alt+Tab: dialog: button Cancel (marked) | 2f07716822aa99d3",
        "white Alt+Tab: dialog: button Save (marked) | 2f07716822aa99d3",
        "white Alt+Tab: dialog: button Close dialog (marked) | 4a3ce78b7d4b010c",
        "white closed: page: button Open white (marked)",
        "slate opened: dialog: div Rename itemChoose a new name.CancelSave (marked)",
        "slate Alt+Tab: dialog: button Close dialog (marked) | 21c104233e93c607",
        "slate Alt+Tab: dialog: button Cancel (marked) | f4e6e6ff5a3c33c3",
        "slate Alt+Tab: dialog: button Save (marked) | f4e6e6ff5a3c33c3",
        "slate Alt+Tab: dialog: button Close dialog (marked) | 21c104233e93c607",
        "slate closed: page: button Open slate (marked)",
        "primary opened: dialog: div Rename itemChoose a new name.CancelSave (marked)",
        "primary Alt+Tab: dialog: button Close dialog (marked) | 401b69cefb5993d9",
        "primary Alt+Tab: dialog: button Cancel (marked) | 35505050a5c02e9d",
        "primary Alt+Tab: dialog: button Save (marked) | 35505050a5c02e9d",
        "primary Alt+Tab: dialog: button Close dialog (marked) | 401b69cefb5993d9",
        "primary closed: page: button Open primary (marked)",
      ],
    },
  },
  others: {
    chromium: {
      open: {
        glass: "7d45a0dc68ec2dc4 2d057e6fe92361d5",
        dark: "1fa3df5d9fa9294a 1f6ca9a236725705",
      },
      hovered: {
        glass: "7d45a0dc68ec2dc4 0c173f3f97a970ee",
        dark: "1fa3df5d9fa9294a 995c3f403736964d",
      },
      walk: [
        "glass opened: dialog: div Rename itemChoose a new name.CancelSave (marked)",
        "glass Tab: dialog: button Close dialog (marked) | 4a3ce78b7d4b010c",
        "glass Tab: dialog: button Cancel (marked) | 2f07716822aa99d3",
        "glass Tab: dialog: button Save (marked) | 2f07716822aa99d3",
        "glass Tab: dialog: button Close dialog (marked) | 4a3ce78b7d4b010c",
        "glass closed: page: button Open glass (marked)",
        "dark opened: dialog: div Rename itemChoose a new name.CancelSave (marked)",
        "dark Tab: dialog: button Close dialog (marked) | a651c8e9bcf3a41c",
        "dark Tab: dialog: button Cancel (marked) | f4e6e6ff5a3c33c3",
        "dark Tab: dialog: button Save (marked) | f4e6e6ff5a3c33c3",
        "dark Tab: dialog: button Close dialog (marked) | a651c8e9bcf3a41c",
        "dark closed: page: button Open dark (marked)",
      ],
    },
    webkit: {
      open: {
        glass: "3d518bccef9dc16c 6207a523a3e8d4a1",
        dark: "53b0a8206b2fabe1 a9c5357dd62fcf8e",
      },
      hovered: {
        glass: "3d518bccef9dc16c 6207a523a3e8d4a1",
        dark: "53b0a8206b2fabe1 a9c5357dd62fcf8e",
      },
      walk: [
        "glass opened: dialog: div Rename itemChoose a new name.CancelSave (marked)",
        "glass Alt+Tab: dialog: button Close dialog (marked) | 4a3ce78b7d4b010c",
        "glass Alt+Tab: dialog: button Cancel (marked) | 2f07716822aa99d3",
        "glass Alt+Tab: dialog: button Save (marked) | 2f07716822aa99d3",
        "glass Alt+Tab: dialog: button Close dialog (marked) | 4a3ce78b7d4b010c",
        "glass closed: page: button Open glass (marked)",
        "dark opened: dialog: div Rename itemChoose a new name.CancelSave (marked)",
        "dark Alt+Tab: dialog: button Close dialog (marked) | a651c8e9bcf3a41c",
        "dark Alt+Tab: dialog: button Cancel (marked) | f4e6e6ff5a3c33c3",
        "dark Alt+Tab: dialog: button Save (marked) | f4e6e6ff5a3c33c3",
        "dark Alt+Tab: dialog: button Close dialog (marked) | a651c8e9bcf3a41c",
        "dark closed: page: button Open dark (marked)",
      ],
    },
  },
};

async function readEveryCase(group: Group): Promise<Pinned | null> {
  const real = realInputOrSkip();
  if (!real) return null;
  await document.fonts.ready;
  const now: Pinned = { open: {}, hovered: {}, walk: [] };
  const raw: string[] = [];
  const tab = chromium() ? "Tab" : "Alt+Tab";
  try {
    for (const c of GROUPS[group]) {
      document.documentElement.classList.toggle("dark", !!c.dark);
      const opener = document.querySelector<HTMLElement>(`[data-pin-open="${c.key}"]`)!;
      await real.commands.realHover("body", { fx: 0.99, fy: 0.99 });
      opener.focus();
      await real.commands.realPress(["Enter"]);
      await settledOpen();
      now.walk.push(`${c.key} opened: ${where()}`);
      now.open[c.key] = await read();
      raw.push(`${c.key} open html: ${html()}\nstyles:\n${styles()}`);

      /* The pointer on the close button. Hover styles can't be read in WebKit
         here (the dev stylesheet's nested hover media), so there this reads as
         at rest; Chromium's is the hovered one. */
      await real.commands.realHover('[role="dialog"] button[aria-label="Close dialog"]');
      await wait(250);
      await still();
      now.hovered[c.key] = await read();
      await real.commands.realHover("body", { fx: 0.99, fy: 0.99 });
      await still();

      /* Tab around inside: the trap brings it back to the start. */
      for (let i = 0; i < 4; i++) {
        await real.commands.realPress([tab]);
        await wait(150);
        now.walk.push(`${c.key} ${tab === "Tab" ? "Tab" : "Alt+Tab"}: ${where()} | ${await digest(look(document.activeElement!))}`);
        raw.push(`${c.key} step ${i + 1} ${where()}: ${look(document.activeElement!)}`);
      }

      await real.commands.realPress(["Escape"]);
      await waitFor(() => expect(dialog()).toBeNull());
      await still();
      now.walk.push(`${c.key} closed: ${where()}`);
    }
  } finally {
    document.documentElement.classList.remove("dark");
  }

  const engine = chromium() ? "chromium" : "webkit";
  console.info(`DIALOG UNCHANGED ${group} ${engine} ${JSON.stringify(now)}`);
  if (JSON.stringify(now) !== JSON.stringify(OLD_BUILD[group][engine])) console.info(`DIALOG UNCHANGED ${group} ${engine} raw:\n${raw.join("\n")}`);
  return now;
}

export const WithNoNewOptionNothingChanged: Story = {
  tags: ["real-input"],
  render: () => <Dialogs cases={GROUPS.light} />,
  play: async () => {
    const now = await readEveryCase("light");
    if (!now) return;
    await expect(now).toEqual(OLD_BUILD.light[chromium() ? "chromium" : "webkit"]);
  },
};

export const WithNoNewOptionNothingChangedGlassAndDark: Story = {
  tags: ["real-input"],
  render: () => <Dialogs cases={GROUPS.others} />,
  play: async () => {
    const now = await readEveryCase("others");
    if (!now) return;
    await expect(now).toEqual(OLD_BUILD.others[chromium() ? "chromium" : "webkit"]);
  },
};
