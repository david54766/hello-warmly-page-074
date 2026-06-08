import { Badge } from "@/components/ui/badge";
import { isGrantActive, isGrantExpired, isGrantExpiringSoon, type AccessGrant } from "@/lib/access";

export function AccessExpirationBadge({ grant }: { grant: AccessGrant }) {
  if (isGrantExpired(grant)) return <Badge variant="destructive" className="rounded-full">Expired</Badge>;
  if (isGrantExpiringSoon(grant)) return <Badge variant="outline" className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">Expiring soon</Badge>;
  if (isGrantActive(grant)) return <Badge variant="outline" className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Active</Badge>;
  return <Badge variant="outline">Inactive</Badge>;
}