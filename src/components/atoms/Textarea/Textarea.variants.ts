import { cva } from "class-variance-authority";

export const textareaVariants = cva(
  [
    "w-full rounded-lg border bg-transparent px-3 py-2 text-sm",
    "transition-all duration-150",
    "placeholder:text-secondary-400 dark:placeholder:text-neutral-500",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "disabled:bg-secondary-50 dark:disabled:bg-neutral-900",
    "dark:bg-neutral-900",
    "min-h-[80px]",
  ],
  {
    variants: {
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
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      },
    },
    defaultVariants: {
      error: false,
      resize: "vertical",
    },
  }
);
