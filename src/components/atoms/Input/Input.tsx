import { forwardRef } from "react";
import { cn } from "@/shared/utils/cn";
import { InputProps } from "./Input.types";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          // Base styles
          "flex h-9 w-full rounded-lg border bg-transparent px-3 py-2 text-sm",
          "transition-all duration-150",
          // Placeholder
          "placeholder:text-secondary-400 dark:placeholder:text-neutral-500",
          // Focus states
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary-50 dark:disabled:bg-neutral-900",
          // Default state
          !error && [
            "border-secondary-200 dark:border-neutral-700",
            "focus:border-primary-500 focus:ring-primary-500/20",
            "dark:bg-neutral-900 dark:focus:border-primary-400 dark:focus:ring-primary-400/20",
          ],
          // Error state
          error && [
            "border-red-500 dark:border-red-500",
            "focus:border-red-500 focus:ring-red-500/20",
            "dark:focus:border-red-400 dark:focus:ring-red-400/20",
          ],
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
