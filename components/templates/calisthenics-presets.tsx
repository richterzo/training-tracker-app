"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Sparkles, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Preset {
  id: string
  name: string
  description: string
  exercises: Array<{
    group: number
    level: string
    category: string
    note: string
  }>
}

interface CalisthenicsPresetsProps {
  groupId: string
  userId: string
  onTemplateCreated?: () => void
}

export function CalisthenicsPresets({ groupId, userId, onTemplateCreated }: CalisthenicsPresetsProps) {
  const router = useRouter()
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchPresets()
  }, [])

  const fetchPresets = async () => {
    try {
      const response = await fetch("/api/templates/calisthenics-presets")
      const data = await response.json()
      setPresets(data)
    } catch (err) {
      setError("Failed to load presets")
    } finally {
      setLoading(false)
    }
  }

  const createTemplateFromPreset = async (preset: Preset) => {
    setCreating(preset.id)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    try {
      // Create template
      const { data: template, error: templateError } = await supabase
        .from("workout_templates")
        .insert({
          group_id: groupId,
          name: preset.name,
          description: preset.description,
          created_by: userId,
        })
        .select()
        .single()

      if (templateError) throw templateError

      // Get all exercises in the group to match by category
      const { data: exercises, error: exercisesError } = await supabase
        .from("exercises")
        .select("*")
        .eq("group_id", groupId)

      if (exercisesError) throw exercisesError

      // Create template exercises with progression notes
      // Ensure we have at least one exercise to use as fallback
      if (!exercises || exercises.length === 0) {
        throw new Error("No exercises found in your group. Please create exercises first.")
      }

      const templateExercises = preset.exercises
        .map((presetEx, idx) => {
          // Find matching exercise by category
          const matchingExercise = exercises.find(
            (ex) => ex.category.toLowerCase() === presetEx.category.toLowerCase()
          )

          // Use matching exercise or fallback to first exercise of same category, or first available
          const exerciseToUse = matchingExercise || exercises.find(
            (ex) => ex.category.toLowerCase() === presetEx.category.toLowerCase()
          ) || exercises[0]

          if (!exerciseToUse) {
            return null
          }

          return {
            template_id: template.id,
            exercise_id: exerciseToUse.id,
            order_index: idx,
            sets: 3,
            reps: null,
            duration_seconds: null,
            rest_seconds: 60,
            notes: matchingExercise
              ? `Group ${presetEx.group}, Level ${presetEx.level}: ${presetEx.note}`
              : `${presetEx.category.toUpperCase()} - Group ${presetEx.group}, Level ${presetEx.level}: ${presetEx.note}`,
            progression_range: `${presetEx.group}.${presetEx.level}`,
          }
        })
        .filter((ex): ex is NonNullable<typeof ex> => ex !== null && !!ex.exercise_id) // Only include valid exercises

      if (templateExercises.length > 0) {
        const { error: insertError } = await supabase.from("template_exercises").insert(templateExercises)
        if (insertError) throw insertError
      }

      setSuccess(`Template "${preset.name}" created successfully!`)
      if (onTemplateCreated) {
        onTemplateCreated()
      }
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Failed to create template")
    } finally {
      setCreating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const presetCategories = {
    basics: presets.filter((p) => p.id.includes("plain-basics") || p.id.includes("pull-strength") || p.id.includes("push-strength") || p.id.includes("core-focus")),
    skills: presets.filter((p) => p.id.includes("prep")),
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          Calisthenics Presets
        </h2>
        <p className="text-muted-foreground mt-1">
          Pre-built templates based on the Calisthenics Basic Course. Select your level for each exercise group.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Strength Programs</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {presetCategories.basics.map((preset) => (
              <Card key={preset.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">{preset.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{preset.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 space-y-2 mb-4">
                    <div className="text-xs text-muted-foreground">
                      {preset.exercises.length} exercises
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(preset.exercises.map((e) => e.category))).map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => createTemplateFromPreset(preset)}
                    disabled={creating === preset.id}
                    className="w-full"
                    size="sm"
                  >
                    {creating === preset.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Template"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Skill Preparation Programs</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {presetCategories.skills.map((preset) => (
              <Card key={preset.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">{preset.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{preset.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 space-y-2 mb-4">
                    <div className="text-xs text-muted-foreground">
                      {preset.exercises.length} exercises
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(preset.exercises.map((e) => e.category))).map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => createTemplateFromPreset(preset)}
                    disabled={creating === preset.id}
                    className="w-full"
                    size="sm"
                  >
                    {creating === preset.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Template"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Alert>
        <AlertDescription className="text-sm">
          <strong>Note:</strong> These templates use exercise groups and levels (e.g., 1.1-1.4, 2.1-2.4). 
          When you create a template, you'll need to select the appropriate exercise from your library 
          for each group and level. The progression notes are saved in each exercise's notes field.
        </AlertDescription>
      </Alert>
    </div>
  )
}
