"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonalStats } from "./personal-stats"
import { GroupStats } from "./group-stats"
import type { Database } from "@/lib/types/database"

type CompletedWorkout = Database["public"]["Tables"]["completed_workouts"]["Row"] & {
  completed_sets: Array<
    Database["public"]["Tables"]["completed_sets"]["Row"] & {
      exercises: Database["public"]["Tables"]["exercises"]["Row"] | null
    }
  >
  user_profiles?: Database["public"]["Tables"]["user_profiles"]["Row"] | null | undefined
}

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]
type GroupMember = Database["public"]["Tables"]["user_profiles"]["Row"]

interface StatsViewProps {
  weeklyWorkouts: CompletedWorkout[]
  monthlyWorkouts: CompletedWorkout[]
  yearlyWorkouts: CompletedWorkout[]
  exercises: Exercise[]
  userId: string
  groupMembers: GroupMember[]
  groupWeeklyWorkouts: CompletedWorkout[]
  groupMonthlyWorkouts: CompletedWorkout[]
  groupYearlyWorkouts: CompletedWorkout[]
  groupId: string
}

export function StatsView({
  weeklyWorkouts,
  monthlyWorkouts,
  yearlyWorkouts,
  exercises,
  userId,
  groupMembers,
  groupWeeklyWorkouts,
  groupMonthlyWorkouts,
  groupYearlyWorkouts,
  groupId,
}: StatsViewProps) {
  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="personal">Personal Stats</TabsTrigger>
        <TabsTrigger value="group">Group Stats</TabsTrigger>
      </TabsList>

      <TabsContent value="personal" className="mt-6">
        <PersonalStats
          weeklyWorkouts={weeklyWorkouts}
          monthlyWorkouts={monthlyWorkouts}
          yearlyWorkouts={yearlyWorkouts}
          exercises={exercises}
          userId={userId}
        />
      </TabsContent>

      <TabsContent value="group" className="mt-6">
        <GroupStats
          weeklyWorkouts={groupWeeklyWorkouts}
          monthlyWorkouts={groupMonthlyWorkouts}
          yearlyWorkouts={groupYearlyWorkouts}
          groupMembers={groupMembers}
          currentUserId={userId}
        />
      </TabsContent>
    </Tabs>
  )
}
