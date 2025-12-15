import { ComponentType, SVGProps } from "react";

export interface NavItemProps {
  href: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  shortcut?: string;
  className?: string;
}
