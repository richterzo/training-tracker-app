"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Users, UserPlus } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface OnboardingFlowProps {
  user: User
}

type OnboardingStep = "choice" | "create-group" | "join-group"

export function OnboardingFlow({ user }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>("choice")
  const [groupName, setGroupName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/onboarding/create-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName,
          fullName: user.user_metadata?.full_name || "",
          displayName: displayName || user.user_metadata?.full_name || "",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create group")
      }

      router.push("/app")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/onboarding/join-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          fullName: user.user_metadata?.full_name || "",
          displayName: displayName || user.user_metadata?.full_name || "",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join group")
      }

      router.push("/app")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  if (step === "choice") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Training Tracker</CardTitle>
          <CardDescription>Choose how you want to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup onValueChange={(value) => setStep(value as OnboardingStep)} className="grid gap-4">
            <Label
              htmlFor="create"
              className="flex cursor-pointer items-start gap-4 rounded-lg border-2 border-muted bg-card p-4 transition-colors hover:border-primary has-[:checked]:border-primary"
            >
              <RadioGroupItem value="create-group" id="create" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Create a new group</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start fresh with your own training group. Perfect for personal use or coaching.
                </p>
              </div>
            </Label>

            <Label
              htmlFor="join"
              className="flex cursor-pointer items-start gap-4 rounded-lg border-2 border-muted bg-card p-4 transition-colors hover:border-primary has-[:checked]:border-primary"
            >
              <RadioGroupItem value="join-group" id="join" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Join existing group</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Have an invite code? Join a group created by your coach or training partner.
                </p>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>
    )
  }

  if (step === "create-group") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your group</CardTitle>
          <CardDescription>Give your training group a name</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="My Training Group"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                You can share exercises and templates with members of your group
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (Nickname)</Label>
              <Input
                id="displayName"
                placeholder="e.g., Coach Mike"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">How others will see you in the group</p>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("choice")} disabled={loading}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create group
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join a group</CardTitle>
        <CardDescription>Enter the invite code from your coach or training partner</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoinGroup} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="Enter code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
              disabled={loading}
              className="font-mono text-lg tracking-wider"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name (Nickname)</Label>
            <Input
              id="displayName"
              placeholder="e.g., Mike"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">How others will see you in the group</p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep("choice")} disabled={loading}>
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join group
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
