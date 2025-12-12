import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className
      )}
    >
      {icon && (
        <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6 fade-in-scale">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-gradient-to-r from-primary to-secondary hover:glow-primary hover-lift"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Preset empty states
export function NoWorkspacesEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<span className="text-5xl">🚀</span>}
      title="No workspaces yet"
      description="Create your first cloud workspace and start coding in seconds. Choose your preferred setup and we'll handle the rest."
      action={{
        label: "Create Workspace",
        onClick: onCreate,
      }}
    />
  );
}

export function NoResultsEmpty() {
  return (
    <EmptyState
      icon={<span className="text-5xl">🔍</span>}
      title="No results found"
      description="We couldn't find anything matching your search. Try adjusting your filters or search terms."
    />
  );
}

export function ErrorStateEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<span className="text-5xl">❌</span>}
      title="Something went wrong"
      description="We encountered an error while loading your data. Please try again or contact support if the problem persists."
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}

export function ComingSoonEmpty() {
  return (
    <EmptyState
      icon={<span className="text-5xl">🚧</span>}
      title="Coming Soon"
      description="We're working hard to bring you this feature. Stay tuned for updates!"
    />
  );
}
