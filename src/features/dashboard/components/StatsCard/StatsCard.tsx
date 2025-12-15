import { Typography } from "@/atoms/Typography";
import { cn } from "@/shared/utils/cn";
import { StatsCardProps } from "./StatsCard.types";

export function StatsCard({ title, value, icon: Icon, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        "group relative p-5 rounded-xl",
        "bg-white dark:bg-neutral-900",
        "border border-secondary-200 dark:border-neutral-800",
        "shadow-soft hover:shadow-soft-md",
        "transition-all duration-200",
        className
      )}
    >
      {/* Hover accent */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-primary-500 rounded-l-xl transition-colors" />

      <div className="flex items-center justify-between">
        <div>
          <Typography variant="muted" className="mb-1 text-xs uppercase tracking-wider">
            {title}
          </Typography>
          <Typography variant="h3" className="text-2xl font-semibold">{value}</Typography>
        </div>
        {Icon && (
          <div className="p-3 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl">
            <Icon className="h-5 w-5 text-primary-500" />
          </div>
        )}
      </div>
    </div>
  );
}
