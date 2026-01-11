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
import { AlertCircle, Loader2, Plus, GripVertical, Trash2, MapPin, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { LocationPicker } from "@/components/planning/location-picker"
import type { Database } from "@/lib/types/database"

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]
type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]

type Template = Database["public"]["Tables"]["workout_templates"]["Row"] & {
  template_exercises: Array<{
    id: string
    order_index: number
    sets: number | null
    reps: number | null
    duration_seconds: number | null
    rest_seconds: number | null
    exercises: Database["public"]["Tables"]["exercises"]["Row"]
  }>
}

interface PlanWorkoutFormProps {
  groupId: string
  userId: string
  templates: Template[]
  exercises: Exercise[]
  groupMembers?: UserProfile[]
}

interface WorkoutExercise {
  exerciseId: string
  sets: number
  reps: number | null
  duration: number | null
  rest: number
}

export function PlanWorkoutForm({ groupId, userId, templates, exercises, groupMembers = [] }: PlanWorkoutFormProps) {
  const [name, setName] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [location, setLocation] = useState("")
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [isGroupWorkout, setIsGroupWorkout] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const loadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    setName(template.name)
    setWorkoutExercises(
      template.template_exercises
        .sort((a, b) => a.order_index - b.order_index)
        .map((te) => ({
          exerciseId: te.exercises.id,
          sets: te.sets || 3,
          reps: te.reps,
          duration: te.duration_seconds,
          rest: te.rest_seconds || 60,
        })),
    )
  }

  const addExercise = () => {
    setWorkoutExercises([...workoutExercises, { exerciseId: "", sets: 3, reps: 10, duration: null, rest: 60 }])
  }

  const removeExercise = (index: number) => {
    setWorkoutExercises(workoutExercises.filter((_, i) => i !== index))
  }

  const updateExercise = (index: number, field: keyof WorkoutExercise, value: string | number | null) => {
    const updated = [...workoutExercises]
    updated[index] = { ...updated[index], [field]: value }
    setWorkoutExercises(updated)
  }

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (workoutExercises.length === 0) {
      setError("Add at least one exercise")
      return
    }

    if (workoutExercises.some((ex) => !ex.exerciseId)) {
      setError("Select an exercise for all entries")
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { data: workout, error: workoutError } = await supabase
      .from("planned_workouts")
      .insert({
        group_id: groupId,
        user_id: userId,
        template_id: selectedTemplate || null,
        scheduled_date: date,
        name,
        notes: notes || null,
        location: location || null,
        location_lat: locationLat,
        location_lng: locationLng,
        is_group_workout: isGroupWorkout,
      })
      .select()
      .single()

    if (workoutError) {
      setError(workoutError.message)
      setLoading(false)
      return
    }

    // Insert workout exercises
    const { error: exercisesError } = await supabase.from("planned_workout_exercises").insert(
      workoutExercises.map((ex, idx) => ({
        planned_workout_id: workout.id,
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

    if (isGroupWorkout && selectedParticipants.length > 0) {
      const { error: participantsError } = await supabase.from("workout_participants").insert(
        selectedParticipants.map((participantId) => ({
          planned_workout_id: workout.id,
          user_id: participantId,
          status: "invited" as const,
        })),
      )

      if (participantsError) {
        console.error("[v0] Error adding participants:", participantsError)
        // Don't fail the request if adding participants fails
      }
    }

    router.push("/app")
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
            <Label htmlFor="template">Use Template (Optional)</Label>
            <Select
              value={selectedTemplate}
              onValueChange={(value) => {
                setSelectedTemplate(value)
                if (value) loadTemplate(value)
              }}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Workout Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Upper Body Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <LocationPicker
            location={location}
            locationLat={locationLat}
            locationLng={locationLng}
            onLocationChange={setLocation}
            onCoordinatesChange={(lat, lng) => {
              setLocationLat(lat)
              setLocationLng(lng)
            }}
            disabled={loading}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any notes for this workout"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="groupWorkout"
                checked={isGroupWorkout}
                onCheckedChange={(checked) => setIsGroupWorkout(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="groupWorkout" className="flex items-center gap-2 font-medium">
                <Users className="h-4 w-4" />
                Group Workout
              </Label>
            </div>

            {isGroupWorkout && (
              <div className="space-y-2 pl-6">
                <Label className="text-sm text-muted-foreground">Select Participants</Label>
                <div className="space-y-2">
                  {groupMembers.filter((member) => member.id !== userId).length > 0 ? (
                    groupMembers
                      .filter((member) => member.id !== userId)
                      .map((member) => (
                        <div key={member.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`participant-${member.id}`}
                            checked={selectedParticipants.includes(member.id)}
                            onCheckedChange={() => toggleParticipant(member.id)}
                            disabled={loading}
                          />
                          <Label htmlFor={`participant-${member.id}`} className="font-normal">
                            {member.display_name || member.full_name || member.email || "Anonymous"}
                          </Label>
                        </div>
                      ))
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No other members in your group yet. Invite members from Settings to create group workouts.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Exercises</Label>
              <Button type="button" variant="outline" size="sm" onClick={addExercise} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add exercise
              </Button>
            </div>

            {workoutExercises.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">No exercises added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutExercises.map((ex, idx) => (
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
              Plan workout
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
