import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"

export const metadata = {
  title: "Welcome - Training Tracker",
  description: "Complete your account setup",
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user already has a profile with a group
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("group_id")
    .eq("id", user.id)
    .single()

  if (profile?.group_id) {
    redirect("/app")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <OnboardingFlow user={user} />
    </div>
  )
}
