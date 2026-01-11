"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileEdit } from "./profile-edit"
import { BodyMeasurements } from "./body-measurements"
import type { Database } from "@/lib/types/database"

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]
type BodyMeasurement = Database["public"]["Tables"]["body_measurements"]["Row"]

interface ProfileViewProps {
  profile: UserProfile
  measurements: BodyMeasurement[]
  userId: string
}

export function ProfileView({ profile, measurements, userId }: ProfileViewProps) {
  return (
    <Tabs defaultValue="edit" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="edit">Profile</TabsTrigger>
        <TabsTrigger value="measurements">Measurements</TabsTrigger>
      </TabsList>

      <TabsContent value="edit" className="mt-6">
        <ProfileEdit profile={profile} />
      </TabsContent>

      <TabsContent value="measurements" className="mt-6">
        <BodyMeasurements measurements={measurements} userId={userId} />
      </TabsContent>
    </Tabs>
  )
}
