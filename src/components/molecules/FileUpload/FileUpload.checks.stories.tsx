import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { FileUpload, type FileUploadContext, type FileUploadProps } from "./FileUpload";
import { FileUploadRejection } from "./file-upload-rejection";
import { Progress } from "../../atoms/Progress/Progress";
import { asRealFile, pickFiles, samplePhoto, sizedFile } from "../../../test/sample-files";
import { realInputOrSkip } from "../../../test/real-input";
import { backgroundOf, contrast, paint } from "../../../test/painted";
import { settled } from "../../../test/settle";

/**
 * Every promise FileUpload makes, checked in Chromium. Expected values are
 * literals written from the requirement, each paired with a twin that must
 * come out differently, so a pass means the component did it rather than
 * that the check couldn't tell.
 *
 * The harness's `upload` hands each call to the play, which settles it by
 * hand the way a request would, so each state can be read on its own.
 *
 * Checks, not documentation: hidden from the sidebar and the docs page.
 */
const meta = {
  title: "Molecules/FileUpload/Checks",
  tags: ["!dev", "!autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Call = { file: File; context: FileUploadContext; resolve: (r: string) => void; reject: (e: unknown) => void };
const harness = { calls: [] as Call[] };
const upload = (file: File, context: FileUploadContext) =>
  new Promise<string>((resolve, reject) => harness.calls.push({ file, context, resolve, reject }));

function Harness(props: Partial<FileUploadProps<string>>) {
  return (
    <div style={{ maxWidth: 520 }}>
      <FileUpload label="Photos" upload={upload} {...props} />
      <button type="button" data-after="">
        After
      </button>
    </div>
  );
}

const q = <E extends Element = HTMLElement>(s: string) => document.querySelector<E>(s);
const input = () => q<HTMLInputElement>("[data-file-upload] input[type=file]")!;
const choose = () => q("[data-file-choose]")!;
const rowOf = (name: string) =>
  [...document.querySelectorAll<HTMLElement>("[data-file-item]")].find((li) => li.querySelector("p")?.textContent === name)!;
const statusOf = (name: string) => rowOf(name).querySelector("[data-file-status]")!.textContent;
const removeOf = (name: string) => rowOf(name).querySelector<HTMLElement>("[data-file-remove]")!;
const live = () => q("[data-file-live]")!.textContent!.trim();
const reset = () => {
  harness.calls = [];
};
const callFor = (name: string) => harness.calls.find((c) => c.file.name === name)!;

/* ── States ────────────────────────────────────────────────────────────── */

export const EachStateReadsAsItself: Story = {
  render: () => <Harness maxSize={1024 * 1024} concurrency={4} />,
  play: async () => {
    reset();
    pickFiles(input(), [
      await samplePhoto("no-figure-yet.jpg", 10),
      await samplePhoto("uploading.jpg", 60),
      await samplePhoto("processing.jpg", 120),
      await samplePhoto("done.jpg", 180),
      await samplePhoto("failed.jpg", 240),
      sizedFile("rejected.jpg", 2 * 1024 * 1024),
    ]);
    /* Four upload at once; the fifth waits. */
    await waitFor(() => expect(harness.calls.map((c) => c.file.name)).toEqual(["no-figure-yet.jpg", "uploading.jpg", "processing.jpg", "done.jpg"]));
    callFor("uploading.jpg").context.onProgress(0.25);
    callFor("processing.jpg").context.onProcessing();
    callFor("done.jpg").resolve("id-done");
    await waitFor(() => expect(harness.calls).toHaveLength(5));
    callFor("failed.jpg").reject(new Error("The server is busy."));
    await waitFor(() => expect(rowOf("failed.jpg").dataset.status).toBe("failed"));

    const rows = [...document.querySelectorAll<HTMLElement>("[data-file-item]")];
    const read = rows.map((li) => [li.querySelector("p")!.textContent, li.dataset.status, li.querySelector("[data-file-status]")!.textContent!.replace(/^[\d.]+ \w+ · /, "")]);
    await expect(read).toEqual([
      ["no-figure-yet.jpg", "uploading", "Uploading"],
      ["uploading.jpg", "uploading", "Uploading, 25%"],
      ["processing.jpg", "processing", "Finishing up"],
      ["done.jpg", "done", "Uploaded"],
      ["failed.jpg", "failed", "Didn't upload. The server is busy."],
      ["rejected.jpg", "rejected", "Not added. It's over 1 MB."],
    ]);
    /* Only the failed file offers Try again. */
    await expect(rows.map((li) => !!li.querySelector("[data-file-retry]"))).toEqual([false, false, false, false, true, false]);
    /* The bar shows where an upload is, and none on a finished file. */
    const bar = (name: string) => rowOf(name).querySelector<HTMLElement>("[data-file-progress] [data-progress-fill]");
    const share = (name: string) =>
      bar(name)!.getBoundingClientRect().width / rowOf(name).querySelector("[data-file-progress] [data-progress-track]")!.getBoundingClientRect().width;
    /* The fills grow over a transition, so wait for each to arrive rather
       than read it once: a read mid-transition caught 0.99999976. The bar
       with no figure never moves, so it's exact. */
    await waitFor(() => expect(share("uploading.jpg")).toBeCloseTo(0.25, 2));
    await waitFor(() => expect(share("processing.jpg")).toBeCloseTo(1, 2));
    await expect(share("no-figure-yet.jpg")).toBe(0);
    await expect([bar("done.jpg"), bar("failed.jpg"), bar("rejected.jpg")]).toEqual([null, null, null]);
    /* The rejected file was never sent. */
    await expect(harness.calls.map((c) => c.file.name)).not.toContain("rejected.jpg");
  },
};

/* The bar is Progress now, and it keeps 5.6.0's height, colors, rounding and
   spacing, the values that version rendered, at the same 150ms. Three things
   differ on purpose: a tiny value is a dot rather than a sliver, the fill's
   ends stay round as it grows (scaling squashed them), and while the server
   finishes the whole bar breathes, not only its fill. */
export const TheBarLooksAsItDid: Story = {
  render: () => (
    <>
      <Harness />
      {/* The twin: Progress at its other size, which would be a visible change. */}
      <div style={{ width: 300 }} data-other-size="">
        <Progress value={50} size="md" announce={false} />
      </div>
    </>
  ),
  play: async () => {
    reset();
    pickFiles(input(), [await samplePhoto("pier.jpg", 200)]);
    await waitFor(() => expect(harness.calls).toHaveLength(1));
    harness.calls[0].context.onProgress(0.5);
    const wrap = rowOf("pier.jpg").querySelector<HTMLElement>("[data-file-progress]")!;
    const track = wrap.querySelector<HTMLElement>("[data-progress-track]")!;
    const fill = wrap.querySelector<HTMLElement>("[data-progress-fill]")!;
    await waitFor(() => expect(fill.style.width).toBe("50%"));
    const t = getComputedStyle(track);
    const f = getComputedStyle(fill);
    await expect({
      gap: getComputedStyle(wrap).marginTop,
      height: t.height,
      track: t.backgroundColor,
      fill: f.backgroundColor,
      round: parseFloat(t.borderTopLeftRadius) >= 3 && parseFloat(f.borderTopLeftRadius) >= 3,
      clips: t.overflow,
    }).toEqual({ gap: "6px", height: "6px", track: "rgb(231, 229, 228)", fill: "rgb(10, 79, 122)", round: true, clips: "hidden" });
    await expect(getComputedStyle(document.querySelector("[data-other-size] [data-progress-track]")!).height).toBe("10px");
  },
};

export const AWaitingFileReadsWaiting: Story = {
  render: () => <Harness concurrency={1} />,
  play: async () => {
    reset();
    pickFiles(input(), [await samplePhoto("first.jpg", 10), await samplePhoto("second.jpg", 90)]);
    await waitFor(() => expect(harness.calls).toHaveLength(1));
    await expect([statusOf("first.jpg")!.endsWith("Uploading"), statusOf("second.jpg")!.endsWith("Waiting")]).toEqual([true, true]);
    /* The twin: once the first lands, the second goes. */
    harness.calls[0].resolve("1");
    await waitFor(() => expect(statusOf("second.jpg")!.endsWith("Uploading")).toBe(true));
  },
};

export const BarsMoveUnlessMotionIsReduced: Story = {
  tags: ["reduced-motion"],
  render: () => <Harness />,
  play: async () => {
    reset();
    pickFiles(input(), [await samplePhoto("slow.jpg", 10), await samplePhoto("moving.jpg", 90), await samplePhoto("unsure.jpg", 170)]);
    await waitFor(() => expect(harness.calls).toHaveLength(3));
    callFor("slow.jpg").context.onProcessing();
    callFor("moving.jpg").context.onProgress(0.5);
    await waitFor(() => expect(rowOf("slow.jpg").dataset.status).toBe("processing"));
    const track = (name: string) => getComputedStyle(rowOf(name).querySelector("[data-file-progress] [data-progress-track]")!);
    const fill = (name: string) => getComputedStyle(rowOf(name).querySelector("[data-file-progress] [data-progress-fill]")!);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* The server's turn and no figure yet both breathe; a moving figure slides. */
    await expect([track("slow.jpg").animationName, track("unsure.jpg").animationName, /\bwidth\b/.test(fill("moving.jpg").transitionProperty)]).toEqual(
      reduced ? ["none", "none", false] : ["pulse", "pulse", true],
    );
    /* The twin: a bar with a figure doesn't pulse in either mode. */
    await expect([fill("moving.jpg").animationName, track("moving.jpg").animationName]).toEqual(["none", "none"]);
  },
};

/* ── Removing, canceling, retrying ────────────────────────────────────── */

export const RemovingCancelsTheUpload: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    pickFiles(input(), [await samplePhoto("keep.jpg", 10), await samplePhoto("drop.jpg", 90)]);
    await waitFor(() => expect(harness.calls).toHaveLength(2));
    await userEvent.click(removeOf("drop.jpg"));
    await expect([callFor("drop.jpg").context.signal.aborted, callFor("keep.jpg").context.signal.aborted]).toEqual([true, false]);
    /* Finishing anyway changes nothing: it's gone. */
    callFor("drop.jpg").resolve("late");
    await new Promise((r) => setTimeout(r, 50));
    await expect([...document.querySelectorAll("[data-file-item]")].map((li) => li.querySelector("p")!.textContent)).toEqual(["keep.jpg"]);
  },
};

