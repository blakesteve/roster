import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { FileUpload, type FileUploadContext } from "./FileUpload";
import { pickFiles, samplePhoto, sizedFile } from "../../../test/sample-files";
import { realInputOrSkip, type RealInput } from "../../../test/real-input";
import { asRows524 } from "../../../test/file-rows-524";

/**
 * FileUpload's rows at 200% text: a row that can't give its name 5rem wraps,
 * in the order it's read. The picture goes above first; then the buttons go
 * under the name, together, at the row's end. Measured as rendered in
 * Chromium and WebKit, each field beside its rows as 5.24 drew them
 * (`src/test/file-rows-524.ts`): files uploading at 45%, uploaded with a long
 * camera name, failed, and turned away, and a failed one under
 * `preview="dropzone"`, on a page with 16px margins and in a sheet's 39.
 *
 * - **Where a row fits, nothing moves:** wherever 5.24's name gets 5rem, from
 *   320 to 1,280px, at 100% and 200%, both directions, every box in the row
 *   is the same to 0.05px, and wherever it gets less, the row wraps.
 * - **Nothing runs under a button or past the row,** and every name gets
 *   5rem. The twin: at 320px and 200%, 5.24's failed row has a name of 0 and
 *   its status runs under Try again.
 * - **The order:** the picture above, then the buttons under the name, at the
 *   row's end in either direction. The twin: a physical margin puts them at
 *   the start in right to left.
 * - **In a narrow sheet at normal text,** a failed row's picture goes above
 *   and its name gets 112px. The twin: 44.
 * - **A reason with a 50-character word** breaks inside its column, and the
 *   page doesn't scroll. The twin: 5.24's does.
 *
 * Every name width here is the rows' own arithmetic (rem, px and padding), so
 * it's pinned exactly; how far text runs depends on the system font, so that
 * is pinned only as more than nothing.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page. Story
 * styling is inline, so none of it ships in roster.css.
 */
