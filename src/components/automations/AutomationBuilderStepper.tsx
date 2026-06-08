import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { step: number; steps: string[] }

export function AutomationBuilderStepper({ step, steps }: Props) {
  return (
    <ol className="flex items-center gap-2 w-full">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <li key={label} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "size-7 rounded-full grid place-items-center text-xs font-medium border",
              done && "bg-primary text-primary-foreground border-primary",
              active && "bg-primary/10 text-primary border-primary",
              !done && !active && "bg-background text-muted-foreground border-border",
            )}>
              {done ? <Check className="size-3.5" /> : idx}
            </div>
            <span className={cn("text-sm", active ? "font-medium" : "text-muted-foreground")}>{label}</span>
            {idx < steps.length && <div className={cn("flex-1 h-px", done ? "bg-primary" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}