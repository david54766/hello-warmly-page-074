import { useContext, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, InsideCardContext } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardCard({
  title,
  icon,
  comingSoon,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  comingSoon?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-2xl shadow-card hover:shadow-card-hover transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {comingSoon && (
          <span className="text-[10px] uppercase tracking-wide rounded-full bg-accent text-accent-foreground px-2 py-0.5">
            Coming soon
          </span>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  boxed,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Force the bordered box on/off. Defaults to on unless already inside a Card. */
  boxed?: boolean;
}) {
  const insideCard = useContext(InsideCardContext);
  const showBox = boxed ?? !insideCard;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-10 px-6",
        showBox && "rounded-2xl border border-dashed border-border bg-card/60",
      )}
    >
      {icon && <div className="size-12 rounded-full bg-accent text-accent-foreground grid place-items-center mb-3">{icon}</div>}
      <h3 className="font-medium">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warn" | "info" }) {
  const tones: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    warn: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    info: "bg-primary/10 text-primary",
  };
  return <span className={cn("text-xs font-medium rounded-full px-2 py-0.5", tones[tone])}>{label}</span>;
}