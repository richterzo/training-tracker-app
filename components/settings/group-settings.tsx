"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Copy, AlertCircle } from "lucide-react"
import type { Database } from "@/lib/types/database"

type Group = Database["public"]["Tables"]["groups"]["Row"]

interface GroupSettingsProps {
  group: Group
  isAdmin: boolean
}

export function GroupSettings({ group, isAdmin }: GroupSettingsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyInviteCode = async () => {
    await navigator.clipboard.writeText(group.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Information</CardTitle>
        <CardDescription>Details about your training group</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Group Name</Label>
          <Input value={group.name} disabled />
        </div>

        <div className="space-y-2">
          <Label>Invite Code</Label>
          <div className="flex gap-2">
            <Input value={group.id} disabled className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopyInviteCode}>
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Share this code with others to invite them to your group</p>
        </div>

        {!isAdmin && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Only group admins can modify group settings</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
