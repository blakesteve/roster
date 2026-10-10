import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { FileUpload, type FileUploadContext, type FileUploadProps } from "./FileUpload";
import { Progress } from "../../atoms/Progress/Progress";
import { asRealFile, pickFiles, samplePhoto, sizedFile } from "../../../test/sample-files";
import { realInputOrSkip } from "../../../test/real-input";

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

type Call = { file: File; context: FileUploadContext; resolve: (r: string) => void; reject: (e: Error) => void };
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
