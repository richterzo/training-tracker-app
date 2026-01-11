"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Save, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/types/database"

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]

interface ProfileEditProps {
  profile: UserProfile
}

export function ProfileEdit({ profile }: ProfileEditProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    display_name: profile.display_name || "",
    full_name: profile.full_name || "",
    weight_kg: profile.weight_kg ? String(profile.weight_kg) : "",
    height_cm: profile.height_cm ? String(profile.height_cm) : "",
    date_of_birth: profile.date_of_birth || "",
    bio: profile.bio || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    const updateData: any = {
      display_name: formData.display_name || null,
      full_name: formData.full_name || null,
      weight_kg: formData.weight_kg ? Number.parseFloat(formData.weight_kg) : null,
      height_cm: formData.height_cm ? Number.parseInt(formData.height_cm) : null,
      date_of_birth: formData.date_of_birth || null,
      bio: formData.bio || null,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("id", profile.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess("Profile updated successfully!")
    setLoading(false)
    router.refresh()

    // If weight was updated, also add to measurements
    if (formData.weight_kg && Number.parseFloat(formData.weight_kg) > 0) {
      const { error: measurementError } = await supabase.from("body_measurements").upsert({
        user_id: profile.id,
        recorded_at: new Date().toISOString(),
        weight_kg: Number.parseFloat(formData.weight_kg),
      })

      if (measurementError) {
        console.error("Error saving weight measurement:", measurementError)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Your display name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Your full name"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Body Metrics</CardTitle>
          <CardDescription>Your current weight and height</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weight_kg">Weight (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.1"
                min="0"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                placeholder="70.5"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height_cm">Height (cm)</Label>
              <Input
                id="height_cm"
                type="number"
                min="0"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                placeholder="175"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full sm:w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
