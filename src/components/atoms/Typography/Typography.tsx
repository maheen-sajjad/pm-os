import { cn } from "@/shared/utils/cn";
import { TypographyProps } from "./Typography.types";
import { typographyVariants } from "./Typography.variants";

export function Typography({
  as: Component = "p",
  variant = "body",
  className,
  children,
  ...props
}: TypographyProps) {
  return (
    <Component
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}
