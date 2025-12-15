import { HTMLAttributes } from "react";
import { VariantProps } from "class-variance-authority";
import { avatarVariants } from "./Avatar.variants";

export interface AvatarProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  name?: string;
}
