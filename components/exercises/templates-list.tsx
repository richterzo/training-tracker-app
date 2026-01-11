"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/types/database"

type Template = Database["public"]["Tables"]["workout_templates"]["Row"] & {
  template_exercises: Array<{
    id: string
    order_index: number
    sets: number | null
    reps: number | null
    duration_seconds: number | null
    exercises: Database["public"]["Tables"]["exercises"]["Row"]
  }>
}

interface TemplatesListProps {
  templates: Template[]
}

export function TemplatesList({ templates }: TemplatesListProps) {
  return (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-4">
            <p className="text-center text-muted-foreground">
              No templates yet. Create your first workout template to get started.
            </p>
            <Button asChild>
              <Link href="/app/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                Create template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/app/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                New template
              </Link>
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle>{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1">{template.description}</CardDescription>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary">
                          {template.template_exercises.length} exercises
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/app/templates/${template.id}`}>
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