export const FocusNeverFallsToThePage: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    pickFiles(input(), [await samplePhoto("a.jpg", 10), await samplePhoto("b.jpg", 90), await samplePhoto("c.jpg", 170)]);
    await waitFor(() => expect(harness.calls).toHaveLength(3));
    harness.calls[1].reject(new Error("The connection dropped."));
    await waitFor(() => expect(rowOf("b.jpg").dataset.status).toBe("failed"));

    /* Retry: its button goes, so its Remove takes focus. */
    rowOf("b.jpg").querySelector<HTMLElement>("[data-file-retry]")!.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(document.activeElement).toBe(removeOf("b.jpg")));

    /* Remove, by keyboard: next, then previous, then Choose. */
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(document.activeElement).toBe(removeOf("c.jpg")));
    await userEvent.keyboard(" ");
    await waitFor(() => expect(document.activeElement).toBe(removeOf("a.jpg")));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(document.activeElement).toBe(choose()));
    await expect(document.activeElement).not.toBe(document.body);
  },
};

export const EverythingIsReachableByTab: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    pickFiles(input(), [await samplePhoto("a.jpg", 10), await samplePhoto("b.jpg", 90)]);
    await waitFor(() => expect(harness.calls).toHaveLength(2));
    harness.calls[0].reject(new Error("No."));
    await waitFor(() => expect(rowOf("a.jpg").dataset.status).toBe("failed"));
    choose().focus();
    const stops: string[] = [];
    for (let i = 0; i < 4; i++) {
      await userEvent.tab();
      const el = document.activeElement as HTMLElement;
      stops.push(el.getAttribute("aria-label") ?? el.textContent ?? "");
    }
    /* The hidden input is never a stop of its own. */
    await expect(stops).toEqual(["Try a.jpg again", "Remove a.jpg", "Remove b.jpg", "After"]);
  },
};

