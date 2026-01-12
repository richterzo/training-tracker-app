"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Database } from "@/lib/types/database"

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]

interface ExerciseLibraryProps {
  exercises: Exercise[]
}

const categoryColors: Record<string, string> = {
  push: "bg-red-500/10 text-red-700 dark:text-red-400",
  pull: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  legs: "bg-green-500/10 text-green-700 dark:text-green-400",
  core: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  cardio: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  skills: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
}

export function ExerciseLibrary({ exercises }: ExerciseLibraryProps) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || exercise.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const groupedExercises = filteredExercises.reduce(
    (acc, exercise) => {
      if (!acc[exercise.category]) {
        acc[exercise.category] = []
      }
      acc[exercise.category].push(exercise)
      return acc
    },
    {} as Record<string, Exercise[]>
  )

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="push">Push</SelectItem>
            <SelectItem value="pull">Pull</SelectItem>
            <SelectItem value="legs">Legs</SelectItem>
            <SelectItem value="core">Core</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="skills">Skills</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredExercises.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-48 items-center justify-center">
            <p className="text-muted-foreground">No exercises found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExercises).map(([category, categoryExercises]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold capitalize">{category}</h3>
              <div className="grid gap-3">
                {categoryExercises.map((exercise) => (
                  <Card key={exercise.id} className="transition-colors hover:bg-muted/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base">{exercise.name}</CardTitle>
                          {exercise.description && (
                            <CardDescription className="mt-1">
                              {exercise.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {exercise.video_url && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Play className="h-4 w-4" />
                                  <span className="hidden sm:inline">Video</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>{exercise.name}</DialogTitle>
                                  <DialogDescription>Tutorial Video</DialogDescription>
                                </DialogHeader>
                                <div className="aspect-video w-full overflow-hidden rounded-lg">
                                  <video
                                    src={exercise.video_url}
                                    controls
                                    className="h-full w-full"
                                    preload="metadata"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          <Badge className={categoryColors[exercise.category]} variant="secondary">
                            {exercise.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
