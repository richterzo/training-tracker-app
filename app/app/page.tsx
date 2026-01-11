import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CalendarView } from "@/components/calendar/calendar-view"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function AppHomePage() {
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

  // Get current month's workouts
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: workouts } = await supabase
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
    .eq("user_id", user.id)
    .gte("scheduled_date", startOfMonth.toISOString().split("T")[0])
    .lte("scheduled_date", endOfMonth.toISOString().split("T")[0])

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Plan your training schedule</p>
        </div>
        <Button asChild size="icon">
          <Link href="/app/plan/new">
            <Plus className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <CalendarView workouts={workouts || []} />
    </div>
  )
}
