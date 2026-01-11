import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WorkoutPlayer } from "@/components/workout/workout-player"

export const metadata = {
  title: "Workout - Training Tracker",
  description: "Track your workout",
}

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    // Unwrap params Promise (Next.js 15+)
    const { id } = await params

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[WorkoutPage] Auth error:", authError)
      redirect("/login")
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("group_id")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[WorkoutPage] Profile error:", profileError)
      redirect("/onboarding")
    }

    if (!profile?.group_id) {
      console.error("[WorkoutPage] No group_id for user:", user.id)
      redirect("/onboarding")
    }

    // Get planned workout - try without group filter first to see if it exists
    const { data: plannedWorkout, error: workoutError } = await supabase
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
      .single()

    if (workoutError) {
      console.error("[WorkoutPage] Error fetching workout:", {
        error: workoutError,
        code: workoutError.code,
        message: workoutError.message,
        details: workoutError.details,
        hint: workoutError.hint,
        workoutId: id,
        userId: user.id,
        groupId: profile.group_id,
      })
      redirect("/app")
    }

    if (!plannedWorkout) {
      console.error("[WorkoutPage] Workout not found:", {
        workoutId: id,
        userId: user.id,
        groupId: profile.group_id,
      })
      redirect("/app")
    }

    // Check if workout is in user's group
    if (plannedWorkout.group_id !== profile.group_id) {
      console.error("[WorkoutPage] Workout not in user's group:", {
        workoutId: params.id,
        workoutGroupId: plannedWorkout.group_id,
        userGroupId: profile.group_id,
        userId: user.id,
      })
      redirect("/app")
    }

    // Check if user has access: owner or participant in group workout
    const isOwner = plannedWorkout.user_id === user.id
    let isParticipant = false

    if (!isOwner) {
      // If not owner, check if it's a group workout and user is participant
      if (plannedWorkout.is_group_workout) {
        const { data: participant, error: participantError } = await supabase
          .from("workout_participants")
          .select("id")
          .eq("planned_workout_id", plannedWorkout.id)
          .eq("user_id", user.id)
          .in("status", ["invited", "confirmed"])
          .maybeSingle()

        if (participantError) {
          console.error("[WorkoutPage] Error checking participant:", participantError)
        }

        isParticipant = !!participant

        if (!isParticipant) {
          // User is in the group but not a participant - allow them to join
          // Check if user is in the same group
          if (plannedWorkout.group_id === profile.group_id) {
            // Allow access - they can join the workout
            // We'll add a join button in the UI
          } else {
            console.error("[WorkoutPage] Access denied - user not in group:", {
              workoutId: id,
              userId: user.id,
              workoutGroupId: plannedWorkout.group_id,
              userGroupId: profile.group_id,
            })
            redirect("/app")
          }
        }
      } else {
        // Not owner and not a group workout - deny access
        console.error("[WorkoutPage] Access denied - user is not owner of non-group workout:", {
          workoutId: id,
          userId: user.id,
          workoutOwnerId: plannedWorkout.user_id,
        })
        redirect("/app")
      }
    }

    const { data: existingWorkout, error: existingWorkoutError } = await supabase
      .from("completed_workouts")
      .select(
        `
        *,
        completed_sets(*)
      `
      )
      .eq("planned_workout_id", plannedWorkout.id)
      .is("completed_at", null)
      .maybeSingle()

    if (existingWorkoutError && existingWorkoutError.code !== "PGRST116") {
      console.error("[WorkoutPage] Error fetching existing workout:", existingWorkoutError)
    }

    let participants: any[] = []
    if (plannedWorkout.is_group_workout) {
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
        .eq("planned_workout_id", plannedWorkout.id)
        .in("status", ["invited", "confirmed"])

      participants = participantsData || []
    }

    return (
      <WorkoutPlayer
        plannedWorkout={plannedWorkout}
        existingWorkout={existingWorkout || null}
        groupId={profile.group_id}
        userId={user.id}
        isGroupWorkout={plannedWorkout.is_group_workout || false}
        participants={participants}
        canJoin={!isOwner && !isParticipant && plannedWorkout.is_group_workout && plannedWorkout.group_id === profile.group_id}
      />
    )
  } catch (error) {
    // NEXT_REDIRECT is expected, don't log it as an error
    if (error && typeof error === "object" && "digest" in error && error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error // Re-throw redirect errors
    }
    console.error("[WorkoutPage] Unexpected error:", error)
    redirect("/app")
  }
}
