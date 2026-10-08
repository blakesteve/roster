import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "../../../lib/utils";
import { Button, type ButtonProps } from "../../atoms/Button/Button";
import { Card } from "../../atoms/Card/Card";
import { Spinner } from "../../atoms/Spinner/Spinner";
import { Textarea } from "../../atoms/Textarea/Textarea";
import { Alert } from "../../molecules/Alert/Alert";
import { EmptyState } from "../../molecules/EmptyState/EmptyState";
import { RadioGroup } from "../../molecules/RadioGroup/RadioGroup";
import {
  editAction,
  type QueueAction,
  type QueueActionKit,
  type QueueCheckedEditAction,
  type QueueEditAction,
  type QueueHeadingLevel,
  type QueueReason,
  type QueueReasonStep,
  type QueueRunResult,
  type QueueTone,
} from "./queue-actions";

export interface ModerationQueueProps<T> {
  /** The queue's heading, and the list's accessible name. */
  label: string;
  /** Keep the heading for assistive technology only, when the page already titles the queue. */
  hideLabel?: boolean;
  /** The queue heading's level. `2` by default. */
  headingLevel?: QueueHeadingLevel;
  /** Each item's heading level. One below `headingLevel` by default. */
  itemHeadingLevel?: QueueHeadingLevel;
  /** What's waiting. Remove an item once its decision lands; the queue notices. */
  items: readonly T[];
  getKey: (item: T) => string;
  /** The item's heading, and what announcements call it: "Recipe from Dana". */
  itemLabel: (item: T) => string;
  /** Beside the heading: badges, a time, who sent it. */
  renderMeta?: (item: T) => ReactNode;
  /** The item's body: its text, its previews, links out. */
  renderContent: (item: T) => ReactNode;
  /**
   * What a reviewer can decide. A list, or a function returning one: the
   * function form is handed `edit`, which types an edit action's draft, and
   * is the one to use inline in JSX.
   *
   *   actions={(a) => [
   *     { id: "approve", label: "Approve", run: (r) => approve(r.id) },
   *     a.edit({ id: "edit", label: "Edit", edit: { initial: (r) => ({ … }), … },
   *              run: (r, { draft }) => save(r.id, draft) }),
   *   ]}
   */
  actions: readonly QueueAction<T>[] | ((kit: QueueActionKit<T>) => readonly QueueAction<T>[]);
  /** `"loading"` before the first answer, `"error"` when the queue itself can't load. */
  status?: "ready" | "loading" | "error";
  /** The whole-queue error, shown with a Retry when `onRetry` is passed. */
  error?: ReactNode;
  onRetry?: () => void;
  empty?: { title: string; description?: string };
  density?: "comfortable" | "compact";
  /** After the list: "Load more", if the app pages. */
  footer?: ReactNode;
  className?: string;
}

/* An open step. Inline steps live one per item, so a reviewer can have a
   reason half-written on one item while another's decision lands. A step in a
   surface is modal, so there is only ever one of those. */
type Step<T> = {
  key: string;
  label: string;
  /** The item as it was when the step opened; `run` gets the current one. */
  item: T;
  action: QueueAction<T>;
  draft: unknown;
  reason: QueueReason;
  /** In a Dialog or Sheet rather than in the item. */
  surface: boolean;
  /** A surface is on screen; false while it plays its exit. */
  open: boolean;
  error?: string;
};

type FocusTarget =
  | { kind: "item"; key: string }
  | { kind: "empty" }
  | { kind: "trigger"; key: string; actionId: string }
  | { kind: "step"; key: string };

type Outcome = { actionId: string; sentence: string; announce?: string };

const TONE: Record<QueueTone, Pick<ButtonProps, "colorScheme" | "variant">> = {
  primary: { colorScheme: "primary", variant: "solid" },
  success: { colorScheme: "success", variant: "solid" },
  danger: { colorScheme: "error", variant: "soft" },
  neutral: { colorScheme: "neutral", variant: "outline" },
};

const KIT: QueueActionKit<unknown> = { edit: editAction };

