import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { FileUpload, type FileUploadContext, type FileUploadProps } from "./FileUpload";
import { asRealFile, pickFiles, samplePhoto } from "../../../test/sample-files";
import { realInputOrSkip, type RealInput } from "../../../test/real-input";
import { settled } from "../../../test/settle";

/**
 * FileUpload with `camera`: the Take a photo button a finger gets beside
 * Choose, in Chromium and WebKit.
 *
 * The stories tagged `touch` run in a browser whose main pointer is coarse
 * (the `storybook-touch` project); the one tagged `real-input` runs with a
 * mouse. No browser here has a camera, so what's checked is the inputs, the
 * presses that open them, and what happens to a file that comes back. How a
 * shot is named and counted is in FileUpload.test.tsx.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/FileUpload/Camera checks",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Call = { file: File; context: FileUploadContext; resolve: (r: string) => void; reject: (e: unknown) => void };
const harness = { calls: [] as Call[] };
const upload = (file: File, context: FileUploadContext) =>
  new Promise<string>((resolve, reject) => harness.calls.push({ file, context, resolve, reject }));

function Field(props: Partial<FileUploadProps<string>>) {
  return <FileUpload label="Photos" helperText="JPEG or PNG." upload={upload} camera {...props} />;
}

const q = <E extends Element = HTMLElement>(s: string) => document.querySelector<E>(s)!;
const choose = () => q("[data-file-choose]");
const take = () => q("[data-file-camera]");
const box = () => q("[data-file-drop]");
const input = () => q<HTMLInputElement>("[data-file-input]");
const cameraInput = () => q<HTMLInputElement>("[data-file-camera-input]");
const names = () => [...document.querySelectorAll("[data-file-item]")].map((li) => li.querySelector("p")!.textContent);
const frames = async (n = 2) => {
  for (let i = 0; i < n; i++) await new Promise<void>((r) => requestAnimationFrame(() => r()));
};
const near = (a: number, b: number, by = 0.6) => Math.abs(a - b) <= by;
const coarse = () => matchMedia("(pointer: coarse)").matches;
const tab = () => (/Chrome/.test(navigator.userAgent) ? "Tab" : "Alt+Tab");

/* A finger's browser, or nothing in Storybook's own UI. Under the test runner
   a fine pointer throws, so a project that lost its touch screen fails. */
function touch(): RealInput | undefined {
  const real = realInputOrSkip();
  if (real && !coarse()) throw new Error("this check needs a coarse pointer: the storybook-touch project's");
  return real;
}

/* The page at a width, once it's there: the test's frame follows a viewport
   change some frames later. */
async function resize(real: RealInput, width: number, height: number) {
  await real.page.viewport(width, height);
  await waitFor(() => expect(innerWidth).toBe(width));
  await frames();
}

/* A tap's click comes after the tap is over, so "nothing happened" is read
   only once a later tap, on a button that's never unavailable, has landed. */
const Later = () => <button type="button" data-later="">Later</button>;
async function tapsLanded(real: RealInput) {
  const later = q("[data-later]");
  const landed = new Promise<void>((r) => later.addEventListener("click", () => r(), { once: true }));
  await real.commands.realTap("[data-later]");
  await landed;
}

/* Counts presses that reach each file input, and opens neither. */
function countOpens() {
  const opened = { choose: 0, camera: 0 };
  const click = HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click = function () {
    if (this.type !== "file") click.call(this);
    else if (this === cameraInput()) opened.camera++;
    else opened.choose++;
  };
  return { opened, stop: () => void (HTMLInputElement.prototype.click = click) };
}

/* A button's one-line width: a copy of it with nothing to shrink or grow. */
function ownWidth(button: HTMLElement) {
  const copy = button.cloneNode(true) as HTMLElement;
  copy.style.cssText = "position:absolute;visibility:hidden;width:max-content;min-width:0;flex:none";
  box().append(copy);
  const { width } = copy.getBoundingClientRect();
  copy.remove();
  return width;
}

