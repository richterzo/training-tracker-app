"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { Users, Trophy, TrendingUp, Activity, Target } from "lucide-react"
import type { Database } from "@/lib/types/database"

type CompletedWorkout = Database["public"]["Tables"]["completed_workouts"]["Row"] & {
  completed_sets: Array<
    Database["public"]["Tables"]["completed_sets"]["Row"] & {
      exercises: Database["public"]["Tables"]["exercises"]["Row"] | null
    }
  >
  user_profiles?: Database["public"]["Tables"]["user_profiles"]["Row"] | null | undefined
}

type GroupMember = Database["public"]["Tables"]["user_profiles"]["Row"]

interface GroupStatsProps {
  weeklyWorkouts: CompletedWorkout[]
  monthlyWorkouts: CompletedWorkout[]
  yearlyWorkouts: CompletedWorkout[]
  groupMembers: GroupMember[]
  currentUserId: string
}

export function GroupStats({
  weeklyWorkouts,
  monthlyWorkouts,
  yearlyWorkouts,
  groupMembers,
  currentUserId,
}: GroupStatsProps) {
  const memberStats = useMemo(() => {
    const stats: Record<
      string,
      {
        userId: string
        userName: string
        workouts: number
        totalReps: number
        totalSets: number
        totalDuration: number
        streak: number
      }
    > = {}

    groupMembers.forEach((member) => {
      stats[member.id] = {
        userId: member.id,
        userName: member.display_name || member.full_name || member.email || "Anonymous",
        workouts: 0,
        totalReps: 0,
        totalSets: 0,
        totalDuration: 0,
        streak: 0,
      }
    })

    yearlyWorkouts.forEach((workout) => {
      if (!workout.user_id || !stats[workout.user_id]) return

      stats[workout.user_id].workouts += 1
      workout.completed_sets.forEach((set) => {
        stats[workout.user_id].totalSets += 1
        if (set.reps) {
          stats[workout.user_id].totalReps += set.reps
        }
        if (set.duration_seconds) {
          stats[workout.user_id].totalDuration += set.duration_seconds
        }
      })
    })

    // Calculate streaks
    Object.keys(stats).forEach((userId) => {
      const userWorkouts = yearlyWorkouts
        .filter((w) => w.user_id === userId && w.completed_at)
        .map((w) => new Date(w.completed_at!).toISOString().split("T")[0])
        .sort()
        .reverse()

      if (userWorkouts.length === 0) {
        stats[userId].streak = 0
        return
      }

      let currentStreak = 0
      const today = new Date().toISOString().split("T")[0]
      let checkDate = today

      for (const workoutDate of userWorkouts) {
        if (workoutDate === checkDate) {
          currentStreak++
          const date = new Date(checkDate)
          date.setDate(date.getDate() - 1)
          checkDate = date.toISOString().split("T")[0]
        } else if (workoutDate < checkDate) {
          break
        }
      }

      stats[userId].streak = currentStreak
    })

    return Object.values(stats).sort((a, b) => b.totalReps - a.totalReps)
  }, [yearlyWorkouts, groupMembers])

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

  const memberComparisonData = useMemo(() => {
    return memberStats.map((member) => ({
      name: member.userName.length > 10 ? member.userName.substring(0, 10) + "..." : member.userName,
      fullName: member.userName,
      reps: member.totalReps,
      workouts: member.workouts,
      sets: member.totalSets,
    }))
  }, [memberStats])

  const totalWeeklyVolume = useMemo(() => {
    return weeklyWorkouts.reduce((acc, workout) => {
      workout.completed_sets.forEach((set) => {
        if (set.reps) {
          acc += set.reps
        }
      })
      return acc
    }, 0)
  }, [weeklyWorkouts])

  const totalMonthlyVolume = useMemo(() => {
    return monthlyWorkouts.reduce((acc, workout) => {
      workout.completed_sets.forEach((set) => {
        if (set.reps) {
          acc += set.reps
        }
      })
      return acc
    }, 0)
  }, [monthlyWorkouts])

  const totalWorkouts = useMemo(() => {
    return yearlyWorkouts.length
  }, [yearlyWorkouts])

  const avgWorkoutsPerMember = useMemo(() => {
    const activeMembers = memberStats.filter((m) => m.workouts > 0).length
    return activeMembers > 0 ? Math.round(totalWorkouts / activeMembers) : 0
  }, [totalWorkouts, memberStats])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group Weekly Volume</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWeeklyVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total reps this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group Monthly Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMonthlyVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total reps this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Member</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgWorkoutsPerMember}</div>
            <p className="text-xs text-muted-foreground">Workouts per active member</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Group Leaderboard
              </CardTitle>
              <CardDescription>Ranking by total reps this year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {memberStats.map((member, index) => {
                  const isCurrentUser = member.userId === currentUserId
                  const initials = member.userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)

                  return (
                    <div
                      key={member.userId}
                      className={`flex items-center gap-4 rounded-lg border p-4 ${
                        isCurrentUser ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{member.userName}</span>
                          {isCurrentUser && <Badge variant="secondary">You</Badge>}
                        </div>
                        <div className="mt-1 grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium text-foreground">{member.totalReps.toLocaleString()}</span> reps
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{member.workouts}</span> workouts
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{member.streak}</span> day streak
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Member Comparison</CardTitle>
              <CardDescription>Compare performance across group members</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={memberComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "reps") return [value.toLocaleString(), "Reps"]
                      if (name === "workouts") return [value, "Workouts"]
                      if (name === "sets") return [value, "Sets"]
                      return [value, name]
                    }}
                  />
                  <Legend />
                  <Bar dataKey="reps" fill="#8884d8" name="Total Reps" />
                  <Bar dataKey="workouts" fill="#82ca9d" name="Workouts" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Weekly Activity</CardTitle>
              <CardDescription>Combined workouts and volume by day of week</CardDescription>
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
              <CardTitle>Group Monthly Progress</CardTitle>
              <CardDescription>Combined workouts and volume by week</CardDescription>
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
      </Tabs>
    </div>
  )
}