/** The checked edit action as it really is, for the queue's own use. */
const editOf = <T,>(action: QueueAction<T>): QueueEditAction<T, unknown> | null =>
  action.edit ? (action as unknown as QueueEditAction<T, unknown>) : null;

const countLeft = (n: number) => (n === 0 ? "None left." : `${n} left.`);
const level = (n: number) => Math.min(6, Math.max(1, n)) as QueueHeadingLevel;
const messageOf = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "Something went wrong.";

function without<V>(record: Record<string, V>, key: string): Record<string, V> {
  const next = { ...record };
  delete next[key];
  return next;
}

/**
 * A Button that stays focusable while it works or while it can't be pressed
 * yet. `isLoading` covers the first. For the second, `aria-disabled` rather
 * than `disabled`: a browser drops focus from a disabled element to the page,
 * so a keyboard user who pressed Approve would be sent back to the top.
 * `aria-disabled` says the same thing to a screen reader and keeps them where
 * they are.
 */
function QueueButton({
  busy = false,
  blocked = false,
  onClick,
  children,
  className,
  ...props
}: ButtonProps & { busy?: boolean; blocked?: boolean }) {
  return (
    <Button
      size="lg"
      {...props}
      isLoading={busy}
      aria-disabled={blocked || undefined}
      className={cn(blocked && !busy && "rst:cursor-not-allowed rst:opacity-50", className)}
      onClick={(e) => {
        /* Headless UI's Button already drops click handlers on an
           `aria-disabled` element; this keeps the promise if it ever stops. */
        if (blocked) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
}

/**
 * A queue of things waiting for a decision: submissions to approve, reports to
 * resolve, claims to check before they publish.
 *
 * The app owns the data and every request; this owns the layout, the states,
 * the steps and the keyboard. It never fetches. An action's `run` is the only
 * path from a decision to the network, and the app says whether the item has
 * left by removing it from `items`.
 *
 * What it promises, each pinned in ModerationQueue.checks.stories.tsx:
 *   - Only the clicked action is busy, and it keeps focus while it is. That
 *     item's other actions wait; every other item stays live.
 *   - A decision that lands and removes the item is announced with how many
 *     are left, and focus moves to the next item, the previous one, or the
 *     empty state. Never to the page.
 *   - A decision that fails leaves the item where it was, says why, and leaves
 *     focus on the button that tried. A step stays open with its draft.
 *   - Confirm, reason and edit steps open in place (an edit may open in a
 *     Dialog or Sheet instead), take focus, and give it back on Escape.
 *   - An item that disappears for any other reason, with its step open,
 *     closes the step without deciding and is announced once as decided
 *     elsewhere. Focus moves only if it was inside the item.
 *   - Several outcomes in one render are said in one sentence.
 */
function ModerationQueue<T>({
  label,
  hideLabel = false,
  headingLevel = 2,
  itemHeadingLevel,
  items,
  getKey,
  itemLabel,
  renderMeta,
  renderContent,
  actions: actionsProp,
  status = "ready",
  error,
  onRetry,
  empty = { title: "Nothing waiting" },
  density = "comfortable",
  footer,
  className,
}: ModerationQueueProps<T>) {
  const actions = typeof actionsProp === "function" ? actionsProp(KIT as QueueActionKit<T>) : actionsProp;
  const id = useId();
  const rootRef = useRef<HTMLElement>(null);
  const keys = items.map(getKey);
  /* The current item for a key, so a decision runs on what's listed now
     rather than on what the step opened with. */
  const itemsRef = useRef(new Map<string, T>());
  itemsRef.current = new Map(items.map((item, i) => [keys[i], item]));

  /* Decisions in flight, by item. Mirrored in a ref for the effect below,
     which has to know about one in the same render that sees its item go. */
  const [pending, setPendingState] = useState<Record<string, string>>({});
  const pendingRef = useRef<Record<string, string>>({});
  const setPending = (update: (p: Record<string, string>) => Record<string, string>) => {
    pendingRef.current = update(pendingRef.current);
    setPendingState(pendingRef.current);
  };
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [steps, setStepsState] = useState<Record<string, Step<T>>>({});
  const stepsRef = useRef<Record<string, Step<T>>>({});
  const setStep = (key: string, next: Step<T> | null) => {
    stepsRef.current = next ? { ...stepsRef.current, [key]: next } : without(stepsRef.current, key);
    setStepsState(stepsRef.current);
  };

  /* ── The live region ─────────────────────────────────────────────────────
     Polite, and atomic so it's read whole. Everything said in one task goes
     out as one sentence, flushed once the task is done: outcomes that settle
     together (a failure and a landing in the same tick, say) arrive over
     several renders, and a region replaced before a screen reader reads it
     loses the first. The counter alternates a trailing no-break space, so the
     same sentence twice running is still a change. */
  const [live, setLive] = useState({ text: "", n: 0 });
  const said = useRef<string[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = useCallback((text: string) => {
    said.current.push(text);
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      const joined = said.current.join(" ");
      said.current = [];
      setLive((l) => ({ text: joined, n: l.n + 1 }));
    }, 0);
  }, []);
  useLayoutEffect(
    () => () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
    },
    [],
  );

  /* ── Focus ───────────────────────────────────────────────────────────────
     A request, carried out after the render that makes its target exist. If
     the target has gone by then (its item left too), the nearest thing that
     hasn't: the first item, or the empty state. Never the page. */
  const [focusTick, setFocusTick] = useState(0);
  const focusRef = useRef<FocusTarget | null>(null);
  const requestFocus = useCallback((target: FocusTarget) => {
    focusRef.current = target;
    setFocusTick((t) => t + 1);
  }, []);
  const find = useCallback((target: FocusTarget): HTMLElement | null => {
    const root = rootRef.current;
    if (!root) return null;
    const k = "key" in target ? CSS.escape(target.key) : "";
    switch (target.kind) {
      case "item":
        return root.querySelector(`[data-queue-item="${k}"]`);
      case "empty":
        return root.querySelector("[data-queue-empty]");
      case "trigger":
        return root.querySelector(`[data-queue-item="${k}"] [data-queue-action="${CSS.escape(target.actionId)}"]`);
      case "step":
        return root.querySelector(`[data-queue-item="${k}"] [data-queue-step]`);
    }
  }, []);
  useLayoutEffect(() => {
    const target = focusRef.current;
    if (!target) return;
    focusRef.current = null;
    const el =
      find(target) ??
      rootRef.current?.querySelector<HTMLElement>("[data-queue-item]") ??
      rootRef.current?.querySelector<HTMLElement>("[data-queue-empty]");
    el?.focus();
  }, [focusTick, find]);

  /* Which item focus was last inside. Kept through a blur with nowhere to go,
     which is what removing the focused element looks like: focus falls to the
     page, and this remembers whose it was. */
  const lastFocusKey = useRef<string | null>(null);
  const onItemFocus = (key: string) => () => {
    lastFocusKey.current = key;
  };
  const onRootBlur = (e: FocusEvent) => {
    if (e.relatedTarget && !rootRef.current?.contains(e.relatedTarget as Node)) {
      lastFocusKey.current = null;
    }
  };
  /* Focus is still this item's to place: it was last inside the item, and
     hasn't since been taken anywhere else in the page. A reviewer who moved
     on to another item while a decision was in flight keeps their place. */
  const focusIsHome = (key: string) => {
    if (lastFocusKey.current !== key) return false;
    const active = document.activeElement;
    if (!active || active === document.body) return true;
    if (!rootRef.current?.contains(active)) return false;
    return !!active.closest(`[data-queue-item="${CSS.escape(key)}"]`);
  };

  /* Where focus goes once the open surface has finished closing. Placed by
     the queue, not left to Headless UI, which restores focus to wherever it
     was before the surface opened: that may be a button that no longer
     exists. */
  const afterSurface = useRef<FocusTarget | null>(null);
  const closeSurface = (s: Step<T>, target: FocusTarget | null) => {
    afterSurface.current = target;
    setStep(s.key, { ...s, open: false });
  };

  /* ── Noticing items leave ────────────────────────────────────────────────
     Compared by key, after every render. Each decision of ours that resolved
     is recorded in `outcomes`, so this can tell "approved" from "gone" and
     "kept". */
  const prevKeys = useRef<string[]>(keys);
  const outcomes = useRef(new Map<string, Outcome>());
  /* Forces the render below when an app keeps the item and changes nothing,
     so the "kept" outcome is still announced. */
  const [, setSettleTick] = useState(0);
  /* Items that left while their own decision was still in flight. That
     decision settles them; nobody else decided them. */
  const goneWhilePending = useRef(new Set<string>());

  const nextFocus = (gone: string, before: string[], now: Set<string>): FocusTarget => {
    const at = before.indexOf(gone);
    const after = before.slice(at + 1).find((k) => now.has(k));
    if (after) return { kind: "item", key: after };
    const prior = before.slice(0, at).reverse().find((k) => now.has(k));
    return prior ? { kind: "item", key: prior } : { kind: "empty" };
  };

  /* No dependency list on purpose: it compares this render's keys with the
     last render's, so it has to see every render. Each update it makes is
     guarded and settles in one pass. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const before = prevKeys.current;
    prevKeys.current = keys;
    const now = new Set(keys);
    const landed = outcomes.current;
    outcomes.current = new Map();
    const parts: string[] = [];
    let departed = false;

    for (const [key, outcome] of landed) {
      const kept = now.has(key);
      parts.push(outcome.announce ?? outcome.sentence);
      if (!kept) departed = true;
      goneWhilePending.current.delete(key);
      /* An item that left in an earlier render had its focus placed then. */
      const target: FocusTarget | null = kept
        ? { kind: "trigger", key, actionId: outcome.actionId }
        : before.includes(key)
          ? nextFocus(key, before, now)
          : null;
      const s = stepsRef.current[key];
      if (s?.surface) {
        closeSurface(s, target ?? { kind: "empty" });
      } else {
        const home = focusIsHome(key);
        if (s) setStep(key, null);
        if (target && home) requestFocus(target);
      }
    }

    for (const gone of before.filter((k) => !now.has(k))) {
      if (landed.has(gone)) continue;
      setErrors((e) => (gone in e ? without(e, gone) : e));
      const target = nextFocus(gone, before, now);
      const after = afterSurface.current;
      if (after && "key" in after && after.key === gone) afterSurface.current = target;
      if (pendingRef.current[gone]) {
        /* Its own decision is still in flight, and settles it. Focus can't
           wait for that: the focused button went with the item. */
        goneWhilePending.current.add(gone);
        if (focusIsHome(gone)) requestFocus(target);
        continue;
      }
      const s = stepsRef.current[gone];
      if (s && !(s.surface && !s.open)) {
        /* Decided by someone else, or reloaded away, with its step open:
           close the step without deciding, and say so. */
        parts.push(`${s.label} was decided elsewhere.`);
        departed = true;
        if (s.surface) closeSurface(s, target);
        else {
          const home = focusIsHome(gone);
          setStep(gone, null);
          if (home) requestFocus(target);
        }
      } else if (!s && focusIsHome(gone)) {
        requestFocus(target);
      }
    }

    if (parts.length) say(`${parts.join(" ")}${departed ? ` ${countLeft(keys.length)}` : ""}`);
    // `keys` is recomputed each render; comparing it is the point.
  });

  /* ── Deciding ──────────────────────────────────────────────────────────── */
  const decide = async (key: string, fallbackItem: T, action: QueueAction<T>, input: object) => {
    const item = itemsRef.current.get(key) ?? fallbackItem;
    const name = itemLabel(item);
    const run = (action.edit ? editOf(action)!.run : action.run) as (i: T, x: object) => Promise<QueueRunResult>;
    setPending((p) => ({ ...p, [key]: action.id }));
    setErrors((e) => without(e, key));
    try {
      const result = await run(item, input);
      outcomes.current.set(key, {
        actionId: action.id,
        sentence: `${action.done ?? action.label}: ${name}.`,
        announce: result ? result.announce : undefined,
      });
      setSettleTick((t) => t + 1);
    } catch (err) {
      const message = messageOf(err);
      say(`${action.label} didn't go through for ${name}. ${message}`);
      const s = stepsRef.current[key];
      if (goneWhilePending.current.delete(key)) {
        /* The item left anyway (a reload after a conflict, say). There's
           nothing to show the error on, and focus already moved with it. */
        if (s?.surface) closeSurface(s, { kind: "empty" });
        else if (s) setStep(key, null);
      } else if (s) {
        /* A step keeps its draft and shows the error where the reviewer is. */
        setStep(key, { ...s, error: message });
      } else {
        setErrors((e) => ({ ...e, [key]: message }));
      }
    } finally {
      setPending((p) => without(p, key));
    }
  };

  const open = (item: T, action: QueueAction<T>) => {
    const key = getKey(item);
    const edit = editOf(action);
    if (!action.confirm && !action.reason && !edit) {
      void decide(key, item, action, {});
      return;
    }
    setErrors((e) => without(e, key));
    setStep(key, {
      key,
      label: itemLabel(item),
      item,
      action,
      draft: edit ? edit.edit.initial(item) : undefined,
      reason: {},
      surface: !!edit?.edit.surface,
      open: true,
    });
    if (!edit?.edit.surface) requestFocus({ kind: "step", key });
  };

  const cancel = (key: string) => {
    const s = stepsRef.current[key];
    if (!s || pendingRef.current[key]) return;
    const target: FocusTarget = { kind: "trigger", key, actionId: s.action.id };
    if (s.surface) closeSurface(s, target);
    else {
      setStep(key, null);
      requestFocus(target);
    }
  };

  const submit = (key: string) => {
    const s = stepsRef.current[key];
    if (!s || pendingRef.current[key] || blockedReason(s, itemsRef.current.get(key) ?? s.item)) return;
    if (s.action.edit) void decide(key, s.item, s.action, { draft: s.draft });
    else if (s.action.reason) void decide(key, s.item, s.action, { reason: cleanReason(s.reason) });
    else void decide(key, s.item, s.action, {});
  };

  const onSurfaceClosed = (key: string) => {
    const target = afterSurface.current;
    afterSurface.current = null;
    setStep(key, null);
    if (target) requestFocus(target);
  };

  /* ── Rendering ─────────────────────────────────────────────────────────── */
  const Heading = `h${headingLevel}` as const;
  const itemLevel = itemHeadingLevel ?? level(headingLevel + 1);
  const ItemHeading = `h${itemLevel}` as const;
  const headingId = `${id}-label`;

  /* Ids come from the item's position, not its key: a key may hold spaces,
     and `aria-labelledby` splits on them. */
  const stepParts = (s: Step<T>, index: number) => {
    const { action } = s;
    const edit = editOf(action);
    const current = itemsRef.current.get(s.key) ?? s.item;
    const busy = !!pending[s.key];
    const blocked = blockedReason(s, current);
    const messageId = `${id}-step-${index}-message`;
    const submitButton = (
      <QueueButton
        {...TONE[action.tone ?? "neutral"]}
        busy={busy}
        blocked={!!blocked}
        aria-describedby={blocked ? messageId : undefined}
        onClick={() => submit(s.key)}
        data-queue-submit=""
      >
        {edit ? edit.edit.submitLabel : action.label}
      </QueueButton>
    );
    const cancelButton = (
      <QueueButton variant="ghost" colorScheme="neutral" blocked={busy} onClick={() => cancel(s.key)}>
        Cancel
      </QueueButton>
    );
    const fields = (
      <>
        {action.reason && (
          <ReasonFields
            id={`${id}-step-${index}`}
            step={action.reason}
            value={s.reason}
            disabled={busy}
            onChange={(reason) => setStep(s.key, { ...stepsRef.current[s.key], reason })}
          />
        )}
        {edit && (
          <edit.edit.Form
            item={current}
            value={s.draft}
            onChange={(draft: unknown) => setStep(s.key, { ...stepsRef.current[s.key], draft })}
          />
        )}
        {blocked && (
          <p id={messageId} className="rst:text-sm rst:text-error-600 rst:dark:text-error-400" data-queue-validation="">
            {blocked}
          </p>
        )}
        {/* Not a live region of its own: the polite sentence already says
            what failed and on which item, and an assertive alert on top would
            cut it off. */}
        {s.error && (
          <Alert colorScheme="error" role="group" aria-live="off">
            {s.error}
          </Alert>
        )}
      </>
    );
    return { submitButton, cancelButton, fields };
  };

  const inlineStep = (s: Step<T>, index: number) => {
    const { submitButton, cancelButton, fields } = stepParts(s, index);
    const promptId = `${id}-step-${index}-prompt`;
    const edit = editOf(s.action);
    const prompt = s.action.confirm?.prompt ?? s.action.reason?.prompt ?? edit?.edit.title;
    return (
      <div
        role="group"
        aria-labelledby={promptId}
        tabIndex={-1}
        data-queue-step=""
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            cancel(s.key);
          }
        }}
        className="rst:flex rst:flex-col rst:gap-3 rst:rounded-lg rst:border rst:border-[var(--roster-card-border)] rst:p-4 rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring"
      >
        <p id={promptId} className="rst:text-sm rst:font-medium rst:text-[var(--roster-control-text)]">
          {prompt}
        </p>
        {edit?.edit.description && (
          <p className="rst:text-sm rst:text-gray-600 rst:dark:text-gray-300">{edit.edit.description}</p>
        )}
        {fields}
        <div className="rst:flex rst:flex-wrap rst:gap-2">
          {submitButton}
          {cancelButton}
        </div>
      </div>
    );
  };

  const actionBar = (item: T, key: string) => {
    const busyAction = pending[key];
    return (
      <div role="group" aria-label={`Decide: ${itemLabel(item)}`} className="rst:flex rst:flex-wrap rst:gap-2">
        {actions
          .filter((a) => !a.hidden?.(item))
          .map((action) => (
            <QueueButton
              key={action.id}
              {...TONE[action.tone ?? "neutral"]}
              data-queue-action={action.id}
              busy={busyAction === action.id}
              blocked={!!busyAction && busyAction !== action.id}
              onClick={() => open(item, action)}
            >
              {action.label}
            </QueueButton>
          ))}
      </div>
    );
  };

  const surfaceStep = Object.values(steps).find((s) => s.surface) ?? null;
  const surfaceEdit = surfaceStep ? editOf(surfaceStep.action) : null;
  const Surface = surfaceEdit?.edit.surface;
  const surfaceParts = surfaceStep ? stepParts(surfaceStep, -1) : null;

  return (
    <section
      ref={rootRef}
      aria-labelledby={headingId}
      onBlur={onRootBlur}
      className={cn("rst:font-ui rst:flex rst:flex-col rst:gap-4", className)}
    >
      <Heading
        id={headingId}
        className={cn(
          "rst:text-lg rst:font-semibold rst:text-[var(--roster-control-text)]",
          hideLabel && "rst:sr-only",
        )}
      >
        {label}
      </Heading>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="rst:sr-only"
        data-queue-live=""
        data-queue-live-n={live.n}
      >
        {live.text}
        {live.n % 2 ? " " : ""}
      </div>

      {status === "loading" ? (
        <div className="rst:flex rst:justify-center rst:py-12" aria-busy="true">
          <Spinner size="lg" label={`Loading ${label}`} />
        </div>
      ) : status === "error" ? (
        <Alert colorScheme="error">
          <div className="rst:flex rst:flex-col rst:items-start rst:gap-3">
            <div>{error ?? "The queue couldn't load."}</div>
            {onRetry && (
              <Button size="lg" variant="outline" colorScheme="neutral" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState
          title={empty.title}
          description={empty.description}
          headingLevel={itemLevel}
          tabIndex={-1}
          data-queue-empty=""
          className="rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring"
        />
      ) : (
        /* `role="list"` is restated because Safari drops a list's role once
           its markers are styled away. */
        <ul
          role="list"
          aria-labelledby={headingId}
          className="rst:m-0 rst:flex rst:list-none rst:flex-col rst:gap-3 rst:p-0"
        >
          {items.map((item, index) => {
            const key = keys[index];
            const hid = `${id}-item-${index}`;
            const meta = renderMeta?.(item);
            const s = steps[key];
            return (
              <li key={key}>
                <article
                  data-queue-item={key}
                  tabIndex={-1}
                  aria-labelledby={hid}
                  onFocus={onItemFocus(key)}
                  className="rst:rounded-xl rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:ring-offset-background"
                >
                  <Card padding={density === "compact" ? "sm" : "md"}>
                    <div className={cn("rst:flex rst:flex-col", density === "compact" ? "rst:gap-3" : "rst:gap-4")}>
                      <div className="rst:flex rst:flex-wrap rst:items-baseline rst:gap-x-3 rst:gap-y-1">
                        <ItemHeading id={hid} className="rst:text-base rst:font-semibold">
                          {itemLabel(item)}
                        </ItemHeading>
                        {meta && (
                          <div className="rst:flex rst:flex-wrap rst:items-center rst:gap-2 rst:text-sm rst:text-gray-600 rst:dark:text-gray-300">
                            {meta}
                          </div>
                        )}
                      </div>
                      <div className="rst:min-w-0">{renderContent(item)}</div>
                      {/* Not a live region: the polite sentence names the item
                          and says what failed. */}
                      {errors[key] && (
                        <Alert colorScheme="error" role="group" aria-live="off">
                          {errors[key]}
                        </Alert>
                      )}
                      {s && !s.surface ? inlineStep(s, index) : actionBar(item, key)}
                    </div>
                  </Card>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {footer}

      {Surface && surfaceStep && surfaceEdit && surfaceParts && (
        <Surface
          open={surfaceStep.open}
          title={surfaceEdit.edit.title}
          description={surfaceEdit.edit.description}
          busy={!!pending[surfaceStep.key]}
          onCancel={() => cancel(surfaceStep.key)}
          onAfterClose={() => onSurfaceClosed(surfaceStep.key)}
          submitButton={surfaceParts.submitButton}
          cancelButton={surfaceParts.cancelButton}
        >
          <div className="rst:flex rst:flex-col rst:gap-4">{surfaceParts.fields}</div>
        </Surface>
      )}
    </section>
  );
}

/** Why a step can't be submitted yet, or nothing. */
function blockedReason<T>(s: Step<T>, item: T): string | undefined {
  const edit = editOf(s.action);
  if (edit) return edit.edit.validate?.(s.draft, item);
  if (s.action.reason) {
    if (s.action.reason.required && !s.reason.value) return "Pick a reason.";
    if (s.action.reason.note === "required" && !s.reason.note?.trim()) return "Add a note.";
  }
  return undefined;
}

function cleanReason(reason: QueueReason): QueueReason {
  const note = reason.note?.trim();
  return { ...(reason.value ? { value: reason.value } : {}), ...(note ? { note } : {}) };
}

function ReasonFields({
  id,
  step,
  value,
  disabled,
  onChange,
}: {
  id: string;
  step: QueueReasonStep;
  value: QueueReason;
  disabled: boolean;
  onChange: (next: QueueReason) => void;
}) {
  const note = step.note ?? "optional";
  return (
    <>
      {step.options && step.options.length > 0 && (
        <RadioGroup
          label={step.required ? "Reason" : "Reason (optional)"}
          options={step.options}
          value={value.value ?? ""}
          onChange={(v) => onChange({ ...value, value: v })}
          disabled={disabled}
        />
      )}
      {note !== "none" && (
        <Textarea
          id={`${id}-note`}
          label={step.noteLabel ?? (note === "required" ? "Note" : "Note (optional)")}
          rows={3}
          value={value.note ?? ""}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          disabled={disabled}
        />
      )}
    </>
  );
}

/* Kept for `QueueCheckedEditAction`'s type to stay referenced from here. */
export type { QueueCheckedEditAction };

export { ModerationQueue };