/* Where the two sit in the box's inside, which is its width less its border
   and padding. */
function placed() {
  const style = getComputedStyle(box());
  const edge = box().getBoundingClientRect();
  const left = edge.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
  const right = edge.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
  const top = edge.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
  const bottom = edge.bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom);
  const a = choose().getBoundingClientRect();
  const b = take().getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(document.documentElement).fontSize) / 2;
  return {
    inside: right - left,
    a,
    b,
    /* Half a rem apart: a tall box puts no more between them. */
    stacked: near(b.top - a.bottom, gap) && near(a.width, right - left) && near(b.width, right - left),
    beside: near(a.top, b.top) && near(a.left, left) && near(b.right, right) && near(b.left - a.right, gap),
    contained: a.top >= top - 0.6 && b.bottom <= bottom + 0.6 && a.left >= left - 0.6 && b.right <= right + 0.6,
  };
}

const setInside = async (px: number) => {
  const style = getComputedStyle(box());
  const around = parseFloat(style.borderLeftWidth) * 2 + parseFloat(style.paddingLeft) * 2;
  q("[data-wide]").style.width = `${px + around}px`;
  await frames();
};

/* ── The two buttons ──────────────────────────────────────────────────────── */

export const TheTwoFillTheBox: Story = {
  tags: ["touch"],
  render: () => (
    <div data-wide="">
      <Field />
    </div>
  ),
  play: async () => {
    const real = touch();
    if (!real) return;
    await resize(real, 900, 720);
    try {
      const [a, b] = [ownWidth(choose()), ownWidth(take())];
      const [narrow, wide] = [Math.min(a, b), Math.max(a, b)];
      const rows: string[] = [];
      const at = async (px: number, expected: string) => {
        await setInside(px);
        const p = placed();
        const share = p.stacked ? "stacked" : p.beside ? (near(p.a.width, p.b.width) ? "equal" : near(Math.max(p.a.width, p.b.width), wide) ? "as equal as it can" : "uneven") : "neither";
        rows.push(`${px.toFixed(1)}px inside: ${p.a.width.toFixed(1)} and ${p.b.width.toFixed(1)}, ${share}, ${p.a.height} tall`);
        await expect([share, p.contained, Math.round(p.a.height), Math.round(p.b.height)], `${px}px inside`).toEqual([expected, true, 44, 44]);
      };
      /* A phone's box in an app's sheet: 282 at 360, 315 at 393. */
      await at(a + b + 8 - 1, "stacked");
      await at(wide + 1, "stacked");
      await at(a + b + 8 + 0.5, "as equal as it can");
      await at((a + b + 8 + wide * 2 + 8) / 2, "as equal as it can");
      await at(wide * 2 + 8.5, "equal");
      await at(wide * 2 + 120, "equal");
      console.info(`FILEUPLOAD CAMERA own widths ${a.toFixed(1)} and ${b.toFixed(1)}\n${rows.join("\n")}`);
      await expect(wide - narrow, "the twin: the labels differ, so equal isn't free").toBeGreaterThan(2);

      /* The twin: at their own widths, which is what no `flex-1` draws, the
         stacked pair is uneven and fills nothing. */
      await setInside(a + b + 8 - 1);
      for (const el of [choose(), take()]) el.style.flex = "none";
      await frames();
      const loose = placed();
      await expect([loose.stacked, near(loose.a.width, loose.b.width)]).toEqual([false, false]);
      for (const el of [choose(), take()]) el.style.flex = "";
    } finally {
      q("[data-wide]").style.width = "";
      await real.page.viewport(1280, 720);
    }
  },
};

/* 320px and 200% text, in the rows and in the drop box with a picture and
   without. */
