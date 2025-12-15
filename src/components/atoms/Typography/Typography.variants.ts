import { cva } from "class-variance-authority";

export const typographyVariants = cva(
  "text-secondary-900 dark:text-neutral-100",
  {
    variants: {
      variant: {
        h1: "text-3xl font-semibold tracking-tight",
        h2: "text-2xl font-semibold tracking-tight",
        h3: "text-xl font-semibold",
        h4: "text-lg font-medium",
        h5: "text-base font-medium",
        body: "text-sm leading-relaxed",
        small: "text-xs",
        muted: "text-sm text-secondary-500 dark:text-neutral-500",
        code: "text-sm font-mono bg-secondary-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded",
      },
    },
    defaultVariants: {
      variant: "body",
    },
  }
);
