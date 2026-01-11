import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WorkoutViewEdit } from "@/components/planning/workout-view-edit"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Workout Details - Training Tracker",
  description: "View and edit planned workout",
}

export default async function PlanWorkoutDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("group_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.group_id) {
    redirect("/onboarding")
  }

  const { data: plannedWorkout } = await supabase
    .from("planned_workouts")
    .select(
      `
      *,
      planned_workout_exercises(
        *,
        exercises(*)
      )
    `
    )
    .eq("id", id)
    .eq("group_id", profile.group_id)
    .single()

  if (!plannedWorkout) {
    redirect("/app")
  }

  const isOwner = plannedWorkout.user_id === user.id
  const isAdmin = profile.role === "admin"

  if (!isOwner && !isAdmin) {
    redirect("/app")
  }

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("group_id", profile.group_id)
    .order("name")

  const { data: groupMembers } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("group_id", profile.group_id)

  const { data: participants } = await supabase
    .from("workout_participants")
    .select(
      `
      *,
      user_profiles(
        id,
        display_name,
        full_name,
        email
      )
    `
    )
    .eq("planned_workout_id", id)

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Workout Details</h1>
          <p className="text-muted-foreground">{plannedWorkout.name}</p>
        </div>
      </div>

      <WorkoutViewEdit
        plannedWorkout={plannedWorkout}
        exercises={exercises || []}
        groupMembers={groupMembers || []}
        participants={participants || []}
        currentUserId={user.id}
        isOwner={isOwner}
        isAdmin={isAdmin}
        groupId={profile.group_id}
      />
    </div>
  )
}