export const DisablingTheFieldKeepsFocus: Story = {
  render: () => <DisableHarness />,
  play: async () => {
    reset();
    pickFiles(input(), [await samplePhoto("a.jpg", 10), await samplePhoto("b.jpg", 90)]);
    await waitFor(() => expect(harness.calls).toHaveLength(2));
    removeOf("a.jpg").focus();
    q<HTMLButtonElement>("[data-toggle]")!.click();
    await waitFor(() => expect(removeOf("a.jpg").getAttribute("aria-disabled")).toBe("true"));
    await expect(document.activeElement).toBe(removeOf("a.jpg"));
    /* And pressing it does nothing while the field is disabled. */
    await userEvent.keyboard("{Enter}");
    await expect(rowOf("a.jpg")).toBeTruthy();
    await expect(harness.calls[0].context.signal.aborted).toBe(false);
  },
};

function DisableHarness() {
  const [disabled, setDisabled] = useState(false);
  return (
    <>
      <Harness disabled={disabled} />
      <button type="button" data-toggle="" onClick={() => setDisabled((d) => !d)}>
        Toggle
      </button>
    </>
  );
}

/* ── What a screen reader hears ────────────────────────────────────────── */

export const AnnouncesProgressAndProblems: Story = {
  render: () => <Harness maxSize={1024 * 1024} />,
  play: async () => {
    reset();
    pickFiles(input(), [await samplePhoto("a.jpg", 10), await samplePhoto("b.jpg", 90), await samplePhoto("c.jpg", 170), sizedFile("big.jpg", 3 * 1024 * 1024)]);
    await waitFor(() => expect(live()).toBe("3 photos added. big.jpg wasn't added. It's over 1 MB."));
    harness.calls[0].resolve("1");
    harness.calls[1].resolve("2");
    /* Two landing together are one sentence with the latest count. */
    await waitFor(() => expect(live()).toBe("2 of 3 uploaded."));
    harness.calls[2].reject(new Error("The server is busy."));
    await waitFor(() => expect(live()).toBe("c.jpg didn't upload. The server is busy."));
    await userEvent.click(removeOf("c.jpg"));
    await waitFor(() => expect(live()).toBe("c.jpg removed."));
  },
};

