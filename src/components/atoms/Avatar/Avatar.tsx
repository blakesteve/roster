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
            className="rst:h-full rst:w-full rst:object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="rst:leading-none rst:uppercase">
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
      <Popover className="rst:relative rst:inline-flex">
        <PopoverButton
          as="div"
          className="rst:cursor-pointer rst:focus-visible:outline-hidden rst:focus-visible:ring-2 rst:focus-visible:ring-ring rst:focus-visible:ring-offset-2 rst:ring-offset-background rst:rounded-full"
        >
          {AvatarContent}
        </PopoverButton>

        <PopoverPanel
          anchor="bottom"
          className={cn(
            "rst:z-50 rst:mt-2 rst:rounded-md rst:px-3 rst:py-1.5 rst:text-xs rst:font-medium rst:shadow-xl rst:backdrop-blur-md rst:ring-1",
            "rst:bg-gray-900/95 rst:text-white rst:ring-black/5 rst:dark:bg-gray-100/95 rst:dark:text-gray-900 rst:dark:ring-white/20",
            "rst:transition rst:duration-200 rst:ease-in-out rst:data-closed:opacity-0 rst:data-closed:translate-y-1",
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