export const At320AndAtLargeText: Story = {
  tags: ["touch"],
  render: () => <Sizes />,
  play: async () => {
    const real = touch();
    if (!real) return;
    harness.calls = [];
    try {
      const rows: string[] = [];
      for (const width of [320, 360, 375, 393]) {
        await resize(real, width, 800);
        for (const text of ["100%", "200%"]) {
          document.documentElement.style.fontSize = text;
          for (const state of ["rows", "empty", "picture"]) {
            q<HTMLButtonElement>(`[data-show="${state}"]`).click();
            await waitFor(() => expect(q("[data-state]").dataset.state).toBe(state));
            if (state === "picture") {
              pickFiles(input(), [await samplePhoto("cover.jpg", 200)]);
              await waitFor(() => expect(choose().textContent).toBe("Replace photo"));
            }
            await frames(3);
            const p = placed();
            const where = `${width}px, ${text}, ${state}`;
            rows.push(`${where}: ${p.inside.toFixed(0)} inside; ${p.a.width.toFixed(0)} by ${p.a.height.toFixed(0)} and ${p.b.width.toFixed(0)} by ${p.b.height.toFixed(0)}, box ${box().getBoundingClientRect().height.toFixed(0)}`);
            await expect(
              [p.stacked || p.beside, p.contained, choose().scrollWidth <= choose().clientWidth, take().scrollWidth <= take().clientWidth, document.documentElement.scrollWidth <= width],
              where,
            ).toEqual([true, true, true, true, true]);
            await expect(Math.round(Math.min(p.a.height, p.b.height)), where).toBeGreaterThanOrEqual(44);
          }
        }
      }
      console.info(`FILEUPLOAD CAMERA sizes\n${rows.join("\n")}`);
    } finally {
      document.documentElement.style.fontSize = "";
      await real.page.viewport(1280, 720);
    }
  },
};

function Sizes() {
  const [state, setState] = useState("rows");
  return (
    <div data-state={state} style={{ padding: 8 }}>
      {["rows", "empty", "picture"].map((s) => (
        <button key={s} type="button" data-show={s} onClick={() => setState(s)} style={{ position: "absolute", opacity: 0 }} tabIndex={-1} aria-hidden="true" />
      ))}
      <Field key={state} {...(state === "rows" ? {} : { preview: "dropzone", maxFiles: 1 })} />
    </div>
  );
}

/* Off, a finger gets what it did: one input, and Choose at its own width in
   the middle of the box. */
export const OffAFingerGetsChooseAlone: Story = {
  tags: ["touch"],
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Field camera={false} cameraDisabled />
    </div>
  ),
  play: async () => {
    const real = touch();
    if (!real) return;
    const b = choose().getBoundingClientRect();
    const z = box().getBoundingClientRect();
    await expect([
      document.querySelectorAll("input[type=file]").length,
      document.querySelectorAll("[data-file-camera]").length,
      near(b.width, ownWidth(choose())),
      near(b.left - z.left, z.right - b.right),
      /pointer-coarse/.test(q("[data-file-upload]").outerHTML),
    ]).toEqual([1, 0, true, true, false]);
  },
};

/* ── Opening it ───────────────────────────────────────────────────────────── */

