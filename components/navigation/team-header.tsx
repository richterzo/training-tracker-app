"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Users, TrendingUp, History } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/types/database"

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]

interface TeamHeaderProps {
  groupId: string
  currentUserId: string
}

export function TeamHeader({ groupId, currentUserId }: TeamHeaderProps) {
  const [members, setMembers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("group_id", groupId)
        .order("display_name")

      if (!error && data) {
        setMembers(data)
      }
      setLoading(false)
    }

    fetchMembers()
  }, [groupId])

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Team</span>
          <span className="text-xs text-muted-foreground">({members.length})</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Team Members</SheetTitle>
          <SheetDescription>View team members and their progress</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No team members found</div>
          ) : (
            members.map((member) => {
              const displayName = member.display_name || member.full_name || member.email
              const isCurrentUser = member.id === currentUserId

              return (
                <Link
                  key={member.id}
                  href={`/app/team/${member.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback>{getInitials(member.full_name || member.display_name, member.email)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{displayName}</p>
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground">(You)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault()
                        window.location.href = `/app/team/${member.id}?tab=stats`
                      }}
                      title="View stats"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault()
                        window.location.href = `/app/team/${member.id}?tab=history`
                      }}
                      title="View history"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
