"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Clock, Calendar, Dumbbell, Eye } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/types/database"

type CompletedWorkout = Database["public"]["Tables"]["completed_workouts"]["Row"] & {
  completed_sets: Array<
    Database["public"]["Tables"]["completed_sets"]["Row"] & {
      exercises: Database["public"]["Tables"]["exercises"]["Row"] | null
    }
  >
}

interface WorkoutHistoryProps {
  workouts: CompletedWorkout[]
}

export function WorkoutHistory({ workouts }: WorkoutHistoryProps) {
  if (workouts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Dumbbell className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">No workouts yet</p>
          <p className="text-sm text-muted-foreground">Complete your first workout to see it here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {workouts.map((workout) => {
        const duration = workout.duration_seconds
          ? Math.round(workout.duration_seconds / 60)
          : null
        const completedAt = workout.completed_at
          ? format(new Date(workout.completed_at), "PPP 'at' p")
          : "Not completed"

        return (
          <Card key={workout.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{workout.name}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {completedAt}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {duration && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {duration} min
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/app/history/${workout.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {workout.completed_sets && workout.completed_sets.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Exercises completed:</div>
                  <div className="space-y-2">
                    {Object.entries(
                      workout.completed_sets.reduce(
                        (acc, set) => {
                          const exerciseName = set.exercises?.name || "Unknown Exercise"
                          if (!acc[exerciseName]) {
                            acc[exerciseName] = []
                          }
                          acc[exerciseName].push(set)
                          return acc
                        },
                        {} as Record<string, typeof workout.completed_sets>
                      )
                    ).map(([exerciseName, sets]) => (
                      <div key={exerciseName} className="rounded-lg border p-3">
                        <div className="font-medium">{exerciseName}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {sets.length} set{sets.length !== 1 ? "s" : ""} completed
                          {sets.some((s) => s.reps) && (
                            <span>
                              {" "}
                              - {sets.filter((s) => s.reps).length} with reps
                            </span>
                          )}
                          {sets.some((s) => s.duration_seconds) && (
                            <span>
                              {" "}
                              - {sets.filter((s) => s.duration_seconds).length} with holds
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sets logged for this workout</p>
              )}
              {workout.notes && (
                <div className="mt-4 rounded-lg border p-3">
                  <div className="text-sm font-medium">Notes:</div>
                  <div className="mt-1 text-sm text-muted-foreground">{workout.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
