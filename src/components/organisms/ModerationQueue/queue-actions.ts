import type { ComponentType, ReactNode } from "react";

/**
 * What an action's `run` may resolve with. Nothing, for the usual case; or a
 * sentence that replaces the default announcement, for an outcome that isn't
 * the decision itself, such as another reviewer having decided first.
 */
export type QueueRunResult = void | { announce: string };

export type QueueTone = "primary" | "success" | "danger" | "neutral";

export type QueueHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface QueueActionBase<T> {
  /** Unique among the queue's actions. */
  id: string;
  /** The button's words, and the submit button's in its step: "Approve". */
  label: string;
  /** What the live region says when it lands: "Approved". Defaults to `label`. */
  done?: string;
  tone?: QueueTone;
  /** Leave the action off this item, for instance no Edit on a kind that can't be edited. */
  hidden?: (item: T) => boolean;
}

export interface QueueReason {
  /** The chosen option's `value`, when the step offers options. */
  value?: string;
  /** The note, when the step takes one. Trimmed; absent when empty. */
  note?: string;
}

export interface QueueReasonStep {
  /** The question the step asks, and its accessible name. */
  prompt: string;
  /** A short list, shown as radios. */
  options?: { value: string; label: string }[];
  /** An option must be picked before submitting. */
  required?: boolean;
  /** Whether a free-text note is offered, and whether it's required. */
  note?: "none" | "optional" | "required";
  /** The note field's label. */
  noteLabel?: string;
}

/**
 * Every action that isn't an edit: one click, or a step that asks first.
 *
 *   - Neither `confirm` nor `reason`: the button runs the action.
 *   - `confirm`: asks in place, "Remove this post?", with the action and
 *     Cancel.
 *   - `reason`: asks why in place (options, a note, or both), and hands the
 *     answer to `run`. Takes precedence over `confirm`; its submit button is
 *     the confirmation.
 *
 * One type rather than three, so an action written as an object literal gets
 * its parameters typed: TypeScript can't tell three shapes apart by whether
 * an object property is present, and would leave `run` untyped.
 */
export interface QueuePlainAction<T> extends QueueActionBase<T> {
  confirm?: { prompt: string };
  reason?: QueueReasonStep;
  edit?: undefined;
  /** `reason` is set when the action has a reason step. */
  run: (item: T, input: { reason?: QueueReason }) => Promise<QueueRunResult>;
}

/** What an edit step's form is handed. Controlled: the draft lives in the queue. */
export interface QueueFormProps<T, D> {
  item: T;
  value: D;
  onChange: (next: D) => void;
}

/**
 * What a surface (a Dialog, a Sheet) is handed to show an edit step. The queue
 * renders the form, its validation message and both buttons; a surface only
 * places them.
 */
export interface QueueSurfaceProps {
  open: boolean;
  title: string;
  description?: string;
  /** A decision is in flight: the surface shouldn't close on its own. */
  busy: boolean;
  /** Escape, the close button, the backdrop. */
  onCancel: () => void;
  /** Once the surface has finished closing. */
  onAfterClose: () => void;
  /** The app's form, the validation message and any error. */
  children: ReactNode;
  submitButton: ReactNode;
  cancelButton: ReactNode;
}

export type QueueSurface = ComponentType<QueueSurfaceProps>;

export interface QueueEdit<T, D> {
  title: string;
  description?: string;
  /** "Approve with edits", "Publish". */
  submitLabel: string;
  /** Inline, in the item, by default. Or `QueueEditDialog`, `QueueEditSheet`. */
  surface?: QueueSurface;
  /** The draft the form starts from, made each time the step opens. */
  initial: (item: T) => D;
  Form: ComponentType<QueueFormProps<T, D>>;
  /** A message means the draft can't be submitted yet, and says why. */
  validate?: (value: D, item: T) => string | undefined;
}

export interface QueueEditAction<T, D> extends QueueActionBase<T> {
  edit: QueueEdit<T, D>;
  confirm?: undefined;
  reason?: undefined;
  run: (item: T, input: { draft: D }) => Promise<QueueRunResult>;
}

declare const typedEdit: unique symbol;

/**
 * An edit action whose draft type was checked: made by `editAction` (or the
 * `edit` an `actions` function is handed), and the only edit action `actions`
 * accepts.
 *
 * Opaque on purpose. It names what a queue shows, the step's title and
 * buttons, and hides what touches the draft: inside a list of mixed actions a
 * draft could only be typed `any`, so `initial`, `Form`, `validate` and `run`
 * are reachable only where `editAction` checked them against one another. A
 * literal `{ edit: … }`, or a spread of a checked action with a new
 * `initial`, doesn't compile.
 */
export interface QueueCheckedEditAction<T> extends QueueActionBase<T> {
  readonly edit: Pick<QueueEdit<T, never>, "title" | "description" | "submitLabel" | "surface">;
  readonly [typedEdit]: true;
  confirm?: undefined;
  reason?: undefined;
}

export type QueueAction<T> = QueuePlainAction<T> | QueueCheckedEditAction<T>;

/**
 * What a function passed as `actions` is handed: the same `editAction`, bound
 * to the queue's item type. Inside JSX that's the form to use, because the
 * queue's item type isn't known yet when a free-standing `editAction(…)` in
 * an array is checked, and its parameters would come out `unknown`.
 */
export interface QueueActionKit<T> {
  edit: <D>(action: QueueEditAction<T, D>) => QueueCheckedEditAction<T>;
}

/**
 * Makes an edit action, with its draft type checked end to end: `initial`
 * says what a draft is, and the form, `validate` and `run` all get that type.
 *
 *   editAction({ edit: { initial: (s) => ({ body: s.body }), … },
 *                run: (s, { draft }) => save(s.id, draft.body) })
 *
 * The other kinds of action are plain objects; this one goes through a
 * function because TypeScript can only infer the draft's type from a call.
 */
export function editAction<T, D>(action: QueueEditAction<T, D>): QueueCheckedEditAction<T> {
  return action as unknown as QueueCheckedEditAction<T>;
}

