import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ACTION_LABELS, actionRoute, type ChecklistItem } from "@/lib/onboarding";

export function ChecklistItemCard({
  item,
  completed,
  index,
}: {
  item: ChecklistItem;
  completed: boolean;
  index?: number;
}) {
  return (
    <Card className={cn("rounded-2xl transition-colors", completed && "bg-muted/40")}>
      <CardContent className="pt-5 flex items-start gap-3">
        <div className={cn(
          "size-9 shrink-0 rounded-full grid place-items-center",
          completed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-primary/10 text-primary"
        )}>
          {completed ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {typeof index === "number" && <span className="text-xs text-muted-foreground">Step {index + 1}</span>}
            {completed && <span className="text-[10px] uppercase font-medium tracking-wide text-emerald-700 dark:text-emerald-300">Done</span>}
          </div>
          <h3 className={cn("font-medium leading-tight mt-0.5", completed && "line-through text-muted-foreground")}>
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          )}
          <div className="mt-3">
            <Button asChild size="sm" variant={completed ? "outline" : "default"}>
              <Link to={actionRoute(item.action_type)}>
                {ACTION_LABELS[item.action_type]} <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}