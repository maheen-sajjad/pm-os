import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  [
    "inline-flex items-center font-medium rounded-md",
    "transition-colors duration-150",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-secondary-100 text-secondary-600",
          "dark:bg-neutral-800 dark:text-neutral-300",
        ],
        primary: [
          "bg-primary-100 text-primary-700",
          "dark:bg-primary-900/50 dark:text-primary-300",
        ],
        success: [
          "bg-emerald-100 text-emerald-700",
          "dark:bg-emerald-900/50 dark:text-emerald-300",
        ],
        warning: [
          "bg-amber-100 text-amber-700",
          "dark:bg-amber-900/50 dark:text-amber-300",
        ],
        danger: [
          "bg-red-100 text-red-700",
          "dark:bg-red-900/50 dark:text-red-300",
        ],
        info: [
          "bg-blue-100 text-blue-700",
          "dark:bg-blue-900/50 dark:text-blue-300",
        ],
        outline: [
          "bg-transparent border border-secondary-200 text-secondary-600",
          "dark:border-neutral-700 dark:text-neutral-400",
        ],
      },
      size: {
        xs: "px-1.5 py-0.5 text-2xs",
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);
