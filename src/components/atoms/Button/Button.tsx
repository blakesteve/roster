import React from "react";
import { type VariantProps } from "class-variance-authority";
import { Button as HeadlessButton } from "@headlessui/react";
import { cn } from "../../../lib/utils";
import { Spinner } from "../Spinner/Spinner";

import { buttonVariants } from "./button-variants";

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Shows a spinner and ignores presses while something the button started is
   * in flight. Unlike `disabled`, it keeps the button focusable: a native
   * `disabled` drops focus to the page the moment it lands, so a keyboard or
   * screen reader user who just pressed Save is thrown back to the top. A
   * loading button stays where it is, says it's busy (`aria-busy`) and
   * unavailable (`aria-disabled`), and swallows clicks, Enter and Space, which
   * also stops a submit button sending its form twice.
   */
  isLoading?: boolean;
  /** What a screen reader hears for the spinner while loading: "loading" by default. */
  loadingLabel?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  /**
   * Which surface the button sits on.
   *
   * Roster's dark styling keys off an ancestor carrying `.dark`, so a button
   * placed on a hard-coded dark panel that never carries that class (a
   * campfire overlay, a lantern-night backdrop) falls back to the LIGHT
   * styles and flashes a near-white hover. Pass `surface="dark"` to force the
   * dark treatment regardless of the app's theme.
   */
  surface?: "auto" | "dark";
  /**
   * Keeps the label on one line at the size's height, cutting it with an ellipsis
   * when there's no room, instead of wrapping. Only for a control whose label fits
   * at 200% text or is shown in full elsewhere: a cut label fails WCAG 1.4.10.
   * The full label stays the button's accessible name.
   */
  singleLine?: boolean;
  /**
   * `"tile"` stacks `startIcon` over the label in a column, centered, with its
   * own padding and no height of its own, so it fills the grid cell it's in.
   * Any variant. A tile takes one icon, in `startIcon`.
   */
  layout?: "inline" | "tile";
  /**
   * A control that can't be used right now: focusable and in the Tab order,
   * unlike `disabled`, and dimmed to 50%. `aria-disabled` says so, and presses
   * are swallowed as they are while `isLoading`. Tab and other keys pass.
   * `disabled` wins over it, then `isLoading`, which is never dimmed.
   */
  unavailable?: boolean;
  /**
   * For a toggle: says whether it's on, as `aria-pressed` (left off when this
   * is), and draws it on in `tint-subtle` and `plain`. Other variants take the
   * attribute and no new look.
   */
  pressed?: boolean;
}

/* An icon slot one line tall, pinned to the label's first line (`start`) or
   last (`end`), so a wrapped label keeps the icon beside the words it goes
   with: a start icon or spinner before the first, an end arrow after the
   last. Without `lh` the slot is as tall as its icon and centers, as before
   wrapping. */
const SLOT_FIRST_LINE = "rst:supports-[height:1lh]:h-[1lh] rst:supports-[height:1lh]:self-start";
const SLOT_LAST_LINE = "rst:supports-[height:1lh]:h-[1lh] rst:supports-[height:1lh]:self-end";

/* Text children in a span that cuts with an ellipsis, for `singleLine`.
   Elements pass through: an icon stays an icon. */
function truncated(children: React.ReactNode) {
  return React.Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? <span className="rst:truncate">{child}</span> : child,
  );
}

/* A tile's icon, centered over its label and spaced by the row's gap. */
const SLOT_TILE = "rst:inline-flex rst:shrink-0 rst:items-center";

/* A `plain` icon sits beside the first line, or the last for an end icon,
   spaced by the row's gap. Its slot has no height of its own (the icon
   overflows it, centered on the line), so it can't make the row taller than
   the text: WebKit lays a 15.9996px line at 15, against a 16px slot. */
const SLOT_PLAIN_FIRST_LINE =
  "rst:inline-flex rst:h-0 rst:shrink-0 rst:items-center rst:self-start rst:mt-[calc(var(--rst-line,1rem)/2)]";
const SLOT_PLAIN_LAST_LINE =
  "rst:inline-flex rst:h-0 rst:shrink-0 rst:items-center rst:self-end rst:mb-[calc(var(--rst-line,1rem)/2)]";

/* The handlers a press runs through, capture phase included. Not enter,
   leave or move, which a tooltip needs whether the button is busy or not. */
const PRESS = /^on(?:Click|DoubleClick|AuxClick|(?:Pointer|Mouse)(?:Down|Up)|Key(?:Down|Up|Press)|Touch(?:Start|End))(?:Capture)?$/;

/**
 * A loading button's props without the app's press handlers, plus a click
 * handler that cancels the press. Canceling the click is what stops a submit
 * button sending its form; the keys are covered because Enter and Space on a
 * button arrive as that same click.
 *
 * Headless UI already cancels presses on an `aria-disabled` element, but by
 * swapping every key handler for one that cancels the key, Tab included. An
 * app's own `onKeyDown` would then trap focus on a loading button, so the
 * app's handlers are dropped here instead and the keys left alone.
 */