export const EachButtonOpensItsOwnInput: Story = {
  tags: ["touch"],
  render: () => (
    <div>
      <button type="button" data-before="">
        Before
      </button>
      <Field accept="image/jpeg,image/png" maxFiles={10} />
      <button type="button" data-after="">
        After
      </button>
    </div>
  ),
  play: async () => {
    const real = touch();
    if (!real) return;
    harness.calls = [];
    const attrs = (el: HTMLInputElement) => [el.accept, el.multiple, el.getAttribute("capture"), el.hidden, el.tabIndex, el.disabled];
    await expect([attrs(input()), attrs(cameraInput())]).toEqual([
      ["image/jpeg,image/png", true, null, true, -1, false],
      ["image/jpeg,image/png", false, "environment", true, -1, false],
    ]);
    /* Equals: one look, one height, the same help. */
    const look = (el: HTMLElement) => {
      const s = getComputedStyle(el);
      return [s.backgroundColor, s.color, s.borderTopColor, s.borderTopWidth, s.fontSize, s.fontWeight, s.height, s.paddingLeft, el.getAttribute("aria-describedby")];
    };
    await expect(look(take())).toEqual(look(choose()));
    await expect([choose().textContent, take().textContent, !!take().getAttribute("aria-describedby")]).toEqual(["Choose photos", "Take a photo", true]);
    /* Each with an icon of its own. */
    await expect(choose().querySelector("svg")!.innerHTML === take().querySelector("svg")!.innerHTML).toBe(false);

    const { opened, stop } = countOpens();
    try {
      await real.commands.realTap("[data-file-camera]");
      await waitFor(() => expect(opened).toEqual({ choose: 0, camera: 1 }));
      await real.commands.realTap("[data-file-choose]");
      await waitFor(() => expect(opened).toEqual({ choose: 1, camera: 1 }));
      /* Choose, then Take a photo, then out. */
      q("[data-before]").focus();
      const stops: string[] = [];
      for (let i = 0; i < 3; i++) {
        await real.commands.realPress([tab()]);
        stops.push(document.activeElement!.textContent!);
        if (document.activeElement === take()) {
          await real.commands.realPress(["Enter", "Space"]);
          await waitFor(() => expect(opened.camera).toBe(3));
        }
      }
      await expect([stops, opened]).toEqual([["Choose photos", "Take a photo", "After"], { choose: 1, camera: 3 }]);
    } finally {
      stop();
    }
  },
};

/* The camera closed with no shot: the browser says `cancel`, and nothing else. */
export const CancelingTheCameraChangesNothing: Story = {
  tags: ["touch"],
  render: () => <Field />,
  play: async () => {
    const real = touch();
    if (!real) return;
    harness.calls = [];
    const { stop } = countOpens();
    try {
      take().focus();
      await real.commands.realPress(["Enter"]);
      cameraInput().dispatchEvent(new Event("cancel", { bubbles: true }));
      /* A browser may say `change` with nothing in it instead. */
      pickFiles(cameraInput(), []);
      await frames();
      await expect([names(), harness.calls.length, q("[data-file-live]").textContent!.trim(), document.activeElement === take()]).toEqual([[], 0, "", true]);
    } finally {
      stop();
    }
  },
};

/* ── A shot ───────────────────────────────────────────────────────────────── */

const shot = async (hue: number) => asRealFile(new File([await samplePhoto("x.jpg", hue)], "image.jpg", { type: "image/jpeg" }));

