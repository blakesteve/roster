import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { cn } from "../../../lib/utils";
import { Button } from "../../atoms/Button/Button";
import { acceptList, formatBytes, matchesType, sameFile } from "./file-rules";

/** Where a file is: waiting its turn, on its way, being handled by the app's server, or finished one way or another. */
export type FileUploadStatus = "queued" | "uploading" | "processing" | "done" | "failed" | "rejected";

/** What FileUpload hands `upload` with each file. */
export interface FileUploadContext {
  /** Report how much is sent, from 0 to 1. Without it the bar runs without a figure. */
  onProgress: (fraction: number) => void;
  /** Say the bytes are up and the app's server is working on them. */
  onProcessing: () => void;
  /** Aborts when the person removes the file, or the component goes away. */
  signal: AbortSignal;
}

/** A file in the list, as `onChange` reports it. */
export interface FileUploadItem<R = unknown> {
  id: string;
  file: File;
  status: FileUploadStatus;
  /** From 0 to 1 once the app reports any; `null` before. */
  progress: number | null;
  /** What `upload` resolved with, once `done`: an id to send with the form, say. */
  result?: R;
  /** Why it `failed`, or why it was `rejected`. */
  reason?: string;
}

/** Every word FileUpload shows or says. Pass any of them in `strings` to replace it. */
export interface FileUploadStrings {
  choose: string;
  /** Beside the button where a pointer can drag; hidden on touch screens. */
  dropHint: string;
  /** While files are dragged over. */
  dropHere: string;
  queued: string;
  uploading: (percent: number | null) => string;
  processing: string;
  done: string;
  failed: string;
  rejected: string;
  remove: (name: string) => string;
  retry: (name: string) => string;
  wrongType: (file: File) => string;
  tooLarge: (file: File, maxSize: number) => string;
  tooMany: (maxFiles: number) => string;
  duplicate: (file: File) => string;
  /** The reason shown when `upload` rejects. */
  uploadError: (error: unknown) => string;
  size: (bytes: number) => string;
  added: (count: number) => string;
  progress: (done: number, total: number) => string;
  failedNotice: (name: string, reason: string) => string;
  rejectedNotice: (name: string, reason: string) => string;
  removed: (name: string) => string;
}

const STRINGS: FileUploadStrings = {
  choose: "Choose photos",
  dropHint: "or drag them here",
  dropHere: "Drop to add them",
  queued: "Waiting",
  uploading: (percent) => (percent === null ? "Uploading" : `Uploading, ${percent}%`),
  processing: "Finishing up",
  done: "Uploaded",
  failed: "Didn't upload.",
  rejected: "Not added.",
  remove: (name) => `Remove ${name}`,
  retry: (name) => `Try ${name} again`,
  wrongType: () => "That type of file isn't accepted.",
  tooLarge: (_file, maxSize) => `It's over ${formatBytes(maxSize)}.`,
  tooMany: (maxFiles) => `Only ${maxFiles} can be added.`,
  duplicate: () => "It's already added.",
  uploadError: (error) => (error instanceof Error && error.message ? error.message : "Something went wrong."),
  size: formatBytes,
  added: (count) => `${count} ${count === 1 ? "photo" : "photos"} added.`,
  progress: (done, total) => `${done} of ${total} uploaded.`,
  failedNotice: (name, reason) => `${name} didn't upload. ${reason}`,
  rejectedNotice: (name, reason) => `${name} wasn't added. ${reason}`,
  removed: (name) => `${name} removed.`,
};

