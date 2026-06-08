import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AIGeneratedPreview({ title, body }: { title: string; body: string }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle className="text-base">Generated content preview</CardTitle></CardHeader>
      <CardContent>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}