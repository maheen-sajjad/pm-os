import { Typography } from "@/atoms/Typography";
import { cn } from "@/shared/utils/cn";
import { AuthLayoutProps } from "./AuthLayout.types";

export function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-neutral-950 px-4">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl p-8",
          "bg-white dark:bg-neutral-900",
          "border border-secondary-200 dark:border-neutral-800",
          "shadow-soft-lg",
          className
        )}
      >
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <Typography as="h1" variant="h2" className="text-primary-500 dark:text-primary-400 mb-1">
            PM-OS
          </Typography>
          <Typography as="h2" variant="h4" className="text-secondary-900 dark:text-neutral-100">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="muted" className="mt-2 text-secondary-500 dark:text-neutral-400">
              {subtitle}
            </Typography>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