export interface FileUploadProps<R = unknown> {
  /** What the files are: "Photos". Names the group. */
  label: string;
  /**
   * Sends one file, and resolves when it's done with whatever the app needs
   * later (an id, a URL). Rejects with an Error whose message says why, and
   * that message is shown. FileUpload never sends anything itself.
   */
  upload: (file: File, context: FileUploadContext) => Promise<R>;
  /** Every change to the list, with each file's status and result. */
  onChange?: (items: FileUploadItem<R>[]) => void;
  /**
   * What the picker offers. Defaults to `"image/*"`, and on phones it should
   * stay that way. Android's Chrome opens the system photo picker, with its
   * albums and cloud photos, only when every accepted type is an image (or
   * video) type and there's no `capture`; an extension among them gets a plain
   * file browser. Exact types are riskier than they look: a picker that
   * filters by the type a photo reports can hide photos whose reported type
   * doesn't match. Narrow what's allowed with `types`, which is checked after
   * picking.
   */
  accept?: string;
  /**
   * The types allowed, checked on every picked or dropped file: `image/jpeg`,
   * `image/*` or `.png`. Defaults to `accept`. A file that arrives without a
   * type is judged by its extension.
   */
  types?: string[];
  /** The largest file allowed, in bytes. */
  maxSize?: number;
  /** How many files the list may hold, not counting the ones turned away. */
  maxFiles?: number;
  /**
   * The app's own rule: return why a file can't be added, or nothing. Runs
   * before the type and size rules, so its reason is the one shown.
   */
  validate?: (file: File) => string | null | undefined;
  /** How many files upload at once. The rest wait. */
  concurrency?: number;
  helperText?: ReactNode;
  /** A problem with the field as a whole, from the form: "Add at least one photo." */
  errorMessage?: string;
  disabled?: boolean;
  strings?: Partial<FileUploadStrings>;
  className?: string;
}

type Thumb = { status: FileUploadStatus; file: File };

/* A picture of the file, from an object URL made when the image mounts and
   revoked when it unmounts, in a ref callback with a cleanup rather than in
   state: a remount (React's strict mode does one) then makes a fresh URL
   instead of reusing a revoked one. A file the browser can't draw, such as
   HEIC outside Safari, or one that isn't an image, shows a plain mark. */
function Thumbnail({ file, status }: Thumb) {
  const [broken, setBroken] = useState(false);
  const image = !broken && (file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|avif|heic|heif)$/i.test(file.name));
  const attach = useCallback(
    (el: HTMLImageElement | null) => {
      if (!el) return;
      const url = URL.createObjectURL(file);
      el.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [file],
  );

  const frame = "rst:h-14 rst:w-14 rst:shrink-0 rst:rounded-md rst:border rst:border-[var(--roster-card-border)]";
  if (!image) {
    return (
      <span
        aria-hidden="true"
        className={cn(frame, "rst:flex rst:items-center rst:justify-center rst:text-gray-500 rst:dark:text-gray-400")}
        data-file-thumb="placeholder"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m21 15-4.2-4.2a1.6 1.6 0 0 0-2.3 0L7 18" />
        </svg>
      </span>
    );
  }
  /* Empty alt: the file's name sits beside it. */
  return (
    <img
      ref={attach}
      alt=""
      onError={() => setBroken(true)}
      className={cn(frame, "rst:object-cover", status === "rejected" && "rst:opacity-50")}
      data-file-thumb="image"
    />
  );
}

/* A disabled field's buttons are `aria-disabled`, not `disabled`: a form
   that disables the field while it sends would otherwise drop the focus of
   whoever was on Remove to the page. Headless UI's Button ignores presses on
   them, and this makes them look it. */
const DIMMED = "rst:cursor-not-allowed rst:opacity-50";

const ICON = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/**
 * Picks files, uploads each one through the app, and shows where each stands.
 *
 * The app owns every request: `upload` is called once per file, with a way to
 * report progress, a way to say the server is working on it, and a signal
 * that aborts when the file is removed. This owns picking, the rules, the
 * list, each file's state, the keyboard and what a screen reader hears.
 *
 * Choosing is a button, which works everywhere; dragging files onto the field
 * is an addition for a pointer, never the only way in.
 */
