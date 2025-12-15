"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/utils/cn";
import { avatarVariants } from "./Avatar.variants";
import type { AvatarProps } from "./Avatar.types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size, status, ...props }, ref) => {
    const [imgError, setImgError] = useState(false);

    const showImage = src && !imgError;
    const initials = name ? getInitials(name) : "?";

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, status }), className)}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || "Avatar"}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
