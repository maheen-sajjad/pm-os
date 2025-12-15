import { cva } from "class-variance-authority";

export const checkboxVariants = cva(
  [
    "rounded border-secondary-300 dark:border-neutral-600",
    "text-primary-500 dark:text-primary-400",
    "focus:ring-primary-500/30 focus:ring-offset-0",
    "cursor-pointer transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "dark:bg-neutral-900",
  ],
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export const checkboxLabelVariants = cva(
  [
    "text-secondary-700 dark:text-neutral-300",
    "cursor-pointer select-none",
    "transition-colors",
  ],
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);
