"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface NewExerciseFormProps {
  groupId: string
  userId: string
}

export function NewExerciseForm({ groupId, userId }: NewExerciseFormProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState<string>("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file")
      return
    }

    // Validate file size (50MB limit)
    const MAX_SIZE_MB = 50
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_SIZE_MB}MB limit. Please compress the video.`)
      return
    }

    setVideoFile(file)
    setError(null)
    setUploadingVideo(true)

    try {
      const supabase = createClient()

      // Upload video to group-specific folder: {group_id}/exercise-name/video.m4v
      const fileExt = file.name.split(".").pop()
      const exerciseSlug = name.trim().replace(/\s+/g, "-").toLowerCase() || "exercise"
      const fileName = `${exerciseSlug}-${Date.now()}.${fileExt}`
      const storagePath = `${groupId}/${exerciseSlug}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("exercise-videos")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("exercise-videos").getPublicUrl(storagePath)

      setVideoUrl(publicUrl)
      setUploadingVideo(false)
    } catch (err: any) {
      setError(err.message || "Failed to upload video")
      setUploadingVideo(false)
      setVideoFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error: insertError } = await supabase.from("exercises").insert({
      group_id: groupId,
      name,
      category: category as "push" | "pull" | "legs" | "core" | "cardio" | "skills",
      description: description || null,
      video_url: videoUrl || null,
      created_by: userId,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push("/app/exercises")
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Exercise Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Push-ups"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required disabled={loading}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="pull">Pull</SelectItem>
                <SelectItem value="legs">Legs</SelectItem>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="skills">Skills</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the exercise"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">Video</Label>
            <div className="space-y-2">
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleVideoFileChange}
                disabled={loading || uploadingVideo}
                className="cursor-pointer"
              />
              {uploadingVideo && (
                <p className="text-sm text-muted-foreground">Uploading video...</p>
              )}
              {videoUrl && !uploadingVideo && (
                <p className="text-sm text-green-600">✅ Video uploaded successfully</p>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Input
              id="videoUrl"
              type="url"
              placeholder="https://youtube.com/... or paste video URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={loading || uploadingVideo}
            />
            <p className="text-xs text-muted-foreground">
              Upload a video file (max 50MB) or paste a video URL. Group-specific videos are stored in your group folder.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !category} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create exercise
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
