import { SaveButton } from "@/components/onboarding/SaveButton";

export function SaveResourceButton({ resourceId, variant = "icon", className }: { resourceId: string; variant?: "icon"|"button"; className?: string }) {
  return <SaveButton targetType="resource" targetId={resourceId} variant={variant} className={className} />;
}