function FileUpload<R = unknown>({
  label,
  upload,
  onChange,
  accept = "image/*",
  types,
  maxSize,
  maxFiles,
  validate,
  concurrency = 3,
  helperText,
  errorMessage,
  disabled = false,
  strings: overrides,
  className,
}: FileUploadProps<R>) {
  const t = { ...STRINGS, ...overrides };
  const id = useId();
  const labelId = `${id}-label`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  const [items, setItems] = useState<FileUploadItem<R>[]>([]);
  const itemsRef = useRef(items);
  const nextId = useRef(0);
  const controllers = useRef(new Map<string, AbortController>());
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* The latest props, for callbacks that outlive the render that made them:
     an upload resolves long after the click that started it. */
  const latest = useRef({ upload, onChange, concurrency, t, pump: () => {} });

  /* ── The live region ─────────────────────────────────────────────────────
     Polite, and atomic so it's read whole. What happens in one task goes out
     as one sentence, so messages that arrive together don't replace each
     other before they're read; of the counts among them ("2 of 3 uploaded"),
     only the latest is kept. The counter alternates a trailing space, so the
     same sentence twice running is still a change. */
  const [live, setLive] = useState({ text: "", n: 0 });
  const said = useRef<{ text: string; count: boolean }[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = useCallback((text: string, count = false) => {
    if (count) said.current = said.current.filter((m) => !m.count);
    said.current.push({ text, count });
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      const joined = said.current.map((m) => m.text).join(" ");
      said.current = [];
      setLive((l) => ({ text: joined, n: l.n + 1 }));
    }, 0);
  }, []);

  /* ── Focus ───────────────────────────────────────────────────────────────
     A request carried out after the render that makes its target exist. A
     removed file's focus goes to the next file's Remove, else the previous
     one's, else the Choose button: never the page. */
  const focusRef = useRef<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const requestFocus = (selector: string) => {
    focusRef.current = selector;
    setFocusTick((n) => n + 1);
  };
  useLayoutEffect(() => {
    const selector = focusRef.current;
    if (!selector) return;
    focusRef.current = null;
    const target =
      rootRef.current?.querySelector<HTMLElement>(selector) ??
      rootRef.current?.querySelector<HTMLElement>("[data-file-choose]");
    target?.focus();
  }, [focusTick]);

  const commit = useCallback((next: FileUploadItem<R>[]) => {
    itemsRef.current = next;
    setItems(next);
    latest.current.onChange?.(next);
  }, []);
  const patch = useCallback(
    (itemId: string, change: Partial<FileUploadItem<R>>) => {
      if (!itemsRef.current.some((i) => i.id === itemId)) return;
      commit(itemsRef.current.map((i) => (i.id === itemId ? { ...i, ...change } : i)));
    },
    [commit],
  );

  /* ── Uploading ───────────────────────────────────────────────────────────
     Started from the event that queued a file or freed a slot, not from an
     effect that follows the list, so a re-render can't send a file twice. The
     one effect that starts any (below) only restarts what an unmount
     aborted. */
  function pump() {
    const { concurrency: limit } = latest.current;
    const running = itemsRef.current.filter((i) => i.status === "uploading" || i.status === "processing").length;
    const waiting = itemsRef.current.filter((i) => i.status === "queued").slice(0, Math.max(0, Math.max(1, limit) - running));
    for (const item of waiting) start(item);
  }

  function start(item: FileUploadItem<R>) {
    const controller = new AbortController();
    controllers.current.set(item.id, controller);
    patch(item.id, { status: "uploading", progress: null, reason: undefined });
    const current = () => !controller.signal.aborted && controllers.current.get(item.id) === controller;
    const context: FileUploadContext = {
      onProgress: (fraction) => {
        if (!current()) return;
        /* To the hundredth, which is all the bar and the percentage show, so
           a request that reports every few bytes doesn't re-render the list
           and call onChange for each. */
        const progress = Math.round(Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0)) * 100) / 100;
        const now = itemsRef.current.find((i) => i.id === item.id);
        if (now?.status === "uploading" && now.progress !== progress) patch(item.id, { progress });
      },
      onProcessing: () => {
        if (current()) patch(item.id, { status: "processing" });
      },
      signal: controller.signal,
    };
    new Promise<R>((resolve) => resolve(latest.current.upload(item.file, context))).then(
      (result) => {
        if (!current()) return;
        controllers.current.delete(item.id);
        patch(item.id, { status: "done", progress: 1, result });
        const counted = itemsRef.current.filter((i) => i.status !== "rejected");
        say(latest.current.t.progress(counted.filter((i) => i.status === "done").length, counted.length), true);
        pump();
      },
      (error: unknown) => {
        if (!current()) return;
        controllers.current.delete(item.id);
        const reason = latest.current.t.uploadError(error);
        patch(item.id, { status: "failed", reason });
        say(latest.current.t.failedNotice(item.file.name, reason));
        pump();
      },
    );
  }

  useLayoutEffect(() => {
    latest.current = { upload, onChange, concurrency, t, pump };
  });

  /* Abort what's in flight when the field goes away. It can come back with
     its state, hidden and shown again by an <Activity> or reloaded in place
     by Fast Refresh, and then the files that were aborted are queued again
     and started. A first mount has none. */
  useEffect(() => {
    const map = controllers.current;
    const aborted = itemsRef.current.some((i) => (i.status === "uploading" || i.status === "processing") && !map.has(i.id));
    if (aborted) {
      commit(
        itemsRef.current.map((i) =>
          (i.status === "uploading" || i.status === "processing") && !map.has(i.id)
            ? { ...i, status: "queued" as const, progress: null }
            : i,
        ),
      );
      latest.current.pump();
    }
    return () => {
      for (const c of map.values()) c.abort();
      map.clear();
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = null;
      said.current = [];
    };
  }, [commit]);

  /* ── Adding ──────────────────────────────────────────────────────────── */
  const allowed = types ?? acceptList(accept);
  const reasonFor = (file: File, kept: FileUploadItem<R>[]): string | undefined => {
    if (kept.some((i) => sameFile(i.file, file))) return t.duplicate(file);
    const own = validate?.(file);
    if (own) return own;
    if (!matchesType(file, allowed)) return t.wrongType(file);
    if (maxSize !== undefined && file.size > maxSize) return t.tooLarge(file, maxSize);
    if (maxFiles !== undefined && kept.length >= maxFiles) return t.tooMany(maxFiles);
    return undefined;
  };

  const add = (files: File[]) => {
    if (disabled || files.length === 0) return;
    const kept = itemsRef.current.filter((i) => i.status !== "rejected");
    const added: FileUploadItem<R>[] = [];
    for (const file of files) {
      const reason = reasonFor(file, [...kept, ...added.filter((i) => i.status !== "rejected")]);
      added.push({ id: `${id}-file-${nextId.current++}`, file, status: reason ? "rejected" : "queued", progress: null, reason });
    }
    commit([...itemsRef.current, ...added]);
    const accepted = added.filter((i) => i.status === "queued").length;
    if (accepted) say(t.added(accepted));
    for (const i of added) if (i.reason) say(t.rejectedNotice(i.file.name, i.reason));
    pump();
  };

  const remove = (itemId: string) => {
    if (disabled) return;
    const list = itemsRef.current;
    const index = list.findIndex((i) => i.id === itemId);
    if (index < 0) return;
    controllers.current.get(itemId)?.abort();
    controllers.current.delete(itemId);
    const neighbor = list[index + 1] ?? list[index - 1];
    commit(list.filter((i) => i.id !== itemId));
    say(t.removed(list[index].file.name));
    requestFocus(neighbor ? `[data-file-remove="${neighbor.id}"]` : "[data-file-choose]");
    pump();
  };

  const retry = (itemId: string) => {
    if (disabled) return;
    patch(itemId, { status: "queued", progress: null, reason: undefined });
    /* Its Try again button goes; its Remove is the nearest thing that stays. */
    requestFocus(`[data-file-remove="${itemId}"]`);
    pump();
  };

  /* ── Dragging ────────────────────────────────────────────────────────────
     Counted rather than toggled: dragging across the field's own children
     fires a leave for every enter, and a toggle would flicker. Only a drag
     carrying files counts. A drop is always caught, even while disabled, so
     a file let go over the field never replaces the page with itself. */
  const [dragDepth, setDragDepth] = useState(0);
  const carriesFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
  const drag = {
    onDragEnter: (e: DragEvent<HTMLDivElement>) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      setDragDepth((d) => d + 1);
    },
    onDragOver: (e: DragEvent<HTMLDivElement>) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = disabled ? "none" : "copy";
    },
    onDragLeave: (e: DragEvent<HTMLDivElement>) => {
      if (!carriesFiles(e)) return;
      setDragDepth((d) => Math.max(0, d - 1));
    },
    onDrop: (e: DragEvent<HTMLDivElement>) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      setDragDepth(0);
      add(Array.from(e.dataTransfer.files));
    },
  };
  const dragging = dragDepth > 0 && !disabled;

  const statusText = (item: FileUploadItem<R>) => {
    switch (item.status) {
      case "queued":
        return t.queued;
      case "uploading":
        return t.uploading(item.progress === null ? null : Math.round(item.progress * 100));
      case "processing":
        return t.processing;
      case "done":
        return t.done;
      case "failed":
        return `${t.failed} ${item.reason ?? ""}`.trim();
      case "rejected":
        return `${t.rejected} ${item.reason ?? ""}`.trim();
    }
  };

  const describedBy = [helperText ? helpId : null, errorMessage ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div
      ref={rootRef}
      role="group"
      aria-labelledby={labelId}
      className={cn("rst:font-ui rst:w-full", className)}
      data-file-upload=""
    >
      <p
        id={labelId}
        className={cn(
          "rst:mb-1.5 rst:text-left rst:text-sm rst:font-medium rst:leading-none rst:text-[var(--roster-control-text)]",
          disabled && "rst:opacity-70",
        )}
      >
        {label}
      </p>

      <div
        {...drag}
        data-file-drop=""
        data-dragging={dragging ? "" : undefined}
        className={cn(
          "rst:flex rst:flex-col rst:items-center rst:justify-center rst:gap-2 rst:rounded-lg rst:border-2 rst:border-dashed rst:px-4 rst:py-6 rst:text-center rst:transition-colors rst:motion-reduce:transition-none",
          dragging
            ? "rst:border-primary-500 rst:bg-primary-500/10"
            : errorMessage
              ? "rst:border-error-500 rst:dark:border-error-400"
              : "rst:border-gray-300 rst:dark:border-gray-600",
        )}
      >
        <Button
          type="button"
          variant="outline"
          colorScheme="neutral"
          size="lg"
          className={cn("rst:px-5", disabled && DIMMED)}
          aria-disabled={disabled || undefined}
          aria-describedby={describedBy}
          onClick={() => inputRef.current?.click()}
          data-file-choose=""
          startIcon={
            <svg {...ICON} aria-hidden="true">
              <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
            </svg>
          }
        >
          {t.choose}
        </Button>
        {/* For a pointer that can drag; a touch screen can't drop files here. */}
        <p
          className="rst:hidden rst:text-xs rst:text-gray-600 rst:pointer-fine:block rst:dark:text-gray-400"
          data-file-drop-hint=""
        >
          {dragging ? t.dropHere : t.dropHint}
        </p>
        <input
          ref={inputRef}
          type="file"
          hidden
          tabIndex={-1}
          accept={accept}
          multiple={maxFiles !== 1}
          disabled={disabled}
          onChange={(e) => {
            add(Array.from(e.currentTarget.files ?? []));
            /* Cleared, so picking the same file again still says so. */
            e.currentTarget.value = "";
          }}
          data-file-input=""
        />
      </div>

      {helperText && (
        <p id={helpId} className="rst:mt-1.5 rst:text-left rst:text-xs rst:text-gray-500 rst:dark:text-gray-400">
          {helperText}
        </p>
      )}
      {errorMessage && (
        <p id={errorId} className="rst:mt-1.5 rst:text-left rst:text-xs rst:font-medium rst:text-error-600 rst:dark:text-error-400">
          {errorMessage}
        </p>
      )}

      {items.length > 0 && (
        <ul className="rst:mt-3 rst:flex rst:flex-col rst:gap-2" aria-labelledby={labelId}>
          {items.map((item) => {
            const problem = item.status === "failed" || item.status === "rejected";
            const moving = item.status === "uploading" || item.status === "processing" || item.status === "queued";
            return (
              <li
                key={item.id}
                data-file-item={item.id}
                data-status={item.status}
                className="rst:flex rst:items-center rst:gap-3 rst:rounded-md rst:border rst:border-[var(--roster-card-border)] rst:p-2"
              >
                <Thumbnail file={item.file} status={item.status} />
                <div className="rst:min-w-0 rst:flex-1 rst:text-left">
                  <p className="rst:truncate rst:text-sm rst:font-medium rst:text-[var(--roster-control-text)]" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p
                    className={cn(
                      "rst:mt-0.5 rst:flex rst:items-start rst:gap-1 rst:text-xs",
                      problem ? "rst:text-error-600 rst:dark:text-error-400" : "rst:text-gray-600 rst:dark:text-gray-400",
                    )}
                    data-file-status=""
                  >
                    {item.status === "done" && (
                      <svg {...ICON} width={14} height={14} aria-hidden="true" className="rst:mt-px rst:shrink-0 rst:text-success-600 rst:dark:text-success-400">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                    <span>
                      <span className="rst:tabular-nums">{t.size(item.file.size)}</span>
                      <span aria-hidden="true"> · </span>
                      {statusText(item)}
                    </span>
                  </p>
                  {moving && (
                    <div
                      role="progressbar"
                      aria-label={item.file.name}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={item.status === "uploading" && item.progress !== null ? Math.round(item.progress * 100) : undefined}
                      className={cn(
                        "rst:mt-1.5 rst:h-1.5 rst:overflow-hidden rst:rounded-full rst:bg-gray-200 rst:dark:bg-gray-700",
                        /* Under way with no figure yet: the track pulses and the
                           fill waits at zero, so the first figure grows it
                           rather than shrinking a full bar. */
                        item.status === "uploading" && item.progress === null && "rst:animate-pulse rst:motion-reduce:animate-none",
                      )}
                      data-file-progress=""
                    >
                      <div
                        className={cn(
                          "rst:h-full rst:origin-left rst:rounded-full rst:bg-primary-600 rst:transition-transform rst:motion-reduce:transition-none rst:dark:bg-primary-400",
                          /* On the server: full, and pulsing, since there's no figure to give. */
                          item.status === "processing" && "rst:animate-pulse rst:motion-reduce:animate-none",
                        )}
                        style={{
                          transform: `scaleX(${item.status === "processing" ? 1 : item.status === "uploading" ? (item.progress ?? 0) : 0})`,
                        }}
                      />
                    </div>
                  )}
                </div>
                {item.status === "failed" && (
                  <Button
                    type="button"
                    variant="ghost"
                    colorScheme="neutral"
                    size="icon"
                    className={cn("rst:h-11 rst:w-11", disabled && DIMMED)}
                    aria-disabled={disabled || undefined}
                    aria-label={t.retry(item.file.name)}
                    onClick={() => retry(item.id)}
                    data-file-retry={item.id}
                  >
                    <svg {...ICON} aria-hidden="true">
                      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  colorScheme="neutral"
                  size="icon"
                  className={cn("rst:h-11 rst:w-11", disabled && DIMMED)}
                  aria-disabled={disabled || undefined}
                  aria-label={t.remove(item.file.name)}
                  onClick={() => remove(item.id)}
                  data-file-remove={item.id}
                >
                  <svg {...ICON} aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="rst:sr-only"
        data-file-live=""
        data-file-live-n={live.n}
      >
        {live.text}
        {live.n % 2 ? " " : ""}
      </div>
    </div>
  );
}

export { FileUpload };
