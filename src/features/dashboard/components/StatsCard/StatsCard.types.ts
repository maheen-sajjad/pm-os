import { ComponentType, SVGProps } from "react";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  className?: string;
}