/* ── Phones ────────────────────────────────────────────────────────────── */

export const At375EveryTargetIs44: Story = {
  tags: ["real-input"],
  render: () => <Harness />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    await real.page.viewport(375, 720);
    try {
      reset();
      pickFiles(input(), [
        await samplePhoto("a-very-long-file-name-straight-off-a-camera-roll-IMG_20261008_101544.jpg", 10),
        await samplePhoto("b.jpg", 90),
      ]);
      await waitFor(() => expect(harness.calls).toHaveLength(2));
      harness.calls[1].reject(new Error("No."));
      await waitFor(() => expect(rowOf("b.jpg").dataset.status).toBe("failed"));
      const targets = [...document.querySelectorAll<HTMLElement>("[data-file-upload] button")].filter((el) => el.offsetParent);
      await expect(targets.length, "targets on screen").toBe(4);
      for (const el of targets) {
        const box = el.getBoundingClientRect();
        await expect(
          [Math.round(box.width) >= 44, Math.round(box.height) >= 44, box.left >= 0, box.right <= 375],
          el.getAttribute("aria-label") ?? el.textContent ?? "",
        ).toEqual([true, true, true, true]);
      }
      /* A long name truncates; it doesn't push Remove off its row. */
      const long = document.querySelector<HTMLElement>("[data-file-item]")!;
      const remove = long.querySelector("[data-file-remove]")!.getBoundingClientRect();
      await expect(remove.right <= long.getBoundingClientRect().right + 0.5).toBe(true);
      await expect(document.documentElement.scrollWidth, "no sideways scroll").toBeLessThanOrEqual(375);
      /* No drop hint on a touch-sized screen with a mouse? The hint follows the pointer, not the width. */
      await expect(getComputedStyle(q("[data-file-drop-hint]")!).display).toBe(matchMedia("(pointer: fine)").matches ? "block" : "none");
    } finally {
      await real.page.viewport(1280, 720);
    }
  },
};

/* ── Real picking and dropping ─────────────────────────────────────────── */

export const PickingThroughTheBrowser: Story = {
  tags: ["real-input"],
  render: () => <Harness types={["image/jpeg", "image/png"]} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    reset();
    await real.commands.realSetFiles("[data-file-upload] input[type=file]", [
      await asRealFile(await samplePhoto("pier.jpg", 200)),
      { name: "notes.txt", mimeType: "text/plain", size: 12 },
    ]);
    await waitFor(() => expect(harness.calls.map((c) => c.file.name)).toEqual(["pier.jpg"]));
    await expect(statusOf("notes.txt")).toBe("12 B · Not added. That type of file isn't accepted.");
    /* The thumbnail drew: a real decoded image, not the placeholder. */
    const img = rowOf("pier.jpg").querySelector<HTMLImageElement>("img")!;
    await waitFor(() => expect([img.complete, img.naturalWidth]).toEqual([true, 160]));
    /* The input was cleared, so picking the same file again still fires a
       change. (Whether it's then a duplicate can't be checked here: the
       browser stamps each file Playwright hands it with a new modified time.
       FileUpload.test.tsx pins the duplicate rule.) */
    await expect(input().value).toBe("");
    await real.commands.realSetFiles("[data-file-upload] input[type=file]", [await asRealFile(await samplePhoto("pier.jpg", 200))]);
    await waitFor(() => expect(document.querySelectorAll("[data-file-item]")).toHaveLength(3));
  },
};

export const DroppingFiles: Story = {
  tags: ["real-input"],
  render: () => <Harness />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    reset();
    await real.commands.realDropFiles("[data-file-drop]", [await asRealFile(await samplePhoto("dropped.png", 300, { type: "image/png" }))]);
    await waitFor(() => expect(harness.calls.map((c) => c.file.name)).toEqual(["dropped.png"]));
    await expect(q("[data-file-drop]")!.hasAttribute("data-dragging")).toBe(false);
    /* The twin: a drop on the page beside the field isn't taken. */
    await real.commands.realDropFiles("[data-after]", [await asRealFile(await samplePhoto("elsewhere.png", 30, { type: "image/png" }))]);
    await new Promise((r) => setTimeout(r, 50));
    await expect(harness.calls).toHaveLength(1);
  },
};

