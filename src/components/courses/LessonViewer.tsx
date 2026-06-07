import { Card, CardContent } from "@/components/ui/card";
import { Paperclip, Video } from "lucide-react";
import type { Lesson } from "@/lib/courses";

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return null;
  }
}

export function LessonViewer({ lesson }: { lesson: Lesson }) {
  const embed = lesson.video_url ? getEmbedUrl(lesson.video_url) : null;
  return (
    <div className="space-y-6">
      <div className="aspect-video rounded-2xl overflow-hidden bg-muted grid place-items-center">
        {embed ? (
          <iframe
            src={embed}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        ) : (
          <div className="flex flex-col items-center text-muted-foreground gap-2">
            <Video className="size-10" />
            <p className="text-sm">Video coming soon</p>
          </div>
        )}
      </div>
      {lesson.content?.trim() ? (
        <article className="prose prose-sm sm:prose-base max-w-none dark:prose-invert whitespace-pre-wrap">
          {lesson.content}
        </article>
      ) : (
        <p className="text-sm text-muted-foreground">No written content for this lesson yet.</p>
      )}
      {lesson.attachments?.length > 0 && (
        <Card className="rounded-2xl">
          <CardContent className="pt-5 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Paperclip className="size-4" />Attachments</h3>
            <ul className="space-y-1 text-sm">
              {lesson.attachments.map((url, i) => (
                <li key={i}>
                  <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">{url}</a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}