export const AShotIsAddedAndFocusStays: Story = {
  tags: ["touch"],
  render: () => (
    <>
      <Field maxFiles={2} />
      <Later />
    </>
  ),
  play: async () => {
    const real = touch();
    if (!real) return;
    harness.calls = [];
    const { opened, stop } = countOpens();
    try {
      take().focus();
      await real.commands.realSetFiles("[data-file-camera-input]", [await shot(20)]);
      await waitFor(() => expect(names()).toEqual(["Camera photo 1"]));
      /* The input is cleared, so the same shot again still says so; the file
         keeps its own name; the thumbnail drew. */
      await expect([cameraInput().value, harness.calls[0].file.name, take().getAttribute("aria-disabled")]).toEqual(["", "image.jpg", null]);
      await waitFor(() => expect(q<HTMLImageElement>("[data-file-item] img").naturalWidth).toBe(160));

      /* The shot that fills the list: the button is unavailable under the
         focus that's on it, and keeps it. */
      await real.commands.realSetFiles("[data-file-camera-input]", [await shot(90)]);
      await waitFor(() => expect(names()).toEqual(["Camera photo 1", "Camera photo 2"]));
      await waitFor(() => expect(take().getAttribute("aria-disabled")).toBe("true"));
      await frames(10);
      await expect(document.activeElement === take()).toBe(true);
      await real.commands.realPress(["Enter", "Space"]);
      await real.commands.realTap("[data-file-camera]");
      await tapsLanded(real);
      await expect(opened).toEqual({ choose: 0, camera: 0 });

      /* Removing both by key: each Remove, then Choose, never the page or the
         camera. And there's room again. */
      const removes = () => [...document.querySelectorAll<HTMLElement>("[data-file-remove]")];
      removes()[0].focus();
      await real.commands.realPress(["Enter"]);
      await waitFor(() => expect(names()).toEqual(["Camera photo 2"]));
      await waitFor(() => expect(document.activeElement).toBe(removes()[0]));
      await expect(removes()[0].getAttribute("aria-label")).toBe("Remove Camera photo 2");
      await expect(take().getAttribute("aria-disabled")).toBe(null);
      await real.commands.realPress(["Enter"]);
      await waitFor(() => expect(document.activeElement).toBe(choose()));
      await real.commands.realTap("[data-file-camera]");
      await waitFor(() => expect(opened).toEqual({ choose: 0, camera: 1 }));
    } finally {
      stop();
    }
  },
};

/* ── When it's unavailable ────────────────────────────────────────────────── */

const CASES: [name: string, props: Partial<FileUploadProps<string>>, expected: { take: string | null; choose: string | null }][] = [
  ["room", { maxFiles: 3 }, { take: null, choose: null }],
  ["no room at all", { maxFiles: 0 }, { take: "true", choose: null }],
  ["full", { maxFiles: 1 }, { take: "true", choose: null }],
  ["the app says so", { cameraDisabled: true }, { take: "true", choose: null }],
  ["a full drop box", { maxFiles: 1, preview: "dropzone" }, { take: null, choose: null }],
  ["a full drop box, and the app says so", { maxFiles: 1, preview: "dropzone", cameraDisabled: true }, { take: "true", choose: null }],
  ["disabled", { disabled: true }, { take: "true", choose: "true" }],
];

export const WhenItsUnavailable: Story = {
  tags: ["touch"],
  render: () => <Cases />,
  play: async () => {
    const real = touch();
    if (!real) return;
    const { opened, stop } = countOpens();
    try {
      for (const [name, , expected] of CASES) {
        harness.calls = [];
        q<HTMLButtonElement>(`[data-case="${name}"]`).click();
        await waitFor(() => expect(q("[data-now]").dataset.now).toBe(name));
        if (name.includes("full") || name === "room" || name === "the app says so") {
          pickFiles(input(), [await samplePhoto("one.jpg", 30)]);
          await waitFor(() => expect(names()).toEqual(["one.jpg"]));
        }
        await settled(take());
        const s = getComputedStyle(take());
        const before = { ...opened };
        take().focus();
        await expect(document.activeElement === take(), `${name}: focusable`).toBe(true);
        await real.commands.realPress(["Enter"]);
        await real.commands.realTap("[data-file-camera]");
        await tapsLanded(real);
        await expect(
          { take: take().getAttribute("aria-disabled"), native: take().hasAttribute("disabled"), opacity: s.opacity, cursor: s.cursor, opens: opened.camera - before.camera, choose: choose().getAttribute("aria-disabled"), chooseOpacity: getComputedStyle(choose()).opacity },
          name,
        ).toEqual({
          take: expected.take,
          native: false,
          opacity: expected.take ? "0.5" : "1",
          cursor: expected.take ? "not-allowed" : "pointer",
          opens: expected.take ? 0 : 2,
          choose: expected.choose,
          chooseOpacity: expected.choose ? "0.5" : "1",
        });
        /* Choose, Remove and Try again are only ever the field's to disable. */
        const rest = [...document.querySelectorAll("[data-file-remove], [data-file-retry]")].map((el) => el.getAttribute("aria-disabled"));
        await expect(rest.every((v) => v === expected.choose), `${name}: ${rest}`).toBe(true);
        await expect([input().disabled, cameraInput().disabled], name).toEqual([name === "disabled", name === "disabled"]);
      }
    } finally {
      stop();
    }
  },
};

