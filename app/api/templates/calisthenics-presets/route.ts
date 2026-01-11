import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Calisthenics template presets based on the document
const CALISTHENICS_PRESETS = {
  "plain-basics-1": {
    name: "Plain Basics - Day 1",
    description: "Full body basics training. Push, Pull, Core combined",
    exercises: [
      { group: 1, level: "1-4", category: "push", note: "Choose level 1.1-1.4" },
      { group: 2, level: "1-4", category: "push", note: "Choose level 2.1-2.4" },
      { group: 3, level: "1-4", category: "push", note: "Choose level 3.1-3.4" },
      { group: 4, level: "1-4", category: "push", note: "Choose level 4.1-4.4" },
      { group: 1, level: "1-4", category: "pull", note: "Choose level 1.1-1.4" },
      { group: 2, level: "1-4", category: "pull", note: "Choose level 2.1-2.4" },
      { group: 4, level: "1-4", category: "pull", note: "Choose level 4.1-4.4" },
      { group: 7, level: "1-4", category: "core", note: "Choose level 7.1-7.4" },
    ],
  },
  "plain-basics-2": {
    name: "Plain Basics - Day 2",
    description: "Full body basics training. Push, Pull, Core combined",
    exercises: [
      { group: 1, level: "1-4", category: "pull", note: "Choose level 1.1-1.4" },
      { group: 2, level: "1-4", category: "pull", note: "Choose level 2.1-2.4" },
      { group: 4, level: "1-4", category: "pull", note: "Choose level 4.1-4.4" },
      { group: 5, level: "1-4", category: "pull", note: "Choose level 5.1-5.4" },
      { group: 7, level: "1-4", category: "core", note: "Choose level 7.1-7.4" },
      { group: 1, level: "1-4", category: "push", note: "Choose level 1.1-1.4" },
      { group: 2, level: "1-4", category: "push", note: "Choose level 2.1-2.4" },
      { group: 3, level: "1-4", category: "push", note: "Choose level 3.1-3.4" },
      { group: 4, level: "1-4", category: "push", note: "Choose level 4.1-4.4" },
    ],
  },
  "plain-basics-3": {
    name: "Plain Basics - Day 3",
    description: "Full body basics training. Push, Pull, Core combined",
    exercises: [
      { group: 5, level: "1-4", category: "push", note: "Choose level 5.1-5.4" },
      { group: 6, level: "1-4", category: "push", note: "Choose level 6.1-6.4" },
      { group: 2, level: "1-4", category: "pull", note: "Choose level 2.1-2.4" },
      { group: 3, level: "1-4", category: "pull", note: "Choose level 3.1-3.4" },
      { group: 7, level: "1-4", category: "core", note: "Choose level 7.1-7.4" },
    ],
  },
  "plain-basics-4": {
    name: "Plain Basics - Day 4",
    description: "Full body basics training. Push, Pull, Core combined",
    exercises: [
      { group: 3, level: "1-4", category: "pull", note: "Choose level 3.1-3.4" },
      { group: 6, level: "1-4", category: "pull", note: "Choose level 6.1-6.4" },
      { group: 4, level: "1-4", category: "pull", note: "Choose level 4.1-4.4" },
      { group: 5, level: "1-4", category: "pull", note: "Choose level 5.1-5.4" },
      { group: 7, level: "1-4", category: "core", note: "Choose level 7.1-7.4" },
      { group: 5, level: "1-2", category: "push", note: "Choose level 5.1-5.2" },
      { group: 6, level: "1-4", category: "push", note: "Choose level 6.1-6.4" },
      { group: 7, level: "1-4", category: "core", note: "Choose level 7.1-7.4" },
      { group: 5, level: "3-4", category: "push", note: "Choose level 5.3-5.4" },
    ],
  },
  "pull-strength": {
    name: "Pull Strength Focus",
    description: "Focused pulling strength training with minimal push exercises for balance",
    exercises: [
      { group: 2, level: "1-4", category: "pull", note: "Choose level 2.1-2.4" },
      { group: 3, level: "1-4", category: "pull", note: "Choose level 3.1-3.4" },
      { group: 4, level: "1-4", category: "pull", note: "Choose level 4.1-4.4" },
      { group: 7, level: "1-4", category: "core", note: "Choose level 7.1-7.4" },
      { group: 1, level: "4", category: "push", note: "Level 1.4 only" },
      { group: 4, level: "3-4", category: "push", note: "Choose level 4.3-4.4" },
    ],
  },
  "push-strength": {
    name: "Push Strength Focus",
    description: "Focused pushing strength training with minimal pull exercises for balance",
    exercises: [
      { group: 2, level: "1-4", category: "push", note: "Choose level 2.1-2.4" },
      { group: 5, level: "1-4", category: "push", note: "Choose level 5.1-5.4" },
      { group: 4, level: "1-4", category: "push", note: "Choose level 4.1-4.4" },
      { group: 7, level: "1-4", category: "core", note: "Choose level 7.1-7.4" },
      { group: 1, level: "4", category: "pull", note: "Level 1.4 only" },
      { group: 4, level: "1-4", category: "pull", note: "Choose level 4.1-4.4" },
    ],
  },
  "core-focus": {
    name: "Core Strength",
    description: "Dedicated core training program",
    exercises: [
      { group: 1, level: "1-4", category: "core", note: "ABS1 - Choose level 1.1-1.4" },
      { group: 2, level: "1-4", category: "core", note: "ABS1 - Choose level 2.1-2.4" },
      { group: 3, level: "1-4", category: "core", note: "ABS1 - Choose level 3.1-3.4" },
      { group: 4, level: "3", category: "core", note: "SIDE ABS - Level 4.3" },
      { group: 6, level: "1-4", category: "core", note: "SIDE ABS - Choose level 6.1-6.4" },
      { group: 7, level: "1-4", category: "core", note: "SIDE ABS - Choose level 7.1-7.4" },
      { group: 4, level: "1-4", category: "core", note: "ABS2 - Choose level 4.1-4.4" },
      { group: 5, level: "1-4", category: "core", note: "ABS2 - Choose level 5.1-5.4" },
    ],
  },
  "planche-prep": {
    name: "Planche Preparation",
    description: "Basic preparation for planche. Focus on pushing strength and core",
    exercises: [
      { group: 1, level: "4", category: "push", note: "Level 1.4" },
      { group: 2, level: "4", category: "push", note: "Level 2.4" },
      { group: 2, level: "3", category: "push", note: "Level 2.3" },
      { group: 5, level: "4", category: "push", note: "Level 5.4" },
      { group: 3, level: "4", category: "pull", note: "Level 3.4" },
      { group: 4, level: "3", category: "pull", note: "Level 4.3" },
      { group: 6, level: "4", category: "pull", note: "Level 6.4" },
      { group: 7, level: "4", category: "pull", note: "Level 7.4" },
      { group: 4, level: "4", category: "core", note: "Level 4.4" },
      { group: 5, level: "4", category: "core", note: "Level 5.4" },
    ],
  },
  "handstand-prep": {
    name: "Handstand Preparation",
    description: "Basic preparation for handstand. Focus on pushing strength and core",
    exercises: [
      { group: 1, level: "4", category: "push", note: "Level 1.4" },
      { group: 2, level: "4", category: "push", note: "Level 2.4" },
      { group: 3, level: "4", category: "push", note: "Level 3.4" },
      { group: 5, level: "4", category: "core", note: "Level 5.4" },
      { group: 4, level: "3", category: "core", note: "Level 4.3" },
      { group: 6, level: "4", category: "core", note: "Level 6.4" },
    ],
  },
  "front-lever-prep": {
    name: "Front Lever Preparation",
    description: "Basic preparation for front lever. Focus on pulling and core strength",
    exercises: [
      { group: 7, level: "3", category: "push", note: "French push ups - Level 7.3" },
      { group: 3, level: "4", category: "pull", note: "Level 3.4" },
      { group: 6, level: "4", category: "pull", note: "Level 6.4" },
      { group: 4, level: "4", category: "pull", note: "Level 4.4" },
      { group: 5, level: "4", category: "pull", note: "Level 5.4" },
      { group: 4, level: "4", category: "core", note: "Level 4.4" },
      { group: 5, level: "4", category: "core", note: "Level 5.4" },
      { group: 3, level: "4", category: "core", note: "Level 3.4" },
      { group: 1, level: "4", category: "core", note: "Level 1.4" },
    ],
  },
  "one-arm-pullup-prep": {
    name: "One Arm Pull Up Preparation",
    description: "Basic preparation for one arm pull up. Focus on asymmetric pulling",
    exercises: [
      { group: 4, level: "4", category: "pull", note: "Level 4.4" },
      { group: 7, level: "2", category: "pull", note: "Level 7.2" },
      { group: 7, level: "3", category: "pull", note: "Level 7.3" },
      { group: 7, level: "4", category: "pull", note: "Level 7.4" },
    ],
  },
  "back-lever-prep": {
    name: "Back Lever Preparation",
    description: "Basic preparation for back lever. Focus on upper back and core",
    exercises: [
      { group: 3, level: "4", category: "push", note: "Level 3.4" },
      { group: 5, level: "3", category: "push", note: "Level 5.3" },
      { group: 4, level: "4", category: "pull", note: "Level 4.4" },
      { group: 6, level: "4", category: "pull", note: "Level 6.4" },
      { group: 1, level: "4", category: "pull", note: "Level 1.4" },
      { group: 4, level: "3", category: "core", note: "Level 4.3" },
      { group: 5, level: "4", category: "core", note: "Level 5.4" },
      { group: 1, level: "4", category: "core", note: "Level 1.4" },
    ],
  },
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const presetId = searchParams.get("id")

    if (presetId && presetId in CALISTHENICS_PRESETS) {
      return NextResponse.json(CALISTHENICS_PRESETS[presetId as keyof typeof CALISTHENICS_PRESETS])
    }

    return NextResponse.json(Object.keys(CALISTHENICS_PRESETS).map((id) => ({
      id,
      ...CALISTHENICS_PRESETS[id as keyof typeof CALISTHENICS_PRESETS],
    })))
  } catch (error) {
    console.error("[CalisthenicsPresets] Error:", error)
    return NextResponse.json({ error: "Failed to fetch presets" }, { status: 500 })
  }
}