export const ImageThePickerCantDrawShowsAMark: Story = {
  render: () => <Harness />,
  play: async () => {
    reset();
    /* Not an image at all, though it says it is: Chromium fails to decode it. */
    pickFiles(input(), [new File([new Uint8Array(64)], "from-a-camera.heic", { type: "image/heic" }), await samplePhoto("fine.jpg", 50)]);
    await waitFor(() => expect(rowOf("from-a-camera.heic").querySelector("[data-file-thumb]")!.getAttribute("data-file-thumb")).toBe("placeholder"));
    const fine = rowOf("fine.jpg").querySelector<HTMLImageElement>("img")!;
    await waitFor(() => expect(fine.naturalWidth).toBe(160));
    await expect(fine.getAttribute("data-file-thumb")).toBe("image");
  },
};

/* ── The accessibility tree ────────────────────────────────────────────── */

export const NamesAndRoles: Story = {
  tags: ["ax-tree"],
  render: () => <Harness helperText="JPEG or PNG." errorMessage="Add at least one photo." />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    reset();
    pickFiles(input(), [await samplePhoto("pier.jpg", 200)]);
    await waitFor(() => expect(harness.calls).toHaveLength(1));
    harness.calls[0].context.onProgress(0.5);
    await waitFor(() => expect(statusOf("pier.jpg")).toContain("50%"));
    const probes = [
      q("[data-file-upload]")!,
      choose(),
      rowOf("pier.jpg").querySelector("img")!,
      rowOf("pier.jpg").querySelector("[data-file-progress] [data-progress-track]")!,
      removeOf("pier.jpg"),
      q("[data-file-live]")!,
    ];
    const ids = probes.map((el, i) => {
      const id = `fu-${i}-${Math.random().toString(36).slice(2)}`;
      el.setAttribute("data-ax-probe", id);
      return `[data-ax-probe="${id}"]`;
    });
    const states = await real.commands.axStates(ids);
    probes.forEach((el) => el.removeAttribute("data-ax-probe"));
    await expect(states.map((s) => [s.role, s.name, s.description])).toEqual([
      ["group", "Photos", ""],
      ["button", "Choose photos", "JPEG or PNG. Add at least one photo."],
      ["none", "", ""],
      /* The bar is a picture: the status line beside it says how far. */
      ["none", "", ""],
      ["button", "Remove pier.jpg", ""],
      ["status", "", ""],
    ]);
  },
};

/* ── Turned away by upload ─────────────────────────────────────────────── */

/* Everything the live region says, in order, not just the last thing. */
function listen() {
  const heard: string[] = [];
  const region = q("[data-file-live]")!;
  const observer = new MutationObserver(() => {
    const text = region.textContent!.trim();
    if (text) heard.push(text);
  });
  observer.observe(region, { childList: true, subtree: true, characterData: true });
  return { heard, stop: () => observer.disconnect() };
}

export const UploadCanTurnAFileAwayForGood: Story = {
  render: () => <Harness concurrency={1} />,
  play: async () => {
    reset();
    pickFiles(input(), [await samplePhoto("scan.jpg", 10), await samplePhoto("next.jpg", 90)]);
    await waitFor(() => expect(live()).toBe("2 photos added."));
    const { heard, stop } = listen();
    callFor("scan.jpg").context.onProgress(0.4);
    await waitFor(() => expect(rowOf("scan.jpg").querySelector("[data-file-progress]")).not.toBeNull());
    callFor("scan.jpg").reject(new FileUploadRejection("That isn't a photo."));
    await waitFor(() => expect(rowOf("scan.jpg").dataset.status).toBe("rejected"));
    /* Its slot freed: the file waiting starts. */
    await waitFor(() => expect(harness.calls.map((c) => c.file.name)).toEqual(["scan.jpg", "next.jpg"]));
    await expect([
      statusOf("scan.jpg")!.replace(/^[\d.]+ \w+ · /, ""),
      !!rowOf("scan.jpg").querySelector("[data-file-retry]"),
      !!rowOf("scan.jpg").querySelector("[data-file-progress]"),
      callFor("scan.jpg").context.signal.aborted,
      getComputedStyle(rowOf("scan.jpg").querySelector("img")!).opacity,
    ]).toEqual(["Not added. That isn't a photo.", false, false, false, "0.5"]);
    /* The twin: a plain Error still fails, with Try again. */
    callFor("next.jpg").reject(new Error("The server is busy."));
    await waitFor(() => expect(rowOf("next.jpg").dataset.status).toBe("failed"));
    await waitFor(() => expect(heard.at(-1)).toBe("next.jpg didn't upload. The server is busy."));
    stop();
    /* Said once, as not added, never as a failure. */
    await expect(heard).toEqual(["scan.jpg wasn't added. That isn't a photo.", "next.jpg didn't upload. The server is busy."]);
    await expect(!!rowOf("next.jpg").querySelector("[data-file-retry]")).toBe(true);
  },
};

