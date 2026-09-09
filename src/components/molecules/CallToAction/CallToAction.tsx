import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { ctaVariants } from "./call-to-action-variants";
import { Button } from "../../atoms/Button/Button";

export interface CallToActionProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof ctaVariants> {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  onDismiss?: () => void;
}

const CallToAction = ({
  title,
  description,
  action,
  icon,
  variant,
  onDismiss,
  className,
  ...props
}: CallToActionProps) => {
  return (
    <div className={cn(ctaVariants({ variant }), className)} {...props}>
      {/* The layout lives one level inside the card because an element cannot
          query its own width, and the card is the container. Everything below
          keys off the CARD's width rather than the window's. */}
      <div className="rst:flex rst:flex-col rst:gap-4 rst:@[32rem]:flex-row rst:@[32rem]:items-center rst:@[32rem]:justify-between">
      {/* Stacks whenever the card is narrow — the same 32rem step the card
          itself uses, so the icon never sits beside a title in a column
          layout. The icon column costs about 36px, which a ~270px content box
          feels immediately. */}
      <div className="rst:flex rst:flex-col rst:items-center rst:gap-4 rst:@[32rem]:flex-row rst:@[32rem]:items-start">
        {icon && (
          <div className="rst:shrink-0 rst:text-current rst:@[32rem]:mt-1">
            {icon}
          </div>
        )}
        {/* `min-w-0` is load-bearing, not tidying. A flex child defaults to
            `min-width: auto`, so this column refuses to shrink below the
            min-content of its widest descendant — an embedded `Countdown` is
            about 190px — and drags the title and description out past the
            card, where the base `overflow-hidden` clips them mid-word. */}
        <div className="rst:flex rst:min-w-0 rst:flex-col rst:gap-1.5 rst:w-full">
          <h3 className="rst:text-lg rst:font-bold rst:leading-tight rst:tracking-tight rst:text-current">
            {title}
          </h3>
          {description && (
            <div className="rst:max-w-prose rst:text-sm rst:leading-relaxed rst:text-current rst:opacity-90 rst:dark:opacity-80">
              {description}
            </div>
          )}
        </div>
      </div>

      {/* In a narrow CARD the action goes full width under the content rather
          than hugging one side of a column that may only be ~180px across. A
          right-aligned button was still an intrinsically sized box, so a long
          label overflowed and the `overflow-hidden` on the card clipped it.

          `[&>*]:w-full` reaches whatever node the consumer passed, since the
          action is their element and not ours. Above 32rem it all reverts: the
          card is a row with `justify-between`, which puts a naturally sized
          action on the right. */}
      {action && (
        <div className="rst:flex rst:w-full rst:shrink-0 rst:pt-2 rst:[&>*]:w-full rst:@[32rem]:w-auto rst:@[32rem]:pt-0 rst:@[32rem]:[&>*]:w-auto">
          {action}
        </div>
      )}

      {onDismiss && (
        <div className="rst:absolute rst:right-2 rst:top-2">
          <Button
            variant="ghost"
            size="sm"
            className="rst:h-8 rst:w-8 rst:rounded-full rst:p-0 rst:opacity-60 rst:hover:opacity-100 rst:dark:hover:bg-black/20"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <FontAwesomeIcon icon={faXmark} className="rst:h-4 rst:w-4" />
          </Button>
        </div>
      )}
      </div>
    </div>
  );
};

export { CallToAction };