const meta = {
  title: "Molecules/FileUpload/Reflow checks",
  tags: ["!dev", "!autodocs", "real-input"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Call = { field: string; file: File; context: FileUploadContext; resolve: (r: string) => void; reject: (e: Error) => void };
const calls: Call[] = [];
const held = (field: string) => (file: File, context: FileUploadContext) =>
  new Promise<string>((resolve, reject) => calls.push({ field, file, context, resolve, reject }));
const call = (field: string, name: string) => calls.find((c) => c.field === field && c.file.name === name)!;

const LONG = "PXL_20261125_183045123.PORTRAIT.jpg";
const WORD = "/storage/emulated/0/DCIM/Camera/PXL_2026112518.jpg";
const FIELDS = [
  { id: "rows-16", margin: 16, box: false },
  { id: "box-16", margin: 16, box: true },
  { id: "rows-39", margin: 39, box: false },
  { id: "box-39", margin: 39, box: true },
  { id: "word", margin: 16, box: false },
] as const;
type Field = (typeof FIELDS)[number]["id"];
const MEASURED: Field[] = ["rows-16", "box-16", "rows-39", "box-39"];

const STILL = "*,*::before,*::after{transition:none!important;animation:none!important}";
function Fields() {
  return (
    <div>
      <style>{STILL}</style>
      {FIELDS.map((f) => (
        <div key={f.id} data-subject={f.id} style={{ padding: `8px ${f.margin}px` }}>
          <div data-field={f.id}>
            {f.box ? (
              <FileUpload label="Cover" preview="dropzone" maxFiles={1} upload={held(f.id)} />
            ) : (
              <FileUpload label="Photos" maxSize={1024 * 1024} upload={held(f.id)} />
            )}
          </div>
          {/* The twins, made from the rows once they've settled. */}
          <div data-twin={f.id} inert />
        </div>
      ))}
    </div>
  );
}

const q = <T extends Element = HTMLElement>(root: ParentNode, s: string) => root.querySelector<T>(s)!;
const fieldRoot = (id: Field) => q(document, `[data-field="${id}"] > div`);
const input = (id: Field) => q<HTMLInputElement>(fieldRoot(id), "input[type=file]");
const rowsIn = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>("[data-file-item]")];
const now = (id: Field) => rowsIn(fieldRoot(id));
const was = (id: Field, kind: "was" | "naive" = "was") => rowsIn(q(document, `[data-twin="${id}"] [data-kind="${kind}"]`));
const nameOf = (li: Element) => q(li, "p[title]").getAttribute("title")!;

/* Each field filled through its own upload calls, then its twins made: 5.24's
   rows, and today's with the buttons' box given a physical margin. */
async function fill() {
  calls.length = 0;
  const settled = (id: Field, n: number) => waitFor(() => expect(now(id).filter((li) => !["queued", "uploading"].includes(li.dataset.status!) || li.textContent!.includes("45%"))).toHaveLength(n));
  for (const id of ["rows-16", "rows-39"] as const) {
    pickFiles(input(id), [
      await samplePhoto("uploading.jpg", 60),
      await samplePhoto(LONG, 180),
      await samplePhoto("failed.jpg", 240),
      sizedFile("big.jpg", 2 * 1024 * 1024),
    ]);
    await waitFor(() => expect(calls.filter((c) => c.field === id)).toHaveLength(3));
    call(id, "uploading.jpg").context.onProgress(0.45);
    call(id, LONG).resolve("id");
    call(id, "failed.jpg").reject(new Error("The server is busy."));
    await settled(id, 4);
  }
  for (const [id, reason] of [["box-16", "The server is busy."], ["box-39", "The server is busy."], ["word", `It couldn't be saved to ${WORD}`]] as const) {
    pickFiles(input(id), [await samplePhoto("failed.jpg", 240)]);
    await waitFor(() => expect(calls.filter((c) => c.field === id)).toHaveLength(1));
    call(id, "failed.jpg").reject(new Error(reason));
    await waitFor(() => expect(now(id)[0].dataset.status).toBe("failed"));
  }
  for (const f of FIELDS) {
    const root = fieldRoot(f.id);
    const make = (kind: "was" | "naive") => {
      const box = document.createElement("div");
      box.className = root.className;
      box.dataset.kind = kind;
      const list = q(root, "ul").cloneNode(true) as HTMLElement;
      if (kind === "was") asRows524(list);
      else
        for (const a of list.querySelectorAll<HTMLElement>("[data-file-actions]")) {
          a.classList.remove("rst:ms-auto");
          a.style.marginLeft = "auto";
        }
      box.append(list);
      return box;
    };
    q(document, `[data-twin="${f.id}"]`).replaceChildren(make("was"), make("naive"));
  }
  await waitFor(() => expect([...document.querySelectorAll<HTMLImageElement>("[data-subject] img")].every((img) => img.complete)).toBe(true));
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
type Box = { l: number; r: number; t: number; b: number };
const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { l: r.left, r: r.right, t: r.top, b: r.bottom };
};
const rel = (b: Box, o: Box) => [b.l - o.l, b.r - o.l, b.t - o.t, b.b - o.t].map(r2);
const lines = (root: Element) => {
  const out: Box[] = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    if (!w.currentNode.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(w.currentNode);
    for (const r of range.getClientRects()) if (r.width) out.push({ l: r.left, r: r.right, t: r.top, b: r.bottom });
  }
  return out;
};
/* The row's content box: inside its border and padding. */
const inner = (li: Element): Box => {
  const b = boxOf(li);
  const s = getComputedStyle(li);
  const n = (p: string) => parseFloat(s.getPropertyValue(p));
  return {
    l: b.l + n("border-left-width") + n("padding-left"),
    r: b.r - n("border-right-width") - n("padding-right"),
    t: b.t + n("border-top-width") + n("padding-top"),
    b: b.b - n("border-bottom-width") - n("padding-bottom"),
  };
};
const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);

/* One row's parts, the same in both builds. */
const piecesOf = (li: Element) => {
  const name = q(li, "p[title]");
  return {
    picture: li.querySelector("[data-file-thumb]"),
    column: name.parentElement!,
    name,
    status: q(li, "[data-file-status]"),
    progress: li.querySelector("[data-file-progress]"),
    buttons: [...li.querySelectorAll("[data-file-retry], [data-file-remove]")],
  };
};
/* What a row draws, against its own corner. The name's text is cut by its
   box, so the box is read, not the text. */
