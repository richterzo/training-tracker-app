import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, TrendingUp, History, Calendar } from "lucide-react"
import Link from "next/link"
import { WorkoutHistory } from "@/components/history/workout-history"

export default async function TeamMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const defaultTab = tab || "stats"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: currentProfile } = await supabase
    .from("user_profiles")
    .select("group_id")
    .eq("id", user.id)
    .single()

  if (!currentProfile?.group_id) {
    redirect("/onboarding")
  }

  // Get team member profile
  const { data: memberProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", id)
    .eq("group_id", currentProfile.group_id)
    .single()

  if (!memberProfile) {
    redirect("/app")
  }

  const displayName = memberProfile.display_name || memberProfile.full_name || memberProfile.email

  // Get member's completed workouts
  const { data: completedWorkouts } = await supabase
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
    .eq("user_id", id)
    .eq("group_id", currentProfile.group_id)
    .order("completed_at", { ascending: false })
    .limit(50)

  // Get member's planned workouts
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: plannedWorkouts } = await supabase
    .from("planned_workouts")
    .select("*")
    .eq("user_id", id)
    .eq("group_id", currentProfile.group_id)
    .gte("scheduled_date", startOfMonth.toISOString().split("T")[0])
    .lte("scheduled_date", endOfMonth.toISOString().split("T")[0])
    .order("scheduled_date", { ascending: true })

  // Calculate stats
  const totalWorkouts = completedWorkouts?.length || 0
  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - 7)
  const weeklyWorkouts =
    completedWorkouts?.filter((w) => new Date(w.completed_at) >= thisWeek).length || 0

  const thisMonth = new Date()
  thisMonth.setMonth(thisMonth.getMonth() - 1)
  const monthlyWorkouts =
    completedWorkouts?.filter((w) => new Date(w.completed_at) >= thisMonth).length || 0

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Team Member</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={memberProfile.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="text-lg">
                {getInitials(memberProfile.full_name || memberProfile.display_name, memberProfile.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{memberProfile.email}</p>
              {memberProfile.bio && (
                <p className="mt-2 text-sm text-muted-foreground">{memberProfile.bio}</p>
              )}
            </div>
            <Badge variant={memberProfile.role === "admin" ? "default" : "secondary"}>
              {memberProfile.role === "admin" ? "Admin" : "Member"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stats">
            <TrendingUp className="mr-2 h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Workouts</CardDescription>
                <CardTitle className="text-3xl">{totalWorkouts}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Week</CardDescription>
                <CardTitle className="text-3xl">{weeklyWorkouts}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Month</CardDescription>
                <CardTitle className="text-3xl">{monthlyWorkouts}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {plannedWorkouts && plannedWorkouts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Workouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plannedWorkouts.map((workout) => (
                    <Link
                      key={workout.id}
                      href={`/app/plan/${workout.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                    >
                      <div>
                        <p className="font-medium">{workout.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(workout.scheduled_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge variant={workout.is_group_workout ? "default" : "secondary"}>
                        {workout.is_group_workout ? "Group" : "Personal"}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <WorkoutHistory workouts={completedWorkouts || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
