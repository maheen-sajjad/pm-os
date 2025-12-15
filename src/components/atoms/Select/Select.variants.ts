import { cva } from "class-variance-authority";

export const selectVariants = cva(
  [
    "w-full rounded-lg border bg-transparent",
    "transition-all duration-150",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "appearance-none cursor-pointer",
    "dark:bg-neutral-900",
  ],
  {
    variants: {
      size: {
        sm: "h-8 px-3 py-1.5 text-sm",
        md: "h-9 px-3 py-2 text-sm",
        lg: "h-10 px-4 py-2.5 text-base",
      },
      error: {
        true: [
          "border-red-500 dark:border-red-500",
          "focus:border-red-500 focus:ring-red-500/20",
          "dark:focus:border-red-400 dark:focus:ring-red-400/20",
        ],
        false: [
          "border-secondary-200 dark:border-neutral-700",
          "focus:border-primary-500 focus:ring-primary-500/20",
          "dark:focus:border-primary-400 dark:focus:ring-primary-400/20",
        ],
      },
    },
    defaultVariants: {
      size: "md",
      error: false,
    },
  }
);
