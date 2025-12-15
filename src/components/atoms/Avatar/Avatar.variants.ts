import { cva } from "class-variance-authority";

export const avatarVariants = cva(
  [
    "relative inline-flex items-center justify-center rounded-full overflow-hidden",
    "bg-gradient-to-br from-primary-400 to-primary-600",
    "text-white font-medium",
    "ring-2 ring-white dark:ring-neutral-900",
    "transition-transform duration-150",
  ],
  {
    variants: {
      size: {
        xs: "w-6 h-6 text-2xs",
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
        xl: "w-16 h-16 text-lg",
      },
      status: {
        online: "after:absolute after:bottom-0 after:right-0 after:w-2.5 after:h-2.5 after:bg-emerald-500 after:rounded-full after:ring-2 after:ring-white dark:after:ring-neutral-900",
        away: "after:absolute after:bottom-0 after:right-0 after:w-2.5 after:h-2.5 after:bg-amber-500 after:rounded-full after:ring-2 after:ring-white dark:after:ring-neutral-900",
        offline: "after:absolute after:bottom-0 after:right-0 after:w-2.5 after:h-2.5 after:bg-secondary-400 after:rounded-full after:ring-2 after:ring-white dark:after:ring-neutral-900",
        none: "",
      },
    },
    defaultVariants: {
      size: "md",
      status: "none",
    },
  }
);
