import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WorkoutDetails } from "@/components/history/workout-details"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Workout Details - Training Tracker",
  description: "View detailed workout information",
}

export default async function WorkoutDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise (Next.js 15+)
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

  // Get the completed workout with all sets
  const { data: workout } = await supabase
    .from("completed_workouts")
    .select(
      `
      *,
      completed_sets(
        *,
        exercises(*)
      ),
      planned_workouts(
        id,
        is_group_workout,
        location,
        location_lat,
        location_lng
      )
    `
    )
    .eq("id", id)
    .single()

  if (!workout) {
    redirect("/app/history")
  }

  // Get participants separately if it's a group workout
  let participants: any[] = []
  if (workout.planned_workout_id) {
    const { data: participantsData } = await supabase
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
      .eq("planned_workout_id", workout.planned_workout_id)
      .in("status", ["invited", "confirmed"])

    participants = participantsData || []
  }

  // Check if user has access (must be the owner or in the same group)
  if (workout.user_id !== user.id && workout.group_id !== profile.group_id) {
    redirect("/app/history")
  }

  // If it's a group workout, get all participants' completed workouts
  let groupWorkouts: any[] = []
  if (workout.planned_workouts?.is_group_workout && participants.length > 0) {
    const participantIds = participants
      .filter((p: any) => p.status === "confirmed" || p.user_id === workout.user_id)
      .map((p: any) => p.user_id)

    const { data: allWorkouts } = await supabase
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
      .eq("planned_workout_id", workout.planned_workout_id)
      .in("user_id", participantIds)
      .not("completed_at", "is", null)

    groupWorkouts = allWorkouts || []
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/history">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Workout Details</h1>
          <p className="text-muted-foreground">{workout.name}</p>
        </div>
      </div>

      <WorkoutDetails
        workout={workout}
        groupWorkouts={groupWorkouts}
        participants={participants}
        currentUserId={user.id}
        isAdmin={profile.role === "admin"}
        groupId={profile.group_id}
      />
    </div>
  )
}
