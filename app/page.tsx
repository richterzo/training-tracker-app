import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dumbbell, Calendar, TrendingUp, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Training Tracker</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 text-center md:py-24">
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Track your calisthenics journey
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
            Plan workouts, track progress, and share templates with your training group. Built for
            athletes who train with their body weight.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Start training free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold">Plan workouts</h3>
                <p className="text-sm text-muted-foreground">
                  Schedule your training sessions with our built-in calendar
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold">Track progress</h3>
                <p className="text-sm text-muted-foreground">
                  Log every rep, set, and hold time with our workout player
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold">View stats</h3>
                <p className="text-sm text-muted-foreground">
                  Analyze your training history and see your improvements
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold">Share templates</h3>
                <p className="text-sm text-muted-foreground">
                  Create workout templates and share them with your group
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Training Tracker. Built for calisthenics athletes.</p>
        </div>
      </footer>
    </div>
  )
}
