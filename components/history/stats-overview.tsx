"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Dumbbell, Clock, Calendar } from "lucide-react"

interface StatsOverviewProps {
  totalWorkouts: number
  totalSets: number
  avgDuration: number
}

export function StatsOverview({ totalWorkouts, totalSets, avgDuration }: StatsOverviewProps) {
  const stats = [
    {
      icon: Calendar,
      label: "Total Workouts",
      value: totalWorkouts,
      description: "Completed sessions",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Dumbbell,
      label: "Total Sets",
      value: totalSets,
      description: "Sets completed",
      color: "text-green-600 dark:text-green-400",
    },
    {
      icon: Clock,
      label: "Avg Duration",
      value: `${avgDuration} min`,
      description: "Per workout",
      color: "text-orange-600 dark:text-orange-400",
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Progress
          </CardTitle>
          <CardDescription>Overview of your training journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-4 rounded-lg border p-4">
                <div className={`rounded-lg bg-muted p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm font-medium">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keep Going!</CardTitle>
          <CardDescription>Consistency is the key to progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm">
                <span className="font-semibold">Tip:</span> Try to train at least 3 times per week
                for optimal results.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm">
                <span className="font-semibold">Remember:</span> Progressive overload is key.
                Gradually increase reps, sets, or difficulty over time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