/* ── The picture in the drop box ──────────────────────────────────────── */

const box = () => q("[data-file-drop]")!;
const boxImage = () => box().querySelector<HTMLImageElement>("img");

/* Where the picture actually paints inside its contained box. */
function painted(img: HTMLImageElement) {
  const r = img.getBoundingClientRect();
  const scale = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
  const [w, h] = [img.naturalWidth * scale, img.naturalHeight * scale];
  return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, right: r.left + (r.width + w) / 2, bottom: r.top + (r.height + h) / 2, height: h };
}

export const ThePictureFillsTheDropBox: Story = {
  render: () => <Harness preview="dropzone" maxFiles={1} />,
  play: async () => {
    reset();
    const empty = box().getBoundingClientRect().height;
    pickFiles(input(), [await samplePhoto("cover.jpg", 200)]);
    await waitFor(() => expect(boxImage()?.naturalWidth).toBe(160));
    const withPicture = box().getBoundingClientRect().height;
    const edge = box().getBoundingClientRect();
    const border = parseFloat(getComputedStyle(box()).borderTopWidth);
    const p = painted(boxImage()!);
    const gap = Math.min(p.left - edge.left, p.top - edge.top, edge.right - p.right, edge.bottom - p.bottom) - border;
    console.info(`FILEUPLOAD BOX heights ${empty} / ${withPicture}, picture ${p.height.toFixed(1)}px tall, ${gap.toFixed(1)}px clear of the dashed edge`);
    await expect([withPicture, gap >= 11.5, rowOf("cover.jpg").querySelector("[data-file-thumb]")]).toEqual([empty, true, null]);
    /* The twin: the picture really drew, and fills most of the box's height. */
    await expect(p.height / (edge.height - 2 * border)).toBeGreaterThan(0.8);
    /* The button is over it, named for what it does now, and still a 44px target. */
    const button = choose().getBoundingClientRect();
    await expect([choose().textContent, Math.round(button.height) >= 44, document.elementFromPoint(button.left + button.width / 2, button.top + button.height / 2)?.closest("[data-file-choose]") === choose()]).toEqual([
      "Replace photo",
      true,
      true,
    ]);
    /* Removed: no picture, and the box keeps its height. */
    await userEvent.click(removeOf("cover.jpg"));
    await waitFor(() => expect(boxImage()).toBeNull());
    await expect([box().getBoundingClientRect().height, choose().textContent, document.activeElement === choose()]).toEqual([empty, "Choose photos", true]);
  },
};

function Unmounting() {
  const [shown, setShown] = useState(true);
  return (
    <>
      {shown && <Harness preview="dropzone" maxFiles={1} />}
      <button type="button" data-unmount="" onClick={() => setShown(false)}>
        Unmount
      </button>
    </>
  );
}

export const EveryPictureUrlIsRevoked: Story = {
  render: () => <Unmounting />,
  play: async () => {
    reset();
    const made: string[] = [];
    const revoked = new Set<string>();
    const [create, revoke] = [URL.createObjectURL, URL.revokeObjectURL];
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      const url = create(obj);
      made.push(url);
      return url;
    };
    URL.revokeObjectURL = (url: string) => {
      revoked.add(url);
      revoke(url);
    };
    try {
      pickFiles(input(), [await samplePhoto("first.jpg", 20)]);
      await waitFor(() => expect(boxImage()?.naturalWidth).toBe(160));
      /* The twin: the picture on screen is the one URL still live. */
      await expect(made.filter((u) => !revoked.has(u))).toEqual([boxImage()!.src]);
      /* Replaced, then removed, then a third picked and the field unmounted. */
      pickFiles(input(), [await samplePhoto("second.jpg", 140)]);
      await waitFor(() => expect(rowOf("second.jpg")).toBeTruthy());
      await waitFor(() => expect(boxImage()?.naturalWidth).toBe(160));
      await userEvent.click(removeOf("second.jpg"));
      pickFiles(input(), [await samplePhoto("third.jpg", 260)]);
      await waitFor(() => expect(boxImage()?.naturalWidth).toBe(160));
      q<HTMLButtonElement>("[data-unmount]")!.click();
      await waitFor(() => expect(q("[data-file-upload]")).toBeNull());
      console.info(`FILEUPLOAD URLS made ${made.length}, revoked ${made.filter((u) => revoked.has(u)).length}`);
      await expect([made.length >= 3, made.filter((u) => !revoked.has(u))]).toEqual([true, []]);
    } finally {
      URL.createObjectURL = create;
      URL.revokeObjectURL = revoke;
    }
  },
};

