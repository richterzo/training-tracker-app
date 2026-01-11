"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, Play, Check, Timer, AlertCircle, Flag, ChevronRight, ChevronDown, ChevronUp, Users, Plus, Minus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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

type CompletedWorkout = Database["public"]["Tables"]["completed_workouts"]["Row"] & {
  completed_sets: Array<Database["public"]["Tables"]["completed_sets"]["Row"]>
}

interface WorkoutPlayerProps {
  plannedWorkout: PlannedWorkout
  existingWorkout: CompletedWorkout | null
  groupId: string
  userId: string
  isGroupWorkout?: boolean
  participants?: Array<{
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
  canJoin?: boolean
}

interface SetData {
  reps: number | null
  weight: number | null
  duration: number | null
  completed: boolean
}

export function WorkoutPlayer({
  plannedWorkout,
  existingWorkout,
  groupId,
  userId,
  isGroupWorkout = false,
  participants = [],
  canJoin = false,
}: WorkoutPlayerProps) {
  const router = useRouter()
  const [workoutId, setWorkoutId] = useState<string | null>(existingWorkout?.id || null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [setsData, setSetsData] = useState<Record<string, SetData[]>>({})
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [workoutStarted, setWorkoutStarted] = useState(!!existingWorkout)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime] = useState(existingWorkout?.started_at ? new Date(existingWorkout.started_at) : new Date())
  const [showParticipantDialog, setShowParticipantDialog] = useState(false)
  const [participantPerformance, setParticipantPerformance] = useState<Record<string, Record<string, SetData[]>>>({})

  const sortedExercises = useMemo(
    () => [...plannedWorkout.planned_workout_exercises].sort((a, b) => a.order_index - b.order_index),
    [plannedWorkout.planned_workout_exercises]
  )
  const currentExercise = sortedExercises[currentExerciseIndex]

  useEffect(() => {
    const initialData: Record<string, SetData[]> = {}
    sortedExercises.forEach((ex) => {
      const sets = ex.sets || 3
      initialData[ex.id] = Array.from({ length: sets }, () => ({
        reps: ex.reps,
        weight: null,
        duration: ex.duration_seconds,
        completed: false,
      }))
    })

    if (existingWorkout) {
      existingWorkout.completed_sets.forEach((completedSet) => {
        const exerciseId = sortedExercises.find((ex) => ex.exercises.id === completedSet.exercise_id)?.id
        if (exerciseId && initialData[exerciseId]) {
          const setIndex = completedSet.set_number - 1
          if (setIndex >= 0 && setIndex < initialData[exerciseId].length) {
            initialData[exerciseId][setIndex] = {
              reps: completedSet.reps,
              weight: completedSet.weight,
              duration: completedSet.duration_seconds,
              completed: true,
            }
          }
        }
      })
    }

    setSetsData(initialData)
  }, [existingWorkout, sortedExercises])

  useEffect(() => {
    if (!isResting || restTimer <= 0) return

    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          setIsResting(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isResting])

  // Elapsed time tracker
  useEffect(() => {
    if (workoutStarted) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [workoutStarted, startTime])

  const startWorkout = async () => {
    setError(null)
    const supabase = createClient()

    const { data, error: workoutError } = await supabase
      .from("completed_workouts")
      .insert({
        group_id: groupId,
        user_id: userId,
        planned_workout_id: plannedWorkout.id,
        name: plannedWorkout.name,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (workoutError) {
      setError(workoutError.message)
      return
    }

    setWorkoutId(data.id)
    setWorkoutStarted(true)
  }

  const completeSet = async () => {
    if (!workoutId) return

    const exerciseData = setsData[currentExercise.id]
    const setData = exerciseData[currentSet - 1]

    setError(null)
    const supabase = createClient()

    const { error: setInsertError } = await supabase.from("completed_sets").insert({
      completed_workout_id: workoutId,
      exercise_id: currentExercise.exercises.id,
      set_number: currentSet,
      reps: setData.reps,
      weight: setData.weight,
      duration_seconds: setData.duration,
    })

    if (setInsertError) {
      setError(setInsertError.message)
      return
    }

    // Mark set as completed
    const updatedData = { ...setsData }
    updatedData[currentExercise.id][currentSet - 1].completed = true
    setSetsData(updatedData)

    // Move to next set or exercise
    if (currentSet < exerciseData.length) {
      setCurrentSet(currentSet + 1)
      // Start rest timer
      if (currentExercise.rest_seconds) {
        setRestTimer(currentExercise.rest_seconds)
        setIsResting(true)
      }
    } else if (currentExerciseIndex < sortedExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      setCurrentSet(1)
      if (currentExercise.rest_seconds) {
        setRestTimer(currentExercise.rest_seconds)
        setIsResting(true)
      }
    }
  }

  const finishWorkout = async () => {
    if (!workoutId) return

    setError(null)
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from("completed_workouts")
      .update({
        completed_at: new Date().toISOString(),
        duration_seconds: elapsedTime,
      })
      .eq("id", workoutId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    if (isGroupWorkout && participants.length > 0) {
      setShowParticipantDialog(true)
    } else {
      router.push("/app/history")
      router.refresh()
    }
  }

  const saveParticipantPerformance = async (participantId: string) => {
    if (!workoutId) return

    const supabase = createClient()
    const performance = participantPerformance[participantId]
    if (!performance) return

    // Create a map from planned exercise ID to actual exercise ID
    const exerciseIdMap = new Map<string, string>()
    sortedExercises.forEach((ex) => {
      exerciseIdMap.set(ex.id, ex.exercises.id)
    })

    let athleteWorkoutId: string

    const { data: existingWorkout } = await supabase
      .from("completed_workouts")
      .select("id")
      .eq("planned_workout_id", plannedWorkout.id)
      .eq("user_id", participantId)
      .maybeSingle()

    if (existingWorkout) {
      athleteWorkoutId = existingWorkout.id
    } else {
      const { data: newWorkout, error: createError } = await supabase
        .from("completed_workouts")
        .insert({
          group_id: groupId,
          user_id: participantId,
          planned_workout_id: plannedWorkout.id,
          name: plannedWorkout.name,
          started_at: startTime.toISOString(),
          completed_at: new Date().toISOString(),
          duration_seconds: elapsedTime,
        })
        .select()
        .single()

      if (createError) {
        setError(createError.message)
        return
      }

      athleteWorkoutId = newWorkout.id
    }

    await supabase.from("completed_sets").delete().eq("completed_workout_id", athleteWorkoutId)

    const setsToInsert: any[] = []
    Object.entries(performance).forEach(([plannedExerciseId, sets]) => {
      const actualExerciseId = exerciseIdMap.get(plannedExerciseId)
      if (!actualExerciseId) return

      sets.forEach((set, index) => {
        if (set.reps !== null || set.duration !== null) {
          setsToInsert.push({
            completed_workout_id: athleteWorkoutId,
            exercise_id: actualExerciseId,
            set_number: index + 1,
            reps: set.reps,
            weight: set.weight,
            duration_seconds: set.duration,
          })
        }
      })
    })

    if (setsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("completed_sets").insert(setsToInsert)
      if (insertError) {
        setError(insertError.message)
        return
      }
    }
  }

  const handleFinishWithParticipants = async () => {
    setError(null)
    const supabase = createClient()

    for (const participant of participants.filter((p) => p.status === "confirmed" || p.user_id === userId)) {
      if (participant.user_id !== userId) {
        await saveParticipantPerformance(participant.user_id)
      }
    }

    setShowParticipantDialog(false)
    router.push("/app/history")
    router.refresh()
  }

  const updateParticipantSet = (participantId: string, exerciseId: string, setIndex: number, field: keyof SetData, value: number | null) => {
    const updated = { ...participantPerformance }
    if (!updated[participantId]) {
      updated[participantId] = {}
    }
    if (!updated[participantId][exerciseId]) {
      updated[participantId][exerciseId] = setsData[exerciseId]?.map((s) => ({ ...s })) || []
    }
    updated[participantId][exerciseId][setIndex] = {
      ...updated[participantId][exerciseId][setIndex],
      [field]: value,
    }
    setParticipantPerformance(updated)
  }

  const updateSetData = (field: keyof SetData, value: number | null) => {
    const updatedData = { ...setsData }
    updatedData[currentExercise.id][currentSet - 1] = {
      ...updatedData[currentExercise.id][currentSet - 1],
      [field]: value,
    }
    setSetsData(updatedData)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const totalSets = sortedExercises.reduce((acc, ex) => acc + (ex.sets || 3), 0)
  const completedSets = Object.values(setsData).reduce((acc, sets) => acc + sets.filter((s) => s.completed).length, 0)
  const progress = (completedSets / totalSets) * 100

  const joinWorkout = async () => {
    setError(null)
    const supabase = createClient()

    const { error: joinError } = await supabase
      .from("workout_participants")
      .upsert({
        planned_workout_id: plannedWorkout.id,
        user_id: userId,
        status: "confirmed",
      })

    if (joinError) {
      setError(joinError.message)
      return
    }

    // After joining, start the workout for this user
    await startWorkout()
  }

  if (!workoutStarted) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="container mx-auto max-w-2xl flex-1 space-y-6 p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{plannedWorkout.name}</h1>
              <p className="text-sm text-muted-foreground">
                {new Date(plannedWorkout.scheduled_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {canJoin && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                This is a group workout. Join to track your own performance alongside others.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="text-center">
                <h2 className="mb-2 text-lg font-semibold">Ready to start?</h2>
                <p className="text-muted-foreground">{sortedExercises.length} exercises planned</p>
              </div>

              <div className="space-y-2">
                {sortedExercises.map((ex, idx) => (
                  <div key={ex.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{ex.exercises.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {ex.sets} sets
                        {ex.reps && ` × ${ex.reps} reps`}
                        {ex.duration_seconds && ` × ${ex.duration_seconds}s`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {canJoin ? (
                <Button onClick={joinWorkout} className="w-full" size="lg">
                  <Users className="mr-2 h-5 w-5" />
                  Join & Start Workout
                </Button>
              ) : (
                <Button onClick={startWorkout} className="w-full" size="lg">
                  <Play className="mr-2 h-5 w-5" />
                  Start Workout
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold">{plannedWorkout.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {formatTime(elapsedTime)} • {completedSets}/{totalSets} sets
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={finishWorkout}>
              <Flag className="mr-2 h-4 w-4" />
              Finish
            </Button>
          </div>
          <Progress value={progress} className="mt-3" />
        </div>
      </div>

      <Dialog open={showParticipantDialog} onOpenChange={setShowParticipantDialog}>
        <DialogContent className="w-full max-w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto p-0 sm:p-6">
          <DialogHeader className="px-4 sm:px-0 pt-4 sm:pt-0">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="h-5 w-5" />
              Record Performance
            </DialogTitle>
            <DialogDescription className="text-sm">
              Track actual reps vs target for each participant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4 px-4 sm:px-0 pb-4">
            {participants
              .filter((p) => p.status === "confirmed" || p.user_id === userId)
              .map((participant) => {
                const participantName =
                  participant.user_profiles?.display_name ||
                  participant.user_profiles?.full_name ||
                  participant.user_profiles?.email ||
                  "Participant"

                if (participant.user_id === userId) {
                  return null
                }

                return (
                  <Card key={participant.id} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg">{participantName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sortedExercises.map((ex) => {
                        const plannedExerciseId = ex.id
                        const exerciseId = ex.exercises.id
                        const targetReps = ex.reps || 0
                        const participantSets = participantPerformance[participant.user_id]?.[plannedExerciseId] || []

                        return (
                          <div key={plannedExerciseId} className="rounded-lg border bg-muted/30 p-3 sm:p-4">
                            <div className="font-semibold mb-3 text-sm sm:text-base">{ex.exercises.name}</div>
                            <div className="space-y-3">
                              {Array.from({ length: ex.sets || 3 }).map((_, setIdx) => {
                                const currentSet = participantSets[setIdx] || { reps: null, duration: null }
                                const actualReps = currentSet.reps ?? targetReps
                                const diff = actualReps - targetReps
                                const diffDisplay = diff !== 0 ? (diff > 0 ? `+${diff}` : `${diff}`) : "0"

                                return (
                                  <div key={setIdx} className="flex items-center gap-2 sm:gap-3 rounded-lg border bg-background p-2 sm:p-3">
                                    <div className="flex-shrink-0 w-12 sm:w-16 text-center">
                                      <div className="text-xs text-muted-foreground">Set {setIdx + 1}</div>
                                      <div className="text-xs font-medium text-muted-foreground mt-1">
                                        Target: {targetReps}
                                      </div>
                                    </div>

                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                                          onClick={() => {
                                            const newReps = Math.max(0, (currentSet.reps ?? targetReps) - 1)
                                            updateParticipantSet(participant.user_id, plannedExerciseId, setIdx, "reps", newReps)
                                          }}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>

                                        <div className="flex-1 text-center">
                                          <div className="text-lg sm:text-2xl font-bold">{actualReps}</div>
                                          <div
                                            className={`text-xs font-medium ${
                                              diff > 0
                                                ? "text-green-600 dark:text-green-400"
                                                : diff < 0
                                                  ? "text-red-600 dark:text-red-400"
                                                  : "text-muted-foreground"
                                            }`}
                                          >
                                            {diffDisplay !== "0" && diffDisplay}
                                          </div>
                                        </div>

                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                                          onClick={() => {
                                            const newReps = (currentSet.reps ?? targetReps) + 1
                                            updateParticipantSet(participant.user_id, plannedExerciseId, setIdx, "reps", newReps)
                                          }}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>

                                      {ex.duration_seconds && (
                                        <div className="flex items-center gap-2">
                                          <Label className="text-xs w-16 flex-shrink-0">Hold (s):</Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            placeholder={`${ex.duration_seconds}s`}
                                            value={currentSet.duration ?? ""}
                                            onChange={(e) =>
                                              updateParticipantSet(
                                                participant.user_id,
                                                plannedExerciseId,
                                                setIdx,
                                                "duration",
                                                e.target.value ? Number.parseInt(e.target.value) : null
                                              )
                                            }
                                            className="h-8 text-sm flex-1"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )
              })}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4 px-4 sm:px-0 pb-4 sm:pb-0 border-t pt-4">
            <Button variant="outline" onClick={() => setShowParticipantDialog(false)} className="w-full sm:w-auto">
              Skip
            </Button>
            <Button onClick={handleFinishWithParticipants} className="w-full sm:w-auto">
              <Check className="mr-2 h-4 w-4" />
              Save & Finish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto max-w-2xl flex-1 space-y-4 p-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isResting && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold text-primary">Rest Period</div>
                  <div className="text-sm text-muted-foreground">Take a break</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{restTimer}s</div>
                <Button variant="ghost" size="sm" onClick={() => setIsResting(false)}>
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{currentExercise.exercises.name}</h2>
                <Badge variant="secondary" className="mt-2">
                  {currentExercise.exercises.category}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Exercise</div>
                <div className="text-2xl font-bold">
                  {currentExerciseIndex + 1}/{sortedExercises.length}
                </div>
              </div>
            </div>

            {currentExercise.exercises.description && (
              <p className="mb-4 text-sm text-muted-foreground">{currentExercise.exercises.description}</p>
            )}

            <div className="mb-6 rounded-lg bg-muted p-4 text-center">
              <div className="mb-1 text-sm font-medium text-muted-foreground">Current Set</div>
              <div className="text-4xl font-bold">
                {currentSet}/{setsData[currentExercise.id]?.length || 0}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reps</label>
                <Input
                  type="number"
                  value={setsData[currentExercise.id]?.[currentSet - 1]?.reps ?? ""}
                  onChange={(e) => updateSetData("reps", e.target.value ? Number.parseInt(e.target.value) : null)}
                  className="text-center text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Weight (kg)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={setsData[currentExercise.id]?.[currentSet - 1]?.weight ?? ""}
                  onChange={(e) => updateSetData("weight", e.target.value ? Number.parseFloat(e.target.value) : null)}
                  className="text-center text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time (s)</label>
                <Input
                  type="number"
                  value={setsData[currentExercise.id]?.[currentSet - 1]?.duration ?? ""}
                  onChange={(e) => updateSetData("duration", e.target.value ? Number.parseInt(e.target.value) : null)}
                  className="text-center text-lg"
                />
              </div>
            </div>

            <Button onClick={completeSet} className="mt-6 w-full" size="lg" disabled={isResting}>
              <Check className="mr-2 h-5 w-5" />
              Complete Set
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setExpanded({ ...expanded, [currentExerciseIndex]: !expanded[currentExerciseIndex] })}
            >
              <span className="font-medium">All Sets</span>
              {expanded[currentExerciseIndex] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {expanded[currentExerciseIndex] && (
              <div className="mt-3 space-y-2">
                {setsData[currentExercise.id]?.map((set, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-lg border p-3 ${set.completed ? "bg-muted" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${set.completed ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        {set.completed ? <Check className="h-4 w-4" /> : idx + 1}
                      </div>
                      <span className="font-medium">Set {idx + 1}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {set.reps && `${set.reps} reps`}
                      {set.weight && ` @ ${set.weight}kg`}
                      {set.duration && ` ${set.duration}s`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {currentExerciseIndex < sortedExercises.length - 1 && (
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => {
              setCurrentExerciseIndex(currentExerciseIndex + 1)
              setCurrentSet(1)
            }}
          >
            Skip to Next Exercise
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
