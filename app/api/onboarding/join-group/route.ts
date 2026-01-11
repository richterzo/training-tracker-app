import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { inviteCode, fullName, displayName } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For now, use a simple invite code format: GROUP_ID
    // In production, you'd want to implement a proper invite system
    const groupId = inviteCode

    // Verify group exists
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 })
    }

    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: user.id,
      email: user.email!,
      full_name: fullName,
      display_name: displayName,
      group_id: group.id,
      role: "member",
    })

    if (profileError) {
      console.error("[v0] Error creating profile:", profileError)
      return NextResponse.json({ error: "Failed to join group" }, { status: 500 })
    }

    return NextResponse.json({ success: true, groupId: group.id })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
