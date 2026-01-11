"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { Clock, Calendar, Users, Check, Plus, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/types/database"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { WorkoutLocationMap } from "@/components/history/workout-location-map"

type CompletedWorkout = Database["public"]["Tables"]["completed_workouts"]["Row"] & {
  completed_sets: Array<
    Database["public"]["Tables"]["completed_sets"]["Row"] & {
      exercises: Database["public"]["Tables"]["exercises"]["Row"] | null
    }
  >
  planned_workouts?: {
    id: string
    is_group_workout: boolean | null
    location: string | null
    location_lat: number | null
    location_lng: number | null
  } | null
}

type Participant = {
  id: string
  planned_workout_id: string
  user_id: string
  status: string
  user_profiles: {
    id: string
    display_name: string | null
    full_name: string | null
    email: string
  } | null
}

interface WorkoutDetailsProps {
  workout: CompletedWorkout
  groupWorkouts: Array<
    CompletedWorkout & {
      user_profiles: {
        id: string
        display_name: string | null
        full_name: string | null
        email: string
      } | null
    }
  >
  participants: Participant[]
  currentUserId: string
  isAdmin: boolean
  groupId: string
}

interface SetInput {
  reps: number | null
  weight: number | null
  duration_seconds: number | null
}

export function WorkoutDetails({
  workout,
  groupWorkouts,
  participants,
  currentUserId,
  isAdmin,
  groupId,
}: WorkoutDetailsProps) {
  const [editingAthlete, setEditingAthlete] = useState<string | null>(null)
  const [setsData, setSetsData] = useState<Record<string, SetInput[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isGroupWorkout = workout.planned_workouts?.is_group_workout || false
  const isOwner = workout.user_id === currentUserId

  // Group workouts by exercise
  const exercisesMap = new Map<string, any>()
  workout.completed_sets.forEach((set) => {
    const exerciseId = set.exercise_id
    if (!exercisesMap.has(exerciseId)) {
      exercisesMap.set(exerciseId, {
        exercise: set.exercises,
        sets: [],
      })
    }
    exercisesMap.get(exerciseId)!.sets.push(set)
  })

  const exercises = Array.from(exercisesMap.values()).sort((a, b) => {
    const aMinSet = Math.min(...a.sets.map((s: any) => s.set_number))
    const bMinSet = Math.min(...b.sets.map((s: any) => s.set_number))
    return aMinSet - bMinSet
  })

  const startEditingAthlete = (athleteId: string) => {
    setEditingAthlete(athleteId)
    // Initialize sets data for this athlete
    const athleteWorkout = groupWorkouts.find((w) => w.user_id === athleteId)
    if (athleteWorkout) {
      const data: Record<string, SetInput[]> = {}
      exercises.forEach((ex) => {
        const athleteSets = athleteWorkout.completed_sets.filter((s) => s.exercise_id === ex.exercise?.id)
        if (athleteSets.length > 0) {
          data[ex.exercise!.id] = athleteSets
            .sort((a, b) => a.set_number - b.set_number)
            .map((s) => ({
              reps: s.reps,
              weight: s.weight,
              duration_seconds: s.duration_seconds,
            }))
        } else {
          // Initialize empty sets based on current workout
          const currentSets = ex.sets.length
          data[ex.exercise!.id] = Array.from({ length: currentSets }, () => ({
            reps: null,
            weight: null,
            duration_seconds: null,
          }))
        }
      })
      setSetsData(data)
    }
  }

  const saveAthletePerformance = async (athleteId: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    // Find or create completed_workout for this athlete
    let athleteWorkoutId: string

    const existingWorkout = groupWorkouts.find((w) => w.user_id === athleteId)
    if (existingWorkout) {
      athleteWorkoutId = existingWorkout.id
    } else {
      // Create new completed workout for this athlete
      const { data: newWorkout, error: createError } = await supabase
        .from("completed_workouts")
        .insert({
          group_id: groupId,
          user_id: athleteId,
          planned_workout_id: workout.planned_workout_id,
          name: workout.name,
          started_at: workout.started_at,
          completed_at: workout.completed_at,
          duration_seconds: workout.duration_seconds,
        })
        .select()
        .single()

      if (createError) {
        setError(createError.message)
        setLoading(false)
        return
      }

      athleteWorkoutId = newWorkout.id
    }

    // Delete existing sets for this athlete
    await supabase.from("completed_sets").delete().eq("completed_workout_id", athleteWorkoutId)

    // Insert new sets
    const setsToInsert: any[] = []
    Object.entries(setsData).forEach(([exerciseId, sets]) => {
      sets.forEach((set, index) => {
        if (set.reps !== null || set.duration_seconds !== null) {
          setsToInsert.push({
            completed_workout_id: athleteWorkoutId,
            exercise_id: exerciseId,
            set_number: index + 1,
            reps: set.reps,
            weight: set.weight,
            duration_seconds: set.duration_seconds,
          })
        }
      })
    })

    if (setsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("completed_sets").insert(setsToInsert)

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    }

    setSuccess("Performance saved successfully!")
    setEditingAthlete(null)
    setLoading(false)
    // Refresh page to show updated data
    window.location.reload()
  }

  const updateSetData = (exerciseId: string, setIndex: number, field: keyof SetInput, value: number | null) => {
    const updated = { ...setsData }
    if (!updated[exerciseId]) {
      updated[exerciseId] = []
    }
    if (!updated[exerciseId][setIndex]) {
      updated[exerciseId][setIndex] = { reps: null, weight: null, duration_seconds: null }
    }
    updated[exerciseId][setIndex] = {
      ...updated[exerciseId][setIndex],
      [field]: value,
    }
    setSetsData(updated)
  }

  return (
    <div className="space-y-6">
      {/* Workout Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{workout.name}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {workout.completed_at
                    ? format(new Date(workout.completed_at), "PPP 'at' p")
                    : "Not completed"}
                </span>
                {workout.duration_seconds && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.round(workout.duration_seconds / 60)} min
                  </span>
                )}
                {isGroupWorkout && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Group Workout
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Exercises and Sets */}
      <Card>
        <CardHeader>
          <CardTitle>Exercises & Sets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {exercises.map((ex, idx) => (
              <div key={ex.exercise?.id || idx} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{ex.exercise?.name || "Unknown Exercise"}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {ex.exercise?.category}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{ex.sets.length} sets</div>
                </div>
                <div className="space-y-2">
                  {ex.sets
                    .sort((a: any, b: any) => a.set_number - b.set_number)
                    .map((set: any) => (
                      <div key={set.id} className="flex items-center gap-4 rounded border p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-medium">
                          {set.set_number}
                        </div>
                        <div className="flex-1">
                          {set.reps !== null && <span className="mr-3">{set.reps} reps</span>}
                          {set.weight !== null && <span className="mr-3">{set.weight} kg</span>}
                          {set.duration_seconds !== null && <span>{set.duration_seconds}s</span>}
                        </div>
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Group Workout Participants */}
      {isGroupWorkout && participants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Participants Performance</CardTitle>
            <CardDescription>View and record performance for each athlete</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Athletes</TabsTrigger>
                <TabsTrigger value="record">Record Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="space-y-4">
                  {participants
                    .filter((p) => p.status === "confirmed" || p.user_id === workout.user_id)
                    .map((participant) => {
                      const athleteWorkout = groupWorkouts.find((w) => w.user_id === participant.user_id)
                      const athleteName =
                        participant.user_profiles?.display_name ||
                        participant.user_profiles?.full_name ||
                        participant.user_profiles?.email ||
                        "Unknown"

                      return (
                        <div key={participant.user_id} className="rounded-lg border p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{athleteName}</h3>
                              {participant.user_id === workout.user_id && (
                                <Badge variant="outline" className="mt-1">
                                  You
                                </Badge>
                              )}
                            </div>
                            {(isAdmin || isOwner) && participant.user_id !== currentUserId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditingAthlete(participant.user_id)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Record Performance
                              </Button>
                            )}
                          </div>

                          {athleteWorkout && athleteWorkout.completed_sets.length > 0 ? (
                            <div className="space-y-2">
                              {exercises.map((ex) => {
                                const athleteSets = athleteWorkout.completed_sets.filter(
                                  (s) => s.exercise_id === ex.exercise?.id
                                )
                                if (athleteSets.length === 0) return null

                                return (
                                  <div key={ex.exercise?.id} className="rounded border p-2">
                                    <div className="mb-1 text-sm font-medium">{ex.exercise?.name}</div>
                                    <div className="flex flex-wrap gap-2">
                                      {athleteSets
                                        .sort((a, b) => a.set_number - b.set_number)
                                        .map((set) => (
                                          <div key={set.id} className="text-xs text-muted-foreground">
                                            Set {set.set_number}:{" "}
                                            {set.reps !== null && `${set.reps} reps`}
                                            {set.weight !== null && ` @ ${set.weight}kg`}
                                            {set.duration_seconds !== null && ` ${set.duration_seconds}s`}
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No performance recorded yet</p>
                          )}
                        </div>
                      )
                    })}
                </div>
              </TabsContent>

              <TabsContent value="record" className="mt-4">
                {editingAthlete ? (
                  <div className="space-y-4">
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

                    <div className="rounded-lg border p-4">
                      <h3 className="mb-4 font-semibold">
                        Recording performance for:{" "}
                        {participants.find((p) => p.user_id === editingAthlete)?.user_profiles?.display_name ||
                          participants.find((p) => p.user_id === editingAthlete)?.user_profiles?.full_name ||
                          "Athlete"}
                      </h3>

                      <div className="space-y-6">
                        {exercises.map((ex) => {
                          const exerciseId = ex.exercise?.id
                          if (!exerciseId) return null

                          const sets = setsData[exerciseId] || []

                          return (
                            <div key={exerciseId} className="rounded-lg border p-4">
                              <h4 className="mb-3 font-medium">{ex.exercise?.name}</h4>
                              <div className="space-y-3">
                                {Array.from({ length: ex.sets.length }).map((_, setIdx) => (
                                  <div key={setIdx} className="grid grid-cols-4 gap-2">
                                    <div>
                                      <Label className="text-xs">Set {setIdx + 1}</Label>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Reps</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={sets[setIdx]?.reps ?? ""}
                                        onChange={(e) =>
                                          updateSetData(
                                            exerciseId,
                                            setIdx,
                                            "reps",
                                            e.target.value ? Number.parseInt(e.target.value) : null
                                          )
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Weight (kg)</Label>
                                      <Input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={sets[setIdx]?.weight ?? ""}
                                        onChange={(e) =>
                                          updateSetData(
                                            exerciseId,
                                            setIdx,
                                            "weight",
                                            e.target.value ? Number.parseFloat(e.target.value) : null
                                          )
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Time (s)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={sets[setIdx]?.duration_seconds ?? ""}
                                        onChange={(e) =>
                                          updateSetData(
                                            exerciseId,
                                            setIdx,
                                            "duration_seconds",
                                            e.target.value ? Number.parseInt(e.target.value) : null
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingAthlete(null)
                            setSetsData({})
                            setError(null)
                            setSuccess(null)
                          }}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => saveAthletePerformance(editingAthlete)} disabled={loading}>
                          <Save className="mr-2 h-4 w-4" />
                          {loading ? "Saving..." : "Save Performance"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">Select an athlete to record their performance</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {workout.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{workout.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Location Map */}
      {workout.planned_workouts?.location_lat && workout.planned_workouts?.location_lng && (
        <WorkoutLocationMap
          location={workout.planned_workouts.location}
          locationLat={workout.planned_workouts.location_lat}
          locationLng={workout.planned_workouts.location_lng}
        />
      )}
    </div>
  )
}
