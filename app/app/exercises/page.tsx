import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ExerciseLibrary } from "@/components/exercises/exercise-library"
import { VideoGallery } from "@/components/exercises/video-gallery"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { TemplatesList } from "@/components/exercises/templates-list"

export const metadata = {
  title: "Exercises - Training Tracker",
  description: "Manage your exercise library and workout templates",
}

export default async function ExercisesPage() {
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

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("group_id", profile.group_id)
    .order("name")

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

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exercises</h1>
          <p className="text-muted-foreground">Manage your exercise library and templates</p>
        </div>
        <Button asChild size="icon">
          <Link href="/app/exercises/new">
            <Plus className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="exercises" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="videos">Video Gallery</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="exercises" className="mt-6">
          <ExerciseLibrary exercises={exercises || []} />
        </TabsContent>
        <TabsContent value="videos" className="mt-6">
          <VideoGallery exercises={exercises || []} />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <TemplatesList templates={templates || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