const parts = (li: Element) => {
  const o = boxOf(li);
  const p = piecesOf(li);
  return {
    row: rel(o, o),
    picture: p.picture && rel(boxOf(p.picture), o),
    column: rel(boxOf(p.column), o),
    name: rel(boxOf(p.name), o),
    status: rel(boxOf(p.status), o),
    words: lines(p.status).map((l) => rel(l, o)),
    progress: p.progress && rel(boxOf(p.progress), o),
    buttons: p.buttons.map((b) => rel(boxOf(b), o)),
  };
};
const apart = (a: unknown, b: unknown): number => {
  const [x, y] = [JSON.stringify(a).match(/-?[\d.]+/g) ?? [], JSON.stringify(b).match(/-?[\d.]+/g) ?? []];
  return x.length !== y.length ? Infinity : Math.max(0, ...x.map((n, i) => Math.abs(Number(n) - Number(y[i]))));
};
const columnWidth = (li: Element) => r2(boxOf(piecesOf(li).column).r - boxOf(piecesOf(li).column).l);
/* Where the row has wrapped: the picture above the name, the buttons under it. */
const shape = (li: Element) => {
  const p = piecesOf(li);
  const column = boxOf(p.column);
  return {
    pictureAbove: !!p.picture && column.t >= boxOf(p.picture).b - 0.5,
    buttonsUnder: boxOf(p.buttons[0]).t >= column.b - 0.5,
  };
};
/* How far a status's words run under a button, side to side. */
const under = (li: Element) => {
  const p = piecesOf(li);
  let most = 0;
  for (const w of lines(p.status))
    for (const b of p.buttons.map(boxOf)) {
      if (Math.min(w.b, b.b) - Math.max(w.t, b.t) <= 0.5) continue;
      most = Math.max(most, Math.min(w.r, b.r) - Math.max(w.l, b.l));
    }
  return r2(most);
};
/* How far anything the row draws runs past its border. What draws nothing has
   no box to read, and the name's cut text is left to its box. */
const past = (li: Element) => {
  const o = boxOf(li);
  const drawn = [...li.querySelectorAll("*")].filter((el) => el.getClientRects().length).map(boxOf);
  const all = drawn.concat(lines(piecesOf(li).status));
  return r2(Math.max(0, ...all.map((b) => Math.max(b.r - o.r, o.l - b.l))));
};

type Dir = "ltr" | "rtl";
async function at(real: RealInput, width: number, percent: number, dir: Dir = "ltr") {
  await real.page.viewport(width, 900);
  await waitFor(() => expect(window.innerWidth).toBe(width));
  document.documentElement.style.fontSize = percent === 100 ? "" : `${percent}%`;
  document.documentElement.dir = dir;
  await frame();
  await frame();
}
async function restore(real: RealInput) {
  document.documentElement.style.fontSize = "";
  document.documentElement.dir = "ltr";
  for (const el of document.querySelectorAll<HTMLElement>("[data-subject], [data-twin], [data-field]")) el.style.display = "";
  await real.page.viewport(1280, 720);
}
const engine = () => (navigator.userAgent.includes("Chrome") ? "chromium" : "webkit");
const WIDTHS = [320, 360, 375, 390, 430, 768, 1280];

export const WhereARowFitsNothingMoves: Story = {
  render: () => <Fields />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await document.fonts.ready;
    await fill();
    const moved: string[] = [];
    const stayed: string[] = [];
    let compared = 0;
    let wrapped = 0;
    try {
      for (const percent of [100, 200])
        for (const dir of ["ltr", "rtl"] as const)
          for (const width of WIDTHS) {
            await at(real, width, percent, dir);
            const floor = 5 * rem();
            for (const id of MEASURED) {
              const [rows, twins] = [now(id), was(id)];
              rows.forEach((li, i) => {
                const where = `${width} ${percent}% ${dir} ${id} ${nameOf(li)}`;
                const room = columnWidth(twins[i]);
                if (room >= floor + 0.5) {
                  compared += 1;
                  const [a, b] = [parts(li), parts(twins[i])];
                  if (apart(a, b) > 0.05) moved.push(`${where}: ${JSON.stringify(a)} was ${JSON.stringify(b)}`);
                } else if (room <= floor - 0.5) {
                  wrapped += 1;
                  const s = shape(li);
                  if (!s.pictureAbove && !s.buttonsUnder) stayed.push(`${where}: 5.24's name ${room}`);
                }
              });
            }
          }
    } finally {
      await restore(real);
    }
    console.info(`FILEUPLOAD UNCHANGED ${engine()} ${compared} compared, ${moved.length} moved; ${wrapped} where 5.24's name is under 5rem, ${stayed.length} of them on one line`);
    // Each direction: at 100%, every row at every width but the sheet's failed row at 320; at 200%, every row at 768 and 1,280.
    await expect(compared).toBe(2 * (7 * 10 - 1 + 2 * 10));
    await expect(moved).toEqual([]);
    await expect(stayed).toEqual([]);
  },
};

