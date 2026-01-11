import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileView } from "@/components/profile/profile-view"

export const metadata = {
  title: "Profile - Training Tracker",
  description: "Manage your profile and track body measurements",
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/onboarding")
  }

  // Get body measurements history
  const { data: measurements } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(100)

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your profile and track your progress</p>
      </div>

      <ProfileView profile={profile} measurements={measurements || []} userId={user.id} />
    </div>
  )
}
