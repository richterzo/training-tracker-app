"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  userId: string
  userName: string
  onAvatarUpdated: (url: string | null) => void
}

export function AvatarUpload({ currentAvatarUrl, userId, userName, onAvatarUpdated }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        try {
          // Extract path from URL (format: /storage/v1/object/public/avatars/userId/filename)
          const urlParts = currentAvatarUrl.split("/avatars/")
          if (urlParts.length > 1) {
            const oldPath = urlParts[1]
            await supabase.storage.from("avatars").remove([oldPath])
          }
        } catch (err) {
          // Ignore errors when deleting old avatar
          console.warn("Could not delete old avatar:", err)
        }
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError, data } = await supabase.storage.from("avatars").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Update profile
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId)

      if (updateError) throw updateError

      onAvatarUpdated(publicUrl)
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = async () => {
    if (!currentAvatarUrl) return

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Delete from storage
      const urlParts = currentAvatarUrl.split("/avatars/")
      if (urlParts.length > 1) {
        const oldPath = urlParts[1]
        await supabase.storage.from("avatars").remove([oldPath])
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: null })
        .eq("id", userId)

      if (updateError) throw updateError

      onAvatarUpdated(null)
    } catch (err: any) {
      setError(err.message || "Failed to remove avatar")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-2">
          <AvatarImage src={currentAvatarUrl || undefined} alt={userName} />
          <AvatarFallback className="text-lg sm:text-2xl">{getInitials(userName)}</AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full sm:w-auto"
        >
          <Camera className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Change Photo"}
        </Button>
        {currentAvatarUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
            className="w-full sm:w-auto"
          >
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <Alert variant="destructive" className="w-full">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Recommended: Square image, max 5MB
      </p>
    </div>
  )
}