export const ReplacingThePictureByKeysAndByDropping: Story = {
  tags: ["real-input"],
  render: () => <Harness preview="dropzone" maxFiles={1} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    reset();
    pickFiles(input(), [await samplePhoto("first.jpg", 20)]);
    await waitFor(() => expect(boxImage()?.naturalWidth).toBe(160));
    /* Tab reaches the button over the picture, it rings, and Enter opens the picker. */
    const opened = { n: 0 };
    const click = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () {
      if (this.type === "file") opened.n++;
      else click.call(this);
    };
    try {
      document.body.focus();
      choose().blur();
      const before = document.createElement("button");
      before.textContent = "start";
      q("[data-file-upload]")!.before(before);
      before.focus();
      await real.commands.realPress([/Chrome/.test(navigator.userAgent) ? "Tab" : "Alt+Tab"]);
      await waitFor(() => expect(document.activeElement).toBe(choose()));
      await new Promise((r) => setTimeout(r, 250));
      const ringed = /0px 0px 0px [1-9]/.test(getComputedStyle(choose()).boxShadow);
      await real.commands.realPress(["Enter"]);
      await expect([choose().textContent, ringed, opened.n]).toEqual(["Replace photo", true, 1]);
      before.remove();
    } finally {
      HTMLInputElement.prototype.click = click;
    }
    /* A drop replaces it: the first's upload stops, and the box shows the second. */
    await real.commands.realDropFiles("[data-file-drop]", [await asRealFile(await samplePhoto("second.png", 300, { type: "image/png" }))]);
    await waitFor(() => expect([...document.querySelectorAll("[data-file-item]")].map((li) => li.querySelector("p")!.textContent)).toEqual(["second.png"]));
    await expect(callFor("first.jpg").context.signal.aborted).toBe(true);
    await waitFor(() => expect(boxImage()?.naturalWidth).toBe(160));
    /* The twin: a file the rules turn away leaves the picture where it was. */
    const shown = boxImage()!.src;
    await real.commands.realDropFiles("[data-file-drop]", [{ name: "notes.txt", mimeType: "text/plain", size: 12 }]);
    await waitFor(() => expect(document.querySelectorAll("[data-file-item]")).toHaveLength(2));
    await expect([boxImage()!.src === shown, rowOf("notes.txt").dataset.status]).toEqual([true, "rejected"]);
  },
};

/* The button's size and ring, and whether it rings at all. */
const buttonLook = () => {
  const b = choose();
  return `${Math.round(b.getBoundingClientRect().height)}px, ring ${getComputedStyle(b).boxShadow}`;
};

