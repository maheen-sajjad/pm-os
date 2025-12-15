import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import { checkboxVariants, checkboxLabelVariants } from "./Checkbox.variants";
import type { CheckboxProps } from "./Checkbox.types";

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, size, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(checkboxVariants({ size }), className)}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className={checkboxLabelVariants({ size })}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