function withoutPresses(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) if (!PRESS.test(key)) rest[key] = value;
  return { ...rest, onClick: (e: React.MouseEvent) => e.preventDefault() };
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      colorScheme,
      variant,
      size,
      isLoading = false,
      loadingLabel,
      startIcon,
      endIcon,
      surface = "auto",
      singleLine = false,
      layout = "inline",
      unavailable = false,
      pressed,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    /* `disabled` wins, then `isLoading`, then `unavailable`: a disabled button
       that's also loading is disabled, and a busy one is never dimmed. */
    const busy = isLoading && !disabled;
    const off = unavailable && !disabled && !isLoading;
    const pressProps = busy || off ? withoutPresses(props) : props;

    const tile = layout === "tile";
    const plain = variant === "plain" && !tile;
    const byGap = tile || plain;
    /* Loading, a tile with an icon draws its spinner over the icon's box, so
       nothing moves. A tile without one, and `plain`, have no icon box to
       stand in: the spinner replaces what shows, and the label stays as the
       accessible name. Every other Button puts the spinner before its label. */
    const overIcon = isLoading && tile && !!startIcon;
    const replaced = isLoading && !overIcon && byGap;
    const label = singleLine ? truncated(children) : children;

    return (
      <HeadlessButton
        className={cn(
          buttonVariants({ colorScheme, variant, size, singleLine, layout, pressed }),
          tile && startIcon && "rst:py-3",
          // Roster's dark variant is `&:where(.dark, .dark *)`, so an element
          // carrying `.dark` itself satisfies it. That is all forcing the
          // dark surface requires.
          surface === "dark" && "dark",
          busy && "rst:cursor-progress",
          off && "rst:cursor-not-allowed rst:opacity-50",
          className,
        )}
        ref={ref}
        disabled={disabled}
        {...pressProps}
        aria-disabled={busy || off ? true : props["aria-disabled"]}
        aria-busy={busy ? true : props["aria-busy"]}
        aria-pressed={pressed ?? props["aria-pressed"]}
      >
        {/* The label and its icons in one row, which takes the button's
            own `gap` and `justify-content`, so an app's `gap-1.5` or
            `justify-start` still applies. Icons an app passes as children
            stay centered on the label, as before. A tile's row is a column,
            as its button is. */}
        <span
          className={cn(
            "rst:flex rst:grow rst:min-w-0 rst:items-center rst:[justify-content:inherit] rst:[gap:inherit]",
            tile && "rst:flex-col",
          )}
        >
          {overIcon && (
            <span className={cn(SLOT_TILE, "rst:relative")}>
              <span className="rst:invisible rst:inline-flex rst:items-center">{startIcon}</span>
              {/* An icon's box needn't be square (Font Awesome's is wider
                  than tall), and a spinner filling it would be an ellipse. So
                  it's a circle as wide as the box's shorter side (`cqmin`),
                  centered without a transform, so the spin's is the only one. */}
              <span className="rst:absolute rst:inset-0 rst:flex rst:items-center rst:justify-center rst:[container-type:size]">
                <Spinner size="sm" variant="current" label={loadingLabel} className="rst:size-[100cqmin]" />
              </span>
            </span>
          )}
          {/* Keeps the spinner's name and the label's apart wherever a name is
              computed without the row's layout. It draws nothing: a flex row
              drops text that is only a space. */}
          {overIcon && " "}

          {replaced && (
            <>
              <Spinner size="sm" variant="current" label={loadingLabel} />
              <span className="rst:sr-only">{label}</span>
            </>
          )}

          {isLoading && !overIcon && !replaced && (
            <span className={cn("rst:mr-2 rst:flex rst:shrink-0 rst:items-center", SLOT_FIRST_LINE)}>
              <Spinner size="sm" variant="current" label={loadingLabel} />
            </span>
          )}

          {!isLoading && startIcon && (
            <span className={tile ? SLOT_TILE : plain ? SLOT_PLAIN_FIRST_LINE : cn("rst:mr-2 rst:inline-flex rst:shrink-0 rst:items-center", SLOT_FIRST_LINE)}>
              {startIcon}
            </span>
          )}

          {!replaced && label}

          {!isLoading && endIcon && (
            <span className={tile ? SLOT_TILE : plain ? SLOT_PLAIN_LAST_LINE : cn("rst:ml-2 rst:inline-flex rst:shrink-0 rst:items-center", SLOT_LAST_LINE)}>
              {endIcon}
            </span>
          )}
        </span>
      </HeadlessButton>
    );
  },
);
Button.displayName = "Button";

export { Button };
