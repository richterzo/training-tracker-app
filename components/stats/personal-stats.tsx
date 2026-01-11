"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { Calendar, TrendingUp, Activity, Target } from "lucide-react"
import type { Database } from "@/lib/types/database"

type CompletedWorkout = Database["public"]["Tables"]["completed_workouts"]["Row"] & {
  completed_sets: Array<
    Database["public"]["Tables"]["completed_sets"]["Row"] & {
      exercises: Database["public"]["Tables"]["exercises"]["Row"] | null
    }
  >
}

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]

interface PersonalStatsProps {
  weeklyWorkouts: CompletedWorkout[]
  monthlyWorkouts: CompletedWorkout[]
  yearlyWorkouts: CompletedWorkout[]
  exercises: Exercise[]
  userId: string
}

export function PersonalStats({
  weeklyWorkouts,
  monthlyWorkouts,
  yearlyWorkouts,
  exercises,
  userId,
}: PersonalStatsProps) {
  const weeklyStats = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const stats = days.map((day) => ({ day, workouts: 0, sets: 0, reps: 0 }))

    weeklyWorkouts.forEach((workout) => {
      if (workout.completed_at) {
        const date = new Date(workout.completed_at)
        const dayIndex = date.getDay()
        stats[dayIndex].workouts += 1

        workout.completed_sets.forEach((set) => {
          stats[dayIndex].sets += 1
          if (set.reps) {
            stats[dayIndex].reps += set.reps
          }
        })
      }
    })

    return stats
  }, [weeklyWorkouts])

  const monthlyStats = useMemo(() => {
    const weeks: Record<number, { week: number; workouts: number; sets: number; reps: number }> = {}

    monthlyWorkouts.forEach((workout) => {
      if (workout.completed_at) {
        const date = new Date(workout.completed_at)
        const weekNumber = Math.floor((date.getDate() - 1) / 7)

        if (!weeks[weekNumber]) {
          weeks[weekNumber] = { week: weekNumber + 1, workouts: 0, sets: 0, reps: 0 }
        }

        weeks[weekNumber].workouts += 1
        workout.completed_sets.forEach((set) => {
          weeks[weekNumber].sets += 1
          if (set.reps) {
            weeks[weekNumber].reps += set.reps
          }
        })
      }
    })

    return Object.values(weeks).sort((a, b) => a.week - b.week)
  }, [monthlyWorkouts])

  const exerciseStats = useMemo(() => {
    const stats: Record<
      string,
      {
        exerciseId: string
        exerciseName: string
        category: string
        totalSets: number
        totalReps: number
        bestReps: number
        totalDuration: number
        bestDuration: number
        workouts: number
      }
    > = {}

    yearlyWorkouts.forEach((workout) => {
      workout.completed_sets.forEach((set) => {
        const exerciseId = set.exercise_id
        const exercise = exercises.find((e) => e.id === exerciseId)

        if (!stats[exerciseId]) {
          stats[exerciseId] = {
            exerciseId,
            exerciseName: exercise?.name || "Unknown",
            category: exercise?.category || "unknown",
            totalSets: 0,
            totalReps: 0,
            bestReps: 0,
            totalDuration: 0,
            bestDuration: 0,
            workouts: 0,
          }
        }

        stats[exerciseId].totalSets += 1
        if (set.reps) {
          stats[exerciseId].totalReps += set.reps
          stats[exerciseId].bestReps = Math.max(stats[exerciseId].bestReps, set.reps)
        }
        if (set.duration_seconds) {
          stats[exerciseId].totalDuration += set.duration_seconds
          stats[exerciseId].bestDuration = Math.max(stats[exerciseId].bestDuration, set.duration_seconds)
        }
      })

      const uniqueExercises = new Set(workout.completed_sets.map((s) => s.exercise_id))
      uniqueExercises.forEach((exerciseId) => {
        if (stats[exerciseId]) {
          stats[exerciseId].workouts += 1
        }
      })
    })

    return Object.values(stats).sort((a, b) => b.totalSets - a.totalSets)
  }, [yearlyWorkouts, exercises])

  const weeklyVolume = useMemo(() => {
    return weeklyWorkouts.reduce((acc, workout) => {
      workout.completed_sets.forEach((set) => {
        if (set.reps) {
          acc += set.reps
        }
      })
      return acc
    }, 0)
  }, [weeklyWorkouts])

  const monthlyVolume = useMemo(() => {
    return monthlyWorkouts.reduce((acc, workout) => {
      workout.completed_sets.forEach((set) => {
        if (set.reps) {
          acc += set.reps
        }
      })
      return acc
    }, 0)
  }, [monthlyWorkouts])

  const streak = useMemo(() => {
    const sortedWorkouts = [...yearlyWorkouts]
      .filter((w) => w.completed_at)
      .map((w) => new Date(w.completed_at!).toISOString().split("T")[0])
      .sort()
      .reverse()

    if (sortedWorkouts.length === 0) return 0

    let currentStreak = 0
    const today = new Date().toISOString().split("T")[0]
    let checkDate = today

    for (const workoutDate of sortedWorkouts) {
      if (workoutDate === checkDate) {
        currentStreak++
        const date = new Date(checkDate)
        date.setDate(date.getDate() - 1)
        checkDate = date.toISOString().split("T")[0]
      } else if (workoutDate < checkDate) {
        break
      }
    }

    return currentStreak
  }, [yearlyWorkouts])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Volume</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total reps this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total reps this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak}</div>
            <p className="text-xs text-muted-foreground">Days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearlyWorkouts.length}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Workouts and volume by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="workouts" fill="#8884d8" name="Workouts" />
                  <Bar dataKey="sets" fill="#82ca9d" name="Sets" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Progress</CardTitle>
              <CardDescription>Workouts and volume by week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" label={{ value: "Week", position: "insideBottom", offset: -5 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="workouts" stroke="#8884d8" name="Workouts" />
                  <Line type="monotone" dataKey="sets" stroke="#82ca9d" name="Sets" />
                  <Line type="monotone" dataKey="reps" stroke="#ffc658" name="Reps" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Exercise Statistics</CardTitle>
              <CardDescription>Performance by exercise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exerciseStats.slice(0, 10).map((stat) => (
                  <div key={stat.exerciseId} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{stat.exerciseName}</h3>
                          <Badge variant="outline">{stat.category}</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Sets: </span>
                            <span className="font-medium">{stat.totalSets}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Reps: </span>
                            <span className="font-medium">{stat.totalReps.toLocaleString()}</span>
                          </div>
                          {stat.bestReps > 0 && (
                            <div>
                              <span className="text-muted-foreground">Best Reps: </span>
                              <span className="font-medium">{stat.bestReps}</span>
                            </div>
                          )}
                          {stat.bestDuration > 0 && (
                            <div>
                              <span className="text-muted-foreground">Best Hold: </span>
                              <span className="font-medium">{stat.bestDuration}s</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Workouts: </span>
                            <span className="font-medium">{stat.workouts}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
