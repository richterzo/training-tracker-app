import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NewTemplateForm } from "@/components/templates/new-template-form"
import { CalisthenicsPresets } from "@/components/templates/calisthenics-presets"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "New Template - Training Tracker",
  description: "Create a new workout template",
}

export default async function NewTemplatePage() {
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

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/exercises">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Template</h1>
          <p className="text-muted-foreground">Create a workout template or use a preset</p>
        </div>
      </div>

      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="presets">Calisthenics Presets</TabsTrigger>
          <TabsTrigger value="custom">Custom Template</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="mt-6">
          <CalisthenicsPresets
            groupId={profile.group_id}
            userId={user.id}
          />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <NewTemplateForm groupId={profile.group_id} userId={user.id} exercises={exercises || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
