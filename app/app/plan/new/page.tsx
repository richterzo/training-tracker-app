import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PlanWorkoutForm } from "@/components/planning/plan-workout-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Plan Workout - Training Tracker",
  description: "Plan a new workout session",
}

export default async function PlanWorkoutPage() {
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

  const { data: templates } = await supabase
    .from("workout_templates")
    .select(
      `
      *,
      template_exercises(
        *,
        exercises(*)
      )
    `
    )
    .eq("group_id", profile.group_id)
    .order("name")

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("group_id", profile.group_id)
    .order("name")

  const { data: groupMembers } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("group_id", profile.group_id)

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Plan Workout</h1>
          <p className="text-muted-foreground">Schedule a workout session</p>
        </div>
      </div>

      <PlanWorkoutForm
        groupId={profile.group_id}
        userId={user.id}
        templates={templates || []}
        exercises={exercises || []}
        groupMembers={groupMembers || []}
      />
    </div>
  )
}