export const ThePictureTakesNoInputFromTheBox: Story = {
  tags: ["real-input"],
  render: () => <Harness preview="dropzone" maxFiles={1} />,
  play: async () => {
    const real = realInputOrSkip();
    if (!real) return;
    reset();
    const tab = /Chrome/.test(navigator.userAgent) ? "Tab" : "Alt+Tab";
    const start = document.createElement("button");
    start.textContent = "start";
    q("[data-file-upload]")!.before(start);
    const ringOnChoose = async () => {
      start.focus();
      await real.commands.realPress([tab]);
      await waitFor(() => expect(document.activeElement).toBe(choose()));
      await settled(choose());
      return buttonLook();
    };
    try {
      const without = await ringOnChoose();
      pickFiles(input(), [await samplePhoto("first.jpg", 20)]);
      await waitFor(() => expect(boxImage()?.naturalWidth).toBe(160));
      /* The same 44px target and the same ring, over a picture as without one. */
      const over = await ringOnChoose();
      await expect([over, /^4[4-9]px, ring .*0px 0px 0px [1-9]/.test(over)]).toEqual([without, true]);

      const b = choose().getBoundingClientRect();
      const p = painted(boxImage()!);
      const onPicture = [p.left + (p.right - p.left) / 2, p.top + 10] as const;
      /* Painted above the picture: with the picture made hittable for a
         moment, the button's middle still finds the button (hit testing
         follows paint order). The twin: the picture's own top finds the
         picture, so the probe can see it. */
      const layer = q<HTMLElement>("[data-file-preview]")!;
      layer.style.pointerEvents = "auto";
      const stacked = [
        document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)?.closest("[data-file-choose]") === choose(),
        !!document.elementFromPoint(...onPicture)?.closest("[data-file-preview]"),
      ];
      layer.style.pointerEvents = "";
      /* As shipped, a point on the picture is the drop box's: a click or a
         drop there goes where it would with no picture. */
      const hit = document.elementFromPoint(...onPicture)!;
      await expect([...stacked, hit.closest("[data-file-preview]"), hit === box()]).toEqual([true, true, null, true]);
      const clicked: EventTarget[] = [];
      box().addEventListener("click", (e) => clicked.push(e.target!), { capture: true, once: true });
      await real.commands.realClick("[data-file-drop]", { fx: 0.5, fy: (onPicture[1] - box().getBoundingClientRect().top) / box().getBoundingClientRect().height });
      await expect(clicked).toEqual([box()]);
      box().setAttribute("data-hit", "");
      await real.commands.realDropFiles("[data-hit]", [await asRealFile(await samplePhoto("second.jpg", 140))]);
      await waitFor(() => expect([...document.querySelectorAll("[data-file-item]")].map((li) => li.querySelector("p")!.textContent)).toEqual(["second.jpg"]));
    } finally {
      start.remove();
    }
  },
};

function Schemes() {
  return (
    <div style={{ display: "grid", gap: 0, maxWidth: 520 }}>
      {(["light", "dark"] as const).map((scheme) => (
        <div key={scheme} className={scheme === "dark" ? "dark" : undefined} data-scheme={scheme} style={{ padding: 16, background: scheme === "dark" ? "#0c0a09" : "#ffffff" }}>
          <FileUpload label={`Cover, ${scheme}`} preview="dropzone" maxFiles={1} upload={upload} />
          <div style={{ height: 12 }} />
          <FileUpload label={`Rows, ${scheme}`} upload={upload} />
        </div>
      ))}
    </div>
  );
}

export const TheDashedEdgeAndThePicture: Story = {
  render: () => <Schemes />,
  play: async () => {
    reset();
    const rows: string[] = [];
    for (const scheme of ["light", "dark"]) {
      const [boxed, plain] = [...document.querySelectorAll<HTMLElement>(`[data-scheme="${scheme}"] [data-file-upload]`)];
      pickFiles(boxed.querySelector("input")!, [await samplePhoto(`${scheme}.jpg`, scheme === "light" ? 50 : 220)]);
      const img = () => boxed.querySelector<HTMLImageElement>("[data-file-drop] img");
      await waitFor(() => expect(img()?.naturalWidth).toBe(160));
      const zone = boxed.querySelector<HTMLElement>("[data-file-drop]")!;
      const ground = paint(backgroundOf(zone));
      const edge = contrast(paint([...backgroundOf(zone), getComputedStyle(zone).borderTopColor]), ground);
      const button = boxed.querySelector<HTMLElement>("[data-file-choose]")!;
      /* Its face eases in with the picture: read where it ends. */
      await settled(button);
      const face = getComputedStyle(button).backgroundColor;
      const ink = contrast(paint([...backgroundOf(button), getComputedStyle(button).color]), paint(backgroundOf(button)));
      const p = painted(img()!);
      const r = zone.getBoundingClientRect();
      const gap = Math.min(p.left - r.left, p.top - r.top, r.right - p.right, r.bottom - p.bottom) - parseFloat(getComputedStyle(zone).borderTopWidth);
      rows.push(
        `${scheme}: face ${face}, edge ${edge.toFixed(2)}:1 on the page, the same as the rows' (${getComputedStyle(zone).borderTopColor === getComputedStyle(plain.querySelector("[data-file-drop]")!).borderTopColor}); picture ${gap.toFixed(1)}px clear of it; button face opaque (${paint(["rgb(0, 0, 0)", face]).join() === paint(["rgb(255, 255, 255)", face]).join()}), its words ${ink.toFixed(2)}:1`,
      );
    }
    console.info(`FILEUPLOAD EDGE\n${rows.join("\n")}`);
    /* The picture never meets the edge, so the edge is judged against the
       page beside it, as without a picture; and the button over the picture
       carries its own surface. */
    for (const line of rows) {
      await expect(line).toMatch(/the same as the rows' \(true\); picture 1[1-9]\.\dpx clear of it; button face opaque \(true\), its words ([5-9]|1\d)\.\d\d:1$/);
    }
  },
};

