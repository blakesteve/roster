import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import { useCountdown } from "../../../hooks/useCountdown";

// --- Variants ---

const titleVariants = cva("font-semibold uppercase tracking-wider mb-4", {
  variants: {
    size: {
      xs: "text-sm",
      sm: "text-base",
      md: "text-lg",
      lg: "text-xl",
      xl: "text-2xl",
    },
    themeMode: {
      light: "text-gray-900",
      dark: "text-gray-100",
    },
  },
  defaultVariants: {
    size: "md",
    themeMode: "light",
  },
});

const numberVariants = cva(
  "font-mono bg-clip-text text-transparent animate-pulse",
  {
    variants: {
      size: {
        xs: "text-2xl",
        sm: "text-3xl",
        md: "text-4xl",
        lg: "text-5xl",
        xl: "text-6xl",
      },
      themeMode: {
        light:
          "bg-gradient-to-br from-primary-700 via-accent-600 to-primary-700 drop-shadow-sm",
        dark: "bg-gradient-to-br from-primary-400 via-accent-300 to-primary-400 drop-shadow-md",
      },
    },
    defaultVariants: {
      size: "md",
      themeMode: "light",
    },
  },
);

const labelVariants = cva("uppercase tracking-widest mt-1", {
  variants: {
    size: {
      xs: "text-[10px]",
      sm: "text-xs",
      md: "text-xs",
      lg: "text-sm",
      xl: "text-sm",
    },
    themeMode: {
      light: "text-gray-600",
      dark: "text-gray-400",
    },
  },
  defaultVariants: {
    size: "md",
    themeMode: "light",
  },
});

interface CountdownItemProps extends VariantProps<typeof numberVariants> {
  value: number;
  label: string;
}

const CountdownItem = ({
  value,
  label,
  size,
  themeMode,
}: CountdownItemProps) => (
  <div className="flex flex-col items-center">
    <span className={cn(numberVariants({ size, themeMode }))}>
      {String(value).padStart(2, "0")}
    </span>
    <span className={cn(labelVariants({ size, themeMode }))}>{label}</span>
  </div>
);

export interface CountdownProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof titleVariants>, "themeMode"> {
  targetDate: Date;
  title?: string;
  completionText?: string;
  themeMode?: "light" | "dark";
}

const Countdown = React.forwardRef<HTMLDivElement, CountdownProps>(
  (
    {
      targetDate,
      title,
      size,
      themeMode = "light",
      className,
      completionText,
      ...props
    },
    ref,
  ) => {
    const { days, hours, minutes, seconds, isFinished } =
      useCountdown(targetDate);

    if (isFinished) {
      if (completionText) {
        return (
          <div
            ref={ref}
            className={cn("font-bold w-full text-center", className)}
            {...props}
          >
            <h3 className={cn(titleVariants({ size, themeMode }), "mb-0")}>
              {completionText}
            </h3>
          </div>
        );
      }
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn("font-bold w-full text-center", className)}
        {...props}
      >
        {title && (
          <h3 className={cn(titleVariants({ size, themeMode }))}>{title}</h3>
        )}
        <div className="flex justify-center gap-4 sm:gap-6 md:gap-8">
          <CountdownItem
            value={days}
            label="Days"
            size={size}
            themeMode={themeMode}
          />
          <CountdownItem
            value={hours}
            label="Hours"
            size={size}
            themeMode={themeMode}
          />
          <CountdownItem
            value={minutes}
            label="Minutes"
            size={size}
            themeMode={themeMode}
          />
          <CountdownItem
            value={seconds}
            label="Seconds"
            size={size}
            themeMode={themeMode}
          />
        </div>
      </div>
    );
  },
);

Countdown.displayName = "Countdown";

export { Countdown };
