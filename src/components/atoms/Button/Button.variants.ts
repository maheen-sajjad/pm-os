import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-primary-500 text-white shadow-soft",
          "hover:bg-primary-600 hover:shadow-soft-md",
          "focus-visible:ring-primary-500",
          "dark:bg-primary-600 dark:hover:bg-primary-500",
        ],
        secondary: [
          "bg-secondary-100 text-secondary-700",
          "hover:bg-secondary-200",
          "focus-visible:ring-secondary-400",
          "dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700",
        ],
        outline: [
          "border border-secondary-200 bg-transparent text-secondary-700",
          "hover:bg-secondary-50 hover:border-secondary-300",
          "focus-visible:ring-secondary-400",
          "dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:border-neutral-600",
        ],
        ghost: [
          "bg-transparent text-secondary-600",
          "hover:bg-secondary-100 hover:text-secondary-900",
          "focus-visible:ring-secondary-400",
          "dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        ],
        danger: [
          "bg-red-500 text-white shadow-soft",
          "hover:bg-red-600 hover:shadow-soft-md",
          "focus-visible:ring-red-500",
          "dark:bg-red-600 dark:hover:bg-red-500",
        ],
        success: [
          "bg-accent-500 text-white shadow-soft",
          "hover:bg-accent-600 hover:shadow-soft-md",
          "focus-visible:ring-accent-500",
          "dark:bg-accent-600 dark:hover:bg-accent-500",
        ],
      },
      size: {
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-base",
        xl: "h-12 px-6 text-base",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
