import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WorkoutHistory } from "@/components/history/workout-history"
import { StatsOverview } from "@/components/history/stats-overview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = {
  title: "History - Training Tracker",
  description: "View your workout history and stats",
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("group_id")
    .eq("id", user.id)
    .single()

  if (!profile?.group_id) {
    redirect("/onboarding")
  }

  // Get completed workouts
  const { data: workouts } = await supabase
    .from("completed_workouts")
    .select(
      `
      *,
      completed_sets(
        *,
        exercises(*)
      )
    `
    )
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(50)

  // Get stats
  const { count: totalWorkouts } = await supabase
    .from("completed_workouts")
    .select("*", { count: "only", head: true })
    .eq("user_id", user.id)
    .not("completed_at", "is", null)

  const { data: totalSetsData } = await supabase
    .from("completed_sets")
    .select("id, completed_workouts!inner(user_id)")
    .eq("completed_workouts.user_id", user.id)

  const { data: recentWorkouts } = await supabase
    .from("completed_workouts")
    .select("duration_seconds")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .not("duration_seconds", "is", null)
    .order("completed_at", { ascending: false })
    .limit(10)

  const avgDuration =
    recentWorkouts && recentWorkouts.length > 0
      ? Math.round(
          recentWorkouts.reduce((acc, w) => acc + (w.duration_seconds || 0), 0) /
            recentWorkouts.length /
            60
        )
      : 0

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground">Your workout history and progress</p>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-6">
          <WorkoutHistory workouts={workouts || []} />
        </TabsContent>
        <TabsContent value="stats" className="mt-6">
          <StatsOverview
            totalWorkouts={totalWorkouts || 0}
            totalSets={totalSetsData?.length || 0}
            avgDuration={avgDuration}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
