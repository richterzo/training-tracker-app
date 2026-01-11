"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play, Edit2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/lib/types/database"

type PlannedWorkout = Database["public"]["Tables"]["planned_workouts"]["Row"] & {
  planned_workout_exercises: Array<{
    id: string
    exercises: Database["public"]["Tables"]["exercises"]["Row"]
  }>
}

interface CalendarViewProps {
  workouts: PlannedWorkout[]
}

export function CalendarView({ workouts: initialWorkouts }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [workouts] = useState(initialWorkouts)

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getWorkoutsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return workouts.filter((w) => w.scheduled_date === dateStr)
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square p-1" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            date.setHours(0, 0, 0, 0)
            const isToday = date.getTime() === today.getTime()
            const dayWorkouts = getWorkoutsForDate(day)

            return (
              <div key={day} className="aspect-square p-1">
                <div
                  className={`flex h-full flex-col rounded-lg border p-1 ${isToday ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <span
                    className={`text-xs ${isToday ? "font-semibold text-primary" : "text-foreground"}`}
                  >
                    {day}
                  </span>
                  <div className="mt-auto flex flex-col gap-0.5">
                    {dayWorkouts.slice(0, 2).map((workout) => (
                      <Link
                        key={workout.id}
                        href={`/app/plan/${workout.id}`}
                        className="rounded bg-primary/10 px-1 py-0.5 text-xs text-primary hover:bg-primary/20"
                      >
                        {workout.name.slice(0, 10)}
                      </Link>
                    ))}
                    {dayWorkouts.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{dayWorkouts.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="font-semibold">Upcoming Workouts</h3>
          {workouts.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">No workouts planned yet</p>
              <Button asChild className="mt-4 bg-transparent" variant="outline" size="sm">
                <Link href="/app/plan/new">Plan your first workout</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {workouts.slice(0, 5).map((workout) => (
                <Card key={workout.id} className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{workout.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {new Date(workout.scheduled_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {workout.planned_workout_exercises.length} exercises
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/plan/${workout.id}`}>
                          <Edit2 className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/workout/${workout.id}`}>
                          <Play className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
