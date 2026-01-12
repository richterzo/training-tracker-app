"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Play, Search, Video as VideoIcon, Link2, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/types/database"

type Exercise = Database["public"]["Tables"]["exercises"]["Row"]

interface VideoFile {
  path: string
  name: string
  folder: string
  url: string
  exerciseName?: string
  exerciseId?: string
}

interface VideoGalleryProps {
  exercises?: Exercise[]
}

export function VideoGallery({ exercises: initialExercises }: VideoGalleryProps) {
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises || [])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [associatingVideo, setAssociatingVideo] = useState<string | null>(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    async function fetchVideos() {
      try {
        const supabase = createClient()
        const allVideos: VideoFile[] = []

        // Funzione ricorsiva per listare tutti i video
        async function listVideosRecursive(folderPath: string = "shared"): Promise<void> {
          const { data: items, error } = await supabase.storage
            .from("exercise-videos")
            .list(folderPath, {
              limit: 1000,
              offset: 0,
              sortBy: { column: "name", order: "asc" },
            })

          if (error) {
            console.error(`Error listing ${folderPath}:`, error)
            return
          }

          if (!items || items.length === 0) {
            return
          }

          for (const item of items) {
            const itemPath = folderPath === "shared" ? `shared/${item.name}` : `${folderPath}/${item.name}`

            // Se è una cartella (ha id e non ha estensione), esplorala ricorsivamente
            if (item.id && !item.name.includes(".")) {
              await listVideosRecursive(itemPath)
            } else if (item.name.endsWith(".m4v") || item.name.endsWith(".mp4")) {
              // È un file video
              const { data: { publicUrl } } = supabase.storage
                .from("exercise-videos")
                .getPublicUrl(itemPath)

              const folder = folderPath.split("/").pop() || "root"
              
              allVideos.push({
                path: itemPath,
                name: item.name,
                folder: folder,
                url: publicUrl,
              })
            }
          }
        }

        await listVideosRecursive()
        
        // Se non abbiamo gli esercizi, recuperali
        if (!initialExercises || initialExercises.length === 0) {
          const { data: exercisesData } = await supabase
            .from("exercises")
            .select("*")
            .order("name")
          
          if (exercisesData) {
            setExercises(exercisesData)
          }
        }
        
        // Recupera anche i video associati agli esercizi per mostrare quale esercizio è associato
        const { data: exercisesWithVideo } = await supabase
          .from("exercises")
          .select("id, name, video_url")
          .not("video_url", "is", null)

        const exerciseVideoMap = new Map<string, { name: string; id: string }>()
        exercisesWithVideo?.forEach((ex) => {
          if (ex.video_url) {
            exerciseVideoMap.set(ex.video_url, { name: ex.name, id: ex.id })
          }
        })

        // Aggiungi il nome e l'ID dell'esercizio associato se presente
        allVideos.forEach((video) => {
          const exercise = exerciseVideoMap.get(video.url)
          if (exercise) {
            video.exerciseName = exercise.name
            video.exerciseId = exercise.id
          }
        })

        setVideos(allVideos)
      } catch (error) {
        console.error("Error fetching videos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [initialExercises])
  
  async function associateVideoToExercise(video: VideoFile, exerciseId: string) {
    if (!exerciseId) {
      toast({
        title: "Errore",
        description: "Seleziona un esercizio",
        variant: "destructive",
      })
      return
    }
    
    setAssociatingVideo(video.path)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("exercises")
        .update({ video_url: video.url })
        .eq("id", exerciseId)
      
      if (error) throw error
      
      // Aggiorna lo stato locale
      const updatedVideos = videos.map((v) => {
        if (v.path === video.path) {
          const exercise = exercises.find((e) => e.id === exerciseId)
          return {
            ...v,
            exerciseName: exercise?.name,
            exerciseId: exercise?.id,
          }
        }
        return v
      })
      setVideos(updatedVideos)
      
      // Aggiorna anche la lista esercizi
      const updatedExercises = exercises.map((e) => {
        if (e.id === exerciseId) {
          return { ...e, video_url: video.url }
        }
        return e
      })
      setExercises(updatedExercises)
      
      toast({
        title: "Successo",
        description: `Video associato a ${exercises.find((e) => e.id === exerciseId)?.name}`,
      })
      
      setSelectedExerciseId("")
      setAssociatingVideo(null)
    } catch (error: any) {
      console.error("Error associating video:", error)
      toast({
        title: "Errore",
        description: error.message || "Impossibile associare il video",
        variant: "destructive",
      })
      setAssociatingVideo(null)
    }
  }
  
  // Esercizi senza video o con video diverso
  const availableExercises = exercises.filter((ex) => {
    if (!ex.video_url) return true
    // Permetti anche di sostituire il video esistente
    return true
  })

  const filteredVideos = videos.filter((video) => {
    const query = searchQuery.toLowerCase()
    return (
      video.name.toLowerCase().includes(query) ||
      video.folder.toLowerCase().includes(query) ||
      (video.exerciseName && video.exerciseName.toLowerCase().includes(query))
    )
  })

  const groupedVideos = filteredVideos.reduce((acc, video) => {
    const key = video.folder
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(video)
    return acc
  }, {} as Record<string, VideoFile[]>)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Video Gallery</CardTitle>
          <CardDescription>Caricamento video...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <VideoIcon className="h-5 w-5" />
              Video Gallery
            </CardTitle>
            <CardDescription>
              Tutti i video disponibili ({videos.length} totali)
            </CardDescription>
          </div>
        </div>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca video per nome, cartella o esercizio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredVideos.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchQuery ? "Nessun video trovato per la ricerca." : "Nessun video disponibile."}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedVideos)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([folder, folderVideos]) => (
                <div key={folder} className="space-y-3">
                  <h3 className="text-lg font-semibold capitalize">{folder}</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {folderVideos.map((video) => (
                      <Card key={video.path} className="transition-colors hover:bg-muted/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm truncate">{video.name}</CardTitle>
                              {video.exerciseName && (
                                <CardDescription className="mt-1">
                                  Associato a: <span className="font-medium">{video.exerciseName}</span>
                                </CardDescription>
                              )}
                            </div>
                            {video.exerciseName && (
                              <Badge variant="secondary" className="shrink-0">
                                Associato
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={() => setSelectedVideo(video)}
                              >
                                <Play className="h-4 w-4" />
                                Guarda Video
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>{video.name}</DialogTitle>
                                <DialogDescription>
                                  {video.exerciseName ? (
                                    <>Video tutorial per: <strong>{video.exerciseName}</strong></>
                                  ) : (
                                    "Video tutorial"
                                  )}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="aspect-video w-full overflow-hidden rounded-lg">
                                <video
                                  src={video.url}
                                  controls
                                  className="h-full w-full"
                                  preload="metadata"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>
                                  <strong>Cartella:</strong> {video.folder}
                                </p>
                                <p>
                                  <strong>Path:</strong> {video.path}
                                </p>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {!video.exerciseName && (
                            <div className="space-y-2">
                              <Select
                                value={selectedExerciseId}
                                onValueChange={setSelectedExerciseId}
                                disabled={associatingVideo === video.path}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Associa a esercizio..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableExercises.map((ex) => (
                                    <SelectItem key={ex.id} value={ex.id}>
                                      {ex.name} {ex.video_url && "(sostituisci)"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="secondary"
                                className="w-full gap-2"
                                onClick={() => associateVideoToExercise(video, selectedExerciseId)}
                                disabled={!selectedExerciseId || associatingVideo === video.path}
                              >
                                {associatingVideo === video.path ? (
                                  <>Caricamento...</>
                                ) : (
                                  <>
                                    <Link2 className="h-4 w-4" />
                                    Associa Video
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                          
                          {video.exerciseName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>Associato a: {video.exerciseName}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
