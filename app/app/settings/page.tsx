import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GroupSettings } from "@/components/settings/group-settings"
import { MembersList } from "@/components/settings/members-list"

export const metadata = {
  title: "Settings - Training Tracker",
  description: "Manage your group and settings",
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*, groups(*)")
    .eq("id", user.id)
    .single()

  if (!profile?.group_id) {
    redirect("/onboarding")
  }

  const { data: members } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("group_id", profile.group_id)

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your group and members</p>
      </div>

      <GroupSettings group={profile.groups} isAdmin={profile.role === "admin"} />
      <MembersList
        members={members || []}
        currentUserId={user.id}
        isAdmin={profile.role === "admin"}
      />
    </div>
  )
}
