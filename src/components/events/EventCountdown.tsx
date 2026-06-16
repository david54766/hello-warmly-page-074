import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    done: ms === 0,
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export function EventCountdown({ startTime, endTime }: { startTime: string; endTime: string }) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  if (now >= end) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        This event has ended.
      </div>
    );
  }
  if (now >= start) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm font-medium text-primary">
        ● Live now
      </div>
    );
  }
  const t = diff(start);
  const items: [string, number][] = [
    ["days", t.d],
    ["hours", t.h],
    ["min", t.m],
    ["sec", t.s],
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Starts in</p>
      <div className="grid grid-cols-4 gap-2 text-center">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-muted/40 px-2 py-2">
            <div className="text-xl font-semibold tabular-nums">{String(value).padStart(2, "0")}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}