function Cases() {
  const [now, setNow] = useState("room");
  return (
    <div data-now={now}>
      {CASES.map(([name]) => (
        <button key={name} type="button" data-case={name} onClick={() => setNow(name)} style={{ position: "absolute", opacity: 0 }} tabIndex={-1} aria-hidden="true" />
      ))}
      <Field key={now} {...CASES.find(([name]) => name === now)![1]} />
      <Later />
    </div>
  );
}

/* `cameraDisabled` turned on under focus keeps it, and a file already on its
   way carries on. */
export const TheAppMakesItUnavailableUnderFocus: Story = {
  tags: ["touch"],
  render: () => <Waiting />,
  play: async () => {
    const real = touch();
    if (!real) return;
    harness.calls = [];
    pickFiles(input(), [await samplePhoto("one.jpg", 30)]);
    await waitFor(() => expect(harness.calls).toHaveLength(1));
    take().focus();
    q<HTMLButtonElement>("[data-wait]").click();
    await waitFor(() => expect(take().getAttribute("aria-disabled")).toBe("true"));
    await frames(10);
    await expect([document.activeElement === take(), harness.calls[0].context.signal.aborted]).toEqual([true, false]);
    /* The twin: the rest of the field still works. */
    await real.commands.realTap("[data-file-remove]");
    await waitFor(() => expect(names()).toEqual([]));
    await expect(harness.calls[0].context.signal.aborted).toBe(true);
  },
};

function Waiting() {
  const [waiting, setWaiting] = useState(false);
  return (
    <>
      <Field cameraDisabled={waiting} />
      <button type="button" data-wait="" onClick={() => setWaiting(true)}>
        Wait
      </button>
    </>
  );
}

/* ── Over a picture ───────────────────────────────────────────────────────── */

export const OverAPictureBothStay: Story = {
  tags: ["touch"],
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Field preview="dropzone" maxFiles={1} />
    </div>
  ),
  play: async () => {
    const real = touch();
    if (!real) return;
    harness.calls = [];
    const empty = box().getBoundingClientRect().height;
    const middle = () => {
      const p = placed();
      const z = box().getBoundingClientRect();
      return { above: p.a.top - z.top, below: z.bottom - p.b.bottom };
    };
    const resting = middle();
    await expect(near(resting.above, resting.below), "in the middle of an empty box").toBe(true);

    await real.commands.realSetFiles("[data-file-camera-input]", [await shot(20)]);
    await waitFor(() => expect(box().querySelector("img")?.naturalWidth).toBe(160));
    await settled(choose());
    await settled(take());
    const p = placed();
    const over = middle();
    /* At the foot of the box, whose height hasn't moved. */
    await expect([box().getBoundingClientRect().height === empty, p.contained, over.below < over.above, near(over.below, 26)]).toEqual([true, true, true, true]);
    await expect([choose().textContent, take().textContent]).toEqual(["Replace photo", "Take a photo"]);
    /* Each above the picture, on an opaque face. */
    const layer = q("[data-file-preview]");
    layer.style.pointerEvents = "auto";
    const hit = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest("button") === el;
    };
    const faces = [choose(), take()].map((el) => [hit(el), getComputedStyle(el).backgroundColor]);
    layer.style.pointerEvents = "";
    await expect(faces).toEqual([
      [true, "rgb(255, 255, 255)"],
      [true, "rgb(255, 255, 255)"],
    ]);

    /* Another shot takes the place of the first, whose upload stops. */
    await real.commands.realSetFiles("[data-file-camera-input]", [await shot(140)]);
    await waitFor(() => expect(names()).toEqual(["Camera photo 2"]));
    await expect([harness.calls[0].context.signal.aborted, harness.calls.length]).toEqual([true, 2]);
    await waitFor(() => expect(q("[data-file-live]").textContent!.trim()).toBe("Camera photo 1 removed. 1 photo added."));
  },
};

