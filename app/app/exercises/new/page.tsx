import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NewExerciseForm } from "@/components/exercises/new-exercise-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "New Exercise - Training Tracker",
  description: "Add a new exercise to your library",
}

export default async function NewExercisePage() {
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

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/exercises">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Exercise</h1>
          <p className="text-muted-foreground">Add a new exercise to your library</p>
        </div>
      </div>

      <NewExerciseForm groupId={profile.group_id} userId={user.id} />
    </div>
  )
}
