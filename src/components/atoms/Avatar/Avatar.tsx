import React, { useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { avatarVariants } from "./avatar-variants";

export interface AvatarProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  initials?: string;
  src?: string;
  alt?: string;
  title?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      size,
      colorScheme,
      shape,
      initials,
      src,
      alt,
      title,
      ...props
    },
    ref,
  ) => {
    const [imageError, setImageError] = useState(false);

    const showImage = src && !imageError;

    const AvatarContent = (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, colorScheme, shape }), className)}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="leading-none uppercase">
            {initials?.slice(0, 2)}
          </span>
        )}
      </div>
    );

    // Simple Render (No Popover)
    if (!title) {
      return AvatarContent;
    }

    // Popover Render (With Tooltip)
    return (
      <Popover className="relative inline-flex">
        <PopoverButton as="div" className="outline-none cursor-pointer">
          {AvatarContent}
        </PopoverButton>

        <PopoverPanel
          anchor="bottom"
          className={cn(
            "z-50 mt-2 rounded-md bg-gray-800 px-3 py-1.5 text-xs text-white shadow-md ring-1 ring-white/10",
            "transition duration-200 ease-in-out data-closed:opacity-0 data-closed:translate-y-1",
          )}
        >
          {title}
        </PopoverPanel>
      </Popover>
    );
  },
);

Avatar.displayName = "Avatar";

export { Avatar };
