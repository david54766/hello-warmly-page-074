import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardCard, EmptyState } from "./DashboardCard";
import { SpaceMemberList, type SpaceMemberRow } from "./SpaceMemberList";
import { Compass, Newspaper, GraduationCap, Calendar, Users, BookOpen, Sparkles } from "lucide-react";
import type { Space } from "@/lib/spaces";
import { FeedList } from "@/components/feed/FeedList";
import { SpaceCoursesTab } from "./SpaceCoursesTab";
import { UpcomingEventsWidget } from "@/components/events/UpcomingEventsWidget";

export function SpaceTabs({ space, members }: { space: Space; members: SpaceMemberRow[] }) {
  return (
    <Tabs defaultValue="discovery" className="space-y-4">
      <TabsList className="flex flex-wrap h-auto">
        <TabsTrigger value="discovery"><Compass className="size-4 mr-1.5" />Discovery</TabsTrigger>
        <TabsTrigger value="feed"><Newspaper className="size-4 mr-1.5" />Feed</TabsTrigger>
        <TabsTrigger value="courses"><GraduationCap className="size-4 mr-1.5" />Courses</TabsTrigger>
        <TabsTrigger value="events"><Calendar className="size-4 mr-1.5" />Events</TabsTrigger>
        <TabsTrigger value="members"><Users className="size-4 mr-1.5" />Members</TabsTrigger>
        <TabsTrigger value="resources"><BookOpen className="size-4 mr-1.5" />Resources</TabsTrigger>
      </TabsList>

      <TabsContent value="discovery" className="space-y-4">
        <DashboardCard title={`Welcome to ${space.name}`} icon={<Sparkles className="size-4" />}>
          <p className="text-sm text-muted-foreground">
            Start here to find the most important conversations, lessons, events, and resources in this Space.
          </p>
        </DashboardCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardCard title="Featured discussion" icon={<Newspaper className="size-4" />} comingSoon>
            <p className="text-sm text-muted-foreground">Top conversations will appear here.</p>
          </DashboardCard>
          <DashboardCard title="Featured course" icon={<GraduationCap className="size-4" />} comingSoon>
            <p className="text-sm text-muted-foreground">Highlighted lessons will appear here.</p>
          </DashboardCard>
          <DashboardCard title="Upcoming event" icon={<Calendar className="size-4" />} comingSoon>
            <p className="text-sm text-muted-foreground">Live sessions and meetups will appear here.</p>
          </DashboardCard>
          <DashboardCard title="Resources" icon={<BookOpen className="size-4" />} comingSoon>
            <p className="text-sm text-muted-foreground">Templates and downloads will appear here.</p>
          </DashboardCard>
        </div>
      </TabsContent>

      <TabsContent value="feed">
        <FeedList
          scopeSpaceId={space.id}
          joinableSpaces={[space]}
          showFilters
          emptyTitle={`No posts in ${space.name} yet`}
          emptyDescription="Be the first to start the conversation."
        />
      </TabsContent>
      <TabsContent value="courses">
        <SpaceCoursesTab spaceId={space.id} />
      </TabsContent>
      <TabsContent value="events">
        <UpcomingEventsWidget spaceId={space.id} limit={10} />
      </TabsContent>
      <TabsContent value="members">
        <SpaceMemberList members={members} />
      </TabsContent>
      <TabsContent value="resources">
        <EmptyState icon={<BookOpen className="size-5" />} title="Resources are coming soon" description="Templates, files, and links will live here." />
      </TabsContent>
    </Tabs>
  );
}