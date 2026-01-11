import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StatsView } from "@/components/stats/stats-view"

export const metadata = {
  title: "Statistics - Training Tracker",
  description: "View your training statistics and progress",
}

export default async function StatsPage() {
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

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const { data: weeklyWorkouts } = await supabase
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
    .gte("completed_at", startOfWeek.toISOString())
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })

  const { data: monthlyWorkouts } = await supabase
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
    .gte("completed_at", startOfMonth.toISOString())
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })

  const { data: yearlyWorkouts } = await supabase
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
    .gte("completed_at", startOfYear.toISOString())
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })

  const { data: allExercises } = await supabase
    .from("exercises")
    .select("id, name, category")
    .eq("group_id", profile.group_id)

  // Get group members for group stats
  const { data: groupMembers } = await supabase
    .from("user_profiles")
    .select("id, display_name, full_name, email")
    .eq("group_id", profile.group_id)

  // Get all group workouts for group stats
  const { data: groupWeeklyWorkouts } = await supabase
    .from("completed_workouts")
    .select(
      `
      *,
      completed_sets(
        *,
        exercises(*)
      ),
      user_profiles(
        id,
        display_name,
        full_name,
        email
      )
    `
    )
    .eq("group_id", profile.group_id)
    .gte("completed_at", startOfWeek.toISOString())
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })

  const { data: groupMonthlyWorkouts } = await supabase
    .from("completed_workouts")
    .select(
      `
      *,
      completed_sets(
        *,
        exercises(*)
      ),
      user_profiles(
        id,
        display_name,
        full_name,
        email
      )
    `
    )
    .eq("group_id", profile.group_id)
    .gte("completed_at", startOfMonth.toISOString())
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })

  const { data: groupYearlyWorkouts } = await supabase
    .from("completed_workouts")
    .select(
      `
      *,
      completed_sets(
        *,
        exercises(*)
      ),
      user_profiles(
        id,
        display_name,
        full_name,
        email
      )
    `
    )
    .eq("group_id", profile.group_id)
    .gte("completed_at", startOfYear.toISOString())
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-muted-foreground">Your training progress and group analytics</p>
      </div>

      <StatsView
        weeklyWorkouts={weeklyWorkouts || []}
        monthlyWorkouts={monthlyWorkouts || []}
        yearlyWorkouts={yearlyWorkouts || []}
        exercises={allExercises || []}
        userId={user.id}
        groupMembers={groupMembers || []}
        groupWeeklyWorkouts={groupWeeklyWorkouts || []}
        groupMonthlyWorkouts={groupMonthlyWorkouts || []}
        groupYearlyWorkouts={groupYearlyWorkouts || []}
        groupId={profile.group_id}
      />
    </div>
  )
}
