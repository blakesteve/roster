import { Activity } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { FileUpload, type FileUploadContext, type FileUploadItem, type FileUploadProps } from "./FileUpload";

/* jsdom draws no images and has no object URLs, so these stand in. What a
   real browser does with focus, layout, drops and the picker is in
   FileUpload.checks.stories.tsx. */
beforeEach(() => {
  let n = 0;
  URL.createObjectURL = vi.fn(() => `blob:thumb-${++n}`);
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.restoreAllMocks());

const photo = (name: string, size = 2048, type = "image/jpeg") =>
  new File([new Uint8Array(size)], name, { type, lastModified: 1 });

type Call = { file: File; context: FileUploadContext; resolve: (r: string) => void; reject: (e: unknown) => void };

function setup(props: Partial<FileUploadProps<string>> = {}) {
  const calls: Call[] = [];
  const upload = vi.fn(
    (file: File, context: FileUploadContext) =>
      new Promise<string>((resolve, reject) => calls.push({ file, context, resolve, reject })),
  );
  const changes: FileUploadItem<string>[][] = [];
  const view = render(<FileUpload label="Photos" upload={upload} onChange={(items) => changes.push(items)} {...props} />);
  const input = view.container.querySelector<HTMLInputElement>("input[type=file]")!;
  const pick = (...files: File[]) => fireEvent.change(input, { target: { files } });
  const row = (name: string) => screen.getByText(name).closest("li")!;
  const status = (name: string) => row(name).querySelector("[data-file-status]")!.textContent;
  const live = () => view.container.querySelector("[data-file-live]")!.textContent!.trim();
  return { ...view, calls, upload, changes, input, pick, row, status, live };
}

/* A settled promise's callbacks run on the microtask queue. */
const settle = () => act(async () => {});

describe("FileUpload", () => {
  it("offers the phone's photo picker: image/*, several at once, no capture", () => {
    const { input } = setup();
    expect(input).toHaveAttribute("accept", "image/*");
    expect(input).toHaveAttribute("multiple");
    expect(input).not.toHaveAttribute("capture");
    expect(input).toHaveAttribute("tabindex", "-1");
    /* The twin: one file at most picks one. */
    const one = setup({ maxFiles: 1 });
    expect(one.input).not.toHaveAttribute("multiple");
  });

  it("opens the picker from the Choose button", () => {
    const { input } = setup();
    const click = vi.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: "Choose photos" }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("uploads each file through the app, and reports what it resolved with", async () => {
    const { pick, calls, status, changes } = setup();
    pick(photo("pier.jpg"), photo("dunes.jpg"));
    expect(calls.map((c) => c.file.name)).toEqual(["pier.jpg", "dunes.jpg"]);
    expect(status("pier.jpg")).toBe("2 KB · Uploading");

    calls[0].resolve("media-1");
    await settle();
    expect(status("pier.jpg")).toBe("2 KB · Uploaded");
    const last = changes.at(-1)!;
    expect(last.map((i) => [i.file.name, i.status, i.result])).toEqual([
      ["pier.jpg", "done", "media-1"],
      ["dunes.jpg", "uploading", undefined],
    ]);
  });

  it("shows progress as the app reports it, then the server's turn", async () => {
    const { pick, calls, status, row } = setup();
    pick(photo("pier.jpg"));
    act(() => calls[0].context.onProgress(0.416));
    expect(status("pier.jpg")).toBe("2 KB · Uploading, 42%");
    expect(within(row("pier.jpg")).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
    act(() => calls[0].context.onProcessing());
    expect(status("pier.jpg")).toBe("2 KB · Finishing up");
    /* Processing has no figure: the bar is indeterminate. */
    expect(within(row("pier.jpg")).getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  });

  it("uploads a few at a time, and the rest wait their turn", async () => {
    const { pick, calls, status } = setup({ concurrency: 2 });
    pick(photo("a.jpg"), photo("b.jpg"), photo("c.jpg"));
    expect(calls).toHaveLength(2);
    expect(status("c.jpg")).toBe("2 KB · Waiting");
    calls[0].resolve("1");
    await settle();
    expect(calls.map((c) => c.file.name)).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
    expect(status("c.jpg")).toBe("2 KB · Uploading");
  });

  it("shows why a file failed, and tries it again", async () => {
    const { pick, calls, status, row } = setup();
    pick(photo("pier.jpg"));
    calls[0].reject(new Error("The connection dropped."));
    await settle();
    expect(status("pier.jpg")).toBe("2 KB · Didn't upload. The connection dropped.");
    fireEvent.click(within(row("pier.jpg")).getByRole("button", { name: "Try pier.jpg again" }));
    expect(calls).toHaveLength(2);
    expect(status("pier.jpg")).toBe("2 KB · Uploading");
    /* Its Try again button went, so focus moves to its Remove, not the page. */
    expect(within(row("pier.jpg")).getByRole("button", { name: "Remove pier.jpg" })).toHaveFocus();
  });

  it("says something general when the app's error has no message", async () => {
    const { pick, calls, status } = setup();
    pick(photo("pier.jpg"));
    calls[0].reject("nope");
    await settle();
    expect(status("pier.jpg")).toBe("2 KB · Didn't upload. Something went wrong.");
  });

  it("turns away what the rules don't allow, says why, and never uploads it", () => {
    const { pick, calls, status } = setup({
      types: ["image/jpeg", "image/png"],
      maxSize: 1024 * 1024,
      maxFiles: 2,
      validate: (f) => (/\.hei[cf]$/i.test(f.name) ? "Export it as JPEG first." : undefined),
    });
    pick(
      photo("from-the-camera.heic", 2048, "image/heic"),
      photo("drawing.gif", 2048, "image/gif"),
      photo("huge.jpg", 2 * 1024 * 1024),
      photo("one.jpg"),
      photo("two.png", 2048, "image/png"),
      photo("three.jpg"),
    );
    expect(calls.map((c) => c.file.name)).toEqual(["one.jpg", "two.png"]);
    expect(status("from-the-camera.heic")).toBe("2 KB · Not added. Export it as JPEG first.");
    expect(status("drawing.gif")).toBe("2 KB · Not added. That type of file isn't accepted.");
    expect(status("huge.jpg")).toBe("2 MB · Not added. It's over 1 MB.");
    expect(status("three.jpg")).toBe("2 KB · Not added. Only 2 can be added.");
  });

  it("accepts a photo that arrives with no type by its extension, and not a text file", () => {
    const { pick, calls, status } = setup({ types: ["image/jpeg"] });
    pick(photo("IMG_0412.JPG", 2048, ""), photo("notes.txt", 2048, ""));
    expect(calls.map((c) => c.file.name)).toEqual(["IMG_0412.JPG"]);
    expect(status("notes.txt")).toBe("2 KB · Not added. That type of file isn't accepted.");
  });

  it("turns away the same file picked twice", () => {
    const { pick, calls, status } = setup();
    pick(photo("pier.jpg"));
    pick(photo("pier.jpg"));
    expect(calls).toHaveLength(1);
    expect(screen.getAllByText("pier.jpg")).toHaveLength(2);
    expect(screen.getAllByText("pier.jpg").map((el) => el.closest("li")!.dataset.status)).toEqual(["uploading", "rejected"]);
    void status;
  });

  it("frees a slot when a file is removed, and doesn't count turned-away files", () => {
    const { pick, calls, row } = setup({ maxFiles: 1 });
    pick(photo("a.jpg"), photo("b.jpg"));
    expect(row("b.jpg").dataset.status).toBe("rejected");
    fireEvent.click(within(row("a.jpg")).getByRole("button", { name: "Remove a.jpg" }));
    pick(photo("c.jpg"));
    expect(calls.map((c) => c.file.name)).toEqual(["a.jpg", "c.jpg"]);
  });

  it("aborts a removed file's upload, and ignores it if it finishes anyway", async () => {
    const { pick, calls, row, changes } = setup();
    pick(photo("a.jpg"), photo("b.jpg"));
    const signal = calls[0].context.signal;
    expect(signal.aborted).toBe(false);
    fireEvent.click(within(row("a.jpg")).getByRole("button", { name: "Remove a.jpg" }));
    expect(signal.aborted).toBe(true);
    /* The twin: the other file's signal is untouched. */
    expect(calls[1].context.signal.aborted).toBe(false);
    calls[0].resolve("late");
    await settle();
    expect(changes.at(-1)!.map((i) => i.file.name)).toEqual(["b.jpg"]);
    expect(screen.queryByText("a.jpg")).toBeNull();
  });

  it("ignores an upload that settles or reports after it's over", async () => {
    const { pick, calls, row, status, live } = setup();
    pick(photo("a.jpg"), photo("b.jpg"));
    fireEvent.click(within(row("a.jpg")).getByRole("button", { name: "Remove a.jpg" }));
    /* An aborted request rejects; a removed file doesn't then say it failed. */
    calls[0].reject(new DOMException("Removed", "AbortError"));
    await settle();
    await waitFor(() => expect(live()).toBe("2 photos added. a.jpg removed."));
    calls[1].resolve("2");
    await settle();
    act(() => {
      calls[1].context.onProcessing();
      calls[1].context.onProgress(0.5);
    });
    expect(status("b.jpg")).toBe("2 KB · Uploaded");
    /* The twin: the same call while it's still running does move it. */
    pick(photo("c.jpg"));
    act(() => calls[2].context.onProcessing());
    expect(status("c.jpg")).toBe("2 KB · Finishing up");
  });

  it("moves focus to the next file's Remove, then the previous one's, then Choose", () => {
    const { pick, row } = setup();
    pick(photo("a.jpg"), photo("b.jpg"), photo("c.jpg"));
    fireEvent.click(within(row("b.jpg")).getByRole("button", { name: "Remove b.jpg" }));
    expect(screen.getByRole("button", { name: "Remove c.jpg" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Remove c.jpg" }));
    expect(screen.getByRole("button", { name: "Remove a.jpg" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Remove a.jpg" }));
    expect(screen.getByRole("button", { name: "Choose photos" })).toHaveFocus();
  });

  it("keeps only the latest count when several land together", async () => {
    const { pick, calls, live } = setup();
    pick(photo("a.jpg"), photo("b.jpg"), photo("c.jpg"));
    calls[0].resolve("1");
    calls[1].reject(new Error("The server is busy."));
    calls[2].resolve("3");
    await waitFor(() => expect(live()).toBe("3 photos added. b.jpg didn't upload. The server is busy. 2 of 3 uploaded."));
  });

  it("announces what happened, politely, as one sentence per moment", async () => {
    const { pick, calls, live, container } = setup({ maxSize: 1024 });
    const region = container.querySelector("[data-file-live]")!;
    expect(region).toHaveAttribute("role", "status");
    expect(region).toHaveAttribute("aria-live", "polite");
    pick(photo("a.jpg", 100), photo("b.jpg", 100), photo("big.jpg", 4096));
    await waitFor(() => expect(live()).toBe("2 photos added. big.jpg wasn't added. It's over 1 KB."));
    calls[0].resolve("1");
    await waitFor(() => expect(live()).toBe("1 of 2 uploaded."));
    calls[1].reject(new Error("The server is busy."));
    await waitFor(() => expect(live()).toBe("b.jpg didn't upload. The server is busy."));
  });

  it("makes a thumbnail for each image and revokes it when the file goes", () => {
    const { pick, row } = setup();
    pick(photo("a.jpg"));
    const img = row("a.jpg").querySelector("img")!;
    expect(img).toHaveAttribute("src", "blob:thumb-1");
    expect(img).toHaveAttribute("alt", "");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    fireEvent.click(within(row("a.jpg")).getByRole("button", { name: "Remove a.jpg" }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:thumb-1");
  });

  it("shows a plain mark for an image the browser can't draw", () => {
    const { pick, row } = setup();
    pick(photo("a.heic", 2048, "image/heic"));
    fireEvent.error(row("a.heic").querySelector("img")!);
    expect(row("a.heic").querySelector("[data-file-thumb]")).toHaveAttribute("data-file-thumb", "placeholder");
  });

  it("adds dropped files, and ignores a drag that carries none", () => {
    const { calls, container } = setup();
    const zone = container.querySelector("[data-file-drop]")!;
    fireEvent.dragEnter(zone, { dataTransfer: { types: ["Files"], files: [] } });
    expect(zone).toHaveAttribute("data-dragging");
    fireEvent.drop(zone, { dataTransfer: { types: ["Files"], files: [photo("dropped.jpg")] } });
    expect(zone).not.toHaveAttribute("data-dragging");
    expect(calls.map((c) => c.file.name)).toEqual(["dropped.jpg"]);
    /* The twin: dragged text isn't a file. */
    fireEvent.dragEnter(zone, { dataTransfer: { types: ["text/plain"], files: [] } });
    expect(zone).not.toHaveAttribute("data-dragging");
  });

  it("takes nothing while disabled, a drop included", () => {
    const { calls, container, input } = setup({ disabled: true });
    const choose = screen.getByRole("button", { name: "Choose photos" });
    /* aria-disabled, not disabled: a field disabled under someone's focus keeps it. */
    expect(choose).toHaveAttribute("aria-disabled", "true");
    expect(choose).not.toBeDisabled();
    const click = vi.spyOn(input, "click");
    fireEvent.click(choose);
    expect(click).not.toHaveBeenCalled();
    const zone = container.querySelector("[data-file-drop]")!;
    const drop = fireEvent.drop(zone, { dataTransfer: { types: ["Files"], files: [photo("dropped.jpg")] } });
    /* Caught, so the browser doesn't open the file in place of the page. */
    expect(drop).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("leaves its buttons focusable when it's disabled mid-upload, and ignores them", async () => {
    const calls: Call[] = [];
    const upload = (file: File, context: FileUploadContext) =>
      new Promise<string>((resolve, reject) => calls.push({ file, context, resolve, reject }));
    const { rerender, container } = render(<FileUpload label="Photos" upload={upload} />);
    fireEvent.change(container.querySelector("input[type=file]")!, { target: { files: [photo("a.jpg"), photo("b.jpg")] } });
    calls[1].reject(new Error("No."));
    await settle();
    rerender(<FileUpload label="Photos" upload={upload} disabled />);
    const remove = screen.getByRole("button", { name: "Remove a.jpg" });
    const retry = screen.getByRole("button", { name: "Try b.jpg again" });
    expect([remove.getAttribute("aria-disabled"), retry.getAttribute("aria-disabled")]).toEqual(["true", "true"]);
    expect([remove.hasAttribute("disabled"), retry.hasAttribute("disabled")]).toEqual([false, false]);
    fireEvent.click(remove);
    fireEvent.click(retry);
    expect(screen.getByText("a.jpg")).toBeInTheDocument();
    expect(calls).toHaveLength(2);
    /* The twin: enabled again, Remove removes. */
    rerender(<FileUpload label="Photos" upload={upload} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove a.jpg" }));
    expect(screen.queryByText("a.jpg")).toBeNull();
  });

  it("restarts what was aborted when it's hidden and shown again", async () => {
    const calls: Call[] = [];
    const upload = (file: File, context: FileUploadContext) =>
      new Promise<string>((resolve, reject) => calls.push({ file, context, resolve, reject }));
    const field = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <FileUpload label="Photos" upload={upload} concurrency={1} />
      </Activity>
    );
    const { rerender, container } = render(field("visible"));
    fireEvent.change(container.querySelector("input[type=file]")!, { target: { files: [photo("a.jpg"), photo("b.jpg")] } });
    expect(calls).toHaveLength(1);
    rerender(field("hidden"));
    expect(calls[0].context.signal.aborted).toBe(true);
    rerender(field("visible"));
    /* a.jpg starts again on a fresh signal; b.jpg still waits for it. */
    expect(calls.map((c) => c.file.name)).toEqual(["a.jpg", "a.jpg"]);
    expect(calls[1].context.signal.aborted).toBe(false);
    calls[1].resolve("1");
    await settle();
    expect(calls.map((c) => c.file.name)).toEqual(["a.jpg", "a.jpg", "b.jpg"]);
    /* And the live region still speaks. */
    await waitFor(() => expect(container.querySelector("[data-file-live]")!.textContent!.trim()).toBe("1 of 2 uploaded."));
  });

  it("uploads one at a time when asked for none", () => {
    const { pick, calls } = setup({ concurrency: 0 });
    pick(photo("a.jpg"), photo("b.jpg"));
    expect(calls.map((c) => c.file.name)).toEqual(["a.jpg"]);
  });

  it("reports progress to the hundredth, not every byte", () => {
    const { pick, calls, changes } = setup();
    pick(photo("a.jpg"));
    const before = changes.length;
    act(() => {
      for (let i = 1; i <= 100; i++) calls[0].context.onProgress(i / 1000);
    });
    /* None to 0 (0.001 rounds down), then each hundredth to 0.1: eleven changes, not a hundred. */
    expect(changes.length - before).toBe(11);
    expect(changes.at(-1)![0].progress).toBe(0.1);
  });

  it("aborts what's in flight when it goes away", () => {
    const { pick, calls, unmount } = setup();
    pick(photo("a.jpg"));
    unmount();
    expect(calls[0].context.signal.aborted).toBe(true);
  });

  it("ties its help and error to the Choose button", () => {
    setup({ helperText: "JPEG or PNG, up to 10.", errorMessage: "Add at least one photo." });
    expect(screen.getByRole("button", { name: "Choose photos" })).toHaveAccessibleDescription(
      "JPEG or PNG, up to 10. Add at least one photo.",
    );
    expect(screen.getByRole("group", { name: "Photos" })).toBeInTheDocument();
  });

  it("says nothing in English once every string is replaced", async () => {
    const strings = {
      choose: "Elegir fotos",
      dropHint: "o arrástralas aquí",
      dropHere: "Suelta para añadir",
      queued: "En espera",
      uploading: (p: number | null) => `Subiendo ${p ?? ""}`,
      processing: "Terminando",
      done: "Subida",
      failed: "No se subió.",
      rejected: "No se añadió.",
      remove: (n: string) => `Quitar ${n}`,
      retry: (n: string) => `Reintentar ${n}`,
      wrongType: () => "Tipo no admitido.",
      tooLarge: () => "Demasiado grande.",
      tooMany: () => "Demasiadas.",
      duplicate: () => "Repetida.",
      uploadError: () => "Error de red.",
      size: () => "2 kB",
      added: (c: number) => `${c} añadidas.`,
      progress: (d: number, t: number) => `${d} de ${t} subidas.`,
      failedNotice: (n: string) => `${n} falló.`,
      rejectedNotice: (n: string) => `${n} rechazada.`,
      removed: (n: string) => `${n} quitada.`,
    };
    const { pick, calls, container } = setup({ strings, maxFiles: 3, maxSize: 4096, types: ["image/jpeg"], concurrency: 2 });
    /* Everything the live region ever says, not just the last thing. */
    const spoken: string[] = [];
    const region = container.querySelector("[data-file-live]")!;
    const observer = new MutationObserver(() => spoken.push(region.textContent ?? ""));
    observer.observe(region, { childList: true, subtree: true, characterData: true });
    pick(photo("a.jpg"), photo("b.jpg"), photo("c.jpg"), photo("d.gif", 10, "image/gif"), photo("e.jpg", 9000), photo("f.jpg"));
    pick(photo("a.jpg"));
    calls[0].resolve("1");
    calls[1].reject(new Error("Network error"));
    await settle();
    act(() => calls[2].context.onProcessing());
    fireEvent.click(screen.getAllByRole("button", { name: "Quitar a.jpg" })[0]);
    await waitFor(() => expect(spoken.join(" ")).toContain("a.jpg quitada."));
    observer.disconnect();
    const said = [
      container.textContent,
      ...[...container.querySelectorAll("[aria-label]")].map((el) => el.getAttribute("aria-label")),
      ...spoken,
    ].join(" ");
    /* Every state was reached: failed, rejected for each reason, removed. */
    for (const word of ["Reintentar b.jpg", "No se subió.", "Tipo no admitido.", "Demasiado grande.", "Demasiadas.", "Repetida.", "b.jpg falló.", "rechazada."]) {
      expect(said, word).toContain(word);
    }
    for (const english of ["Choose", "photo", "drag", "Drop", "Waiting", "Uploading", "Uploaded", "Finishing", "Remove", "Try", "Didn't", "Not added", "accepted", "over", "Only", "already", "added", "uploaded", "removed", "wrong", "KB"]) {
      expect(said, english).not.toContain(english);
    }
    /* The twin: the replaced words are there. */
    expect(said).toContain("Elegir fotos");
    expect(said).toContain("Quitar a.jpg");
    expect(said).toContain("Terminando");
  });
});
