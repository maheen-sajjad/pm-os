import { cva } from "class-variance-authority";

export const modalVariants = cva(
  "relative bg-white dark:bg-neutral-900 rounded-xl shadow-xl transform transition-all",
  {
    variants: {
      size: {
        sm: "max-w-sm w-full",
        md: "max-w-md w-full",
        lg: "max-w-lg w-full",
        xl: "max-w-xl w-full",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);
