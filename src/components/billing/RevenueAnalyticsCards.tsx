import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Clock, AlertCircle, XCircle, Tag } from "lucide-react";
import type { ReactNode } from "react";

export interface RevenueStats {
  totalRevenue: number; mrr: number; arr: number;
  activeSubscribers: number; trialing: number; pastDue: number; canceled: number;
  couponRedemptions: number; oneTimePurchases: number;
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <Card className="rounded-2xl"><CardContent className="pt-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}<span>{label}</span></div>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </CardContent></Card>
  );
}

export function RevenueAnalyticsCards({ s }: { s: RevenueStats }) {
  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={<DollarSign className="size-4" />} label="Total revenue" value={fmt(s.totalRevenue)} />
      <Stat icon={<TrendingUp className="size-4" />} label="MRR (placeholder)" value={fmt(s.mrr)} />
      <Stat icon={<TrendingUp className="size-4" />} label="ARR (placeholder)" value={fmt(s.arr)} />
      <Stat icon={<Users className="size-4" />} label="Active subscribers" value={s.activeSubscribers} />
      <Stat icon={<Clock className="size-4" />} label="Trialing" value={s.trialing} />
      <Stat icon={<AlertCircle className="size-4" />} label="Past due" value={s.pastDue} />
      <Stat icon={<XCircle className="size-4" />} label="Canceled" value={s.canceled} />
      <Stat icon={<Tag className="size-4" />} label="Coupon redemptions" value={s.couponRedemptions} />
      <Stat icon={<DollarSign className="size-4" />} label="One-time purchases" value={s.oneTimePurchases} />
    </div>
  );
}