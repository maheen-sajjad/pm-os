import { HTMLAttributes, ElementType } from "react";
import { VariantProps } from "class-variance-authority";
import { typographyVariants } from "./Typography.variants";

export interface TypographyProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: ElementType;
}
