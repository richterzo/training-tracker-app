import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { TeamHeader } from "@/components/navigation/team-header"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Training Tracker</h1>
          <TeamHeader groupId={profile.group_id} currentUserId={user.id} />
        </div>
      </header>
      <main className="pb-16">{children}</main>
      <BottomNav />
    </div>
  )
}
