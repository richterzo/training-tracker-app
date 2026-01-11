"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, Play, Edit2, Save, X, Trash2, Plus, GripVertical, MapPin, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { LocationPicker } from "@/components/planning/location-picker"
import type { Database } from "@/lib/types/database"

type PlannedWorkout = Database["public"]["Tables"]["planned_workouts"]["Row"] & {
  planned_workout_exercises: Array<{
    id: string
    order_index: number
    sets: number | null
    reps: number | null
    duration_seconds: number | null
    rest_seconds: number | null
    exercises: Database["public"]["Tables"]["exercises"]["Row"]
  }>
}

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]
type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]

interface WorkoutViewEditProps {
  plannedWorkout: PlannedWorkout
  exercises: Exercise[]
  groupMembers: UserProfile[]
  participants: Array<{
    id: string
    user_id: string
    status: string
    user_profiles: {
      id: string
      display_name: string | null
      full_name: string | null
      email: string
    } | null
  }>
  currentUserId: string
  isOwner: boolean
  isAdmin: boolean
  groupId: string
}

interface WorkoutExercise {
  id?: string
  exerciseId: string
  sets: number
  reps: number | null
  duration: number | null
  rest: number
}

export function WorkoutViewEdit({
  plannedWorkout,
  exercises,
  groupMembers,
  participants,
  currentUserId,
  isOwner,
  isAdmin,
  groupId,
}: WorkoutViewEditProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [name, setName] = useState(plannedWorkout.name)
  const [date, setDate] = useState(plannedWorkout.scheduled_date)
  const [notes, setNotes] = useState(plannedWorkout.notes || "")
  const [location, setLocation] = useState(plannedWorkout.location || "")
  const [locationLat, setLocationLat] = useState<number | null>(plannedWorkout.location_lat)
  const [locationLng, setLocationLng] = useState<number | null>(plannedWorkout.location_lng)
  const [isGroupWorkout, setIsGroupWorkout] = useState(plannedWorkout.is_group_workout || false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    participants.filter((p) => p.status === "confirmed" || p.status === "invited").map((p) => p.user_id)
  )

  const sortedExercises = [...plannedWorkout.planned_workout_exercises].sort((a, b) => a.order_index - b.order_index)
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    sortedExercises.map((ex) => ({
      id: ex.id,
      exerciseId: ex.exercises.id,
      sets: ex.sets || 3,
      reps: ex.reps,
      duration: ex.duration_seconds,
      rest: ex.rest_seconds || 60,
    }))
  )

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId]
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

  const handleSave = async () => {
    setError(null)
    setSuccess(null)

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

    const { error: updateError } = await supabase
      .from("planned_workouts")
      .update({
        name,
        scheduled_date: date,
        notes: notes || null,
        location: location || null,
        location_lat: locationLat,
        location_lng: locationLng,
        is_group_workout: isGroupWorkout,
      })
      .eq("id", plannedWorkout.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    const existingExerciseIds = workoutExercises.filter((ex) => ex.id).map((ex) => ex.id!)

    const { data: allExistingExercises } = await supabase
      .from("planned_workout_exercises")
      .select("id")
      .eq("planned_workout_id", plannedWorkout.id)

    const exercisesToDelete = allExistingExercises
      ?.filter((ex) => !existingExerciseIds.includes(ex.id))
      .map((ex) => ex.id) || []

    if (exercisesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("planned_workout_exercises")
        .delete()
        .in("id", exercisesToDelete)

      if (deleteError) {
        console.error("Error deleting exercises:", deleteError)
      }
    }

    const exercisesToUpdate = workoutExercises.filter((ex) => ex.id)
    const exercisesToInsert = workoutExercises.filter((ex) => !ex.id)

    for (let i = 0; i < exercisesToUpdate.length; i++) {
      const ex = exercisesToUpdate[i]
      const { error: updateError } = await supabase
        .from("planned_workout_exercises")
        .update({
          exercise_id: ex.exerciseId,
          order_index: i,
          sets: ex.sets,
          reps: ex.reps,
          duration_seconds: ex.duration,
          rest_seconds: ex.rest,
        })
        .eq("id", ex.id)

      if (updateError) {
        console.error("Error updating exercise:", updateError)
      }
    }

    if (exercisesToInsert.length > 0) {
      const exercisesToInsertData = exercisesToInsert.map((ex, idx) => ({
        planned_workout_id: plannedWorkout.id,
        exercise_id: ex.exerciseId,
        order_index: exercisesToUpdate.length + idx,
        sets: ex.sets,
        reps: ex.reps,
        duration_seconds: ex.duration,
        rest_seconds: ex.rest,
      }))

      const { error: insertError } = await supabase.from("planned_workout_exercises").insert(exercisesToInsertData)

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    }

    const existingParticipantIds = participants.map((p) => p.user_id)
    const participantsToAdd = selectedParticipants.filter((id) => !existingParticipantIds.includes(id))
    const participantsToRemove = existingParticipantIds.filter((id) => !selectedParticipants.includes(id))

    if (participantsToRemove.length > 0) {
      await supabase
        .from("workout_participants")
        .delete()
        .eq("planned_workout_id", plannedWorkout.id)
        .in("user_id", participantsToRemove)
    }

    if (participantsToAdd.length > 0 && isGroupWorkout) {
      await supabase.from("workout_participants").insert(
        participantsToAdd.map((userId) => ({
          planned_workout_id: plannedWorkout.id,
          user_id: userId,
          status: "invited",
        }))
      )
    }

    setSuccess("Workout updated successfully!")
    setIsEditing(false)
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this workout?")) return

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from("planned_workouts").delete().eq("id", plannedWorkout.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/app")
    router.refresh()
  }

  const handleStartWorkout = () => {
    router.push(`/app/workout/${plannedWorkout.id}`)
  }

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{plannedWorkout.name}</CardTitle>
                <CardDescription className="mt-1">
                  Scheduled for {new Date(plannedWorkout.scheduled_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {(isOwner || isAdmin) && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
                <Button onClick={handleStartWorkout} size="sm">
                  <Play className="mr-2 h-4 w-4" />
                  Start Workout
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {plannedWorkout.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {plannedWorkout.location}
              </div>
            )}

            {plannedWorkout.is_group_workout && participants.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Participants
                </div>
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <Badge key={p.id} variant="secondary">
                      {p.user_profiles?.display_name || p.user_profiles?.full_name || p.user_profiles?.email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {plannedWorkout.notes && (
              <div>
                <div className="text-sm font-medium mb-1">Notes</div>
                <p className="text-sm text-muted-foreground">{plannedWorkout.notes}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="text-sm font-medium">Exercises</div>
              <div className="space-y-2">
                {sortedExercises.map((ex, idx) => (
                  <div key={ex.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{ex.exercises.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {ex.sets} sets
                        {ex.reps && ` × ${ex.reps} reps`}
                        {ex.duration_seconds && ` × ${ex.duration_seconds}s`}
                        {ex.rest_seconds && ` (rest: ${ex.rest_seconds}s)`}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {ex.exercises.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
          className="space-y-6"
        >
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

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
                  {groupMembers
                    .filter((member) => member.id !== currentUserId)
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
                    ))}
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
                      <Select
                        value={ex.exerciseId}
                        onValueChange={(value) => updateExercise(idx, "exerciseId", value)}
                      >
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
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={loading} className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
