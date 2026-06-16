import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Radio, Calendar, MessageSquare, PlayCircle } from "lucide-react";
import { useState } from "react";
import { LIVESTREAM_PROVIDER_LABELS, type EventRow } from "@/lib/events";

type Tab = "stream" | "agenda" | "chat" | "replay";

export function LivestreamPanel({
  event,
  canJoin,
  isLive,
  isPast,
}: {
  event: EventRow;
  canJoin: boolean;
  isLive: boolean;
  isPast: boolean;
}) {
  const hasReplay = !!event.replay_url && isPast;
  const defaultTab: Tab = hasReplay ? "replay" : "stream";
  const [tab, setTab] = useState<Tab>(defaultTab);

  const tabs = (
    [
      { id: "stream" as Tab, label: isLive ? "Live" : "Stream", show: true },
      { id: "agenda" as Tab, label: "Agenda", show: !!event.event_agenda_json?.length },
      { id: "chat" as Tab, label: "Live Chat", show: !!event.live_chat_enabled },
      { id: "replay" as Tab, label: "Replay", show: hasReplay },
    ]
  ).filter((t) => t.show);

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center gap-2 border-b pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
          {event.calendar_url_placeholder && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              asChild
            >
              <a href={event.calendar_url_placeholder} target="_blank" rel="noopener noreferrer">
                <Calendar className="size-4" />
                Add to calendar
              </a>
            </Button>
          )}
        </div>

        {tab === "stream" && (
          <div className="space-y-3">
            {event.livestream_provider && (
              <p className="text-xs text-muted-foreground">
                Powered by {LIVESTREAM_PROVIDER_LABELS[event.livestream_provider]}
              </p>
            )}
            {canJoin && event.livestream_embed_url ? (
              <div className="aspect-video overflow-hidden rounded-xl bg-black">
                <iframe
                  src={event.livestream_embed_url}
                  title="Live stream"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : canJoin && event.livestream_join_url ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <Radio className="mx-auto mb-2 size-6 text-primary" />
                <p className="mb-3 text-sm text-muted-foreground">
                  {isLive ? "The stream is live now." : "Join opens shortly before the event starts."}
                </p>
                <Button asChild>
                  <a href={event.livestream_join_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    {isLive ? "Join live" : "Open join link"}
                  </a>
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                RSVP as going to reveal the live stream join link.
              </div>
            )}
          </div>
        )}

        {tab === "agenda" && (
          <ol className="space-y-3">
            {event.event_agenda_json?.map((item, idx) => (
              <li key={idx} className="flex gap-3 rounded-xl border bg-muted/30 p-3">
                <div className="w-20 shrink-0 text-xs font-medium text-primary">{item.time ?? "—"}</div>
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {tab === "chat" && (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <MessageSquare className="mx-auto mb-2 size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Live event chat will appear here during the session.
            </p>
          </div>
        )}

        {tab === "replay" && hasReplay && (
          <div className="space-y-3">
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                src={event.replay_url!}
                title="Replay"
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <Button variant="outline" asChild>
              <a href={event.replay_url!} target="_blank" rel="noopener noreferrer">
                <PlayCircle className="size-4" />
                Open replay
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}