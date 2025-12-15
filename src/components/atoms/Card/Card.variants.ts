import { cva } from "class-variance-authority";

export const cardVariants = cva(
  [
    "rounded-xl transition-all duration-200",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-white border border-secondary-100",
          "dark:bg-neutral-900 dark:border-neutral-800",
        ],
        outlined: [
          "bg-transparent border border-secondary-200",
          "dark:border-neutral-700",
        ],
        elevated: [
          "bg-white shadow-soft",
          "hover:shadow-soft-md",
          "dark:bg-neutral-900 dark:shadow-none dark:border dark:border-neutral-800",
        ],
        ghost: [
          "bg-transparent",
          "hover:bg-secondary-50 dark:hover:bg-neutral-800/50",
        ],
        interactive: [
          "bg-white border border-secondary-100 cursor-pointer",
          "hover:border-primary-200 hover:shadow-soft-md",
          "dark:bg-neutral-900 dark:border-neutral-800",
          "dark:hover:border-primary-800",
        ],
      },
      padding: {
        none: "",
        xs: "p-2",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);
