"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Plus, GripVertical, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Database } from "@/lib/types/database"

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]

interface NewTemplateFormProps {
  groupId: string
  userId: string
  exercises: Exercise[]
}

interface TemplateExercise {
  exerciseId: string
  sets: number
  reps: number | null
  duration: number | null
  rest: number
}

export function NewTemplateForm({ groupId, userId, exercises }: NewTemplateFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const addExercise = () => {
    setTemplateExercises([...templateExercises, { exerciseId: "", sets: 3, reps: 10, duration: null, rest: 60 }])
  }

  const removeExercise = (index: number) => {
    setTemplateExercises(templateExercises.filter((_, i) => i !== index))
  }

  const updateExercise = (index: number, field: keyof TemplateExercise, value: string | number | null) => {
    const updated = [...templateExercises]
    updated[index] = { ...updated[index], [field]: value }
    setTemplateExercises(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (templateExercises.length === 0) {
      setError("Add at least one exercise to the template")
      return
    }

    if (templateExercises.some((ex) => !ex.exerciseId)) {
      setError("Select an exercise for all entries")
      return
    }

    setLoading(true)

    const supabase = createClient()

    // Create template
    const { data: template, error: templateError } = await supabase
      .from("workout_templates")
      .insert({
        group_id: groupId,
        name,
        description: description || null,
        created_by: userId,
      })
      .select()
      .single()

    if (templateError) {
      setError(templateError.message)
      setLoading(false)
      return
    }

    // Insert template exercises
    const { error: exercisesError } = await supabase.from("template_exercises").insert(
      templateExercises.map((ex, idx) => ({
        template_id: template.id,
        exercise_id: ex.exerciseId,
        order_index: idx,
        sets: ex.sets,
        reps: ex.reps,
        duration_seconds: ex.duration,
        rest_seconds: ex.rest,
      })),
    )

    if (exercisesError) {
      setError(exercisesError.message)
      setLoading(false)
      return
    }

    router.push("/app/exercises")
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Upper Body Strength"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this workout"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Exercises</Label>
              <Button type="button" variant="outline" size="sm" onClick={addExercise} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add exercise
              </Button>
            </div>

            {templateExercises.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">No exercises added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templateExercises.map((ex, idx) => (
                  <div key={idx} className="flex gap-2 rounded-lg border p-3">
                    <GripVertical className="mt-2 h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 space-y-3">
                      <Select value={ex.exerciseId} onValueChange={(value) => updateExercise(idx, "exerciseId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exercise" />
                        </SelectTrigger>
                        <SelectContent>
                          {exercises.map((exercise) => (
                            <SelectItem key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs">Sets</Label>
                          <Input
                            type="number"
                            min="1"
                            value={ex.sets}
                            onChange={(e) => updateExercise(idx, "sets", Number.parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Reps</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ex.reps ?? ""}
                            onChange={(e) =>
                              updateExercise(idx, "reps", e.target.value ? Number.parseInt(e.target.value) : null)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Time (s)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ex.duration ?? ""}
                            onChange={(e) =>
                              updateExercise(idx, "duration", e.target.value ? Number.parseInt(e.target.value) : null)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Rest (s)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={ex.rest}
                            onChange={(e) => updateExercise(idx, "rest", Number.parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeExercise(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create template
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
