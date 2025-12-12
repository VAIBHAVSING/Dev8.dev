import { cn } from "@/lib/utils";

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
  variant?: "default" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-gradient-to-r from-primary to-secondary",
  success: "bg-gradient-to-r from-accent to-accent/80",
  warning: "bg-gradient-to-r from-warning to-warning/80",
  error: "bg-gradient-to-r from-destructive to-destructive/80",
};

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
  showLabel = false,
  variant = "default",
  size = "md",
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="w-full space-y-2">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted",
          sizeStyles[size],
          className
        )}
      >
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out",
            variantStyles[variant],
            indicatorClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{value} / {max}</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "success" | "warning" | "error";
}

const circularVariantColors = {
  default: "stroke-primary",
  success: "stroke-accent",
  warning: "stroke-warning",
  error: "stroke-destructive",
};

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  showLabel = true,
  variant = "default",
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-muted fill-none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={cn("fill-none transition-all duration-500 ease-out", circularVariantColors[variant])}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
