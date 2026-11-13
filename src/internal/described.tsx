import { createElement, forwardRef, type ComponentPropsWithoutRef, type ForwardRefExoticComponent, type RefAttributes } from "react";

type Tag = "input" | "textarea" | "button" | "div" | "span";
type ElementOf = { input: HTMLInputElement; textarea: HTMLTextAreaElement; button: HTMLButtonElement; div: HTMLDivElement; span: HTMLSpanElement };

export type DescribedProps<T extends Tag> = ComponentPropsWithoutRef<T> & {
  /** The caller's own `aria-describedby`, added after Headless UI's. */
  callerDescribedBy?: string;
};

/**
 * An element for a Headless UI control's `as`, which adds a caller's
 * `aria-describedby` to the one Headless UI writes.
 *
 * Headless UI's controls write `aria-describedby` from the `Description`s in
 * their `Field` or group, and their own props win over a caller's, so a
 * caller's value was dropped every time, even with no `Description` to
 * replace it: the key is set to `undefined`. Rendered through one of these, a
 * control keeps both, Headless UI's first. Pass the caller's ids as
 * `callerDescribedBy`, not as `aria-describedby`, which Headless UI would
 * overwrite on the way here.
 *
 * A button rendered through one needs its `type` said: Headless UI works one
 * out only for an `as` of "button", and otherwise not until the element is
 * there, so the first render, and a server's, would have none.
 */
function described<T extends Tag>(tag: T) {
  const Described = forwardRef<ElementOf[T], { callerDescribedBy?: string; "aria-describedby"?: string }>(
    ({ callerDescribedBy, "aria-describedby": own, ...props }, ref) =>
      createElement(tag, { ...props, ref, "aria-describedby": [own, callerDescribedBy].filter(Boolean).join(" ") || undefined }),
  );
  Described.displayName = `Described.${tag}`;
  return Described as ForwardRefExoticComponent<DescribedProps<T> & RefAttributes<ElementOf[T]>>;
}

export const DescribedInput = described("input");
export const DescribedTextarea = described("textarea");
export const DescribedButton = described("button");
export const DescribedDiv = described("div");
export const DescribedSpan = described("span");