/* ── With a mouse ─────────────────────────────────────────────────────────── */

/* The same field twice, with `camera` and without, where the main pointer is
   fine: the button isn't there to see or to reach, and Choose is where and
   what it was. */
export const WithAMouseItIsntThere: Story = {
  tags: ["real-input"],
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <button type="button" data-before="">
        Before
      </button>
      <div data-with="on">
        <Field />
        <Field preview="dropzone" maxFiles={1} />
      </div>
      <button type="button" data-after="">
        After
      </button>
      <div data-with="off">
        <Field camera={false} />
        <Field camera={false} preview="dropzone" maxFiles={1} />
      </div>
    </div>
  ),
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await expect(coarse(), "the main pointer").toBe(false);
    harness.calls = [];
    const side = (name: "on" | "off") => q(`[data-with="${name}"]`);
    for (const name of ["on", "off"] as const) {
      const [, boxed] = side(name).querySelectorAll<HTMLInputElement>("[data-file-input]");
      pickFiles(boxed, [await samplePhoto("cover.jpg", 200)]);
    }
    await waitFor(() => expect(document.querySelectorAll("[data-file-drop] img")).toHaveLength(2));
    await frames(5);
    /* Choose eases onto its face over the picture. */
    for (const el of document.querySelectorAll("[data-file-choose]")) await settled(el);

    const read = (name: "on" | "off") => {
      const origin = side(name).getBoundingClientRect();
      return [...side(name).querySelectorAll<HTMLElement>("*")]
        .filter((el) => !el.closest("[data-file-camera], [data-file-camera-input]") && el.getClientRects().length > 0)
        .map((el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          /* To the hundredth: an svg's path is a float, and the two sit at
             different places on the page. */
          const px = [r.left - origin.left, r.top - origin.top, r.width, r.height].map((n) => Math.round(n * 100) / 100);
          return [el.tagName, ...px, s.display, s.flexDirection, s.flexWrap, s.flexGrow, s.flexBasis, s.justifyContent, s.alignContent, s.backgroundColor, s.color, s.cursor].join(" ");
        });
    };
    const [on, off] = [read("on"), read("off")];
    await expect(on.length).toBeGreaterThan(30);
    await expect(on).toEqual(off);
    /* Choose's own markup is today's, but for what only a finger's browser
       reads. */
    const html = (name: "on" | "off") =>
      [...side(name).querySelectorAll("[data-file-choose]")].map((el) => el.outerHTML.replace(/ ?rst:pointer-coarse:[^ "]+/g, "").replace(/aria-describedby="[^"]+"|id="[^"]+"/g, ""));
    await expect(html("on")).toEqual(html("off"));
    /* Not drawn, not reached. */
    const cameras = [...side("on").querySelectorAll<HTMLElement>("[data-file-camera]")];
    await expect(cameras.map((el) => [getComputedStyle(el).display, el.getClientRects().length])).toEqual([
      ["none", 0],
      ["none", 0],
    ]);
    await expect([...side("on").querySelectorAll<HTMLElement>("[data-file-drop-hint]")].map((el) => getComputedStyle(el).display)).toEqual(["block"]);
    q("[data-before]").focus();
    const stops: string[] = [];
    for (let i = 0; i < 4; i++) {
      await real.commands.realPress([tab()]);
      const el = document.activeElement as HTMLElement;
      stops.push(el.getAttribute("aria-label") ?? el.textContent!);
    }
    await expect(stops).toEqual(["Choose photos", "Replace photo", "Remove cover.jpg", "After"]);
  },
};
