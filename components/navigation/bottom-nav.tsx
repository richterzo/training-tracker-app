"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Dumbbell, History, Settings, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/app", icon: Calendar, label: "Plan" },
  { href: "/app/exercises", icon: Dumbbell, label: "Exercises" },
  { href: "/app/history", icon: History, label: "History" },
  { href: "/app/stats", icon: TrendingUp, label: "Stats" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