export const NothingRunsUnderAButtonOrPastTheRow: Story = {
  render: () => <Fields />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await document.fonts.ready;
    await fill();
    const faults: string[] = [];
    const least: Record<string, number> = { 100: Infinity, 200: Infinity };
    let read = 0;
    let twin = { name: -1, under: -1 };
    try {
      for (const percent of [100, 200])
        for (const dir of ["ltr", "rtl"] as const)
          for (const width of WIDTHS) {
            await at(real, width, percent, dir);
            const floor = 5 * rem();
            for (const f of FIELDS)
              for (const li of now(f.id)) {
                read += 1;
                const where = `${width} ${percent}% ${dir} ${f.id} ${nameOf(li)}`;
                const [name, u, p] = [columnWidth(li), under(li), past(li)];
                least[percent] = Math.min(least[percent], name);
                if (name < floor - 0.05) faults.push(`${where}: a name of ${name}`);
                if (u > 0) faults.push(`${where}: words ${u}px under a button`);
                if (p > 0.05) faults.push(`${where}: ${p}px past the row`);
              }
            if (width === 320 && percent === 200 && dir === "ltr") {
              const failed = was("rows-16").find((li) => li.dataset.status === "failed")!;
              twin = { name: columnWidth(failed), under: under(failed) };
            }
          }
    } finally {
      await restore(real);
    }
    console.info(`FILEUPLOAD ROOM ${engine()} ${read} read, ${faults.length} faults; least name ${JSON.stringify(least)}; 5.24's failed row at 320 and 200%: ${JSON.stringify(twin)}`);
    await expect(read).toBe(2 * 2 * 7 * 11);
    await expect(faults).toEqual([]);
    // The narrowest names: 84px in the sheet at 360 and 100%, 166 in the sheet at 390 and 200%.
    await expect(least).toEqual({ 100: 84, 200: 166 });
    await expect(twin.name).toBe(0);
    await expect(twin.under).toBeGreaterThan(0);
  },
};

export const TheRowWrapsInReadingOrder: Story = {
  render: () => <Fields />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await document.fonts.ready;
    await fill();
    const got: Record<string, unknown> = {};
    /* Where each part sits in its row: the buttons from the row's end. */
    const read = (li: Element, dir: Dir) => {
      const c = inner(li);
      const p = piecesOf(li);
      const actions = boxOf(p.buttons[0].parentElement!);
      return {
        ...shape(li),
        name: columnWidth(li),
        fromEnd: r2(dir === "ltr" ? c.r - actions.r : actions.l - c.l),
      };
    };
    try {
      for (const dir of ["ltr", "rtl"] as const) {
        for (const width of [320, 375]) {
          await at(real, width, 200, dir);
          for (const id of ["rows-16", "box-16"] as const) {
            for (const li of now(id)) got[`${dir} ${width} ${id} ${li.dataset.status}`] = read(li, dir);
            const naive = was(id, "naive").find((li) => li.dataset.status === "failed")!;
            got[`${dir} ${width} ${id} failed, physical margin`] = read(naive, dir).fromEnd;
          }
        }
      }
    } finally {
      await restore(real);
    }
    console.info(`FILEUPLOAD ORDER ${engine()} ${JSON.stringify(got)}`);
    const pic = { pictureAbove: true, fromEnd: 0 };
    for (const dir of ["ltr", "rtl"]) {
      // At 320 and 200% every row stacks: the picture, the name the row's width, the buttons under it at the end.
      for (const status of ["uploading", "done", "failed", "rejected"])
        await expect(got[`${dir} 320 rows-16 ${status}`]).toEqual({ ...pic, buttonsUnder: true, name: 254 });
      await expect(got[`${dir} 320 box-16 failed`]).toEqual({ pictureAbove: false, buttonsUnder: true, name: 254, fromEnd: 0 });
      // At 375 a row with Remove alone keeps it beside the name; a failed row's two buttons go under.
      for (const status of ["uploading", "done", "rejected"])
        await expect(got[`${dir} 375 rows-16 ${status}`]).toEqual({ ...pic, buttonsUnder: false, name: 197 });
      await expect(got[`${dir} 375 rows-16 failed`]).toEqual({ ...pic, buttonsUnder: true, name: 309 });
    }
    // The twin, a physical margin: under the name it holds the buttons at the end left to right, and puts them at the start right to left.
    await expect(got["ltr 320 rows-16 failed, physical margin"]).toBe(0);
    await expect(got["rtl 320 rows-16 failed, physical margin"]).toBeGreaterThan(0);
    await expect(got["rtl 320 box-16 failed, physical margin"]).toBeGreaterThan(0);
  },
};

