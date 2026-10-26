import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { FileUpload, type FileUploadContext } from "./FileUpload";
import { pickFiles, samplePhoto, sizedFile } from "../../../test/sample-files";
import { realInputOrSkip } from "../../../test/real-input";

/**
 * FileUpload with none of its newer options set, pinned to 5.15.0's build, in
 * Chromium and WebKit.
 *
 * Five fields: empty with help text; one holding a file in each state
 * (uploading at 50%, uploaded, failed, turned away) under a field error; one
 * that takes a single file; a disabled one holding a failed file; and the
 * second again in dark. Each is read at rest, while files are dragged over,
 * under a real pointer, along a real keyboard walk, and after a real click on
 * Remove. What's pinned, as SHA-256 digests: each field's HTML, and the
 * computed styles of every element in it (colors, borders, corners, type,
 * padding, outline, rings, cursor, opacity, heights). Also pinned: where focus
 * is at each step, and what the live region said.
 *
 * Widths and pixel values aren't in the digests: they come from the system
 * font, which differs between macOS and Linux, where CI runs. Object URLs and
 * React's ids are masked too. A mismatch logs everything it read.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/FileUpload/Unchanged checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Call = { field: string; file: File; context: FileUploadContext; resolve: (r: string) => void; reject: (e: Error) => void };
const calls: Call[] = [];
const held = (field: string) => (file: File, context: FileUploadContext) =>
  new Promise<string>((resolve, reject) => calls.push({ field, file, context, resolve, reject }));
const call = (field: string, name: string) => calls.find((c) => c.field === field && c.file.name === name)!;

function Disabling() {
  const [disabled, setDisabled] = useState(false);
  return (
    <>
      <FileUpload label="Locked" disabled={disabled} upload={held("disabled")} />
      <button type="button" data-pin-disable="" onClick={() => setDisabled(true)} style={{ display: "none" }}>
        Disable
      </button>
    </>
  );
}

function Fields() {
  return (
    <div style={{ display: "grid", gap: 16, width: 480 }}>
      <button type="button" data-pin-before="">
        Before
      </button>
      <div data-pin="empty">
        <FileUpload label="Photos" helperText="JPEG or PNG." upload={held("empty")} />
      </div>
      <div data-pin="states">
        <FileUpload label="Photos" errorMessage="Add at least one photo." maxSize={1024 * 1024} upload={held("states")} />
      </div>
      <div data-pin="one">
        <FileUpload label="Cover" maxFiles={1} upload={held("one")} />
      </div>
      <div data-pin="disabled">
        <Disabling />
      </div>
      <div data-pin="dark" className="dark" style={{ background: "#0c0a09", padding: 8 }}>
        <FileUpload label="Photos" errorMessage="Add at least one photo." maxSize={1024 * 1024} upload={held("dark")} />
      </div>
    </div>
  );
}

const ROWS = ["empty", "states", "one", "disabled", "dark"] as const;
type Row = (typeof ROWS)[number];
const row = (name: Row) => document.querySelector<HTMLElement>(`[data-pin="${name}"]`)!;
const input = (name: Row) => row(name).querySelector<HTMLInputElement>("input[type=file]")!;
const item = (name: Row, file: string) =>
  [...row(name).querySelectorAll<HTMLElement>("[data-file-item]")].find((li) => li.querySelector("p")?.textContent === file)!;

/* Every pixel value masked (see above), object URLs, and React's ids. */
const html = (name: Row) =>
  row(name)
    .innerHTML.replace(/-?\d+(\.\d+)?px/g, "#px")
    .replace(/blob:[^"]+/g, "blob")
    .replace(/[«:_]r[0-9a-z]+[»:_]/g, "ID");

const PROPS = [
  "display", "position", "box-sizing", "color", "background-color",
  "border-top-style", "border-top-width", "border-top-color", "border-bottom-width", "border-bottom-color",
  "border-left-width", "border-right-width", "border-top-left-radius", "border-bottom-right-radius",
  "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-decoration-line", "text-align",
  "padding-top", "padding-right", "padding-bottom", "padding-left", "margin-top", "margin-bottom",
  "gap", "flex-direction", "flex-grow", "flex-shrink", "justify-content", "align-items", "overflow-x",
  "outline-style", "outline-width", "outline-color", "outline-offset", "box-shadow",
  "cursor", "opacity", "transform", "visibility", "height", "min-height", "object-fit",
  "transition-property", "transition-duration", "animation-name",
];
const styles = (name: Row) =>
  [...row(name).querySelectorAll("*")]
    .map((el) => {
      const s = getComputedStyle(el);
      return `${el.tagName.toLowerCase()} ${PROPS.map((p) => s.getPropertyValue(p)).join(";")}`;
    })
    .join("\n");

async function digest(text: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return [...bytes.slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* A field: its HTML's digest, then its styles'. */
const read = async (names: readonly Row[] = ROWS) => {
  const out: Record<string, string> = {};
  for (const name of names) out[name] = `${await digest(html(name))} ${await digest(styles(name))}`;
  return out;
};

const said = (name: Row) => row(name).querySelector("[data-file-live]")!.textContent!.trim();
const where = () => {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return "body";
  const pin = el.closest("[data-pin]")?.getAttribute("data-pin") ?? "page";
  return `${pin}: ${el.tagName.toLowerCase()} ${el.getAttribute("aria-label") ?? el.textContent?.trim()}${el.hasAttribute("data-key-focus") ? " (marked)" : ""}`;
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chromium = () => /Chrome/.test(navigator.userAgent);

/* Every image drawn or given up on, and nothing still easing. */
async function quiet() {
  await waitFor(() => expect([...document.querySelectorAll<HTMLImageElement>("[data-pin] img")].every((img) => img.complete)).toBe(true));
  await wait(400);
}

type Pinned = {
  rest: Record<string, string>;
  dragging: Record<string, string>;
  hovered: Record<string, string>;
  walked: Record<string, string>;
  clicked: Record<string, string>;
  said: string[];
  walk: string[];
};

/* Read from 6a1b30c, 5.15.0, 25 Oct 2026. */
const OLD_BUILD: Record<"chromium" | "webkit", Pinned> = {
  chromium: {
    rest: {
      empty: "b29da041066f9a7a 9354bff1cd8417b6",
      states: "e4e5400e6eb579ab 7b651d74a89f46d0",
      one: "736965829697a8e8 389737f2146847c5",
      disabled: "dfc8005a010cb1d3 9c8f0215dabcecd5",
      dark: "05aba774c26ccf85 452b0962c3cacd8f",
    },
    dragging: {
      states: "4a2bb6eb6db8c404 29486ebbc1c10ff2",
    },
    hovered: {
      choose: "9972d95688f6427c 17fab5be9f5383fa",
      retry: "e9e11ef6eb9e17e0 3706a387ec0fdb3d",
      remove: "796e87d3952ef661 eca4fd008455ad0f",
    },
    walked: {
      empty: "b29da041066f9a7a 9354bff1cd8417b6",
      states: "e4e5400e6eb579ab 7b651d74a89f46d0",
      one: "736965829697a8e8 389737f2146847c5",
      disabled: "dfc8005a010cb1d3 9c8f0215dabcecd5",
      dark: "12bea4d92ced0adc c7522898f3649fe1",
    },
    clicked: {
      one: "979c3b0a41fd5442 81f14549f494eb10",
    },
    said: [
      "",
      "failed.jpg didn't upload. The server is busy.",
      "1 of 1 uploaded.",
      "locked.jpg didn't upload. No.",
      "d-failed.jpg didn't upload. The server is busy.",
      "cover.jpg removed.",
    ],
    walk: [
      "empty: button Choose photos (marked) | b5b8faeabf6dd4a9",
      "states: button Choose photos (marked) | b5b8faeabf6dd4a9",
      "states: button Remove uploading.jpg (marked) | 53c5e63f728ca370",
      "states: button Remove done.jpg (marked) | 53c5e63f728ca370",
      "states: button Try failed.jpg again (marked) | 53c5e63f728ca370",
      "states: button Remove failed.jpg (marked) | 53c5e63f728ca370",
      "states: button Remove big.jpg (marked) | 53c5e63f728ca370",
      "one: button Choose photos (marked) | b5b8faeabf6dd4a9",
      "one: button Remove cover.jpg (marked) | 53c5e63f728ca370",
      "disabled: button Choose photos (marked) | 108a6a1f9827ae2d",
      "disabled: button Try locked.jpg again (marked) | ed1dcba236892b19",
      "disabled: button Remove locked.jpg (marked) | ed1dcba236892b19",
      "dark: button Choose photos (marked) | 80fc67f8a0a114c5",
      "dark: button Remove d-uploading.jpg (marked) | 8cc2472e420c007a",
      "dark: button Remove d-done.jpg (marked) | 8cc2472e420c007a",
      "dark: button Try d-failed.jpg again (marked) | 8cc2472e420c007a",
      "removed: one: button Choose photos",
    ],
  },
  webkit: {
    rest: {
      empty: "b29da041066f9a7a 935b1283e531b946",
      states: "8f8c265d5c7e00a7 45b75ff3adfc4c41",
      one: "52b1fe22e530a60d 99776980d1367b60",
      disabled: "daf5c792334e36a9 13e5d5d6918f55cd",
      dark: "17ff1824dbb0272a 373ac8fdf92cfdb7",
    },
    dragging: {
      states: "4cf24d24e2f04ff0 6f88aa6d0b770339",
    },
    hovered: {
      choose: "f95d6c70b9e7c310 45b75ff3adfc4c41",
      retry: "9286a8aa5a97774f 45b75ff3adfc4c41",
      remove: "4e87482a54a3339a 45b75ff3adfc4c41",
    },
    walked: {
      empty: "b29da041066f9a7a 935b1283e531b946",
      states: "8f8c265d5c7e00a7 45b75ff3adfc4c41",
      one: "52b1fe22e530a60d 99776980d1367b60",
      disabled: "daf5c792334e36a9 13e5d5d6918f55cd",
      dark: "1063d1402fcda352 5f7fe1a6ffd2d053",
    },
    clicked: {
      one: "979c3b0a41fd5442 093ed1e47c8bc57e",
    },
    said: [
      "",
      "failed.jpg didn't upload. The server is busy.",
      "1 of 1 uploaded.",
      "locked.jpg didn't upload. No.",
      "d-failed.jpg didn't upload. The server is busy.",
      "cover.jpg removed.",
    ],
    walk: [
      "empty: button Choose photos (marked) | 4382088b1f7a6e87",
      "states: button Choose photos (marked) | 4382088b1f7a6e87",
      "states: button Remove uploading.jpg (marked) | 942ecc00e46c78ba",
      "states: button Remove done.jpg (marked) | 942ecc00e46c78ba",
      "states: button Try failed.jpg again (marked) | 942ecc00e46c78ba",
      "states: button Remove failed.jpg (marked) | 942ecc00e46c78ba",
      "states: button Remove big.jpg (marked) | 942ecc00e46c78ba",
      "one: button Choose photos (marked) | 4382088b1f7a6e87",
      "one: button Remove cover.jpg (marked) | 942ecc00e46c78ba",
      "disabled: button Choose photos (marked) | 39181b48eb9d8228",
      "disabled: button Try locked.jpg again (marked) | 7d3dafd7f4079dc4",
      "disabled: button Remove locked.jpg (marked) | 7d3dafd7f4079dc4",
      "dark: button Choose photos (marked) | c653638c963bbf0c",
      "dark: button Remove d-uploading.jpg (marked) | b5edfa22b7415f37",
      "dark: button Remove d-done.jpg (marked) | b5edfa22b7415f37",
      "dark: button Try d-failed.jpg again (marked) | b5edfa22b7415f37",
      "removed: one: button Choose photos",
    ],
  },
};

/* One file in each state, in `field`, settled in order so the live region
   says the same thing every time. */
async function fill(field: "states" | "dark") {
  const p = field === "dark" ? "d-" : "";
  pickFiles(input(field), [
    await samplePhoto(`${p}uploading.jpg`, 60),
    await samplePhoto(`${p}done.jpg`, 180),
    await samplePhoto(`${p}failed.jpg`, 240),
    sizedFile(`${p}big.jpg`, 2 * 1024 * 1024),
  ]);
  await waitFor(() => expect(calls.filter((c) => c.field === field)).toHaveLength(3));
  call(field, `${p}uploading.jpg`).context.onProgress(0.5);
  call(field, `${p}done.jpg`).resolve("id");
  await waitFor(() => expect(item(field, `${p}done.jpg`).dataset.status).toBe("done"));
  await waitFor(() => expect(said(field)).toBe("1 of 3 uploaded."));
  call(field, `${p}failed.jpg`).reject(new Error("The server is busy."));
  await waitFor(() => expect(said(field)).toBe(`${p}failed.jpg didn't upload. The server is busy.`));
}

async function readEveryState(): Promise<Pinned | null> {
  const real = realInputOrSkip();
  if (!real) return null;
  calls.length = 0;
  await document.fonts.ready;
  /* The pointer starts off every field: a story before this one leaves it
     wherever its last click was. */
  await real.commands.realHover("[data-pin-before]");
  await fill("states");
  await fill("dark");
  pickFiles(input("one"), [await samplePhoto("cover.jpg", 30)]);
  await waitFor(() => expect(calls.filter((c) => c.field === "one")).toHaveLength(1));
  call("one", "cover.jpg").resolve("id");
  await waitFor(() => expect(item("one", "cover.jpg").dataset.status).toBe("done"));
  pickFiles(input("disabled"), [await samplePhoto("locked.jpg", 300)]);
  await waitFor(() => expect(calls.filter((c) => c.field === "disabled")).toHaveLength(1));
  call("disabled", "locked.jpg").reject(new Error("No."));
  await waitFor(() => expect(item("disabled", "locked.jpg").dataset.status).toBe("failed"));
  document.querySelector<HTMLButtonElement>("[data-pin-disable]")!.click();
  await waitFor(() => expect(row("disabled").querySelector("[data-file-choose]")!.getAttribute("aria-disabled")).toBe("true"));
  await quiet();
  const now: Pinned = { rest: await read(), dragging: {}, hovered: {}, walked: {}, clicked: {}, said: ROWS.map(said), walk: [] };

  /* Files dragged over the field with a file in each state. */
  const zone = row("states").querySelector("[data-file-drop]")!;
  const carrying = () => {
    const dt = new DataTransfer();
    dt.items.add(new File(["x"], "over.jpg", { type: "image/jpeg" }));
    return dt;
  };
  zone.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: carrying() }));
  await wait(300);
  now.dragging = await read(["states"]);
  zone.dispatchEvent(new DragEvent("dragleave", { bubbles: true, cancelable: true, dataTransfer: carrying() }));
  await waitFor(() => expect(zone.hasAttribute("data-dragging")).toBe(false));

  /* The pointer on each kind of button. Hover styles can't be read in WebKit
     here (the dev stylesheet's nested hover media), so there these read as at
     rest; Chromium's are the hovered ones. */
  const targets = [
    ["choose", '[data-pin="states"] [data-file-choose]'],
    ["retry", `[data-pin="states"] [data-file-retry]`],
    ["remove", `[data-pin="states"] [data-file-remove]`],
  ] as const;
  for (const [key, selector] of targets) {
    await real.commands.realHover(selector);
    await wait(250);
    now.hovered[key] = (await read(["states"])).states;
  }
  await real.commands.realHover("[data-pin-before]");

  /* The keyboard, from the button before every field. Safari's keyboard
     users reach buttons with Option+Tab. */
  document.querySelector<HTMLElement>("[data-pin-before]")!.focus();
  const tab = chromium() ? "Tab" : "Alt+Tab";
  for (let i = 0; i < 16; i++) {
    await real.commands.realPress([tab]);
    await wait(200);
    const el = document.activeElement!;
    now.walk.push(`${where()} | ${await digest(PROPS.map((p) => getComputedStyle(el).getPropertyValue(p)).join(";"))}`);
  }
  now.walked = await read();

  /* A real click on Remove: the file goes, and focus lands on Choose. */
  await real.commands.realClick('[data-pin="one"] [data-file-remove]');
  await waitFor(() => expect(row("one").querySelector("[data-file-item]")).toBeNull());
  await wait(300);
  now.walk.push(`removed: ${where()}`);
  now.clicked = await read(["one"]);
  now.said.push(said("one"));

  const engine = chromium() ? "chromium" : "webkit";
  console.info(`FILEUPLOAD UNCHANGED ${engine} ${JSON.stringify(now)}`);
  if (JSON.stringify(now) !== JSON.stringify(OLD_BUILD[engine])) {
    for (const name of ROWS) console.info(`FILEUPLOAD UNCHANGED ${engine} ${name} html: ${html(name)}\nstyles:\n${styles(name)}`);
  }
  return now;
}

export const WithNoNewOptionNothingChanged: Story = {
  tags: ["real-input"],
  render: () => <Fields />,
  play: async () => {
    const now = await readEveryState();
    if (!now) return;
    await expect(now).toEqual(OLD_BUILD[chromium() ? "chromium" : "webkit"]);
  },
};
