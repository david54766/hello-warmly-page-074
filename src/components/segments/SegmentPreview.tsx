import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { conditionLabel, type SegmentCondition } from "@/lib/segments";

export function SegmentPreview({ conditions, matchMode }: { conditions: SegmentCondition[]; matchMode: "all" | "any" }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
      <CardContent>
        {conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add conditions to preview targeted members.</p>
        ) : (
          <p className="text-sm">
            Members where {matchMode === "all" ? "ALL" : "ANY"} of: {" "}
            <span className="font-medium">
              {conditions.map((c, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-muted-foreground"> {matchMode === "all" ? "AND" : "OR"} </span>}
                  {conditionLabel(c.type)} {c.value ? `"${c.value}"` : ""}
                </span>
              ))}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}