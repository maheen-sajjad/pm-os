import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import { textareaVariants } from "./Textarea.variants";
import type { TextareaProps } from "./Textarea.types";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, resize, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ error, resize }), className)}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
