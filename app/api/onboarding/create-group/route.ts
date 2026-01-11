import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { groupName, fullName, displayName } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({ name: groupName })
      .select()
      .single()

    if (groupError) {
      console.error("[v0] Error creating group:", groupError)
      return NextResponse.json(
        {
          error: "Failed to create group",
          details: groupError.message,
          hint:
            groupError.code === "PGRST116"
              ? "Database tables may not exist. Please run the SQL scripts in Supabase."
              : undefined,
        },
        { status: 500 }
      )
    }

    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: user.id,
      email: user.email!,
      full_name: fullName,
      display_name: displayName,
      group_id: group.id,
      role: "admin",
    })

    if (profileError) {
      console.error("[v0] Error creating profile:", profileError)
      return NextResponse.json(
        {
          error: "Failed to create profile",
          details: profileError.message,
          hint:
            profileError.code === "PGRST116"
              ? "Database tables may not exist. Please run the SQL scripts in Supabase."
              : undefined,
        },
        { status: 500 }
      )
    }

    // Seed default exercises for the group (optional - don't fail if this doesn't work)
    const { error: seedError } = await supabase.rpc("seed_default_exercises", {
      target_group_id: group.id,
      creator_user_id: user.id,
    })

    if (seedError) {
      console.error("[v0] Error seeding exercises:", seedError)
      // Don't fail the request if seeding fails - it's optional
    }

    return NextResponse.json({ success: true, groupId: group.id })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "Internal server error",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