export const InANarrowSheetAFailedRowsPictureGoesAbove: Story = {
  render: () => <Fields />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await document.fonts.ready;
    await fill();
    const got: Record<string, unknown> = {};
    try {
      for (const dir of ["ltr", "rtl"] as const) {
        await at(real, 320, 100, dir);
        const failed = now("rows-39").find((li) => li.dataset.status === "failed")!;
        const twin = was("rows-39").find((li) => li.dataset.status === "failed")!;
        got[dir] = { ...shape(failed), name: columnWidth(failed), was: columnWidth(twin) };
        got[`${dir} others`] = now("rows-39").filter((li) => li !== failed).map((li) => shape(li).pictureAbove || shape(li).buttonsUnder);
      }
    } finally {
      await restore(real);
    }
    console.info(`FILEUPLOAD SHEET ${engine()} ${JSON.stringify(got)}`);
    for (const dir of ["ltr", "rtl"]) {
      // 320 less the sheet's 39px a side: the picture goes above, Try again and Remove stay beside a name of 112px, where 5.24's had 44.
      await expect(got[dir]).toEqual({ pictureAbove: true, buttonsUnder: false, name: 112, was: 44 });
      await expect(got[`${dir} others`]).toEqual([false, false, false]);
    }
  },
};

export const ALongWordDoesntScrollThePage: Story = {
  render: () => <Fields />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await document.fonts.ready;
    await fill();
    await expect(WORD.length).toBe(50);
    const got: Record<string, unknown> = {};
    /* Only the one row on the page: today's, then 5.24's. */
    const alone = async (which: "now" | "was") => {
      for (const el of document.querySelectorAll<HTMLElement>("[data-subject]")) el.style.display = el.dataset.subject === "word" ? "" : "none";
      q(document, '[data-field="word"]').style.display = which === "now" ? "" : "none";
      q(document, '[data-twin="word"]').style.display = which === "was" ? "" : "none";
      q(document, '[data-twin="word"] [data-kind="naive"]').style.display = "none";
      await frame();
      return r2(document.documentElement.scrollWidth - window.innerWidth);
    };
    try {
      for (const percent of [100, 200]) {
        await at(real, 320, percent);
        const scrolls = await alone("now");
        const li = now("word")[0];
        const column = boxOf(piecesOf(li).column);
        const words = lines(piecesOf(li).status);
        got[percent] = {
          scrolls,
          inside: words.every((w) => w.l >= column.l - 0.05 && w.r <= column.r + 0.05),
          lines: words.length > 1,
          was: await alone("was"),
        };
      }
    } finally {
      await restore(real);
    }
    console.info(`FILEUPLOAD WORD ${engine()} ${JSON.stringify(got)}`);
    for (const percent of [100, 200]) {
      await expect(got[percent]).toMatchObject({ scrolls: 0, inside: true, lines: true });
      await expect((got[percent] as { was: number }).was).toBeGreaterThan(0);
    }
  },
};
