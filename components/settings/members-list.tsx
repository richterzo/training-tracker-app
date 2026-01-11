"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Crown, User } from "lucide-react"
import type { Database } from "@/lib/types/database"

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]

interface MembersListProps {
  members: UserProfile[]
  currentUserId: string
  isAdmin: boolean
}

export function MembersList({ members, currentUserId }: MembersListProps) {
  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>{members.length} member(s) in your group</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Avatar>
                <AvatarFallback>{getInitials(member.display_name || member.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{member.display_name || member.full_name || "Anonymous"}</span>
                  {member.id === currentUserId && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {member.role === "admin" ? (
                  <Badge variant="default" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <User className="h-3 w-3" />
                    Member
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
